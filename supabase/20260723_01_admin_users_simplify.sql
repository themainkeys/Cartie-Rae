-- ============================================================================
-- Cartiae Rae — admin_users schema alignment (single-admin model)
-- Migration: 20260723_01_admin_users_simplify.sql
--
-- Run FIRST, before 20260723_02_orders_schema.sql.
-- The orders RLS policies reference admin_users.is_active.
--
-- Run in: Supabase Dashboard → SQL Editor
--
-- This migration:
--   1. Runs a comprehensive preflight that ABORTS if any view, function,
--      or RLS policy still references admin_users.role — nothing is dropped
--      blindly; unknown dependencies cause a hard failure with names printed.
--   2. Drops the role column only after preflight passes.
--   3. Adds is_active (soft-disable without deleting admin record).
--   4. Adds updated_at with a TABLE-SPECIFIC trigger function
--      (public.set_admin_users_updated_at) so no shared function is touched.
--   5. Preserves all existing admin records.
--   6. Does NOT drop or recreate the table.
--   7. Does NOT touch any existing RLS policies on admin_users.
--
-- Safe to re-run: all steps use IF EXISTS / IF NOT EXISTS guards.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Preflight dependency check
--
-- Aborts the entire migration if ANY of the following still reference the
-- admin_users.role column:
--   • Views (pg_views)
--   • Functions/procedures (pg_proc)
--   • RLS policies on admin_users
--   • RLS policies on OTHER tables that join or reference admin_users.role
--
-- No object is dropped. On abort, the error message lists the offending names
-- so they can be reviewed and handled explicitly before re-running.
--
-- Note: triggers reference functions, not columns directly. A trigger cannot
-- depend on a column; only functions it calls can. Function bodies are
-- covered by the pg_proc check below.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  v_count integer;
  v_names text;
begin

  -- 0a. Views in the public schema that mention admin_users and role together
  select count(*), string_agg(viewname, ', ' order by viewname)
  into   v_count, v_names
  from   pg_views
  where  schemaname = 'public'
    and  definition ilike '%admin_users%'
    and  definition ilike '%.role%';

  if v_count > 0 then
    raise exception
      'PREFLIGHT FAILED: % view(s) reference admin_users.role and must be '
      'migrated or dropped before this column can be removed. View(s): %',
      v_count, v_names;
  end if;

  -- 0b. Functions/procedures in the public schema whose body references
  --     admin_users and role together
  select count(*), string_agg(p.proname, ', ' order by p.proname)
  into   v_count, v_names
  from   pg_proc     p
  join   pg_namespace n on n.oid = p.pronamespace
  where  n.nspname = 'public'
    and  p.prosrc  ilike '%admin_users%'
    and  p.prosrc  ilike '%.role%';

  if v_count > 0 then
    raise exception
      'PREFLIGHT FAILED: % function(s) reference admin_users.role and must be '
      'updated before this column can be removed. Function(s): %',
      v_count, v_names;
  end if;

  -- 0c. RLS policies directly on the admin_users table that mention role
  select count(*), string_agg(policyname, ', ' order by policyname)
  into   v_count, v_names
  from   pg_policies
  where  schemaname = 'public'
    and  tablename  = 'admin_users'
    and  (
           coalesce(qual,       '') ilike '%.role%'
        or coalesce(with_check, '') ilike '%.role%'
         );

  if v_count > 0 then
    raise exception
      'PREFLIGHT FAILED: % RLS policy/policies on admin_users reference the '
      'role column and must be updated before removal. Policy/policies: %',
      v_count, v_names;
  end if;

  -- 0d. RLS policies on OTHER tables that join admin_users and reference .role
  select count(*),
         string_agg(tablename || '.' || policyname, ', '
                    order by tablename, policyname)
  into   v_count, v_names
  from   pg_policies
  where  schemaname = 'public'
    and  tablename <> 'admin_users'
    and  (
           (coalesce(qual,       '') ilike '%admin_users%'
            and coalesce(qual,       '') ilike '%.role%')
        or (coalesce(with_check, '') ilike '%admin_users%'
            and coalesce(with_check, '') ilike '%.role%')
         );

  if v_count > 0 then
    raise exception
      'PREFLIGHT FAILED: % RLS policy/policies on other tables join '
      'admin_users and reference .role. Each must be updated before the '
      'column can be removed. Policy/policies: %',
      v_count, v_names;
  end if;

  raise notice 'Preflight passed: no views, functions, or policies reference admin_users.role.';

end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Drop role column (only reached if preflight passed above)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (
    select 1
    from   information_schema.columns
    where  table_schema = 'public'
      and  table_name   = 'admin_users'
      and  column_name  = 'role'
  ) then
    alter table public.admin_users drop column role;
    raise notice 'admin_users.role dropped successfully.';
  else
    raise notice 'admin_users.role is already absent — skipping drop.';
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add is_active — allows disabling an admin account without deletion.
--    Defaults to true so all existing records remain active immediately.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.admin_users
  add column if not exists is_active boolean not null default true;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add updated_at for audit trail
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.admin_users
  add column if not exists updated_at timestamptz not null default now();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Table-specific trigger function for admin_users.updated_at
--
--    Named public.set_admin_users_updated_at() — NOT the generic set_updated_at.
--    This avoids touching or replacing any shared function that may already
--    exist and serve other tables with different semantics.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_admin_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_admin_users_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Backfill: ensure is_active is true for all existing rows
-- ─────────────────────────────────────────────────────────────────────────────
update public.admin_users
  set is_active = true
  where is_active is distinct from true;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Verification
-- ─────────────────────────────────────────────────────────────────────────────
select id, name, email, is_active, created_at, updated_at
from   public.admin_users;
