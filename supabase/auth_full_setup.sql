-- ============================================================================
-- Cartiae Rae — One-shot admin auth setup (run in Supabase → SQL Editor)
-- Creates tables AND promotes your existing Supabase Auth user(s) to Super Admin.
-- No User UID needed. Safe to re-run.
-- ============================================================================

-- 1) admin_users table
create table if not exists public.admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  email      text,
  role       text not null check (role in ('super_admin','store_manager','content_manager')),
  created_at timestamptz default now()
);
alter table public.admin_users enable row level security;

drop policy if exists "admin read own profile" on public.admin_users;
create policy "admin read own profile" on public.admin_users
  for select to authenticated using ( auth.uid() = id );

-- 2) contact_requests table
create table if not exists public.contact_requests (
  id               text primary key,
  name             text not null,
  email            text not null,
  phone            text,
  porosity         text,
  message          text not null,
  photo_attachment text,
  status           text default 'Pending',
  date             text,
  created_at       timestamptz default now()
);
alter table public.contact_requests enable row level security;

drop policy if exists "contact public insert" on public.contact_requests;
create policy "contact public insert" on public.contact_requests
  for insert to anon, authenticated with check ( true );

drop policy if exists "contact admin read" on public.contact_requests;
create policy "contact admin read" on public.contact_requests
  for select to authenticated
  using ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

drop policy if exists "contact admin update" on public.contact_requests;
create policy "contact admin update" on public.contact_requests
  for update to authenticated
  using ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

drop policy if exists "contact admin delete" on public.contact_requests;
create policy "contact admin delete" on public.contact_requests
  for delete to authenticated
  using ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- 3) Promote EVERY existing Supabase Auth user to super_admin.
--    (On a fresh project that's just the admin login you created.)
--    If you later add non-admin users, remove them from admin_users manually.
insert into public.admin_users (id, name, email, role)
select u.id, coalesce(u.raw_user_meta_data->>'name', split_part(u.email,'@',1)), u.email, 'super_admin'
from auth.users u
on conflict (id) do update set role = excluded.role, email = excluded.email;

-- Show the result so you can confirm your login is now an admin:
select email, role from public.admin_users;
