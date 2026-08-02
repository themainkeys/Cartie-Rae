-- ============================================================================
-- Cartiae Rae — Atomic Order Persistence
-- Migration: 20260723_05_atomic_order_persistence.sql
--
-- Run FIFTH, after 20260723_04_ebook_asset_swap.sql.
-- Requires public.order_items (created by migration _02).
--
-- Creates:
--   • stripe_line_item_id column on order_items (authoritative item identity)
--   • UNIQUE (order_id, stripe_line_item_id) constraint
--   • public.persist_stripe_order() — fully atomic order + items reconciliation
--
-- SECURITY MODEL:
--   SECURITY DEFINER — function runs as the function owner (postgres/superuser).
--   SET search_path = public, pg_catalog — prevents schema injection.
--   EXECUTE revoked from public, anon, authenticated.
--   Granted only to service_role (Netlify stripe-webhook function).
--
-- TRANSACTIONAL GUARANTEE:
--   The function contains no EXCEPTION handler that swallows errors.
--   Any failure — validation, write, or completeness — raises a PostgreSQL
--   exception that rolls back the entire function transaction.
--   Stripe receives non-2xx and retries on 5xx. 422 stays failed for manual fix.
--
-- RECONCILIATION MODEL:
--   For each retry, the function:
--     1. Validates all inputs.
--     2. Upserts the order row.
--     3. DELETES stale item rows (order_id matches, stripe_line_item_id does not).
--     4. UPSERTS all items with authoritative Stripe values (DO UPDATE — not DO NOTHING).
--     5. Verifies COUNT equality: stored items = expected items.
--     6. Verifies SET equality: every expected stripe_line_item_id is in the DB.
--   Any previous incorrect row value is overwritten. No stale row survives a retry.
--
-- ITEM IDENTITY:
--   Stripe line items are identified by (order_id, stripe_line_item_id) where
--   stripe_line_item_id is item.id from listLineItems (li_xxx format).
--   This is safer than (product_id, item_type) because Stripe may produce
--   multiple lines for the same product (discounts, bundles, prorated charges).
--
-- IDEMPOTENCY:
--   Safe to re-run against the same Stripe event:
--     • Order upsert ON CONFLICT updates only mutable fields.
--     • Item upsert ON CONFLICT updates all fields to authoritative values.
--     • DELETE of stale rows removes nothing if the payload is unchanged.
--     • Count/set verification passes as long as DB reflects the current payload.
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
--    Added nullable first so any pre-existing rows can be backfilled safely
--    before the NOT NULL constraint is enforced.
--    In normal development flow this table is empty when this migration runs.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.order_items
  add column if not exists stripe_line_item_id text;

-- Backfill any rows that existed before this migration (should be zero in dev).
update public.order_items
  set stripe_line_item_id = 'legacy-' || id::text
  where stripe_line_item_id is null;

alter table public.order_items
  alter column stripe_line_item_id set not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Unique constraint: (order_id, stripe_line_item_id)
--
--    Each Stripe line item may appear in an order at most once.
--    Enables ON CONFLICT DO UPDATE for authoritative field reconciliation.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.order_items
  drop constraint if exists order_items_stripe_line_item_unique;
alter table public.order_items
  add constraint order_items_stripe_line_item_unique
    unique (order_id, stripe_line_item_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. persist_stripe_order
--
--    Fully atomic order + items reconciliation in one PostgreSQL transaction.
--
--    PARAMETER MAPPING — verified against stripe-webhook.js:
--
--      Pos  SQL param                          JS source
--      ---  ────────────────────────────────  ─────────────────────────────────────────
--       1   p_stripe_checkout_session_id       session.id
--       2   p_stripe_payment_intent_id         session.payment_intent || null
--       3   p_stripe_customer_id               session.customer || null
--       4   p_stripe_event_id                  stripeEvent.id
--       5   p_customer_email                   session.customer_details?.email || meta.customerEmail
--       6   p_customer_name                    session.customer_details?.name  || meta.customerName
--       7   p_customer_phone                   session.customer_details?.phone || meta.customerPhone
--       8   p_shipping_address                 JSON.stringify(address) || meta.shippingAddress || null
--       9   p_payment_status                   'paid'  (hardcoded for checkout.session.completed)
--      10   p_fulfillment_status               deriveFulfillmentStatus(itemRows): 'available'|'pending'
--      11   p_currency                         session.currency || 'usd'
--      12   p_subtotal                         session.amount_subtotal || 0  (integer cents)
--      13   p_discount_total                   Math.max(0, subtotal - total)  (integer cents)
--      14   p_shipping_total                   session.shipping_cost?.amount_total || 0
--      15   p_tax_total                        session.total_details?.amount_tax   || 0
--      16   p_total                            session.amount_total || 0  (integer cents)
--      17   p_contains_digital                 itemRows.some(r => r.item_type === 'ebook')
--      18   p_contains_physical                itemRows.some(r => r.item_type === 'product')
--      19   p_contains_service                 itemRows.some(r => r.item_type === 'service')
--      20   p_applied_promo_code               meta.promoCode || null
--      21   p_applied_discount_percent         parseFloat(meta.discountPercent) || null → numeric
--      22   p_metadata                         meta  (session.metadata, serialized to jsonb)
--      23   p_paid_at                          new Date().toISOString() → timestamptz
--      24   p_items                            itemRows[]  (array of validated item objects)
--
--    Each p_items element must contain:
--      stripe_line_item_id   text    item.id  (li_xxx)
--      product_id            text    price.product.metadata.itemId
--      product_name          text    item.description || product.name
--      item_type             text    'product' | 'ebook' | 'service'
--      quantity              integer item.quantity
--      unit_price            integer item.price.unit_amount  (cents)
--      line_total            integer item.amount_total  (cents)
--      currency              text    item.currency || session.currency
--      stripe_price_id       text    item.price.id  (nullable)
--      stripe_product_id     text    product.id  (nullable)
--
--    Returns:
--      order_id        uuid     — the persisted order UUID
--      was_created     boolean  — true if this was a new order; false on retry
--      items_expected  integer  — unique stripe_line_item_ids received
--      items_before    integer  — item count before this run (diagnostic)
--      items_persisted integer  — item count after reconciliation
--      is_complete     boolean  — always true on success; function raises on false
--
--    Failure modes:
--      VALIDATION_ERROR prefix → caller should return 422 (no retry)
--      PERSISTENCE_ERROR prefix → caller should return 500 (retry)
--      Any other exception → caller should return 500 (retry)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.persist_stripe_order(
  -- ── Stripe session identifiers ─────────────────────────────────────────────
  p_stripe_checkout_session_id  text,
  p_stripe_payment_intent_id    text,
  p_stripe_customer_id          text,
  p_stripe_event_id             text,

  -- ── Customer fields ────────────────────────────────────────────────────────
  p_customer_email              text,
  p_customer_name               text,
  p_customer_phone              text,
  p_shipping_address            text,

  -- ── Payment lifecycle ──────────────────────────────────────────────────────
  p_payment_status              text,
  p_fulfillment_status          text,
  p_currency                    text,

  -- ── Monetary values — integer cents ───────────────────────────────────────
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

  -- ── Line items (see item schema in header comment above) ──────────────────
  p_items                       jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_order_id         uuid;
  v_was_created      boolean;
  v_pre_existing_id  uuid;
  v_items_expected   integer;
  v_items_before     integer;
  v_items_persisted  integer;
  v_items_matched    integer;

  -- Validation loop variables
  v_item             jsonb;
  v_line_item_id     text;
  v_product_id       text;
  v_item_type        text;
begin

  -- ═══════════════════════════════════════════════════════════════════════════
  -- PHASE 1: VALIDATION — no writes until every check passes
  -- ═══════════════════════════════════════════════════════════════════════════

  -- Required: Stripe session ID
  if p_stripe_checkout_session_id is null or trim(p_stripe_checkout_session_id) = '' then
    raise exception 'VALIDATION_ERROR: p_stripe_checkout_session_id is required.';
  end if;

  -- Required: customer email (needed for download verification)
  if p_customer_email is null or trim(p_customer_email) = '' then
    raise exception 'VALIDATION_ERROR: p_customer_email is required.';
  end if;

  -- Valid payment status
  if p_payment_status not in (
    'unpaid','processing','paid','failed','refunded','partially_refunded','canceled'
  ) then
    raise exception 'VALIDATION_ERROR: Invalid payment_status: %.', p_payment_status;
  end if;

  -- Valid fulfillment status
  if p_fulfillment_status not in ('pending','available','fulfilled','revoked') then
    raise exception 'VALIDATION_ERROR: Invalid fulfillment_status: %.', p_fulfillment_status;
  end if;

  -- Items array: must be a non-empty JSON array
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'VALIDATION_ERROR: p_items must be a JSON array.';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'VALIDATION_ERROR: p_items must contain at least one item.';
  end if;

  -- Validate every item before any write.
  -- Any invalid item aborts the entire event — partial orders are never created.
  for v_item in select value from jsonb_array_elements(p_items) loop

    v_line_item_id := v_item->>'stripe_line_item_id';
    v_product_id   := v_item->>'product_id';
    v_item_type    := v_item->>'item_type';

    -- stripe_line_item_id: required (idempotency + reconciliation key)
    if v_line_item_id is null or trim(v_line_item_id) = '' then
      raise exception 'VALIDATION_ERROR: An item in p_items is missing stripe_line_item_id.';
    end if;

    -- product_id: required (eBook entitlement key)
    if v_product_id is null or trim(v_product_id) = '' then
      raise exception
        'VALIDATION_ERROR: Item % has null or empty product_id. '
        'Ensure price.product.metadata.itemId is set on the Stripe Product.',
        v_line_item_id;
    end if;

    -- item_type: must match schema CHECK constraint
    if v_item_type not in ('product', 'ebook', 'service') then
      raise exception
        'VALIDATION_ERROR: Item % has unsupported item_type "%". '
        'Supported: product, ebook, service.',
        v_line_item_id, v_item_type;
    end if;

    -- quantity: positive integer
    begin
      if (v_item->>'quantity')::integer < 1 then
        raise exception
          'VALIDATION_ERROR: Item % quantity must be >= 1.', v_line_item_id;
      end if;
    exception when invalid_text_representation or not_null_violation then
      raise exception
        'VALIDATION_ERROR: Item % has a non-integer or missing quantity.', v_line_item_id;
    end;

    -- unit_price and line_total: non-negative integers (cents)
    begin
      if (v_item->>'unit_price')::integer < 0 then
        raise exception
          'VALIDATION_ERROR: Item % unit_price must be >= 0.', v_line_item_id;
      end if;
      if (v_item->>'line_total')::integer < 0 then
        raise exception
          'VALIDATION_ERROR: Item % line_total must be >= 0.', v_line_item_id;
      end if;
    exception when invalid_text_representation or not_null_violation then
      raise exception
        'VALIDATION_ERROR: Item % has non-integer or missing unit_price/line_total.',
        v_line_item_id;
    end;

  end loop;

  -- Count expected unique line item IDs (deduplicate input; Stripe never duplicates,
  -- but we handle it safely in case of unusual retry payloads).
  select count(distinct (item->>'stripe_line_item_id'))
  into   v_items_expected
  from   jsonb_array_elements(p_items) as item;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- PHASE 2: ORDER UPSERT
  --
  -- ON CONFLICT on stripe_checkout_session_id (UNIQUE NOT NULL, _02 migration).
  -- Retry scenario: order already exists → update tracking fields only.
  -- New order: full insert.
  -- DO NOT downgrade payment_status or fulfillment_status (merge conservatively).
  -- ═══════════════════════════════════════════════════════════════════════════

  -- Detect whether the order already exists (for the was_created return value).
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
        -- Preserve existing payment_intent_id if the new value is null
        stripe_payment_intent_id = coalesce(
          excluded.stripe_payment_intent_id,
          orders.stripe_payment_intent_id
        ),
        -- Always accept Stripe's authoritative lifecycle values
        payment_status           = excluded.payment_status,
        fulfillment_status       = excluded.fulfillment_status,
        updated_at               = now()
  returning id into v_order_id;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- PHASE 3: ITEM RECONCILIATION
  --
  -- Count items before reconciliation for diagnostics.
  -- Delete stale rows: items in DB for this order that Stripe no longer reports.
  --   Scoped strictly to this order_id. Checkout Session items are immutable
  --   after completion, so stale rows indicate a buggy previous write.
  -- Upsert authoritative rows: DO UPDATE overwrites every field with the
  --   current Stripe-sourced values. Corrects any previously incorrect data.
  -- ═══════════════════════════════════════════════════════════════════════════

  select count(*) into v_items_before
  from   public.order_items
  where  order_id = v_order_id;

  -- DELETE stale rows: those present in DB but not in the current Stripe payload.
  -- Scoped to this order_id only — never touches other orders.
  --
  -- Uses NOT EXISTS instead of NOT IN to avoid the SQL NULL trap:
  -- NOT IN returns NULL (not TRUE) when the subquery contains any NULL value,
  -- which would silently skip the delete. NOT EXISTS has no such issue.
  delete from public.order_items oi_del
  where  oi_del.order_id = v_order_id
    and  not exists (
           select 1
           from   jsonb_array_elements(p_items) as item
           where  item->>'stripe_line_item_id' = oi_del.stripe_line_item_id
         );

  -- UPSERT authoritative item rows.
  -- ON CONFLICT DO UPDATE ensures existing rows receive current Stripe values.
  -- This corrects any field that was stored incorrectly by a previous run.
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
  on conflict (order_id, stripe_line_item_id) do update set
    -- Authoritative Stripe values overwrite whatever was previously stored.
    product_id        = excluded.product_id,
    product_name      = excluded.product_name,
    item_type         = excluded.item_type,
    quantity          = excluded.quantity,
    unit_price        = excluded.unit_price,
    line_total        = excluded.line_total,
    currency          = excluded.currency,
    stripe_price_id   = excluded.stripe_price_id,
    stripe_product_id = excluded.stripe_product_id,
    metadata          = excluded.metadata;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- PHASE 4: EXACT SET VERIFICATION
  --
  -- Count equality: stored rows must equal expected rows exactly.
  --   Catches: stale row that DELETE somehow missed, or extra phantom row.
  --
  -- Set equality: every expected stripe_line_item_id must exist in DB.
  --   Catches: an item that was supposed to insert but silently didn't.
  --
  -- Both checks must pass. Failure raises an exception, rolling back the
  -- entire transaction. Stripe receives 500 and retries.
  -- ═══════════════════════════════════════════════════════════════════════════

  -- Total stored items for this order after reconciliation.
  select count(*) into v_items_persisted
  from   public.order_items
  where  order_id = v_order_id;

  -- Count of expected IDs that actually exist in DB.
  -- Uses EXISTS (not IN) for NULL-safety and clarity.
  select count(*) into v_items_matched
  from   public.order_items oi
  where  oi.order_id = v_order_id
    and  exists (
           select 1
           from   jsonb_array_elements(p_items) as item
           where  item->>'stripe_line_item_id' = oi.stripe_line_item_id
         );

  -- Check 1: total count equality (detects stale rows or missing inserts).
  if v_items_persisted <> v_items_expected then
    raise exception
      'PERSISTENCE_ERROR: Order % has % item row(s) after reconciliation but expected exactly %. '
      'Possible stale row or failed upsert. Rolling back.',
      v_order_id, v_items_persisted, v_items_expected;
  end if;

  -- Check 2: set membership (detects rows with wrong stripe_line_item_id values).
  if v_items_matched <> v_items_expected then
    raise exception
      'PERSISTENCE_ERROR: Order % — only % of % expected stripe_line_item_id(s) found in DB. '
      'Item set is incomplete. Rolling back.',
      v_order_id, v_items_matched, v_items_expected;
  end if;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- PHASE 5: RETURN
  -- ═══════════════════════════════════════════════════════════════════════════

  return jsonb_build_object(
    'order_id',        v_order_id,
    'was_created',     v_was_created,
    'items_expected',  v_items_expected,
    'items_before',    v_items_before,
    'items_persisted', v_items_persisted,
    'is_complete',     true   -- always true here — RAISE fired before we reach this line otherwise
  );

exception
  when others then
    -- Propagate all exceptions to the caller, triggering full transaction rollback.
    -- This function never returns a result after a partial write.
    raise;

end;
$$;

comment on function public.persist_stripe_order(
  text,text,text,text,text,text,text,text,text,text,text,
  integer,integer,integer,integer,integer,
  boolean,boolean,boolean,text,numeric,jsonb,timestamptz,jsonb
) is
  'Atomic reconciliation of one Stripe checkout.session.completed event. '
  'Validates all inputs; upserts the order; deletes stale items; upserts authoritative '
  'item rows; verifies exact count + set equality. Any failure rolls back entirely. '
  'Security: DEFINER, search_path = public + pg_catalog, service_role only.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Access control
--
--    REVOKE from public first (covers all roles).
--    Explicit REVOKE from anon and authenticated (belt-and-suspenders).
--    GRANT only to service_role (the Netlify stripe-webhook function uses this
--    role via SUPABASE_SERVICE_ROLE_KEY — never expose this key to the browser).
--
--    With SECURITY DEFINER, this is critical: a caller who can execute the
--    function runs it with postgres/superuser privileges.
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
-- 5. Verification queries — run after applying in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- stripe_line_item_id column exists and is NOT NULL
select column_name, data_type, is_nullable
from   information_schema.columns
where  table_schema = 'public'
  and  table_name   = 'order_items'
  and  column_name  = 'stripe_line_item_id';
-- Expected: 1 row, data_type=text, is_nullable=NO

-- Unique constraint exists
select conname, pg_get_constraintdef(oid) as definition
from   pg_constraint
where  conrelid = 'public.order_items'::regclass
  and  conname  = 'order_items_stripe_line_item_unique';
-- Expected: 1 row

-- Function: SECURITY DEFINER, 24 params, returns jsonb
select
  proname,
  case prosecdef when true then 'DEFINER' else 'INVOKER' end as security_model,
  pronargs,
  pg_get_function_result(oid) as return_type
from pg_proc
where proname      = 'persist_stripe_order'
  and pronamespace = 'public'::regnamespace;
-- Expected: security_model=DEFINER, pronargs=24, return_type=jsonb

-- Access control: verify EXECUTE granted only to service_role
-- (Use routine_privileges, which shows explicit grants.)
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name   = 'persist_stripe_order';
-- Expected: exactly one row — grantee=service_role, privilege_type=EXECUTE
-- public / anon / authenticated must NOT appear.
-- If public appears, the REVOKE statements did not execute successfully.
