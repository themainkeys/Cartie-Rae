-- ============================================================================
-- Cartiae Rae — Orders + Order Items schema
-- Migration: 20260723_02_orders_schema.sql
--
-- Run SECOND, after 20260723_01_admin_users_simplify.sql.
-- Requires admin_users.is_active to exist (added by migration 01).
--
-- Run in: Supabase Dashboard → SQL Editor
--
-- ============================================================================
-- DESIGN DECISIONS (read before modifying)
-- ============================================================================
--
-- 1. Stripe line item retrieval in the webhook (Step 3)
--    ─────────────────────────────────────────────────
--    create-checkout-session.js places itemId and itemType under:
--      price_data.product_data.metadata  (per line item)
--
--    In Stripe's data model, product_data.metadata is stored on the ephemeral
--    Stripe Product object — NOT on the line item or Price object.
--
--    The webhook MUST use the paginated listLineItems endpoint with the
--    product expansion to access this metadata:
--
--      const lineItems = await stripe.checkout.sessions.listLineItems(
--        sessionId,
--        { limit: 100, expand: ['data.price.product'] }
--      );
--      // lineItems.data[n].price.product.metadata.itemId   → internal ID
--      // lineItems.data[n].price.product.metadata.itemType → 'ebook' etc.
--      // lineItems.data[n].quantity                         → quantity
--      // lineItems.data[n].amount_total                     → line total (cents)
--
--    If lineItems.has_more is true, iterate pages until exhausted.
--    For this storefront, carts are small (< 20 items), so a single page
--    is always sufficient — but the pagination check must still be present.
--
--    Using sessions.retrieve() with expand: ['line_items.data.price.product']
--    embeds line items directly but caps at the first page only. listLineItems
--    is the correct pattern for fulfillment and is used here.
--
--    Required change to create-checkout-session.js: NONE for schema creation.
--
-- 2. eBook entitlement: product_id only, no file path on order_items
--    ────────────────────────────────────────────────────────────────
--    order_items.product_id stores the internal EBook.id (e.g. "ebook-001").
--    The download function resolves the file path at delivery time:
--
--      Step A: verify paid order contains the requested product_id + item_type='ebook'
--      Step B: look up current file path from the ebooks catalog table
--      Step C: call storage.createSignedUrl(path, 3600) → expiring URL
--
--    ebook_file_path is NOT stored on order_items.
--    Rationale: entitlement is an immutable fact (customer paid for ID X);
--    the asset path is a catalog concern. Admin can replace a PDF without
--    touching any order record. Avoids duplication across every order row.
--
-- 3. stripe_event_id — duplicate delivery detection, NOT the idempotency key
--    ────────────────────────────────────────────────────────────────────────
--    Primary idempotency key: stripe_checkout_session_id (UNIQUE NOT NULL).
--    Webhook uses ON CONFLICT (stripe_checkout_session_id) DO NOTHING for
--    the initial order creation INSERT.
--
--    stripe_event_id is distinct: it detects when Stripe re-delivers the
--    SAME event. Partial unique index (NOT NULL rows only) allows:
--      a. Multiple events (checkout.session.completed, payment_intent.refunded)
--         to legitimately update the SAME order with DIFFERENT event IDs.
--      b. Only the first delivery of a given event ID to take effect.
--    The webhook records the current event ID on each write.
--
-- 4. stripe_payment_intent_id uniqueness and NULL
--    ─────────────────────────────────────────────
--    PostgreSQL UNIQUE constraints allow multiple NULL values without conflict.
--    Once a non-NULL value is written it must be globally unique.
--    This is correct: payment_intent_id arrives on checkout.session.completed
--    but may be absent for some payment methods.
--
-- 5. line_total and unit_price
--    ──────────────────────────
--    create-checkout-session.js pre-applies the discount to unit_price:
--      unitAmountCents = round(item.price * discountFactor * 100)
--    Therefore unit_price already reflects any discount and:
--      line_total ≈ unit_price × quantity
--    The webhook writes Stripe's authoritative amount_total into line_total,
--    which may differ from pure arithmetic by ±1 cent due to rounding.
--    No DB CHECK constraint enforces the relationship for this reason.
--
-- 6. Admin UPDATE scope
--    ────────────────────
--    Admin may UPDATE orders (e.g. set fulfillment_status = 'fulfilled').
--    Payment fields are written server-side by the webhook; the admin should
--    not normally change them. Column-level RLS is not supported in Postgres.
--    If tighter control is required later, remove this policy and implement
--    a dedicated Netlify Function for fulfillment updates.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Verify dependency: admin_users.is_active must exist before RLS policies
--    reference it. Abort clearly if migration 01 was not run first.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1
    from   information_schema.columns
    where  table_schema = 'public'
      and  table_name   = 'admin_users'
      and  column_name  = 'is_active'
  ) then
    raise exception
      'DEPENDENCY MISSING: admin_users.is_active does not exist. '
      'Run 20260723_01_admin_users_simplify.sql first, then re-run this migration.';
  end if;
  raise notice 'Dependency check passed: admin_users.is_active exists.';
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Table-specific trigger function for orders.updated_at
--
--    Named public.set_orders_updated_at() — NOT a generic set_updated_at.
--    Does not touch or replace any existing shared function.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. orders
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.orders (

  id uuid primary key default gen_random_uuid(),

  -- ── Stripe references ─────────────────────────────────────────────────────
  stripe_checkout_session_id  text not null,  -- PRIMARY idempotency key
  stripe_payment_intent_id    text,           -- NULL-safe unique (see decision 4)
  stripe_customer_id          text,
  stripe_event_id             text,           -- last Stripe event ID (see decision 3)

  -- ── Customer details (copied from session.metadata by the webhook) ─────────
  customer_email   text not null,
  customer_name    text,
  customer_phone   text,
  shipping_address text,

  -- ── Payment lifecycle ──────────────────────────────────────────────────────
  payment_status text not null
    check (payment_status in (
      'unpaid',
      'processing',
      'paid',
      'failed',
      'refunded',
      'partially_refunded',
      'canceled'
    )),

  -- ── Fulfillment lifecycle ──────────────────────────────────────────────────
  fulfillment_status text not null default 'pending'
    check (fulfillment_status in (
      'pending',    -- received, not yet acted on
      'available',  -- digital: download link ready / email sent
      'fulfilled',  -- physical: shipped; consultation: booked
      'revoked'     -- refunded / chargebacked; access removed
    )),

  -- ── Money — integer cents throughout; never float ─────────────────────────
  currency        text    not null default 'usd',
  subtotal        integer not null default 0 check (subtotal        >= 0),
  discount_total  integer not null default 0 check (discount_total  >= 0),
  shipping_total  integer not null default 0 check (shipping_total  >= 0),
  tax_total       integer not null default 0 check (tax_total       >= 0),
  total           integer not null default 0 check (total           >= 0),

  -- ── Discount metadata ──────────────────────────────────────────────────────
  applied_promo_code        text,
  applied_discount_percent  numeric(5,2) default 0,

  -- ── Cart composition flags (denormalised for fast admin filtering) ─────────
  contains_digital  boolean not null default false,
  contains_physical boolean not null default false,
  contains_service  boolean not null default false,

  -- ── Full raw session.metadata blob for auditability ───────────────────────
  metadata jsonb not null default '{}'::jsonb,

  -- ── Timestamps ────────────────────────────────────────────────────────────
  paid_at      timestamptz,
  refunded_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Idempotency: one order per checkout session
alter table public.orders
  add constraint if not exists orders_stripe_session_unique
    unique (stripe_checkout_session_id);

-- Unique among non-NULL payment_intent values (NULLs do not conflict)
alter table public.orders
  add constraint if not exists orders_stripe_pi_unique
    unique (stripe_payment_intent_id);

-- Partial unique index: prevents reprocessing the same Stripe event delivery.
-- NULL values excluded — different event types write different event IDs
-- to the same order row without conflicting.
create unique index if not exists orders_stripe_event_id_unique
  on public.orders (stripe_event_id)
  where stripe_event_id is not null;

-- updated_at trigger (table-specific function — see block 1 above)
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_orders_updated_at();

alter table public.orders enable row level security;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. order_items
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.order_items (

  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  -- ── Item classification ────────────────────────────────────────────────────
  item_type text not null
    check (item_type in ('product', 'ebook', 'service')),

  -- ── Internal product reference ─────────────────────────────────────────────
  -- product_id = CartItem.id / EBook.id / Product.id from the frontend.
  -- Stored as text because IDs are nanoid-style strings, not UUIDs.
  -- eBook entitlement check (see design decision 2):
  --   SELECT 1 FROM order_items
  --   WHERE order_id = $verified_order_id
  --     AND product_id = $requested_ebook_id
  --     AND item_type = 'ebook'
  -- File path is then resolved from the ebooks catalog, not stored here.
  product_id   text not null,
  product_name text not null,

  -- ── Pricing — integer cents (see decision 5) ───────────────────────────────
  -- unit_price: discount pre-applied; written from Stripe's price data.
  -- line_total: written from Stripe's authoritative amount_total (may differ
  --             from unit_price × quantity by ±1 cent due to rounding).
  quantity         integer not null default 1 check (quantity  >= 1),
  unit_price       integer not null           check (unit_price >= 0),
  line_total       integer not null           check (line_total >= 0),
  currency         text    not null default 'usd',

  -- ── Stripe-side references (from expanded line item) ──────────────────────
  stripe_price_id   text,   -- ephemeral price created by price_data
  stripe_product_id text,   -- ephemeral product created by product_data

  -- ── Extension metadata ─────────────────────────────────────────────────────
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indexes
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists orders_customer_email_idx
  on public.orders (customer_email);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists orders_fulfillment_status_idx
  on public.orders (fulfillment_status);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

-- Partial index for eBook entitlement queries only — keeps it small
create index if not exists order_items_ebook_entitlement_idx
  on public.order_items (product_id, order_id)
  where item_type = 'ebook';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS Policies
--
-- Authentication model:
--   admin_users.id = auth.uid()  (admin_users.id references auth.users.id)
--   is_active = true required — deactivated admin cannot access orders.
--
-- Write path:
--   Stripe webhook Netlify Function uses a service-role Supabase client.
--   Service-role bypasses RLS automatically — no write policy needed.
--
-- Read path:
--   Authenticated admin with an active admin_users row may SELECT.
--
-- Update path:
--   Admin may UPDATE orders (fulfillment_status, etc.) from the portal.
--   See design decision 6 for future tightening guidance.
--
-- No policy = default deny for anon and non-admin authenticated users.
-- Customers never query these tables directly.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "orders admin select" on public.orders;
create policy "orders admin select"
  on public.orders
  for select
  to authenticated
  using (
    exists (
      select 1
      from   public.admin_users au
      where  au.id        = auth.uid()
        and  au.is_active = true
    )
  );

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update"
  on public.orders
  for update
  to authenticated
  using (
    exists (
      select 1
      from   public.admin_users au
      where  au.id        = auth.uid()
        and  au.is_active = true
    )
  );

drop policy if exists "order_items admin select" on public.order_items;
create policy "order_items admin select"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from   public.admin_users au
      where  au.id        = auth.uid()
        and  au.is_active = true
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Verification — run after applying to confirm structure
-- ─────────────────────────────────────────────────────────────────────────────

-- Columns
select table_name, column_name, data_type, is_nullable, column_default
from   information_schema.columns
where  table_schema = 'public'
  and  table_name  in ('orders', 'order_items')
order by table_name, ordinal_position;

-- Indexes
select indexname, tablename, indexdef
from   pg_indexes
where  schemaname = 'public'
  and  tablename  in ('orders', 'order_items')
order by tablename, indexname;

-- RLS policies
select tablename, policyname, cmd, roles, qual
from   pg_policies
where  schemaname = 'public'
  and  tablename  in ('orders', 'order_items')
order by tablename, policyname;

-- Trigger functions created by this migration
select routine_name, routine_type
from   information_schema.routines
where  routine_schema = 'public'
  and  routine_name  in ('set_orders_updated_at', 'set_admin_users_updated_at');
