/**
 * Netlify Serverless Function — create-checkout-session.js
 *
 * Creates a real Stripe Checkout Session and returns the hosted checkout URL.
 * Called by the frontend via POST /.netlify/functions/create-checkout-session
 *
 * Environment variables required (set in Netlify dashboard):
 *   STRIPE_SECRET_KEY  — sk_test_... or sk_live_...
 *   SITE_URL           — https://cartiaerae.netlify.app
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./lib/supabaseRest');

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Loads the published catalog and builds an id -> {name, price, type} map.
 *
 * This is the ONLY source of prices. The browser sends ids and quantities; it
 * does not get to say what anything costs. Without this, a customer could edit
 * the request in devtools and buy a $200 product for the Stripe minimum.
 *
 * Returns null if the catalog cannot be read — callers must then refuse the sale
 * rather than fall back to client-supplied prices.
 */
async function loadCatalog() {
  if (!db.hasCredentials()) return null;

  let row;
  try {
    row = await db.selectOne('site_snapshots', { columns: 'data', eq: { id: 'main' } });
  } catch (err) {
    console.error('[create-checkout-session] Catalog load failed:', err.message);
    return null;
  }

  if (!row?.data) {
    console.error('[create-checkout-session] No site_snapshots row with id=main.');
    return null;
  }

  const snap = row.data;
  const catalog = new Map();

  const add = (list, type) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (!entry || typeof entry.id !== 'string') continue;
      const price = Number(entry.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      catalog.set(entry.id, { name: String(entry.name || entry.id), price, type });
    }
  };

  add(snap.products, 'product');
  add(snap.ebooks, 'ebook');
  add(snap.services, 'service');

  // Discount codes are resolved server-side too — the client sends a code string,
  // never a percentage.
  const codes = new Map();
  if (Array.isArray(snap.discountCodes)) {
    for (const c of snap.discountCodes) {
      if (!c || typeof c.code !== 'string') continue;
      const pct = Number(c.discountPercent);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) continue;
      codes.set(c.code.trim().toUpperCase(), pct);
    }
  }

  return catalog.size > 0 ? { catalog, codes } : null;
}

const ITEM_DESCRIPTIONS = {
  ebook: 'Instant Digital Delivery — PDF eBook Guide',
  service: 'Virtual 1-on-1 Consultation Session (scheduled within 24 hours)',
  product: 'Natural Hair Botanical Essential — Physical Shipment',
};

/**
 * Validates the shape of the cart received from the client.
 *
 * Only `id` and `quantity` are trusted here — name, type and price are all
 * resolved from the server-side catalog afterwards, so there is nothing to
 * validate about the values the client sent for them.
 */
function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Cart is empty or malformed.';
  }
  for (const item of items) {
    if (!item || !item.id || typeof item.id !== 'string') return 'Item is missing a valid id.';
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      return `Item "${item.id}" has an invalid quantity: ${item.quantity}.`;
    }
  }
  return null;
}

// ── Handler ────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  // Guard: STRIPE_SECRET_KEY must be present
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[create-checkout-session] STRIPE_SECRET_KEY is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payment gateway is not configured. Please contact support.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body.' }),
    };
  }

  const {
    cart,
    customerEmail,
    customerName,
    customerPhone,
    shippingAddress,
    appliedDiscount,
  } = body;

  // ── Validate customer info ─────────────────────────────────────────────
  if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'A valid customer email is required.' }),
    };
  }
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Customer name must be at least 2 characters.' }),
    };
  }

  // ── Validate cart items ────────────────────────────────────────────────
  const cartError = validateCartItems(cart);
  if (cartError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: cartError }),
    };
  }

  // ── Resolve every item against the server-side catalog ─────────────────
  // Fail CLOSED: if the catalog is unavailable we refuse the sale rather than
  // fall back to prices the browser supplied.
  const priceBook = await loadCatalog();
  if (!priceBook) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: 'The store catalog is temporarily unavailable, so checkout is paused. Please try again shortly.',
      }),
    };
  }

  const resolved = [];
  for (const item of cart) {
    const entry = priceBook.catalog.get(item.id);
    if (!entry) {
      console.warn(`[create-checkout-session] Unknown item id rejected: ${item.id}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'One of the items in your cart is no longer available.' }),
      };
    }
    resolved.push({
      id: item.id,
      quantity: item.quantity,
      name: entry.name,     // server-owned
      price: entry.price,   // server-owned
      type: entry.type,     // server-owned
    });
  }

  // ── Detect item types (from the catalog, not the client) ───────────────
  const containsPhysical = resolved.some((i) => i.type === 'product');
  const containsDigital  = resolved.some((i) => i.type === 'ebook');
  const containsService  = resolved.some((i) => i.type === 'service');

  // Physical orders require shipping address collected by frontend
  if (containsPhysical && (!shippingAddress || shippingAddress.trim().length < 5)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'A shipping address is required for physical products.' }),
    };
  }

  // ── Build Stripe line items ────────────────────────────────────────────
  // The client may send a discount CODE; the percentage behind it is looked up
  // server-side. An unknown code is simply worth nothing rather than an error,
  // so a stale code in localStorage cannot block a checkout.
  const submittedCode = typeof appliedDiscount?.code === 'string'
    ? appliedDiscount.code.trim().toUpperCase()
    : '';
  const discountPercent = submittedCode ? (priceBook.codes.get(submittedCode) ?? 0) : 0;
  const discountFactor = 1 - discountPercent / 100;

  const lineItems = resolved.map((item) => {
    const unitAmountCents = Math.round(item.price * discountFactor * 100);
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name.trim(),
          description: ITEM_DESCRIPTIONS[item.type] || '',
          metadata: {
            itemId: item.id,
            itemType: item.type,
          },
        },
        unit_amount: Math.max(unitAmountCents, 50), // Stripe minimum is $0.50
      },
      quantity: item.quantity,
    };
  });

  // ── Determine site URL ─────────────────────────────────────────────────
  const siteUrl = (process.env.SITE_URL || 'https://cartiaerae.netlify.app').replace(/\/$/, '');

  // ── Build session params ───────────────────────────────────────────────
  const sessionParams = {
    mode: 'payment',
    customer_email: customerEmail.trim().toLowerCase(),
    line_items: lineItems,
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${siteUrl}/checkout/cancel`,
    metadata: {
      customerName:           customerName.trim(),
      customerEmail:          customerEmail.trim().toLowerCase(),
      customerPhone:          customerPhone  || '',
      shippingAddress:        shippingAddress || '',
      // Record the code and the percentage WE resolved, not what the client claimed.
      appliedPromoCode:       discountPercent > 0 ? submittedCode : '',
      appliedDiscountPercent: discountPercent.toString(),
      containsDigital:        containsDigital.toString(),
      containsService:        containsService.toString(),
      containsPhysical:       containsPhysical.toString(),
    },
    payment_intent_data: {
      description: 'Cartiae Rae Hair Studio — Order',
      metadata: {
        customerName: customerName.trim(),
      },
    },
  };

  // Only collect Stripe's built-in shipping form for physical orders
  // (we already have shipping address in metadata from the frontend form)
  if (containsPhysical) {
    sessionParams.shipping_address_collection = {
      allowed_countries: ['US', 'CA', 'GB', 'AU'],
    };
  }

  // ── Create Stripe session ──────────────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('[create-checkout-session] Stripe error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message || 'Failed to create checkout session. Please try again.',
      }),
    };
  }
};
