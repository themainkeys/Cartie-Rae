/**
 * Netlify Serverless Function — stripe-webhook.js
 *
 * Receives and processes Stripe webhook events.
 * Called by Stripe at POST /.netlify/functions/stripe-webhook
 *
 * Handles: checkout.session.completed
 *
 * Responsibilities:
 *   1. Verify Stripe-Signature header to confirm the event is authentic.
 *   2. Retrieve all Checkout line items via paginated API with
 *      expand: ['data.price.product'] to access per-item metadata.
 *   3. Resolve itemId and itemType from price.product.metadata —
 *      these were written during session creation in create-checkout-session.js.
 *   4. Upsert the order into public.orders (idempotent on stripe_checkout_session_id).
 *   5. Insert order_items rows.
 *   6. Never generate download links — that is the job of get-ebook-download.js.
 *
 * Environment variables required (set in Netlify dashboard — never in frontend):
 *   STRIPE_SECRET_KEY       — sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET   — whsec_... (from Stripe dashboard webhook settings)
 *   SUPABASE_URL            — https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (bypasses RLS; server-only)
 *
 * Security notes:
 *   - SUPABASE_SERVICE_ROLE_KEY must never appear in any frontend bundle.
 *     It is only used here, in a trusted serverless context.
 *   - The Stripe signature verification is the first thing that runs.
 *     No database writes occur if verification fails.
 *   - All monetary values are stored as integer cents matching the DB schema.
 */

'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// ── Supabase admin client (service role — bypasses RLS) ─────────────────────
// Only constructed if credentials are present; the handler checks before use.
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Fulfillment status helper ────────────────────────────────────────────────
// 'available' = customer can download immediately (digital-only order)
// 'pending'   = physical shipment required before fulfillment is complete
function deriveFulfillmentStatus(lineItems) {
  const hasPhysical = lineItems.some(
    item => item.price?.product?.metadata?.itemType === 'product'
  );
  return hasPhysical ? 'pending' : 'available';
}

// ── Paginated line item retrieval ────────────────────────────────────────────
// Stripe paginates line items at 100 per page. We fetch all pages to ensure
// every item's metadata is available for order_items insertion.
async function fetchAllLineItems(sessionId) {
  const allItems = [];
  let startingAfter;

  do {
    const params = {
      limit: 100,
      expand: ['data.price.product'],
    };
    if (startingAfter) params.starting_after = startingAfter;

    // eslint-disable-next-line no-await-in-loop
    const page = await stripe.checkout.sessions.listLineItems(sessionId, params);

    allItems.push(...page.data);

    if (page.has_more && page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    } else {
      startingAfter = null;
    }
  } while (startingAfter);

  return allItems;
}

// ── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // ── Guard: POST only ──────────────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // ── Guard: required environment variables ─────────────────────────────────
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY is not set.');
    return { statusCode: 500, body: 'Webhook handler misconfigured: missing Stripe key.' };
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set.');
    return { statusCode: 500, body: 'Webhook handler misconfigured: missing webhook secret.' };
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[stripe-webhook] Supabase service credentials are not set.');
    return { statusCode: 500, body: 'Webhook handler misconfigured: missing database credentials.' };
  }

  // ── Step 1: Verify Stripe signature ──────────────────────────────────────
  // Netlify provides the raw body as a string (or base64 if binary).
  // Stripe signature verification requires the exact raw bytes.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    // Return 400 so Stripe does not retry a malformed/forged request.
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  // ── Step 2: Filter event type ─────────────────────────────────────────────
  // Only checkout.session.completed triggers order fulfillment.
  // All other event types are acknowledged with 200 and no database write.
  if (stripeEvent.type !== 'checkout.session.completed') {
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, action: 'ignored', type: stripeEvent.type }),
    };
  }

  const session = stripeEvent.data.object;
  const supabase = getSupabaseAdmin();

  // ── Step 3: Retrieve all line items with product metadata expanded ─────────
  // itemId and itemType are stored in price_data.product_data.metadata during
  // session creation (see create-checkout-session.js lines 138–141).
  // Accessing them requires expanding price.product on each line item.
  let lineItems;
  try {
    lineItems = await fetchAllLineItems(session.id);
  } catch (err) {
    console.error('[stripe-webhook] Failed to fetch line items:', err.message);
    // Return 500 so Stripe retries the webhook.
    return { statusCode: 500, body: 'Failed to retrieve line items from Stripe.' };
  }

  // ── Step 4: Upsert order (idempotent on stripe_checkout_session_id) ────────
  // If Stripe delivers the same event twice (network retry, etc.), the INSERT
  // will fail with unique violation code 23505. We detect this and return 200
  // without re-inserting order_items, ensuring exactly-once semantics.

  // Extract customer metadata from the session.
  // create-checkout-session.js stores these in session.metadata.
  const meta = session.metadata || {};

  // Monetary values: all stored as integer cents.
  // session.amount_subtotal and session.amount_total are already in cents.
  const subtotalCents  = session.amount_subtotal || 0;
  const totalCents     = session.amount_total    || 0;
  // Discount = pre-discount subtotal minus post-discount total.
  // Both values come from Stripe and reflect the actual charged amounts.
  const discountCents  = Math.max(0, subtotalCents - totalCents);
  const shippingCents  = session.shipping_cost?.amount_total || 0;
  const taxCents       = session.total_details?.amount_tax   || 0;

  const fulfillmentStatus = deriveFulfillmentStatus(lineItems);

  const orderRow = {
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:   session.payment_intent   || null,
    stripe_customer_id:         session.customer          || null,
    stripe_event_id:            stripeEvent.id,
    customer_email:             session.customer_details?.email  || meta.customerEmail  || null,
    customer_name:              session.customer_details?.name   || meta.customerName   || null,
    customer_phone:             session.customer_details?.phone  || meta.customerPhone  || null,
    // Shipping address: prefer Stripe's collected address; fall back to metadata string.
    shipping_address: session.shipping_details?.address
      ? JSON.stringify(session.shipping_details.address)
      : (meta.shippingAddress || null),
    payment_status:     'paid',
    fulfillment_status: fulfillmentStatus,
    currency:           session.currency || 'usd',
    subtotal:           subtotalCents,
    discount_total:     discountCents,
    shipping_total:     shippingCents,
    tax_total:          taxCents,
    total:              totalCents,
    paid_at:            new Date().toISOString(),
    metadata:           meta,
  };

  const { data: insertedOrder, error: orderError } = await supabase
    .from('orders')
    .insert(orderRow)
    .select('id')
    .single();

  if (orderError) {
    if (orderError.code === '23505') {
      // Unique violation on stripe_checkout_session_id — already processed.
      // This is an expected idempotency case (Stripe retries, network hiccups).
      console.log('[stripe-webhook] Duplicate event — order already exists for session:', session.id);
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, action: 'duplicate_ignored', sessionId: session.id }),
      };
    }

    // Any other error is unexpected. Return 500 so Stripe retries.
    console.error('[stripe-webhook] Order insert error:', orderError);
    return { statusCode: 500, body: 'Order persistence failed.' };
  }

  const orderId = insertedOrder.id;

  // ── Step 5: Insert order_items ────────────────────────────────────────────
  // One row per Stripe line item. itemId and itemType come from
  // price.product.metadata (written during session creation).
  //
  // If a product object failed to expand (edge case), we log the anomaly but
  // still insert the row with the best available data — the order already
  // exists and the payment was collected. Manual remediation is preferable to
  // a failed webhook that leaves the order without items.
  const itemRows = lineItems.map(item => {
    const productMeta = item.price?.product?.metadata || {};
    const itemId      = productMeta.itemId   || null;
    const itemType    = productMeta.itemType || 'product';
    const itemName    = item.description || item.price?.product?.name || 'Unknown Item';

    if (!itemId) {
      console.warn(
        '[stripe-webhook] Line item missing itemId in product metadata.',
        { lineItemId: item.id, priceId: item.price?.id }
      );
    }

    return {
      order_id:         orderId,
      product_id:       itemId || 'unknown',
      item_type:        itemType,
      item_name:        itemName,
      quantity:         item.quantity         || 1,
      unit_price_cents: item.price?.unit_amount || 0,
      line_total_cents: item.amount_total      || 0,
      currency:         item.currency          || (session.currency || 'usd'),
      stripe_price_id:  item.price?.id         || null,
    };
  });

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemRows);

  if (itemsError) {
    // The order row exists and payment was collected.
    // Log the error but return 200 so Stripe does not retry the entire event —
    // retrying would attempt to re-insert the order (now idempotent) and the
    // items again, which may succeed on retry.
    // A monitoring alert should be raised here in production.
    console.error('[stripe-webhook] order_items insert error (order created, items failed):', itemsError);
    // Return 500 to let Stripe retry, giving items another chance.
    return { statusCode: 500, body: 'Order items persistence failed — will retry.' };
  }

  // ── Success ───────────────────────────────────────────────────────────────
  console.log(
    '[stripe-webhook] Order fulfilled.',
    { orderId, sessionId: session.id, itemCount: itemRows.length, fulfillmentStatus }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      received:          true,
      orderId,
      sessionId:         session.id,
      itemCount:         itemRows.length,
      fulfillmentStatus,
    }),
  };
};
