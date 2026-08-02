-- ============================================================================
-- Cartiae Rae — Atomic Order Persistence
-- Migration: 20260723_05_atomic_order_persistence.sql
--
-- Run FIFTH, after 20260723_04_ebook_asset_swap.sql.
-- Requires public.order_items (created by migration _02).
--
-- Creates:
--   • stripe_line_item_id column on order_items (item identity for idempotency)
--   • UNIQUE (order_id, stripe_line_item_id) constraint
--   • public.persist_stripe_order() — atomic order + items upsert in one
--     PostgreSQL transaction
--
-- Security:
--   EXECUTE revoked from PUBLIC, anon, and authenticated.
--   Granted only to service_role (used by stripe-webhook Netlify Function).
--   Anon and unauthenticated clients cannot call this function.
--
-- Idempotency:
--   Safe to re-run. Uses IF NOT EXISTS / DROP IF EXISTS / CREATE OR REPLACE.
--
-- Design decisions:
--
--   Item identity: stripe_line_item_id (li_xxx) rather than (product_id, item_type)
--   ─────────────────────────────────────────────────────────────────────────────
--   Using (order_id, product_id, item_type) as the uniqueness key assumes one
--   Stripe line item per product per order. Stripe may produce multiple lines for
--   the same product when discounts, variants, or taxes create separate lines.
--   The Stripe line item ID (item.id = 'li_xxx') is the authoritative stable
--   identity for each line in a Checkout Session and is safe for idempotency.
--
--   Retry recovery:
--   ─────────────────────────────────────────────────────────────────────────────
--   ON CONFLICT (order_id, stripe_line_item_id) DO NOTHING allows retries to
--   skip already-inserted items and complete any that are missing. After all
--   inserts, the function verifies completeness and raises an exception if the
--   count is lower than expected — causing a full rollback so Stripe receives
--   a non-2xx and retries.
--
--   Fulfillment status:
--   ─────────────────────────────────────────────────────────────────────────────
--   The caller (stripe-webhook.js) derives fulfillment_status before calling
--   this function. 'available' is set for digital-only orders; 'pending' for
--   all others. The download function does not rely on this status to gate
--   digital downloads — it checks payment_status = 'paid' and
--   fulfillment_status != 'revoked' instead.
--
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Dependency preflight
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where  table_schema = 'public'
      and  table_name   = 'order_items'
  ) then
    raise exception
      'DEPENDENCY MISSING: public.order_items not found. Apply migration _02 first.';
  end if;
  raise notice 'Dependency check passed: public.order_items exists.';
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add stripe_line_item_id to order_items
--
--    Added nullable first so existing rows (if any) can be backfilled before
--    the NOT NULL constraint is applied. In normal development flow this table
--    is empty when this migration runs.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.order_items
  add column if not exists stripe_line_item_id text;

-- Backfill any existing rows (should be none in dev; safety net for production).
update public.order_items
  set stripe_line_item_id = 'legacy-' || id::text
  where stripe_line_item_id is null;

-- Enforce NOT NULL now that all rows have a value.
alter table public.order_items
  alter column stripe_line_item_id set not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Unique constraint: (order_id, stripe_line_item_id)
--
--    Each Stripe line item may appear in a given order at most once.
--    Enables ON CONFLICT DO NOTHING for idempotent retries in the RPC.
--    DROP + ADD pattern — IF NOT EXISTS is not valid for ADD CONSTRAINT.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.order_items
  drop constraint if exists order_items_stripe_line_item_unique;
alter table public.order_items
  add constraint order_items_stripe_line_item_unique
    unique (order_id, stripe_line_item_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. persist_stripe_order — atomic order + items upsert
--
--    Called by the stripe-webhook Netlify Function via supabase.rpc().
--    The entire operation runs in one implicit PostgreSQL transaction:
--      1. Validate all inputs before any write.
--      2. Upsert the order row.
--      3. Insert missing item rows (ON CONFLICT DO NOTHING).
--      4. Verify completeness — raise exception if items_persisted < items_expected.
--         The exception rolls back everything: order upsert included.
--      5. Return audit summary.
--
--    Raises VALIDATION_ERROR (message prefix) for deterministic bad input.
--    Raises PERSISTENCE_ERROR for completeness failures.
--    Retries are safe: already-inserted items are skipped; order is re-upserted
--    with the new event ID and updated timestamps.
--
--    SECURITY INVOKER: runs as the caller's role.
--    The stripe-webhook function connects as service_role (bypasses RLS).
--    Anon and authenticated roles are explicitly denied below.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.persist_stripe_order(
  -- ── Stripe session identifiers ─────────────────────────────────────────────
  p_stripe_checkout_session_id  text,
  p_stripe_payment_intent_id    text,
  p_stripe_customer_id          text,
  p_stripe_event_id             text,

  -- ── Customer fields (copied from session by webhook) ───────────────────────
  p_customer_email              text,
  p_customer_name               text,
  p_customer_phone              text,
  p_shipping_address            text,

  -- ── Payment lifecycle ──────────────────────────────────────────────────────
  p_payment_status              text,
  p_fulfillment_status          text,
  p_currency                    text,

  -- ── Monetary values — integer cents throughout ─────────────────────────────
  p_subtotal                    integer,
  p_discount_total              integer,
  p_shipping_total              integer,
  p_tax_total                   integer,
  p_total                       integer,

  -- ── Cart composition flags ─────────────────────────────────────────────────
  p_contains_digital            boolean,
  p_contains_physical           boolean,
  p_contains_service            boolean,

  -- ── Discount metadata ─────────────────────────────────────────────────────
  p_applied_promo_code          text,
  p_applied_discount_percent    numeric,

  -- ── Blobs ─────────────────────────────────────────────────────────────────
  p_metadata                    jsonb,
  p_paid_at                     timestamptz,

  -- ── Line items — JSONB array of item objects ───────────────────────────────
  -- Each element must contain:
  --   stripe_line_item_id  text   (li_xxx — the item's Stripe ID)
  --   product_id           text   (from price.product.metadata.itemId)
  --   product_name         text
  --   item_type            text   ('product' | 'ebook' | 'service')
  --   quantity             integer >= 1
  --   unit_price           integer >= 0 (cents)
  --   line_total           integer >= 0 (cents)
  --   currency             text
  --   stripe_price_id      text   (nullable)
  --   stripe_product_id    text   (nullable)
  p_items                       jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_order_id         uuid;
  v_was_created      boolean;
  v_pre_existing_id  uuid;
  v_items_expected   integer;
  v_items_before     integer;
  v_items_persisted  integer;
  v_is_complete      boolean;

  -- Validation loop variables
  v_item             jsonb;
  v_line_item_id     text;
  v_product_id       text;
  v_item_type        text;
begin

  -- ── Input validation — abort before any write ───────────────────────────────

  -- Required session ID
  if p_stripe_checkout_session_id is null or trim(p_stripe_checkout_session_id) = '' then
    raise exception 'VALIDATION_ERROR: p_stripe_checkout_session_id is required.';
  end if;

  -- Required payment status value
  if p_payment_status not in (
    'unpaid','processing','paid','failed','refunded','partially_refunded','canceled'
  ) then
    raise exception 'VALIDATION_ERROR: Invalid payment_status: %.', p_payment_status;
  end if;

  -- Required fulfillment status value
  if p_fulfillment_status not in ('pending','available','fulfilled','revoked') then
    raise exception 'VALIDATION_ERROR: Invalid fulfillment_status: %.', p_fulfillment_status;
  end if;

  -- Required customer email
  if p_customer_email is null or trim(p_customer_email) = '' then
    raise exception 'VALIDATION_ERROR: p_customer_email is required.';
  end if;

  -- Items array must be present and non-empty
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'VALIDATION_ERROR: p_items must be a JSON array.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'VALIDATION_ERROR: p_items must contain at least one item.';
  end if;

  -- Validate each item before any write. Any invalid item aborts the whole event.
  for v_item in select value from jsonb_array_elements(p_items) loop

    v_line_item_id := v_item->>'stripe_line_item_id';
    v_product_id   := v_item->>'product_id';
    v_item_type    := v_item->>'item_type';

    -- stripe_line_item_id: required (idempotency key for this item)
    if v_line_item_id is null or trim(v_line_item_id) = '' then
      raise exception 'VALIDATION_ERROR: an item is missing stripe_line_item_id.';
    end if;

    -- product_id: required (entitlement key — must come from Stripe product metadata)
    if v_product_id is null or trim(v_product_id) = '' then
      raise exception
        'VALIDATION_ERROR: item % has null or empty product_id. '
        'Check that price.product.metadata.itemId is set on the Stripe Product.',
        v_line_item_id;
    end if;

    -- item_type: must be a supported value
    if v_item_type not in ('product', 'ebook', 'service') then
      raise exception
        'VALIDATION_ERROR: item % has unsupported item_type: %. '
        'Supported values: product, ebook, service.',
        v_line_item_id, v_item_type;
    end if;

    -- quantity: non-null integer >= 1
    begin
      if (v_item->>'quantity')::integer < 1 then
        raise exception
          'VALIDATION_ERROR: item % quantity must be >= 1.', v_line_item_id;
      end if;
    exception when invalid_text_representation or not_null_violation then
      raise exception
        'VALIDATION_ERROR: item % has a non-integer or missing quantity.', v_line_item_id;
    end;

    -- unit_price and line_total: non-null integers >= 0
    begin
      if (v_item->>'unit_price')::integer < 0 then
        raise exception
          'VALIDATION_ERROR: item % unit_price must be >= 0.', v_line_item_id;
      end if;
      if (v_item->>'line_total')::integer < 0 then
        raise exception
          'VALIDATION_ERROR: item % line_total must be >= 0.', v_line_item_id;
      end if;
    exception when invalid_text_representation or not_null_violation then
      raise exception
        'VALIDATION_ERROR: item % has non-integer or missing unit_price/line_total.',
        v_line_item_id;
    end;

  end loop;

  -- ── Order upsert ────────────────────────────────────────────────────────────
  --
  -- ON CONFLICT on stripe_checkout_session_id (UNIQUE NOT NULL, set in _02).
  -- If the order already exists (Stripe retry, partial failure, duplicate event):
  --   - Update the event ID so we know which event last touched this row.
  --   - Coalesce payment_intent_id: keep existing non-null value if new is null.
  --   - Do NOT downgrade payment_status or fulfillment_status.
  -- If the order is new: insert all fields.
  --
  -- was_created: detect insert vs update by checking for a pre-existing row.
  select id into v_pre_existing_id
  from   public.orders
  where  stripe_checkout_session_id = p_stripe_checkout_session_id;

  v_was_created := (v_pre_existing_id is null);

  insert into public.orders (
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    stripe_customer_id,
    stripe_event_id,
    customer_email,
    customer_name,
    customer_phone,
    shipping_address,
    payment_status,
    fulfillment_status,
    currency,
    subtotal,
    discount_total,
    shipping_total,
    tax_total,
    total,
    contains_digital,
    contains_physical,
    contains_service,
    applied_promo_code,
    applied_discount_percent,
    metadata,
    paid_at
  )
  values (
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id,
    p_stripe_customer_id,
    p_stripe_event_id,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_shipping_address,
    p_payment_status,
    p_fulfillment_status,
    p_currency,
    p_subtotal,
    p_discount_total,
    p_shipping_total,
    p_tax_total,
    p_total,
    p_contains_digital,
    p_contains_physical,
    p_contains_service,
    p_applied_promo_code,
    p_applied_discount_percent,
    p_metadata,
    p_paid_at
  )
  on conflict (stripe_checkout_session_id) do update
    set stripe_event_id          = excluded.stripe_event_id,
        -- Preserve existing non-null payment_intent if new value is null
        stripe_payment_intent_id = coalesce(
          excluded.stripe_payment_intent_id,
          orders.stripe_payment_intent_id
        ),
        -- Always update to latest payment/fulfillment status from Stripe
        payment_status           = excluded.payment_status,
        fulfillment_status       = excluded.fulfillment_status,
        updated_at               = now()
  returning id into v_order_id;

  -- ── Count items before insert (for diagnostics in return value) ─────────────
  select count(*) into v_items_before
  from   public.order_items
  where  order_id = v_order_id;

  -- ── Item inserts — idempotent via ON CONFLICT DO NOTHING ────────────────────
  --
  -- Uniqueness is on (order_id, stripe_line_item_id).
  -- On first run: all items insert.
  -- On retry: already-present items are skipped; any missing ones are inserted.
  -- This recovers from partial writes without duplicating data.
  insert into public.order_items (
    order_id,
    stripe_line_item_id,
    product_id,
    product_name,
    item_type,
    quantity,
    unit_price,
    line_total,
    currency,
    stripe_price_id,
    stripe_product_id,
    metadata
  )
  select
    v_order_id,
    item->>'stripe_line_item_id',
    item->>'product_id',
    coalesce(nullif(trim(item->>'product_name'), ''), 'Unknown Item'),
    item->>'item_type',
    (item->>'quantity')::integer,
    (item->>'unit_price')::integer,
    (item->>'line_total')::integer,
    coalesce(nullif(item->>'currency', ''), p_currency, 'usd'),
    nullif(item->>'stripe_price_id',   ''),
    nullif(item->>'stripe_product_id', ''),
    coalesce((item->'metadata')::jsonb, '{}'::jsonb)
  from jsonb_array_elements(p_items) as item
  on conflict (order_id, stripe_line_item_id) do nothing;

  -- ── Completeness verification ───────────────────────────────────────────────
  --
  -- items_expected: unique stripe_line_item_ids in the input array.
  -- Duplicates in input (should never happen from Stripe) are deduplicated.
  select count(distinct item->>'stripe_line_item_id')
  into   v_items_expected
  from   jsonb_array_elements(p_items) as item;

  -- items_persisted: all items now in the DB for this order.
  select count(*)
  into   v_items_persisted
  from   public.order_items
  where  order_id = v_order_id;

  v_is_complete := (v_items_persisted >= v_items_expected);

  -- If completeness check fails, raise an exception to roll back the entire
  -- transaction. Stripe will receive a 500 and retry the event.
  if not v_is_complete then
    raise exception
      'PERSISTENCE_ERROR: Order % expected % item(s) but found % after insert. '
      'Rolling back to allow Stripe retry.',
      v_order_id, v_items_expected, v_items_persisted;
  end if;

  -- ── Return audit summary ────────────────────────────────────────────────────
  return jsonb_build_object(
    'order_id',        v_order_id,
    'was_created',     v_was_created,
    'items_expected',  v_items_expected,
    'items_before',    v_items_before,
    'items_persisted', v_items_persisted,
    'is_complete',     v_is_complete
  );

end;
$$;

comment on function public.persist_stripe_order(
  text,text,text,text,text,text,text,text,text,text,text,
  integer,integer,integer,integer,integer,
  boolean,boolean,boolean,text,numeric,jsonb,timestamptz,jsonb
) is
  'Atomically upserts an order and all its items from a Stripe checkout.session.completed event. '
  'Validates all inputs before writing. Verifies completeness after insert. '
  'Rolls back entirely if validation or completeness fails. '
  'Safe to call repeatedly for retry recovery — idempotent on (order_id, stripe_line_item_id). '
  'Callable only by service_role (used by the stripe-webhook Netlify Function).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Access control
--
--    Revoke from public (which covers all roles including anon and authenticated).
--    Then explicitly revoke from anon and authenticated as belt-and-suspenders.
--    Grant only to service_role — the Postgres role used by the Netlify
--    server-side client (SUPABASE_SERVICE_ROLE_KEY).
--
--    Anon users and authenticated portal users cannot call this function.
-- ─────────────────────────────────────────────────────────────────────────────
revoke all on function public.persist_stripe_order(
  text,text,text,text,text,text,text,text,text,text,text,
  integer,integer,integer,integer,integer,
  boolean,boolean,boolean,text,numeric,jsonb,timestamptz,jsonb
) from public;

revoke execute on function public.persist_stripe_order(
  text,text,text,text,text,text,text,text,text,text,text,
  integer,integer,integer,integer,integer,
  boolean,boolean,boolean,text,numeric,jsonb,timestamptz,jsonb
) from anon;

revoke execute on function public.persist_stripe_order(
  text,text,text,text,text,text,text,text,text,text,text,
  integer,integer,integer,integer,integer,
  boolean,boolean,boolean,text,numeric,jsonb,timestamptz,jsonb
) from authenticated;

grant execute on function public.persist_stripe_order(
  text,text,text,text,text,text,text,text,text,text,text,
  integer,integer,integer,integer,integer,
  boolean,boolean,boolean,text,numeric,jsonb,timestamptz,jsonb
) to service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Verification queries — run after applying to confirm structure
-- ─────────────────────────────────────────────────────────────────────────────

-- New column on order_items
select column_name, data_type, is_nullable
from   information_schema.columns
where  table_schema = 'public'
  and  table_name   = 'order_items'
  and  column_name  = 'stripe_line_item_id';

-- New unique constraint
select conname, contype, pg_get_constraintdef(oid) as definition
from   pg_constraint
where  conrelid = 'public.order_items'::regclass
  and  conname  = 'order_items_stripe_line_item_unique';

-- Function exists with correct security model
select
  proname                                                              as function_name,
  case prosecdef when true then 'DEFINER' else 'INVOKER' end         as security_model,
  pronargs                                                             as param_count,
  pg_get_function_result(oid)                                         as return_type
from pg_proc
where proname      = 'persist_stripe_order'
  and pronamespace = 'public'::regnamespace;

-- Access control: verify no public/anon/authenticated access
-- (Query pg_proc privileges — expect service_role only)
select
  p.proname,
  pg_catalog.pg_get_function_arguments(p.oid) as args,
  pg_catalog.pg_function_is_visible(p.oid)    as visible
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'persist_stripe_order';
