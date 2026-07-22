/**
 * Netlify Serverless Function — stripe-webhook.js
 *
 * Records paid orders authoritatively (server-side) when Stripe confirms payment.
 * Point a Stripe webhook at:  /.netlify/functions/stripe-webhook
 * Subscribe to the `checkout.session.completed` event.
 *
 * Env (Netlify, server-only):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET        — Stripe → Developers → Webhooks → Signing secret
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY    — writes to public.orders, bypassing RLS
 *
 * We verify the Stripe signature, so the browser can never forge an order.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    return { statusCode: 400, body: 'Missing Stripe signature or webhook secret.' };
  }

  // Stripe requires the RAW body for signature verification.
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook signature verification failed.` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: stripeEvent.type }) };
  }

  const session = stripeEvent.data.object;
  const m = session.metadata || {};

  if (!supabaseAdmin) {
    console.error('[stripe-webhook] Supabase not configured — order not recorded:', session.id);
    // Return 200 so Stripe does not keep retrying; the payment still succeeded.
    return { statusCode: 200, body: JSON.stringify({ received: true, stored: false }) };
  }

  const total = (session.amount_total || 0) / 100;
  const subtotal = (session.amount_subtotal || session.amount_total || 0) / 100;
  const discount = Math.max(0, subtotal - total);

  const order = {
    id: `ORD-${session.id.slice(-10)}`,
    stripe_session_id: session.id,
    customer_name: m.customerName || session.customer_details?.name || '',
    customer_email: m.customerEmail || session.customer_details?.email || session.customer_email || '',
    items: m.itemsSummary || '',
    subtotal,
    discount,
    total,
    status: 'paid',
  };

  // Idempotent on the unique stripe_session_id (Stripe may deliver twice).
  const { error } = await supabaseAdmin.from('orders').upsert(order, { onConflict: 'stripe_session_id' });
  if (error) {
    console.error('[stripe-webhook] failed to store order:', error.message);
    return { statusCode: 500, body: 'Failed to store order.' };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true, stored: true }) };
};
