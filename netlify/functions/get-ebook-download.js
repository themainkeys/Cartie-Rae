/**
 * Netlify Serverless Function — get-ebook-download.js
 *
 * Issues short-lived SIGNED download URLs for the eBooks in a paid order.
 * Called by the frontend via POST /.netlify/functions/get-ebook-download
 *
 * Security model
 * --------------
 *  - The eBook files live in a PRIVATE Supabase bucket ("ebooks"). Nothing is
 *    publicly readable; the only way in is a signed URL minted here.
 *  - A download is issued only when a row exists in public.orders for the given
 *    Stripe session id — and that row is written exclusively by the verified
 *    stripe-webhook. The browser can never assert that it paid.
 *  - The caller NEVER supplies a file path. The eBook id from the order is
 *    resolved through public.ebook_files, so a buyer cannot pivot from a $0.50
 *    purchase to an arbitrary object in the bucket.
 *  - The signed URL expires (default 24h, capped at 7 days by Supabase).
 *
 * Request:  { "sessionId": "cs_test_...", "email": "buyer@example.com" (optional) }
 * Response: { "orderId": "...", "downloads": [{ ebookId, title, url, expiresAt }] }
 *
 * Environment variables required (Netlify -> Site settings -> Environment variables):
 *   SUPABASE_URL               — Supabase -> Settings -> API -> Project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Supabase -> Settings -> API -> service_role key
 *                                (server-side only; never expose to the frontend)
 */

const db = require('./lib/supabaseRest');

const BUCKET = 'ebooks';
const DEFAULT_TTL_SECONDS = 24 * 60 * 60;      // 24 hours
const MAX_TTL_SECONDS = 7 * 24 * 60 * 60;      // Supabase signed-URL ceiling

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.SITE_URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(payload),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  if (!db.hasCredentials()) {
    console.error('[get-ebook-download] No Supabase secret key is set.');
    return json(500, {
      error: 'Downloads are not configured. Please contact support.',
      missing: ['SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)'],
    });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const ttl = Math.min(
    Number.isInteger(body.expiresInSeconds) && body.expiresInSeconds > 0
      ? body.expiresInSeconds
      : DEFAULT_TTL_SECONDS,
    MAX_TTL_SECONDS
  );

  // Stripe session ids look like cs_test_... / cs_live_... — reject anything else
  // outright rather than burning a database round trip on it.
  if (!/^cs_[A-Za-z0-9_]{10,255}$/.test(sessionId)) {
    return json(400, { error: 'A valid Stripe session id is required.' });
  }

  // ── 1) The order must exist and be paid ──────────────────────────────────
  let order;
  try {
    order = await db.selectOne('orders', {
      columns: 'id,customer_email,customer_name,payment_status',
      eq: { stripe_checkout_session_id: sessionId },
    });
  } catch (err) {
    console.error('[get-ebook-download] Order lookup failed:', err.message);
    return json(500, {
      error: 'Could not verify your purchase. Please contact support.',
      // Status + PostgREST code only, so a misconfiguration is diagnosable from
      // outside without describing the schema.
      code: err.code || null,
      status: err.status || null,
    });
  }

  // The webhook may not have landed yet (Stripe delivers it within seconds, but
  // the buyer can beat it back to the success page). 404 tells the client to retry.
  if (!order) {
    return json(404, {
      error: 'This order is not confirmed yet. Please wait a moment and refresh.',
      pending: true,
    });
  }

  if (order.payment_status !== 'paid') {
    return json(403, { error: 'This order is not marked as paid.' });
  }

  // ── 2) If an email was supplied it must match the paying customer ────────
  // Same generic message either way so this cannot be used to probe which
  // address bought a given session.
  if (email && email !== (order.customer_email || '').toLowerCase()) {
    console.warn(`[get-ebook-download] Email mismatch for session ${sessionId}.`);
    return json(403, { error: 'Could not verify your purchase. Please contact support.' });
  }

  // ── 3) Resolve the eBooks in the order to their real storage paths ───────
  // Line items live in their own table, not on the order row.
  let lineItems;
  try {
    lineItems = await db.select('order_items', {
      columns: 'product_id,item_type',
      eq: { order_id: order.id },
    });
  } catch (err) {
    console.error('[get-ebook-download] order_items lookup failed:', err.message);
    return json(500, {
      error: 'Could not prepare your downloads. Please contact support.',
      code: err.code || null,
    });
  }

  const ebookIds = [
    ...new Set(
      lineItems
        .filter((i) => i && i.item_type === 'ebook' && typeof i.product_id === 'string')
        .map((i) => i.product_id)
    ),
  ];

  if (ebookIds.length === 0) {
    return json(200, { orderId: order.id, downloads: [] });
  }

  let files;
  try {
    files = await db.select('ebook_files', {
      columns: 'ebook_id,storage_path,title',
      inList: { ebook_id: ebookIds },
    });
  } catch (err) {
    console.error('[get-ebook-download] ebook_files lookup failed:', err.message);
    return json(500, { error: 'Could not prepare your downloads. Please contact support.' });
  }

  const missing = ebookIds.filter((id) => !files.some((f) => f.ebook_id === id));
  if (missing.length) {
    // The buyer paid for something we cannot deliver — loud log, so it gets fixed.
    console.error(
      `[get-ebook-download] No ebook_files row for: ${missing.join(', ')} (order ${order.id}).`
    );
  }

  // ── 4) Mint one short-lived signed URL per eBook ─────────────────────────
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const downloads = [];
  for (const file of files) {
    try {
      const url = await db.createSignedUrl(
        BUCKET,
        file.storage_path,
        ttl,
        file.storage_path.split('/').pop()
      );
      downloads.push({
        ebookId: file.ebook_id,
        title: file.title || file.ebook_id,
        url,
        expiresAt,
      });
    } catch (err) {
      console.error(`[get-ebook-download] Could not sign "${file.storage_path}":`, err.message);
    }
  }

  if (downloads.length === 0) {
    return json(500, {
      error: 'Your purchase is confirmed but the files could not be prepared. Please contact orders@cartiaerae.com.',
    });
  }

  console.log(
    `[get-ebook-download] Issued ${downloads.length}/${ebookIds.length} link(s) for order ${order.id}.`
  );

  return json(200, {
    orderId: order.id,
    customerName: order.customer_name,
    downloads,
    // Some eBooks in the order had no file mapping — surfaced so the UI can warn.
    incomplete: downloads.length < ebookIds.length,
  });
};
