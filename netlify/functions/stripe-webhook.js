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
const db = require('./lib/supabaseRest');
const { fetchItems, recordOrder } = require('./lib/buildOrder');

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

// ── Handler ────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const missing = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ].filter((k) => !process.env[k]);

  if (!db.hasCredentials()) missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)');

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
  try {
    const items = await fetchItems(stripe, session.id);
    const result = await recordOrder(session, items, stripeEvent.id);

    if (!result) {
      console.error(`[stripe-webhook] Session ${session.id} has no customer email; cannot deliver.`);
      return json(500, { error: 'Order is missing a customer email.' });
    }

    console.log(
      `[stripe-webhook] Recorded order for ${session.id} (${items.length} items).`
    );
    return json(200, { received: true, recorded: true });
  } catch (err) {
    console.error('[stripe-webhook] Unexpected error:', err.message);
    return json(500, { error: 'Failed to process webhook.' });
  }
};
