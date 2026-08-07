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

const { createClient } = require('@supabase/supabase-js');

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

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[get-ebook-download] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.');
    return json(500, { error: 'Downloads are not configured. Please contact support.' });
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

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // ── 1) The order must exist and be paid ──────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, customer_email, customer_name, items, status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (orderError) {
    console.error('[get-ebook-download] Order lookup failed:', orderError.message);
    return json(500, { error: 'Could not verify your purchase. Please contact support.' });
  }

  // The webhook may not have landed yet (Stripe delivers it within seconds, but
  // the buyer can beat it back to the success page). 404 tells the client to retry.
  if (!order) {
    return json(404, {
      error: 'This order is not confirmed yet. Please wait a moment and refresh.',
      pending: true,
    });
  }

  if (order.status !== 'paid') {
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
  const ebookIds = [
    ...new Set(
      (Array.isArray(order.items) ? order.items : [])
        .filter((i) => i && i.type === 'ebook' && typeof i.id === 'string')
        .map((i) => i.id)
    ),
  ];

  if (ebookIds.length === 0) {
    return json(200, { orderId: order.id, downloads: [] });
  }

  const { data: files, error: filesError } = await supabase
    .from('ebook_files')
    .select('ebook_id, storage_path, title')
    .in('ebook_id', ebookIds);

  if (filesError) {
    console.error('[get-ebook-download] ebook_files lookup failed:', filesError.message);
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
    const { data, error } = await supabase
      .storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, ttl, {
        download: file.storage_path.split('/').pop(),
      });

    if (error || !data?.signedUrl) {
      console.error(
        `[get-ebook-download] Could not sign "${file.storage_path}":`,
        error?.message || 'no URL returned'
      );
      continue;
    }

    downloads.push({
      ebookId: file.ebook_id,
      title: file.title || file.ebook_id,
      url: data.signedUrl,
      expiresAt,
    });
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
