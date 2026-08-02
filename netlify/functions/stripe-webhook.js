/**
 * Netlify Serverless Function — stripe-webhook.js
 *
 * Receives and processes Stripe webhook events.
 * Called by Stripe at POST /.netlify/functions/stripe-webhook
 *
 * Handles: checkout.session.completed
 *
 * ── PERSISTENCE MODEL ────────────────────────────────────────────────────────
 *
 * All database writes go through the public.persist_stripe_order PostgreSQL
 * function (migration _05). The order and all its items are written in one
 * atomic transaction. Either everything succeeds or nothing is committed.
 *
 * The webhook never performs independent INSERT/UPDATE calls that could leave
 * a paid order without its entitlement rows.
 *
 * ── HTTP RESPONSE CODES ──────────────────────────────────────────────────────
 *
 *   200  Event fully and safely persisted, or already fully processed (verified).
 *   400  Invalid Stripe signature or structurally malformed event body.
 *   422  Deterministic validation failure — missing/invalid product metadata,
 *        unsupported item type, bad quantity. Retrying will not fix this; the
 *        Stripe Product or Checkout Session metadata must be corrected.
 *   500  Transient failure — DB unavailable, RPC timeout, Stripe API error,
 *        unexpected exception. Stripe will retry.
 *
 * ── IDEMPOTENCY ──────────────────────────────────────────────────────────────
 *
 * The RPC upserts the order on stripe_checkout_session_id and inserts items
 * ON CONFLICT (order_id, stripe_line_item_id) DO NOTHING. Safe to call
 * multiple times for:
 *   • Duplicate Stripe event delivery
 *   • Different event ID for the same Checkout Session
 *   • Previous partial write (order exists, items missing)
 *   • Netlify Function timeout after DB commit
 *
 * ── VALIDATION ───────────────────────────────────────────────────────────────
 *
 * All line items are validated BEFORE any database write. If any item fails,
 * the entire event returns 422 and no write occurs. This prevents partial orders.
 *
 * For every line item the following are required:
 *   • item.id (stripe_line_item_id)
 *   • item.price.product (must be an object — not a string ID, product must expand)
 *   • price.product.metadata.itemId (non-empty — the internal product/eBook ID)
 *   • price.product.metadata.itemType ('product' | 'ebook' | 'service')
 *   • item.quantity >= 1
 *   • item.amount_total >= 0
 *
 * ── DEAD-LETTER / FAILURE ALERTING (TODO for production) ─────────────────────
 *
 * When a 422 is returned, Stripe will mark the delivery as failed but may retry
 * depending on the configured retry schedule. For production, implement:
 *   1. A webhook_failures table to record event_id, session_id, error, timestamp.
 *   2. An operational alert (email/Slack) when a 422 is recorded.
 *   3. Return 200 only after the failure is durably recorded.
 * Until then, 422 is the correct response: it keeps the event visible as failed
 * in the Stripe dashboard without falsely acknowledging it.
 *
 * ── ENVIRONMENT VARIABLES (server-only — never VITE_) ────────────────────────
 *
 *   STRIPE_SECRET_KEY         sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET     whsec_... (from Stripe webhook endpoint settings)
 *   SUPABASE_URL              https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY service_role key; bypasses RLS; NEVER prefix VITE_
 */

'use strict';

const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPPORTED_ITEM_TYPES = new Set(['product', 'ebook', 'service']);
const HANDLED_EVENT_TYPES  = new Set(['checkout.session.completed']);

// ── Supabase service-role client ─────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ── Paginated line-item fetch ─────────────────────────────────────────────────
//
// Stripe paginates line items at 100 per page.
// We expand price.product on each page to access per-item metadata.
// itemId and itemType are stored in price.product.metadata during session
// creation (see create-checkout-session.js).

async function fetchAllLineItems(sessionId) {
  const allItems = [];
  let   startingAfter;

  do {
    const params = { limit: 100, expand: ['data.price.product'] };
    if (startingAfter) params.starting_after = startingAfter;

    // eslint-disable-next-line no-await-in-loop
    const page = await stripe.checkout.sessions.listLineItems(sessionId, params);

    allItems.push(...page.data);
    startingAfter = (page.has_more && page.data.length > 0)
      ? page.data[page.data.length - 1].id
      : null;
  } while (startingAfter);

  return allItems;
}

// ── Line-item validation and mapping ─────────────────────────────────────────
//
// Returns { ok: true, row } on success.
// Returns { ok: false, code, message } on failure.
//   code 'VALIDATION' → 422 (deterministic — retrying won't fix it)
//   code 'TRANSIENT'  → 500 (may succeed on retry)

function mapLineItem(item, sessionCurrency) {
  const lineItemId = item.id;

  // Product must be an expanded object, not a string ID.
  // If it is a string, the expand failed — this is a Stripe API or config issue.
  if (!item.price || typeof item.price.product !== 'object' || item.price.product === null) {
    return {
      ok:      false,
      code:    'VALIDATION',
      message: `Line item ${lineItemId}: price.product is not expanded. `
             + 'Ensure expand=[\'data.price.product\'] is passed to listLineItems.',
    };
  }

  const product     = item.price.product;
  const metadata    = product.metadata || {};
  const itemId      = (metadata.itemId   || '').trim();
  const itemType    = (metadata.itemType || '').trim();
  const productName = item.description || product.name || 'Unknown Item';

  // itemId must be present — it is the internal product/eBook identifier used
  // for entitlement lookup in get-ebook-download.js.
  if (!itemId) {
    return {
      ok:      false,
      code:    'VALIDATION',
      message: `Line item ${lineItemId}: price.product.metadata.itemId is missing or empty. `
             + 'Set itemId on the Stripe Product metadata.',
    };
  }

  // itemType must be a supported value.
  if (!SUPPORTED_ITEM_TYPES.has(itemType)) {
    return {
      ok:      false,
      code:    'VALIDATION',
      message: `Line item ${lineItemId}: unsupported itemType "${itemType}". `
             + `Supported values: ${[...SUPPORTED_ITEM_TYPES].join(', ')}.`,
    };
  }

  // Quantity must be a positive integer.
  const quantity = item.quantity;
  if (!Number.isInteger(quantity) || quantity < 1) {
    return {
      ok:      false,
      code:    'VALIDATION',
      message: `Line item ${lineItemId}: invalid quantity ${quantity}.`,
    };
  }

  // Monetary values must be non-negative integers (Stripe always provides cents).
  const unitPrice = item.price.unit_amount;
  const lineTotal = item.amount_total;

  if (!Number.isInteger(unitPrice) || unitPrice < 0) {
    return {
      ok:      false,
      code:    'VALIDATION',
      message: `Line item ${lineItemId}: invalid unit_amount ${unitPrice}.`,
    };
  }
  if (!Number.isInteger(lineTotal) || lineTotal < 0) {
    return {
      ok:      false,
      code:    'VALIDATION',
      message: `Line item ${lineItemId}: invalid amount_total ${lineTotal}.`,
    };
  }

  return {
    ok:  true,
    row: {
      stripe_line_item_id: lineItemId,
      product_id:          itemId,
      product_name:        productName,
      item_type:           itemType,
      quantity,
      unit_price:          unitPrice,
      line_total:          lineTotal,
      currency:            item.currency || sessionCurrency || 'usd',
      stripe_price_id:     item.price.id   || null,
      stripe_product_id:   product.id      || null,
    },
  };
}

// ── Fulfillment status ────────────────────────────────────────────────────────
//
// Rule: digital-only orders grant immediate download access ('available').
//       Any order containing a physical or service item stays 'pending' until
//       manually fulfilled.
//
// The download function (get-ebook-download.js) does NOT rely on this value to
// gate eBook access. It checks payment_status = 'paid' AND
// fulfillment_status != 'revoked'. A 'pending' mixed-cart order still grants
// eBook downloads. This field reflects physical fulfillment state only.

function deriveFulfillmentStatus(itemRows) {
  const hasPhysical = itemRows.some(r => r.item_type === 'product');
  const hasService  = itemRows.some(r => r.item_type === 'service');
  return (hasPhysical || hasService) ? 'pending' : 'available';
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {

  // ── POST only ───────────────────────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // ── Required environment variables ─────────────────────────────────────────
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY not configured.');
    return { statusCode: 500, body: 'Webhook handler misconfigured.' };
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured.');
    return { statusCode: 500, body: 'Webhook handler misconfigured.' };
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[stripe-webhook] Supabase service credentials not configured.');
    return { statusCode: 500, body: 'Webhook handler misconfigured.' };
  }

  // ── Step 1: Verify Stripe signature ────────────────────────────────────────
  //
  // Netlify provides the raw body as a string, or base64 if binary.
  // Stripe signature verification requires the exact raw bytes — do not parse
  // or re-encode the body before passing it to constructEvent.
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
    return { statusCode: 400, body: `Signature verification failed: ${err.message}` };
  }

  // ── Step 2: Filter event type ───────────────────────────────────────────────
  //
  // Only checkout.session.completed triggers order fulfillment.
  // All other event types are acknowledged with 200 and no database write.
  // Add additional event types to HANDLED_EVENT_TYPES if refund handling
  // is implemented in a future pass.
  if (!HANDLED_EVENT_TYPES.has(stripeEvent.type)) {
    return {
      statusCode: 200,
      body:       JSON.stringify({ received: true, action: 'ignored', type: stripeEvent.type }),
    };
  }

  const session = stripeEvent.data.object;

  // ── Step 3: Fetch all line items with product metadata expanded ─────────────
  //
  // itemId and itemType live in price.product.metadata, written at session
  // creation time in create-checkout-session.js. Expanding the product object
  // is required to access these fields. Stripe paginates at 100 items/page.
  let rawLineItems;
  try {
    rawLineItems = await fetchAllLineItems(session.id);
  } catch (err) {
    console.error('[stripe-webhook] Failed to fetch line items from Stripe:', err.message);
    return { statusCode: 500, body: 'Failed to retrieve line items — will retry.' };
  }

  if (!rawLineItems || rawLineItems.length === 0) {
    // A Stripe Checkout Session must always have at least one line item.
    // Zero items indicates a Stripe API anomaly or a test event with no cart.
    console.error('[stripe-webhook] Session has no line items:', session.id);
    return {
      statusCode: 422,
      body:       'Checkout session contains no line items. Cannot create an order.',
    };
  }

  // ── Step 4: Validate and map all line items before any write ────────────────
  //
  // If any item fails validation, the entire event is rejected with 422.
  // No database write occurs. The admin must correct the Stripe Product
  // metadata (itemId, itemType) and re-deliver the event from the Stripe dashboard.
  const itemRows   = [];
  const itemErrors = [];

  for (const item of rawLineItems) {
    const result = mapLineItem(item, session.currency);
    if (result.ok) {
      itemRows.push(result.row);
    } else {
      itemErrors.push({ code: result.code, message: result.message });
    }
  }

  if (itemErrors.length > 0) {
    // Separate VALIDATION errors (422, don't retry) from TRANSIENT (500, retry).
    const hasTransient   = itemErrors.some(e => e.code === 'TRANSIENT');
    const statusCode     = hasTransient ? 500 : 422;
    const errorMessages  = itemErrors.map(e => e.message);

    console.error('[stripe-webhook] Line item validation failed.', {
      sessionId: session.id,
      eventId:   stripeEvent.id,
      errors:    errorMessages,
    });

    return {
      statusCode,
      body: JSON.stringify({
        error:   'Line item validation failed.',
        details: errorMessages,
      }),
    };
  }

  // ── Step 5: Build order parameters ─────────────────────────────────────────

  const meta           = session.metadata || {};
  const subtotalCents  = session.amount_subtotal || 0;
  const totalCents     = session.amount_total    || 0;
  const discountCents  = Math.max(0, subtotalCents - totalCents);
  const shippingCents  = session.shipping_cost?.amount_total   || 0;
  const taxCents       = session.total_details?.amount_tax     || 0;

  const containsDigital  = itemRows.some(r => r.item_type === 'ebook');
  const containsPhysical = itemRows.some(r => r.item_type === 'product');
  const containsService  = itemRows.some(r => r.item_type === 'service');

  const fulfillmentStatus = deriveFulfillmentStatus(itemRows);

  // Shipping address: prefer structured Stripe object; fall back to metadata string.
  const shippingAddress = session.shipping_details?.address
    ? JSON.stringify(session.shipping_details.address)
    : (meta.shippingAddress || null);

  // ── Step 6: Persist atomically via RPC ─────────────────────────────────────
  //
  // persist_stripe_order runs in one PostgreSQL transaction:
  //   - Validates inputs server-side (second line of defence).
  //   - Upserts the order row.
  //   - Inserts items ON CONFLICT DO NOTHING (idempotent retry-safe).
  //   - Verifies completeness; raises PERSISTENCE_ERROR if items < expected.
  //   - Returns { order_id, was_created, items_expected, items_persisted, is_complete }.
  //
  // On failure: the entire transaction rolls back — no partial state.
  // Stripe receives non-2xx and retries (for 5xx) or flags for review (for 4xx).
  const supabase = getSupabaseAdmin();

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'persist_stripe_order',
    {
      p_stripe_checkout_session_id:  session.id,
      p_stripe_payment_intent_id:    session.payment_intent    || null,
      p_stripe_customer_id:          session.customer           || null,
      p_stripe_event_id:             stripeEvent.id,
      p_customer_email:              session.customer_details?.email  || meta.customerEmail  || null,
      p_customer_name:               session.customer_details?.name   || meta.customerName   || null,
      p_customer_phone:              session.customer_details?.phone  || meta.customerPhone  || null,
      p_shipping_address:            shippingAddress,
      p_payment_status:              'paid',
      p_fulfillment_status:          fulfillmentStatus,
      p_currency:                    session.currency || 'usd',
      p_subtotal:                    subtotalCents,
      p_discount_total:              discountCents,
      p_shipping_total:              shippingCents,
      p_tax_total:                   taxCents,
      p_total:                       totalCents,
      p_contains_digital:            containsDigital,
      p_contains_physical:           containsPhysical,
      p_contains_service:            containsService,
      p_applied_promo_code:          meta.promoCode              || null,
      p_applied_discount_percent:    meta.discountPercent        ? parseFloat(meta.discountPercent) : null,
      p_metadata:                    meta,
      p_paid_at:                     new Date().toISOString(),
      p_items:                       itemRows,
    }
  );

  if (rpcError) {
    const msg = rpcError.message || '';

    if (msg.startsWith('VALIDATION_ERROR:')) {
      // Deterministic failure — retrying won't fix it without correcting
      // the Stripe Product metadata or session configuration.
      // Return 422 so the event appears as failed in Stripe dashboard.
      // TODO (production hardening): write to webhook_failures table before returning.
      console.error('[stripe-webhook] RPC validation error.', {
        sessionId: session.id,
        eventId:   stripeEvent.id,
        error:     msg,
      });
      return { statusCode: 422, body: JSON.stringify({ error: msg }) };
    }

    // All other RPC errors are transient — return 500 so Stripe retries.
    console.error('[stripe-webhook] RPC persistence error.', {
      sessionId: session.id,
      eventId:   stripeEvent.id,
      error:     msg,
      code:      rpcError.code,
    });
    return { statusCode: 500, body: 'Order persistence failed — will retry.' };
  }

  // ── Step 7: Verify RPC reports complete ────────────────────────────────────
  //
  // The RPC raises an exception and rolls back if incomplete, so this check
  // is a belt-and-suspenders guard against unexpected RPC return shapes.
  if (!rpcResult?.is_complete) {
    console.error('[stripe-webhook] RPC returned is_complete = false without error.', {
      sessionId: session.id,
      eventId:   stripeEvent.id,
      rpcResult,
    });
    return { statusCode: 500, body: 'Order persistence incomplete — will retry.' };
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  console.log('[stripe-webhook] Order persisted.', {
    orderId:          rpcResult.order_id,
    wasCreated:       rpcResult.was_created,
    itemsExpected:    rpcResult.items_expected,
    itemsPersisted:   rpcResult.items_persisted,
    fulfillmentStatus,
    containsDigital,
    containsPhysical,
    containsService,
    eventId:          stripeEvent.id,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      received:         true,
      orderId:          rpcResult.order_id,
      wasCreated:       rpcResult.was_created,
      itemsExpected:    rpcResult.items_expected,
      itemsPersisted:   rpcResult.items_persisted,
      fulfillmentStatus,
    }),
  };
};
