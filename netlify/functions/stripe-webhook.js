/**
 * Netlify Serverless Function — stripe-webhook.js
 *
 * Receives Stripe webhook events and records paid orders in Supabase.
 * This is the ONLY place an order is created: the browser is never trusted to
 * say "I paid", so eBook delivery can safely be gated on a row existing here.
 *
 * Endpoint to register in Stripe -> Developers -> Webhooks:
 *   https://cartiaerae.netlify.app/.netlify/functions/stripe-webhook
 * Event to listen for:
 *   checkout.session.completed
 *
 * Environment variables required (Netlify -> Site settings -> Environment variables):
 *   STRIPE_SECRET_KEY          — sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET      — whsec_... (shown when you create the endpoint)
 *   SUPABASE_URL               — Supabase -> Settings -> API -> Project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Supabase -> Settings -> API -> service_role key
 *                                (server-side only; never expose to the frontend)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// The project URL is NOT a secret — it is already compiled into the public
// frontend bundle — so it defaults here. Only the two real secrets
// (STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY) must be set in Netlify.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ljsbwaxoiidjjmvwchah.supabase.co';
// Supabase's dashboard has called this key both "service_role key" and, more
// recently, "secret key" — accept either variable name so a reasonable choice in
// the Netlify UI does not silently break the function.
const SUPABASE_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Stripe signature verification hashes the EXACT bytes it sent. Netlify may hand
 * us the body base64-encoded, so re-materialise the raw buffer before verifying —
 * re-serialising the parsed JSON would break the signature.
 */
function rawBody(event) {
  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body || '', 'utf8');
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

/**
 * Pulls the purchased line items back out of Stripe (the cart is not carried in
 * session metadata — Stripe caps metadata at 500 chars per value). Expanding the
 * product gives us back the itemId/itemType we stamped in create-checkout-session.
 */
async function fetchItems(sessionId) {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ['data.price.product'],
  });

  return lineItems.data.map((li) => {
    const product = li.price?.product;
    const meta = (product && typeof product === 'object' && product.metadata) || {};
    return {
      id: meta.itemId || null,
      type: meta.itemType || null,
      name: li.description || (typeof product === 'object' ? product.name : '') || '',
      quantity: li.quantity || 1,
      unit_amount: (li.price?.unit_amount ?? 0) / 100,
      currency: li.price?.currency || 'usd',
    };
  });
}

// ── Handler ────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const missing = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ].filter((k) => !process.env[k]);

  if (!SUPABASE_SECRET) missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)');

  if (missing.length) {
    console.error('[stripe-webhook] Missing environment variables:', missing.join(', '));
    // Name the missing keys in the response so misconfiguration is diagnosable
    // without digging through function logs. These are variable NAMES, never values.
    // 500 makes Stripe retry, so nothing is lost once the variables are set.
    return json(500, { error: 'Webhook is not configured.', missing });
  }

  // ── 1) Verify the signature ──────────────────────────────────────────────
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!signature) {
    return json(400, { error: 'Missing stripe-signature header.' });
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody(event),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // 400 (not 500) — a bad signature is never worth retrying.
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return json(400, { error: 'Invalid signature.' });
  }

  // ── 2) Only act on completed, actually-paid checkouts ────────────────────
  if (stripeEvent.type !== 'checkout.session.completed') {
    return json(200, { received: true, ignored: stripeEvent.type });
  }

  const session = stripeEvent.data.object;

  if (session.payment_status !== 'paid') {
    console.warn(
      `[stripe-webhook] Session ${session.id} completed with payment_status=${session.payment_status}; not recording.`
    );
    return json(200, { received: true, recorded: false, reason: session.payment_status });
  }

  // ── 3) Record the order ──────────────────────────────────────────────────
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const meta = session.metadata || {};

  try {
    const items = await fetchItems(session.id);

    const order = {
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
      customer_name: meta.customerName || session.customer_details?.name || 'Unknown',
      customer_email: (
        meta.customerEmail ||
        session.customer_details?.email ||
        session.customer_email ||
        ''
      ).trim().toLowerCase(),
      customer_phone: meta.customerPhone || session.customer_details?.phone || null,
      shipping_address: meta.shippingAddress || null,
      items,
      total: (session.amount_total ?? 0) / 100,
      currency: session.currency || 'usd',
      discount_code: meta.appliedPromoCode || null,
      discount_percent: Number(meta.appliedDiscountPercent) || 0,
      // Trust the line items we just read back from Stripe over the client-set
      // metadata flags, falling back to metadata for older sessions.
      contains_digital:  items.some((i) => i.type === 'ebook')   || meta.containsDigital  === 'true',
      contains_service:  items.some((i) => i.type === 'service') || meta.containsService  === 'true',
      contains_physical: items.some((i) => i.type === 'product') || meta.containsPhysical === 'true',
      status: 'paid',
    };

    if (!order.customer_email) {
      console.error(`[stripe-webhook] Session ${session.id} has no customer email; cannot deliver.`);
      return json(500, { error: 'Order is missing a customer email.' });
    }

    // Stripe retries and can deliver the same event more than once, so upsert on
    // the unique session id rather than insert — replaying an event is a no-op.
    const { error } = await supabase
      .from('orders')
      .upsert(order, { onConflict: 'stripe_session_id' });

    if (error) {
      // 500 so Stripe retries with backoff.
      console.error('[stripe-webhook] Supabase upsert failed:', error.message);
      return json(500, { error: 'Failed to record order.' });
    }

    console.log(
      `[stripe-webhook] Recorded order for ${session.id} (${items.length} items, digital=${order.contains_digital}).`
    );
    return json(200, { received: true, recorded: true });
  } catch (err) {
    console.error('[stripe-webhook] Unexpected error:', err.message);
    return json(500, { error: 'Failed to process webhook.' });
  }
};
