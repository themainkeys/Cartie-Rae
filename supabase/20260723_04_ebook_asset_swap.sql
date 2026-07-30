-- =============================================================================
-- Migration 04: Atomic eBook Asset Swap Function
-- =============================================================================
-- File:    20260723_04_ebook_asset_swap.sql
-- Depends: 20260723_03_ebooks_storage.sql (public.ebook_assets must exist)
-- IDEMPOTENT: Uses CREATE OR REPLACE — safe to re-run.
--
-- Purpose
-- -------
-- Wraps the two-step "deactivate previous asset + insert new asset" sequence
-- inside a single PostgreSQL function so it executes atomically within one
-- implicit transaction.
--
-- Without this, a concurrent upload (two browser tabs or two admin sessions)
-- could race between the UPDATE and INSERT, potentially leaving two active rows
-- or deactivating the old asset before the new one is confirmed written.
--
-- Security: SECURITY INVOKER — runs with the caller's privileges so RLS
-- policies on ebook_assets still apply. The caller must be an authenticated
-- admin with INSERT and UPDATE rights on ebook_assets.
--
-- Called from the frontend via: supabase.rpc('activate_ebook_asset', {...})
-- Returns the uuid of the newly inserted ebook_assets row.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Preflight: ebook_assets must exist (migration _03 must have been applied)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from   information_schema.tables
    where  table_schema = 'public'
      and  table_name   = 'ebook_assets'
  ) then
    raise exception
      'ebook_assets table not found — apply migration _03 (20260723_03_ebooks_storage.sql) first.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Function: public.activate_ebook_asset
-- ---------------------------------------------------------------------------
create or replace function public.activate_ebook_asset(
  p_ebook_id        text,
  p_storage_bucket  text,
  p_storage_path    text,
  p_version         integer,
  p_file_name       text,
  p_mime_type       text,
  p_size_bytes      bigint,
  p_checksum_sha256 text   -- nullable: pass NULL if checksum is not yet available
)
returns uuid
language plpgsql
security invoker
-- No SET search_path needed for invoker functions; inherits caller's search_path.
as $$
declare
  v_new_id uuid;
begin
  -- Step 1: Deactivate all currently active assets for this eBook.
  -- Because this is inside a function, this UPDATE and the INSERT below
  -- share the same transaction. If the INSERT fails for any reason
  -- (constraint violation, permission error, etc.), Postgres automatically
  -- rolls back this UPDATE as well — leaving the previous asset still active.
  update public.ebook_assets
  set    is_active  = false,
         updated_at = now()
  where  ebook_id   = p_ebook_id
    and  is_active  = true;

  -- Step 2: Insert the new asset row as the single active version.
  -- The partial unique index (ebook_id) WHERE is_active = true ensures
  -- at most one active row exists per ebook_id after this insert.
  insert into public.ebook_assets (
    ebook_id,
    storage_bucket,
    storage_path,
    version,
    file_name,
    mime_type,
    size_bytes,
    checksum_sha256,
    is_active,
    created_by
  ) values (
    p_ebook_id,
    p_storage_bucket,
    p_storage_path,
    p_version,
    p_file_name,
    p_mime_type,
    p_size_bytes,
    p_checksum_sha256,
    true,
    auth.uid()          -- records which admin uploaded this version
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

comment on function public.activate_ebook_asset(text, text, text, integer, text, text, bigint, text) is
  'Atomically deactivates the current active ebook_assets row for an eBook and inserts a new active row. '
  'Called after a successful PDF upload to the private ebooks Storage bucket. '
  'Runs under SECURITY INVOKER so RLS still applies — caller must be an authenticated admin. '
  'The deactivate + insert share one implicit transaction: if the insert fails, '
  'the deactivate is rolled back and the previous version remains active.';

-- ---------------------------------------------------------------------------
-- Grant: authenticated admins may call this function
-- ---------------------------------------------------------------------------
grant execute
  on function public.activate_ebook_asset(text, text, text, integer, text, text, bigint, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
select
  proname                                      as function_name,
  case prosecdef when true then 'DEFINER' else 'INVOKER' end as security_model,
  pronargs                                     as param_count,
  pg_get_function_result(oid)                  as return_type
from pg_proc
where proname      = 'activate_ebook_asset'
  and pronamespace = 'public'::regnamespace;
