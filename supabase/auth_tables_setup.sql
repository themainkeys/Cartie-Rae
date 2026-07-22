-- ============================================================================
-- Cartiae Rae — Real admin auth + contacts (run in Supabase → SQL Editor)
-- After this, create a staff user (step B below) and flip on real auth.
-- ============================================================================

-- 1) admin_users: maps a Supabase Auth user (UUID) to an admin role.
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

-- 2) contact_requests: public can submit; only admins can read/manage.
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
