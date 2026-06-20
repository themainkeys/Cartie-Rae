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

// ── Helpers ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['product', 'ebook', 'service'];

const ITEM_DESCRIPTIONS = {
  ebook: 'Instant Digital Delivery — PDF eBook Guide',
  service: 'Virtual 1-on-1 Consultation Session (scheduled within 24 hours)',
  product: 'Natural Hair Botanical Essential — Physical Shipment',
};

/**
 * Validates and sanitises each cart item received from the client.
 * Returns an error string if any item is invalid, null otherwise.
 */
function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Cart is empty or malformed.';
  }
  for (const item of items) {
    if (!item.id || typeof item.id !== 'string') return 'Item is missing a valid id.';
    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
      return `Item "${item.id}" has no name.`;
    }
    if (!ALLOWED_TYPES.includes(item.type)) {
      return `Item "${item.name}" has an unrecognised type: ${item.type}.`;
    }
    if (typeof item.price !== 'number' || item.price <= 0 || item.price > 10000) {
      return `Item "${item.name}" has an invalid price: ${item.price}.`;
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      return `Item "${item.name}" has an invalid quantity: ${item.quantity}.`;
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

  // ── Detect item types ──────────────────────────────────────────────────
  const containsPhysical = cart.some((i) => i.type === 'product');
  const containsDigital  = cart.some((i) => i.type === 'ebook');
  const containsService  = cart.some((i) => i.type === 'service');

  // Physical orders require shipping address collected by frontend
  if (containsPhysical && (!shippingAddress || shippingAddress.trim().length < 5)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'A shipping address is required for physical products.' }),
    };
  }

  // ── Build Stripe line items ────────────────────────────────────────────
  const discountFactor = appliedDiscount && appliedDiscount.discountPercent > 0
    ? 1 - appliedDiscount.discountPercent / 100
    : 1;

  const lineItems = cart.map((item) => {
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
      appliedPromoCode:       appliedDiscount?.code || '',
      appliedDiscountPercent: appliedDiscount?.discountPercent?.toString() || '0',
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
