/**
 * Shared order construction for the two paths that can record a paid checkout:
 *
 *   stripe-webhook  — Stripe tells us (needs STRIPE_WEBHOOK_SECRET)
 *   confirm-order   — the buyer returns to the success page and we ask Stripe
 *                     (needs only STRIPE_SECRET_KEY)
 *
 * Both must produce an identical row so the two can run side by side. The upsert
 * is keyed on stripe_session_id, so whichever arrives second is a no-op.
 */

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
    return {
      id: meta.itemId || null,
      type: meta.itemType || null,
      name: li.description || (typeof product === 'object' ? product.name : '') || '',
      quantity: li.quantity || 1,
      unit_amount: (li.price?.unit_amount ?? 0) / 100,
      currency: li.price?.currency || 'usd',
    };
  });
}

/**
 * Maps a Stripe Checkout Session (plus its resolved line items) onto a row for
 * public.orders. Returns null when there is no usable customer email, since an
 * order we cannot deliver to is worse than no row at all.
 */
function buildOrderRow(session, items) {
  const meta = session.metadata || {};

  const customerEmail = (
    meta.customerEmail ||
    session.customer_details?.email ||
    session.customer_email ||
    ''
  ).trim().toLowerCase();

  if (!customerEmail) return null;

  return {
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
    customer_name: meta.customerName || session.customer_details?.name || 'Unknown',
    customer_email: customerEmail,
    customer_phone: meta.customerPhone || session.customer_details?.phone || null,
    shipping_address: meta.shippingAddress || null,
    items,
    total: (session.amount_total ?? 0) / 100,
    currency: session.currency || 'usd',
    discount_code: meta.appliedPromoCode || null,
    discount_percent: Number(meta.appliedDiscountPercent) || 0,
    // Trust the line items read back from Stripe over the client-set metadata
    // flags, falling back to metadata for older sessions.
    contains_digital:  items.some((i) => i.type === 'ebook')   || meta.containsDigital  === 'true',
    contains_service:  items.some((i) => i.type === 'service') || meta.containsService  === 'true',
    contains_physical: items.some((i) => i.type === 'product') || meta.containsPhysical === 'true',
    status: 'paid',
  };
}

module.exports = { fetchItems, buildOrderRow };
