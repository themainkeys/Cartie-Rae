-- ============================================================================
-- Cartiae Rae — remove duplicate order columns and finish the orders wiring
-- ============================================================================
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- BACKGROUND
-- public.orders already existed with a complete, well-designed schema
-- (stripe_checkout_session_id, payment_status, fulfillment_status, integer-cent
-- amounts, a separate order_items table). An earlier script in this repo assumed
-- the table was missing and added parallel columns for the same facts:
--
--     stripe_session_id       duplicates  stripe_checkout_session_id
--     stripe_payment_intent   duplicates  stripe_payment_intent_id
--     status                  duplicates  payment_status / fulfillment_status
--     discount_code           duplicates  applied_promo_code
--     discount_percent        duplicates  applied_discount_percent
--     items                   duplicates  the order_items table
--
-- The application now writes the ORIGINAL columns. This drops the duplicates so
-- there is one unambiguous source of truth per fact.
--
-- Nothing of value is lost: the duplicate columns were only ever added, never
-- written to (no code shipped that populated them). The guard below still
-- refuses to drop any column that somehow holds data.
-- ============================================================================

-- ── 1) Refuse to drop anything that actually contains data ──────────────────
do $$
declare
  populated text;
begin
  select string_agg(col, ', ') into populated
  from (
    select 'stripe_session_id' as col where exists (select 1 from public.orders where stripe_session_id is not null)
    union all
    select 'stripe_payment_intent' where exists (select 1 from public.orders where stripe_payment_intent is not null)
    union all
    select 'items' where exists (select 1 from public.orders where items is not null and items <> '[]'::jsonb)
    union all
    select 'discount_code' where exists (select 1 from public.orders where discount_code is not null)
    union all
    select 'status' where exists (select 1 from public.orders where status is not null)
  ) t;

  if populated is not null then
    raise exception
      'Refusing to drop populated columns: %. Migrate that data into the original columns first.',
      populated;
  end if;
end $$;

-- ── 2) Drop the duplicates ──────────────────────────────────────────────────
drop index if exists public.orders_stripe_session_id_key;

alter table public.orders drop column if exists stripe_session_id;
alter table public.orders drop column if exists stripe_payment_intent;
alter table public.orders drop column if exists items;
alter table public.orders drop column if exists discount_code;
alter table public.orders drop column if exists discount_percent;
alter table public.orders drop column if exists status;

-- ── 3) The real session id must be unique ───────────────────────────────────
-- All three recorders upsert with `on conflict (stripe_checkout_session_id)`.
-- Without this a replayed Stripe event would insert a duplicate order.
create unique index if not exists orders_stripe_checkout_session_id_key
  on public.orders (stripe_checkout_session_id);

-- ── 4) RLS so the admin ledger can read orders AND their line items ─────────
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders
  for select to authenticated
  using ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders
  for update to authenticated
  using      ( exists (select 1 from public.admin_users a where a.id = auth.uid()) )
  with check ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- Without this the ledger shows orders with no line items: the embedded
-- order_items(...) select silently returns an empty array under RLS.
drop policy if exists "order_items admin read" on public.order_items;
create policy "order_items admin read" on public.order_items
  for select to authenticated
  using ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- The recorder functions use the service_role key and bypass RLS, so they need
-- no insert/delete policy here.

-- ── 5) Confirm ──────────────────────────────────────────────────────────────
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
order by ordinal_position;
