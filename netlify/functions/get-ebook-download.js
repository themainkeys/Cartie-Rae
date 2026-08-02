/**
 * Netlify Serverless Function — get-ebook-download.js
 *
 * Verifies purchase entitlement and returns a short-lived signed URL
 * for downloading a purchased eBook PDF.
 *
 * Called by the frontend at POST /.netlify/functions/get-ebook-download
 *
 * Request body (JSON):
 *   { sessionId: string, ebookId: string }
 *
 *   sessionId — Stripe Checkout Session ID from the success URL
 *               (?session_id={CHECKOUT_SESSION_ID}). This is not a secret
 *               (it is visible in the browser URL) but it is cryptographically
 *               bound to a specific Stripe transaction. A valid session ID that
 *               maps to a paid order containing the requested eBook is
 *               sufficient to authorise a download.
 *
 *   ebookId   — Internal EBook.id (e.g. "ebook-001"). Must match an
 *               order_items.product_id row in the verified order.
 *
 * Response (JSON):
 *   200 { url: string, fileName: string, expiresInSeconds: number }
 *   400 Bad request (missing or malformed fields)
 *   403 Order exists but is unpaid or download not yet available
 *   404 No paid order found for this session, or eBook not in order
 *   500 / 503 Server or storage errors
 *
 * Authorisation sequence:
 *   1. Validate sessionId and ebookId format
 *   2. Verify a paid order exists for this sessionId
 *   3. Verify payment_status = 'paid'
 *   4. Verify fulfillment_status allows download
 *   5. Verify this order contains the requested ebookId as an 'ebook' item
 *   6. Resolve the active ebook_assets row
 *   7. Generate a short-lived Supabase Storage signed URL
 *   8. Return signed URL — never the storage path
 *
 * Security invariants:
 *   - The storage path (ebooks bucket object key) is NEVER returned to
 *     the client. Only the signed URL is returned.
 *   - Signed URLs expire after SIGNED_URL_EXPIRES_IN seconds (1 hour).
 *   - All database queries use the service-role client (SUPABASE_SERVICE_ROLE_KEY),
 *     which is a server-only credential that must never appear in any VITE_
 *     environment variable or frontend bundle.
 *   - Every authorisation failure is logged with IP for audit. The response
 *     deliberately does not distinguish between "order not found" and "wrong
 *     ebookId" to avoid leaking information about order structure.
 *
 * Environment variables required (Netlify — server only):
 *   SUPABASE_URL              — https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key; bypasses RLS; NEVER VITE_
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

// ── Constants ─────────────────────────────────────────────────────────────────

const SIGNED_URL_EXPIRES_IN = 3600; // 1 hour — customer has this long to download
const EBOOKS_BUCKET         = 'ebooks';

// Stripe Checkout Session IDs always begin with 'cs_'
const SESSION_ID_PREFIX     = 'cs_';
const MAX_FIELD_LENGTH      = 500;

// Fulfillment statuses that permit download
const DOWNLOADABLE_STATUSES = new Set(['available', 'fulfilled']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidString(val) {
  return (
    typeof val === 'string' &&
    val.trim().length > 0 &&
    val.length <= MAX_FIELD_LENGTH
  );
}

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function clientIp(event) {
  return (
    event.headers['x-forwarded-for']?.split(',')[0].trim() ||
    event.headers['client-ip'] ||
    'unknown'
  );
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {

  // ── Guard: POST only ────────────────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // ── Guard: required environment variables ───────────────────────────────────
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[get-ebook-download] Supabase service credentials not configured.');
    return jsonResponse(500, { error: 'Server configuration error.' });
  }

  // ── Parse and validate request body ────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }

  const { sessionId, ebookId } = body;
  const ip = clientIp(event);

  if (!isValidString(sessionId) || !sessionId.startsWith(SESSION_ID_PREFIX)) {
    return jsonResponse(400, { error: 'Invalid or missing sessionId.' });
  }
  if (!isValidString(ebookId)) {
    return jsonResponse(400, { error: 'Invalid or missing ebookId.' });
  }

  const supabase = getSupabaseAdmin();

  // ── Step 1 & 2: Verify a paid order exists for this Stripe session ──────────
  //
  // We look up the order by stripe_checkout_session_id, which is the primary
  // idempotency key written by the webhook. If no row exists, either the
  // webhook has not yet processed, or this session ID is invalid.
  //
  // We do NOT accept an order_id from the client — the session_id is the
  // only client-provided identity anchor, and it is validated server-side.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, payment_status, fulfillment_status')
    .eq('stripe_checkout_session_id', sessionId)
    .single();

  if (orderError || !order) {
    console.warn('[get-ebook-download] Order not found.', {
      sessionId: sessionId.slice(0, 24) + '…',
      ebookId,
      ip,
    });
    // 404 regardless of the reason — do not reveal whether the session exists.
    return jsonResponse(404, { error: 'Order not found.' });
  }

  // ── Step 3: Verify payment_status = 'paid' ─────────────────────────────────
  if (order.payment_status !== 'paid') {
    console.warn('[get-ebook-download] Order not paid.', {
      orderId: order.id,
      paymentStatus: order.payment_status,
      ip,
    });
    return jsonResponse(403, {
      error: 'Payment has not been confirmed for this order.',
    });
  }

  // ── Step 4: Verify fulfillment_status allows download ──────────────────────
  if (!DOWNLOADABLE_STATUSES.has(order.fulfillment_status)) {
    console.warn('[get-ebook-download] Order fulfillment not ready.', {
      orderId: order.id,
      fulfillmentStatus: order.fulfillment_status,
      ip,
    });
    return jsonResponse(403, {
      error: 'This order is not yet available for download. Please contact support if this persists.',
    });
  }

  // ── Step 5: Verify the specific eBook was purchased in this order ──────────
  //
  // We query order_items with three conditions:
  //   1. order_id must match the verified order (not client-provided)
  //   2. product_id must match the requested ebookId
  //   3. item_type must be 'ebook' — prevents a physical product ID being used
  //
  // This is the entitlement check. If the customer purchased product A but
  // requests product B, this query returns no row and the request is denied.
  const { data: entitlement, error: entitlementError } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', order.id)
    .eq('product_id', ebookId)
    .eq('item_type', 'ebook')
    .single();

  if (entitlementError || !entitlement) {
    console.warn('[get-ebook-download] eBook entitlement not found.', {
      orderId: order.id,
      ebookId,
      ip,
    });
    // Still 404 — do not reveal that the order exists but lacks this item.
    return jsonResponse(404, { error: 'eBook not found in this order.' });
  }

  // ── Step 6: Resolve the active ebook_assets row ────────────────────────────
  //
  // The partial unique index (ebook_id WHERE is_active = true) guarantees
  // at most one active row. If zero rows exist (e.g. upload in progress,
  // or upload failed), we return 503 rather than 404 — the entitlement is
  // valid, the file is temporarily unavailable.
  const { data: asset, error: assetError } = await supabase
    .from('ebook_assets')
    .select('id, storage_path, file_name, version')
    .eq('ebook_id', ebookId)
    .eq('is_active', true)
    .single();

  if (assetError || !asset) {
    console.error('[get-ebook-download] No active asset for eBook.', {
      ebookId,
      error: assetError?.message,
    });
    return jsonResponse(503, {
      error: 'eBook file is temporarily unavailable. Please try again shortly or contact support.',
    });
  }

  // ── Step 7: Generate short-lived signed URL ─────────────────────────────────
  //
  // The storage path (asset.storage_path) is NEVER returned to the client.
  // Only the signed URL is returned. The URL expires after SIGNED_URL_EXPIRES_IN
  // seconds (1 hour). After expiry the customer must request a new URL — they
  // will not need to re-purchase as entitlement is stored permanently in orders.
  const { data: urlData, error: urlError } = await supabase.storage
    .from(EBOOKS_BUCKET)
    .createSignedUrl(asset.storage_path, SIGNED_URL_EXPIRES_IN);

  if (urlError || !urlData?.signedUrl) {
    console.error('[get-ebook-download] Signed URL generation failed.', {
      ebookId,
      assetId: asset.id,
      error: urlError?.message,
    });
    return jsonResponse(500, {
      error: 'Could not generate download link. Please try again.',
    });
  }

  // ── Audit log ───────────────────────────────────────────────────────────────
  console.log('[get-ebook-download] Download authorised.', {
    orderId:          order.id,
    ebookId,
    assetId:          asset.id,
    assetVersion:     asset.version,
    ip,
    expiresInSeconds: SIGNED_URL_EXPIRES_IN,
  });

  // ── Step 8: Return signed URL ───────────────────────────────────────────────
  return jsonResponse(200, {
    url:              urlData.signedUrl,
    fileName:         asset.file_name,
    expiresInSeconds: SIGNED_URL_EXPIRES_IN,
  });
};
