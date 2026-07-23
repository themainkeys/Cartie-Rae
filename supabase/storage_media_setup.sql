-- ============================================================================
-- Cartiae Rae — Media Storage setup (photos + videos)
-- Paste into: Supabase Dashboard → SQL Editor → Run
--
-- Creates/ensures a public "media" bucket and access policies.
--
-- ⚠️ POLICY CHOICE: because the admin currently uses the passwordless DEMO login
-- (no Supabase Auth session), uploads are ANONYMOUS. So these policies allow
-- public insert/update/delete on the `media` bucket. This is convenient but means
-- anyone who knows the project URL could upload to this bucket. It is acceptable
-- for a demo / low-risk site, but you SHOULD tighten it once you enable real
-- Supabase Auth (set VITE_SUPABASE_BACKEND="true" and create staff logins) —
-- see the "LOCK DOWN LATER" block at the bottom.
-- ============================================================================

-- 1) Create (or update) the public "media" bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50 MB per file (raise for longer videos)
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif','video/mp4','video/webm']
)
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Anyone can READ media (needed to display photos/videos on the storefront).
drop policy if exists "media public read" on storage.objects;
create policy "media public read"
  on storage.objects for select
  using ( bucket_id = 'media' );

-- 3) Only LOGGED-IN admins (Supabase Auth session) can upload / replace / delete.
--    This requires real auth (VITE_SUPABASE_BACKEND="true") — which is enabled.
--    Anonymous visitors cannot write to or delete from the bucket.
drop policy if exists "media public insert" on storage.objects;  -- remove any old permissive policy
drop policy if exists "media public update" on storage.objects;
drop policy if exists "media public delete" on storage.objects;

drop policy if exists "media auth insert" on storage.objects;
create policy "media auth insert"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'media' );

drop policy if exists "media auth update" on storage.objects;
create policy "media auth update"
  on storage.objects for update to authenticated
  using ( bucket_id = 'media' );

drop policy if exists "media auth delete" on storage.objects;
create policy "media auth delete"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'media' );

-- ============================================================================
-- NOTE: because uploads now require a login, the admin must be signed in via
-- Supabase Auth for the dropzones to work. If you ever run a public/demo build
-- (VITE_SUPABASE_BACKEND unset) and want uploads without login, you would need
-- permissive anon policies instead — but that lets anyone write to the bucket.
-- ============================================================================
