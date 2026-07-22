# Backend Rework — Activation Guide

This branch (`backend-rework`) makes payments/orders **secure and real**. It is
**inert until you turn on Stripe**, so nothing here changes the current live site
until you complete the steps below. It closes the two critical audit findings:

- **Price tampering** — the checkout function now ignores browser-sent prices and
  looks them up in Supabase (`catalog_items`). A customer can no longer pay $0.50
  for a $45 product.
- **No order record** — a Stripe webhook now writes each paid order to an `orders`
  table (verified by Stripe's signature, so it can't be forged).

## What changed in code
- `netlify/functions/create-checkout-session.js` — resolves prices + discounts from
  Supabase server-side; rejects items not in the catalog.
- `netlify/functions/stripe-webhook.js` — **new**; records paid orders.
- `src/context/AppContext.tsx` — when an admin is logged in, mirrors the catalog +
  discount codes into Supabase so the price authority stays current.
- `supabase/catalog_and_orders_setup.sql` — **new**; the `catalog_items`,
  `discount_codes`, and `orders` tables (+ seed data + RLS).

## Activation steps
1. **Run the SQL:** Supabase → SQL Editor → paste `supabase/catalog_and_orders_setup.sql` → Run.
   (Creates + seeds the price authority and the orders table.)
2. **Set Netlify env vars** (Site settings → Environment variables), server-only:
   - `STRIPE_SECRET_KEY` = `sk_live_...` (or `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` = from step 4
   - `SUPABASE_URL` = `https://ljsbwaxoiidjjmvwchah.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase **secret** key (`sb_secret_...`)
   - `SITE_URL` = your deployed URL
   - (frontend) `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` / `pk_test_...`
3. **Merge this branch** to `main` and deploy.
4. **Register the webhook:** Stripe → Developers → Webhooks → Add endpoint →
   URL `https://<your-site>/.netlify/functions/stripe-webhook`, event
   `checkout.session.completed`. Copy the **Signing secret** into
   `STRIPE_WEBHOOK_SECRET` (step 2) and redeploy.
5. **Test** with card `4242 4242 4242 4242`: complete a purchase → confirm a row
   appears in the Supabase `orders` table and the cart empties on the success page.

## Known limitations / next steps
- The **storefront still reads the catalog from `localStorage`**, so admin price
  edits are shared with customers only after the admin's browser has synced them to
  Supabase (which the new effect does on login/edit). A full migration of the
  storefront to read the catalog from Supabase (so all visitors see the same live
  catalog, in real time) is the recommended next milestone.
- Deleting a product doesn't remove it from `catalog_items` yet (it keeps its
  correct price); re-run the seed SQL to prune if needed.
- If `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` aren't set, checkout returns a clear
  "price verification not configured" error instead of charging an unverified price.
