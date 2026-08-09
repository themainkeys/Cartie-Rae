-- ============================================================================
-- Cartiae Rae — Orders + secure eBook delivery
-- ============================================================================
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
--
-- Creates:
--   1. public.orders       — server-side record of every paid Stripe checkout.
--                            Written ONLY by the stripe-webhook function.
--   2. public.ebook_files  — maps an eBook id to its object path in the private
--                            "ebooks" storage bucket. This is the ONLY source of
--                            truth for which file an order may download, so a
--                            buyer can never request an arbitrary path.
--   3. storage bucket "ebooks" — PRIVATE. No public read policy is created, so
--                            files are reachable only through a short-lived
--                            signed URL minted by get-ebook-download.
--
-- Both tables have RLS enabled with NO policies: the anon/authenticated keys
-- can read nothing. The Netlify functions use the service_role key, which
-- bypasses RLS by design.
-- ============================================================================

-- ── 1) Orders ───────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                       uuid primary key default gen_random_uuid(),
  stripe_session_id        text not null unique,
  stripe_payment_intent    text,
  customer_name            text not null,
  customer_email           text not null,
  customer_phone           text,
  shipping_address         text,
  -- items: [{ id, name, type, quantity, unit_amount, currency }]
  items                    jsonb not null default '[]'::jsonb,
  total                    numeric(10,2) not null default 0,
  currency                 text not null default 'usd',
  discount_code            text,
  discount_percent         numeric(5,2) not null default 0,
  contains_digital         boolean not null default false,
  contains_service         boolean not null default false,
  contains_physical        boolean not null default false,
  status                   text not null default 'paid',
  created_at               timestamptz not null default now()
);

-- Buyers are looked up by (session id) and re-verified by email.
create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));
create index if not exists orders_created_at_idx     on public.orders (created_at desc);

alter table public.orders enable row level security;

-- The public gets nothing. The webhook and download functions use the
-- service_role key, which bypasses RLS entirely.
drop policy if exists "orders public read"   on public.orders;
drop policy if exists "orders public insert" on public.orders;

-- Signed-in admins read their store's orders — without this the admin Orders
-- Ledger authenticates fine and then renders zero rows.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders
  for select to authenticated
  using ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- ...and may mark them dispatched.
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders
  for update to authenticated
  using      ( exists (select 1 from public.admin_users a where a.id = auth.uid()) )
  with check ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- ── 2) eBook id -> storage path mapping ─────────────────────────────────────
create table if not exists public.ebook_files (
  ebook_id     text primary key,
  storage_path text not null,   -- path inside the private "ebooks" bucket
  title        text,
  created_at   timestamptz not null default now()
);

alter table public.ebook_files enable row level security;
-- Again: no policies. Only the service_role key may read this.

-- Seed the three eBooks currently in src/data/initialData.ts.
-- The ebook_id MUST match the cart item id exactly ('ebook-1', not 'eb1') —
-- get-ebook-download looks these up by the id stored on the order.
-- Upload the matching PDFs to the "ebooks" bucket under these exact paths.
insert into public.ebook_files (ebook_id, storage_path, title) values
  ('ebook-1', '4c_growth_blueprint_cartiae_rae.pdf', 'The 4C Growth Blueprint'),
  ('ebook-2', 'wash_day_mastery_cartiae_rae.pdf',    'Wash Day Mastery'),
  ('ebook-3', 'protective_styles_playbook.pdf',      'The Protective Style Playbook')
on conflict (ebook_id) do update
  set storage_path = excluded.storage_path,
      title        = excluded.title;

-- ── 3) Private "ebooks" storage bucket ──────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 104857600, array['application/pdf', 'application/epub+zip'])
on conflict (id) do update
  set public             = false,          -- force private even if it existed as public
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Remove any policy that would expose the bucket publicly.
drop policy if exists "ebooks public read"   on storage.objects;
drop policy if exists "ebooks public insert" on storage.objects;

-- Signed-in admins may upload/replace eBook files from the admin portal.
drop policy if exists "ebooks auth insert" on storage.objects;
create policy "ebooks auth insert"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'ebooks' );

drop policy if exists "ebooks auth update" on storage.objects;
create policy "ebooks auth update"
  on storage.objects for update to authenticated
  using ( bucket_id = 'ebooks' );

drop policy if exists "ebooks auth delete" on storage.objects;
create policy "ebooks auth delete"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'ebooks' );

-- NOTE: no SELECT policy is granted on the ebooks bucket. Reads happen only via
-- the signed URLs generated by the get-ebook-download function.
