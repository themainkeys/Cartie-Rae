-- ============================================================================
-- Cartiae Rae — Backend rework: server-side price authority + order recording
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- WHY: the Stripe checkout function must NOT trust prices sent by the browser
-- (a customer could pay $0.50 for anything). These tables are the trusted source
-- the serverless function reads. `catalog_items`/`discount_codes` are written only
-- by logged-in admins (or seeded here); `orders` is written only by the Stripe
-- webhook (service role). Customers can never write any of them.
-- ============================================================================

-- 1) Authoritative catalog prices
create table if not exists public.catalog_items (
  id         text primary key,
  kind       text not null check (kind in ('product','ebook','service')),
  name       text,
  price      numeric(10,2) not null check (price >= 0),
  active     boolean not null default true,
  updated_at timestamptz default now()
);
alter table public.catalog_items enable row level security;

drop policy if exists "catalog public read" on public.catalog_items;
create policy "catalog public read" on public.catalog_items for select using ( true );

drop policy if exists "catalog admin write" on public.catalog_items;
create policy "catalog admin write" on public.catalog_items for all to authenticated
  using      ( exists (select 1 from public.admin_users a where a.id = auth.uid()) )
  with check ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- 2) Authoritative discount codes
create table if not exists public.discount_codes (
  code        text primary key,
  percent     int not null check (percent between 0 and 100),
  active      boolean not null default true,
  description text,
  updated_at  timestamptz default now()
);
alter table public.discount_codes enable row level security;

drop policy if exists "discounts public read" on public.discount_codes;
create policy "discounts public read" on public.discount_codes for select using ( true );

drop policy if exists "discounts admin write" on public.discount_codes;
create policy "discounts admin write" on public.discount_codes for all to authenticated
  using      ( exists (select 1 from public.admin_users a where a.id = auth.uid()) )
  with check ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- 3) Orders (written by the Stripe webhook via the service role; read by admins)
create table if not exists public.orders (
  id                text primary key,
  stripe_session_id text unique,
  customer_name     text,
  customer_email    text,
  items             jsonb,
  subtotal          numeric(10,2),
  discount          numeric(10,2),
  total             numeric(10,2),
  status            text default 'paid',
  created_at        timestamptz default now()
);
alter table public.orders enable row level security;

drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select to authenticated
  using ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );
-- No insert/update policy on purpose → only the service_role key (the webhook) writes.

-- 4) Seed the canonical catalog + discounts (idempotent; admin edits later overwrite).
insert into public.catalog_items (id, kind, name, price, active) values
  ('prod-1',    'product', 'Botanical Growth Oil',            38.00, true),
  ('prod-2',    'product', 'Silk Sleep Cap',                  25.00, true),
  ('prod-3',    'product', 'Detangling Collection',           45.00, true),
  ('prod-4',    'product', 'Deep Repair Mask',                32.00, true),
  ('ebook-1',   'ebook',   'The 4C Growth Blueprint',         24.99, true),
  ('ebook-2',   'ebook',   'Wash Day Mastery',                19.99, true),
  ('ebook-3',   'ebook',   'The Protective Style Playbook',   15.99, true),
  ('service-1', 'service', 'Hair Assessment Guidance Call',  100.00, true),
  ('service-2', 'service', 'Social Media Growth Coaching Call',100.00, true)
on conflict (id) do update
  set kind = excluded.kind, name = excluded.name, price = excluded.price, active = excluded.active, updated_at = now();

insert into public.discount_codes (code, percent, active, description) values
  ('GROW4C',    15, true, 'Growth bundle discount'),
  ('CARTIAE10', 10, true, 'Welcome discount')
on conflict (code) do update
  set percent = excluded.percent, active = excluded.active, description = excluded.description, updated_at = now();
