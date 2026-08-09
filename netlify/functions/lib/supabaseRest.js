/**
 * Minimal Supabase REST helper for Netlify Functions.
 *
 * Why not @supabase/supabase-js?
 * ------------------------------
 * The full client always constructs a Realtime client, which needs a WebSocket
 * implementation. Netlify's Functions runtime is Node 20, which has none
 * natively, so `createClient()` throws:
 *
 *   "Node.js 20 detected without native WebSocket support"
 *
 * The Functions runtime version is set by AWS_LAMBDA_JS_RUNTIME, not by
 * NODE_VERSION in netlify.toml, so bumping the build image does not fix it.
 *
 * These functions only need a handful of plain PostgREST and Storage calls, so
 * this talks to the REST API directly with fetch (native in Node 18+). No
 * WebSocket, no realtime, no dependency.
 *
 * This file lives in lib/ so Netlify does not treat it as a deployable function
 * (only top-level files, or a directory containing a same-named file, become
 * functions). It is bundled automatically wherever it is required.
 */

const DEFAULT_URL = 'https://ljsbwaxoiidjjmvwchah.supabase.co';

function config() {
  const url = (process.env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, '');
  // Supabase's dashboard has called this key both "service_role key" and, more
  // recently, "secret key" — accept either name.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return { url, key };
}

function headers(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

/** True when a secret key is available; callers should fail closed otherwise. */
function hasCredentials() {
  return Boolean(config().key);
}

/**
 * SELECT with simple equality filters.
 * @returns {Promise<Array>} rows (empty array when nothing matches)
 */
async function select(table, { columns = '*', eq = {}, inList = {}, order, limit } = {}) {
  const { url, key } = config();
  if (!key) throw new Error('Supabase secret key is not configured.');

  const params = new URLSearchParams({ select: columns });
  for (const [col, val] of Object.entries(eq)) params.append(col, `eq.${val}`);
  // PostgREST list filter: ?col=in.(a,b,c) — values are quoted so ids containing
  // a comma or parenthesis cannot break out of the list.
  for (const [col, vals] of Object.entries(inList)) {
    const quoted = vals.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    params.append(col, `in.(${quoted})`);
  }
  if (order) params.append('order', order);
  if (limit) params.append('limit', String(limit));

  const res = await fetch(`${url}/rest/v1/${table}?${params}`, { headers: headers(key) });
  if (!res.ok) throw await restError(`select ${table}`, res);
  return res.json();
}

/**
 * Builds an Error carrying PostgREST's status and machine-readable code
 * (e.g. PGRST205 "table not found in schema cache"). Callers may surface the
 * CODE for diagnosis — never the message, which can describe the schema.
 */
async function restError(what, res) {
  const text = await res.text();
  let code = null;
  try { code = JSON.parse(text).code || null; } catch { /* not JSON */ }
  const err = new Error(`${what} failed (${res.status}${code ? ` ${code}` : ''}): ${text}`);
  err.status = res.status;
  err.code = code;
  return err;
}

/** SELECT returning the first row or null. */
async function selectOne(table, options) {
  const rows = await select(table, { ...options, limit: 1 });
  return rows.length ? rows[0] : null;
}

/**
 * UPSERT a single row. `onConflict` names the unique column to merge on, so a
 * replayed webhook event is a no-op rather than a duplicate.
 */
async function upsert(table, row, onConflict) {
  const { url, key } = config();
  if (!key) throw new Error('Supabase secret key is not configured.');

  const params = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
  const res = await fetch(`${url}/rest/v1/${table}${params}`, {
    method: 'POST',
    headers: headers(key, {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    throw new Error(`upsert ${table} failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Creates a short-lived signed download URL for a private Storage object.
 * @returns {Promise<string>} absolute signed URL
 */
async function createSignedUrl(bucket, path, expiresIn, downloadName) {
  const { url, key } = config();
  if (!key) throw new Error('Supabase secret key is not configured.');

  const res = await fetch(
    `${url}/storage/v1/object/sign/${bucket}/${encodeURI(path)}`,
    {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({ expiresIn }),
    }
  );

  if (!res.ok) {
    throw new Error(`sign ${bucket}/${path} failed (${res.status}): ${await res.text()}`);
  }

  const body = await res.json();
  // Supabase returns a path-relative URL like "/object/sign/bucket/file?token=…"
  const signed = body.signedURL || body.signedUrl;
  if (!signed) throw new Error(`sign ${bucket}/${path} returned no URL`);

  const absolute = `${url}/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`;
  return downloadName
    ? `${absolute}&download=${encodeURIComponent(downloadName)}`
    : absolute;
}

/**
 * Verifies a Supabase access token belongs to a signed-in admin.
 *
 * Two steps, both server-side: exchange the token for a user via GoTrue, then
 * confirm that user has a row in admin_users. The browser cannot fake either.
 *
 * @returns {Promise<{id: string, email: string}|null>} the admin, or null
 */
async function verifyAdminToken(accessToken) {
  const { url, key } = config();
  if (!key || !accessToken) return null;

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const user = await res.json();
  if (!user?.id) return null;

  const admin = await selectOne('admin_users', { columns: 'id', eq: { id: user.id } });
  return admin ? { id: user.id, email: user.email } : null;
}

module.exports = {
  hasCredentials,
  select,
  selectOne,
  upsert,
  createSignedUrl,
  verifyAdminToken,
};
