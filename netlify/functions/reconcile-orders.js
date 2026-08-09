/**
 * Netlify Serverless Function — reconcile-orders.js
 *
 * Backfills paid Stripe checkouts that were never recorded.
 *
 * Why this exists
 * ---------------
 * Without a Stripe webhook, orders are recorded by confirm-order.js when the
 * buyer lands back on the success page. If they pay and then close the tab,
 * nothing calls it and the sale is invisible to the studio.
 *
 * This asks Stripe for recent Checkout Sessions, keeps the paid ones, and
 * inserts any that are missing from public.orders. It needs only
 * STRIPE_SECRET_KEY — no dashboard access, no webhook secret.
 *
 * Access: admin only. The caller must present the Supabase access token of a
 * user with an admin_users row. Otherwise anyone could drive Stripe API calls.
 *
 * Request:  { "days": 30 }   (optional, 1-90, default 30)
 *           Authorization: Bearer <supabase access token>
 * Response: { "scanned": n, "paid": n, "recorded": n, "alreadyPresent": n }
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./lib/supabaseRest');
const { fetchItems, buildOrderRow } = require('./lib/buildOrder');

const MAX_SESSIONS = 500; // hard ceiling so one call cannot run away

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

  if (!process.env.STRIPE_SECRET_KEY || !db.hasCredentials()) {
    return json(500, { error: 'Reconciliation is not configured.' });
  }

  // ── Admin only ───────────────────────────────────────────────────────────
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  let admin;
  try {
    admin = await db.verifyAdminToken(token);
  } catch (err) {
    console.error('[reconcile-orders] Admin check failed:', err.message);
    return json(500, { error: 'Could not verify your session.' });
  }
  if (!admin) {
    return json(403, { error: 'Administrator access is required.' });
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const days = Math.min(Math.max(Number(body.days) || 30, 1), 90);
  const since = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  const result = { scanned: 0, paid: 0, recorded: 0, alreadyPresent: 0, failed: 0 };

  try {
    // ── 1) Which sessions do we already have? ──────────────────────────────
    const existingRows = await db.select('orders', { columns: 'stripe_session_id' });
    const known = new Set(existingRows.map((r) => r.stripe_session_id));

    // ── 2) Walk Stripe's recent sessions ───────────────────────────────────
    for await (const session of stripe.checkout.sessions.list({
      created: { gte: since },
      limit: 100,
    })) {
      result.scanned++;
      if (result.scanned >= MAX_SESSIONS) {
        console.warn(`[reconcile-orders] Stopped at the ${MAX_SESSIONS}-session ceiling.`);
        break;
      }

      if (session.payment_status !== 'paid') continue;
      result.paid++;

      if (known.has(session.id)) {
        result.alreadyPresent++;
        continue;
      }

      try {
        const items = await fetchItems(stripe, session.id);
        const order = buildOrderRow(session, items);
        if (!order) {
          console.error(`[reconcile-orders] ${session.id} has no customer email; skipped.`);
          result.failed++;
          continue;
        }
        await db.upsert('orders', order, 'stripe_session_id');
        result.recorded++;
        console.log(`[reconcile-orders] Backfilled ${session.id}.`);
      } catch (err) {
        // One bad session must not abort the whole sweep.
        console.error(`[reconcile-orders] Failed on ${session.id}:`, err.message);
        result.failed++;
      }
    }

    console.log(
      `[reconcile-orders] ${admin.email}: scanned ${result.scanned}, paid ${result.paid}, ` +
      `recorded ${result.recorded}, already present ${result.alreadyPresent}, failed ${result.failed}.`
    );
    return json(200, result);
  } catch (err) {
    console.error('[reconcile-orders] Sweep failed:', err.message);
    return json(500, { error: 'Reconciliation failed.', ...result });
  }
};
