/**
 * Netlify Serverless Function — confirm-order.js
 *
 * Records a paid checkout WITHOUT needing a Stripe webhook.
 *
 * Why this exists
 * ---------------
 * The webhook (stripe-webhook.js) is the ideal mechanism, but registering it
 * requires Stripe dashboard access to obtain a STRIPE_WEBHOOK_SECRET. This
 * function needs only STRIPE_SECRET_KEY, which is already configured.
 *
 * The browser hands us a session id. We do NOT trust it: we retrieve that
 * session from Stripe with the secret key and record the order only if Stripe
 * itself says `payment_status === 'paid'`. A forged or unpaid id gets nothing.
 * Amounts and line items come from Stripe's copy, never from the client.
 *
 * Safe to run alongside the webhook: both upsert on stripe_checkout_session_id, so
 * whichever arrives second is a no-op. When Stripe access is available, add the
 * webhook and this becomes a redundant fast path rather than dead code.
 *
 * Known limit: if the buyer never returns to the success page (closes the tab
 * after paying), nothing calls this. reconcile-orders.js backfills those.
 *
 * Request:  { "sessionId": "cs_live_..." }
 * Response: { "recorded": true, "alreadyRecorded": false }
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./lib/supabaseRest');
const { fetchItems, recordOrder } = require('./lib/buildOrder');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!db.hasCredentials()) missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)');
  if (missing.length) {
    console.error('[confirm-order] Missing environment variables:', missing.join(', '));
    return json(500, { error: 'Order confirmation is not configured.', missing });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!/^cs_[A-Za-z0-9_]{10,255}$/.test(sessionId)) {
    return json(400, { error: 'A valid Stripe session id is required.' });
  }

  // ── 1) Ask Stripe what actually happened ─────────────────────────────────
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    // An id that Stripe does not recognise is simply not a real purchase.
    console.warn(`[confirm-order] Could not retrieve session ${sessionId}:`, err.message);
    return json(404, { error: 'That checkout session could not be found.' });
  }

  if (session.payment_status !== 'paid') {
    console.warn(
      `[confirm-order] Session ${sessionId} has payment_status=${session.payment_status}; refusing to record.`
    );
    return json(402, {
      error: 'This checkout has not been paid.',
      paymentStatus: session.payment_status,
    });
  }

  // ── 2) Record it (idempotent: re-running is a no-op) ─────────────────────
  try {
    const items = await fetchItems(stripe, sessionId);
    const result = await recordOrder(session, items);

    if (!result) {
      console.error(`[confirm-order] Session ${sessionId} has no customer email; cannot deliver.`);
      return json(500, { error: 'This order is missing a customer email.' });
    }

    console.log(
      `[confirm-order] Recorded order for ${sessionId} (${items.length} items).`
    );
    return json(200, { recorded: true, alreadyRecorded: result.alreadyRecorded });
  } catch (err) {
    console.error('[confirm-order] Failed to record order:', err.message);
    return json(500, { error: 'Could not record your order. Please contact support.' });
  }
};
