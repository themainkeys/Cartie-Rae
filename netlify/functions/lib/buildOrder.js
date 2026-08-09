/**
 * Shared order construction for the paths that can record a paid checkout:
 *
 *   confirm-order     — the buyer returns to the success page and we ask Stripe
 *                       (needs only STRIPE_SECRET_KEY)
 *   reconcile-orders  — admin sweep for buyers who never came back
 *   stripe-webhook    — Stripe tells us (needs STRIPE_WEBHOOK_SECRET)
 *
 * All three produce identical rows, keyed on stripe_checkout_session_id, so
 * whichever arrives second is a no-op.
 *
 * MONEY IS IN CENTS
 * -----------------
 * public.orders stores subtotal/discount_total/shipping_total/tax_total/total as
 * INTEGER, and order_items stores unit_price/line_total as INTEGER. These are
 * cents. Stripe's amount_total and unit_amount are already cents, so they are
 * passed straight through — do NOT divide by 100 anywhere in this file. Writing
 * dollars into these columns silently rounds (24.99 -> 25) and corrupts totals.
 */

const db = require('./supabaseRest');

/**
 * Pulls the purchased line items back out of Stripe. The cart is not carried in
 * session metadata — Stripe caps metadata values at 500 chars — so we expand the
 * product to recover the itemId/itemType stamped in create-checkout-session.
 */
async function fetchItems(stripe, sessionId) {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ['data.price.product'],
  });

  return lineItems.data.map((li) => {
    const product = li.price?.product;
    const meta = (product && typeof product === 'object' && product.metadata) || {};
    const quantity = li.quantity || 1;
    const unitPrice = li.price?.unit_amount ?? 0; // cents

    return {
      productId: meta.itemId || null,
      itemType: meta.itemType || null,
      name: li.description || (typeof product === 'object' ? product.name : '') || '',
      quantity,
      unitPrice,                        // cents
      lineTotal: unitPrice * quantity,  // cents
      currency: li.price?.currency || 'usd',
    };
  });
}

/**
 * Maps a Stripe Checkout Session onto a public.orders row.
 * Returns null when there is no usable customer email — an order we cannot
 * deliver to is worse than no row at all.
 *
 * @param {object} session   Stripe Checkout Session
 * @param {Array}  items     from fetchItems()
 * @param {string} [eventId] Stripe event id, when recorded via the webhook
 */
function buildOrderRow(session, items, eventId) {
  const meta = session.metadata || {};

  const customerEmail = (
    meta.customerEmail ||
    session.customer_details?.email ||
    session.customer_email ||
    ''
  ).trim().toLowerCase();

  if (!customerEmail) return null;

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0); // cents
  const total = session.amount_total ?? 0;                          // cents
  const breakdown = session.total_details || {};

  return {
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
    stripe_customer_id:
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id || null,
    stripe_event_id: eventId || null,

    customer_name: meta.customerName || session.customer_details?.name || 'Unknown',
    customer_email: customerEmail,
    customer_phone: meta.customerPhone || session.customer_details?.phone || null,
    shipping_address: meta.shippingAddress || null,

    payment_status: 'paid',
    fulfillment_status: 'pending',
    currency: session.currency || 'usd',

    // All cents, straight from Stripe.
    subtotal,
    discount_total: breakdown.amount_discount ?? Math.max(0, subtotal - total),
    shipping_total: breakdown.amount_shipping ?? 0,
    tax_total: breakdown.amount_tax ?? 0,
    total,

    applied_promo_code: meta.appliedPromoCode || null,
    applied_discount_percent: Number(meta.appliedDiscountPercent) || 0,

    // Trust the line items read back from Stripe over the client-set metadata
    // flags, falling back to metadata for older sessions.
    contains_digital:  items.some((i) => i.itemType === 'ebook')   || meta.containsDigital  === 'true',
    contains_service:  items.some((i) => i.itemType === 'service') || meta.containsService  === 'true',
    contains_physical: items.some((i) => i.itemType === 'product') || meta.containsPhysical === 'true',

    metadata: { source: eventId ? 'webhook' : 'confirm', stripeMetadata: meta },
    paid_at: new Date().toISOString(),
  };
}

/**
 * Records an order and its line items, idempotently.
 *
 * order_items has no name column, so the display name is kept in its metadata
 * jsonb. Existing items are cleared before reinsertion so a replayed event
 * cannot duplicate lines.
 *
 * @returns {Promise<{orderId: string, alreadyRecorded: boolean}>}
 */
async function recordOrder(session, items, eventId) {
  const row = buildOrderRow(session, items, eventId);
  if (!row) return null;

  const existing = await db.selectOne('orders', {
    columns: 'id',
    eq: { stripe_checkout_session_id: session.id },
  });

  const saved = await db.upsertReturning('orders', row, 'stripe_checkout_session_id');
  const orderId = saved?.id || existing?.id;
  if (!orderId) throw new Error('Order upsert returned no id.');

  await db.remove('order_items', { order_id: orderId });

  if (items.length) {
    await db.insert(
      'order_items',
      items.map((i) => ({
        order_id: orderId,
        product_id: i.productId,
        item_type: i.itemType,
        quantity: i.quantity,
        unit_price: i.unitPrice,   // cents
        line_total: i.lineTotal,   // cents
        currency: i.currency,
        metadata: { name: i.name },
      }))
    );
  }

  return { orderId, alreadyRecorded: Boolean(existing) };
}

module.exports = { fetchItems, buildOrderRow, recordOrder };
