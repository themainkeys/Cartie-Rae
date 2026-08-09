-- ============================================================================
-- Cartiae Rae — tables the app uses but no migration ever created
-- ============================================================================
-- Run this in the Supabase SQL editor. Safe to re-run.
--
--   1. public.site_snapshots — the published site content. This is how the
--      owner's admin edits reach visitors and other devices
--      (AppContext.tsx reads it at :526 and writes it at :1219). Without this
--      table she edits, sees changes locally, gets "Sync failed", and the
--      public site never updates.
--      It is ALSO the server-side price source for create-checkout-session,
--      so that checkout never trusts prices sent by the browser.
--
--   2. public.videos       — video CRUD from the admin (AppContext :790/:841/:855)
--   3. public.gallery_items — gallery CRUD from the admin (AppContext :873/:895/:909)
--
-- RLS: the public may READ published content (the storefront needs it while
-- signed out). Only authenticated admins may write.
-- ============================================================================

-- ── 1) Published site content ───────────────────────────────────────────────
create table if not exists public.site_snapshots (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_snapshots enable row level security;

drop policy if exists "snapshot public read" on public.site_snapshots;
create policy "snapshot public read" on public.site_snapshots
  for select to anon, authenticated using ( true );

drop policy if exists "snapshot admin write" on public.site_snapshots;
create policy "snapshot admin write" on public.site_snapshots
  for all to authenticated
  using      ( exists (select 1 from public.admin_users a where a.id = auth.uid()) )
  with check ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- ── 2) Videos ───────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id            text primary key,
  title         text,
  category      text,
  video_url     text,
  tiktok_url    text,
  thumbnail_url text,
  views         text,
  created_at    timestamptz not null default now()
);

alter table public.videos enable row level security;

drop policy if exists "videos public read" on public.videos;
create policy "videos public read" on public.videos
  for select to anon, authenticated using ( true );

drop policy if exists "videos admin write" on public.videos;
create policy "videos admin write" on public.videos
  for all to authenticated
  using      ( exists (select 1 from public.admin_users a where a.id = auth.uid()) )
  with check ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- ── 3) Gallery ──────────────────────────────────────────────────────────────
create table if not exists public.gallery_items (
  id          text primary key,
  title       text,
  category    text,
  image_url   text,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.gallery_items enable row level security;

drop policy if exists "gallery public read" on public.gallery_items;
create policy "gallery public read" on public.gallery_items
  for select to anon, authenticated using ( true );

drop policy if exists "gallery admin write" on public.gallery_items;
create policy "gallery admin write" on public.gallery_items
  for all to authenticated
  using      ( exists (select 1 from public.admin_users a where a.id = auth.uid()) )
  with check ( exists (select 1 from public.admin_users a where a.id = auth.uid()) );

-- ── 4) Seed the catalog so checkout has prices to verify against ────────────
-- create-checkout-session refuses to sell anything it cannot price from here.
-- Seeded from src/data/initialData.ts, with the invented testimonials removed.
-- The owner's first "Sync to Cloud" from the admin overwrites this.
insert into public.site_snapshots (id, data, updated_at)
values ('main', '{"products":[{"id":"prod-1","name":"Botanical Growth Oil","price":38,"description":"A curated elixir designed specifically for fine 4C hair textures. This potent organic fusion stimulates the scalp follicles while locking in essential cellular-level moisture.","category":"Hair Oils","image":"https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800","stockStatus":"In Stock","stockCount":142,"isFeatured":true,"ingredients":["Organic Cold-Pressed Castor Oil","Rosmarinus Officinalis (Rosemary) Extract","Argania Spinosa (Argan) Kernel Oil","Mentha Piperita (Peppermint) Leaf Oil","Simmondsia Chinensis (Jojoba) Seed Oil"],"howToUse":["Section hair into four distinct quadrants and apply 3-5 drops per section directly to the scalp.","Massage into the scalp in gentle circular motions for 2 minutes to stimulate oxygenation and direct blood flow.","Smooth excess oil through to the ends of the strands. Style as usual."],"reviews":[]},{"id":"prod-2","name":"Silk Sleep Cap","price":25,"description":"100% pure premium mulberry silk bonnet (Grade 6A, 22 momme) to prevent overnight split ends, reduce strand friction, and maintain protective hairstyle integrity.","category":"Accessories","image":"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800","stockStatus":"In Stock","stockCount":88,"isFeatured":true,"ingredients":["100% Natural Mulberry Silk","Soft Hypoallergenic Latex Elastic"],"howToUse":["Gently gathering coils into a loose pineapple or twist style.","Slip the cozy silk cap over the rear scalp first and stretch forward to cover your hairline.","Hand-wash in lukewarm water with silk-safe detergent once every two weeks."],"reviews":[]},{"id":"prod-3","name":"Detangling Collection","price":45,"description":"Sandalwood Wide-Tooth Detangler & Organic Hair Pick combination. Specially designed wide spaces glide through fragile 4C curly intersections without snagging.","category":"Accessories","image":"https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=800","stockStatus":"Low Stock","stockCount":12,"isFeatured":false,"ingredients":["Natural Green Sandalwood"],"howToUse":["Always detangle damp 4C coils saturated with conditioner.","Start combing gently at the very ends of the hair, slowly working your way up to the roots in sections.","Store in a cool dry drawer to keep the rich herbal sandalwood aroma fresh."],"reviews":[]},{"id":"prod-4","name":"Deep Repair Mask","price":32,"description":"Intense hydration restorative cream treatment formulated to penetrates tough low-porosity hair shafts. Floods thirsty cells with plant proteins to halt active breakage.","category":"Treatments","image":"https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?auto=format&fit=crop&q=80&w=800","stockStatus":"In Stock","stockCount":95,"isFeatured":false,"ingredients":["Deionized Water","Shea Butter Alcohols","Hydrolyzed Wheat Protein","Aloe Barbadensis Juice","Avocado Oil Extract"],"howToUse":["Apply standard dollop onto freshly washed, damp hair.","Distribute evenly and cover with a warm plastic cap for 20-30 minutes.","Rinse out thoroughly with cool water to seal the outer cuticles."],"reviews":[]}],"ebooks":[{"id":"ebook-1","name":"The 4C Growth Blueprint","price":24.99,"description":"A comprehensive, step-by-step master guide detailing how to safely grow, hydrate, and retain lengths of natural fine 4C coils. Based on years of trial, research, and proven methods.","image":"https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800","pages":153,"fileSize":"14.2 MB","isFeatured":true,"benefits":["Understand low vs high porosity daily routines","The exact dynamic detangling sequence to prevent breakage","Protective styling schedules that maximize growth retention","The science of deep conditioning fine 4C coils"],"pdfUrl":"4c_growth_blueprint_cartiae_rae.pdf","reviews":[]},{"id":"ebook-2","name":"Wash Day Mastery","price":19.99,"description":"Vastly streamline your wash day protocol. Go from a grueling 6-hour struggle to a highly clinical, hyper-moisturizing 90-minute routine.","image":"https://images.unsplash.com/photo-1560869713-7d0a29430f33?auto=format&fit=crop&q=80&w=800","pages":87,"fileSize":"8.7 MB","isFeatured":false,"benefits":["Streamline cleansing, pre-pooing, and styling","Reduce tangling during the washing sequence","Sectioning strategies designed for active schedules","Recommended safe non-stripping shampoo alternatives"],"pdfUrl":"wash_day_mastery_cartiae_rae.pdf","reviews":[]},{"id":"ebook-3","name":"The Protective Style Playbook","price":15.99,"description":"Learn the exact tension-free cornrowing, weaving, and twisting procedures that keep your hairline robust while preserving length.","image":"https://images.unsplash.com/photo-1595959183075-c1d09e771481?auto=format&fit=crop&q=80&w=800","pages":64,"fileSize":"6.1 MB","isFeatured":false,"benefits":["Scalp hydration methods underneath synthetic hair","Step-by-step guidelines to prevent tension alopecia","Takedown routines to safely melt tangles and shed hair","Nighttime friction-free maintenance protocols"],"pdfUrl":"protective_styles_playbook.pdf","reviews":[]}],"services":[{"id":"service-1","name":"Hair Assessment Guidance Call","price":100,"image":"https://images.unsplash.com/photo-1595959183075-c1d0a5113cc3?auto=format&fit=crop&q=80&w=800","description":"This one-hour personalized session provides an assessment of the client''s hair, routine, and growth challenges. It complements the \"31 Days to Success\" eBook by helping clients understand their hair needs, proper products, daily routines, and long-term healthy growth strategies.","included":["Introduction & Hair Assessment","Identify Hair Goals","Establish Hair Routine","Long-Term Hair Strategy"],"benefits":["Personalized recap","Additional tools/templates","Option for discounted follow-up coaching"],"notice":["Confirmation may take up to 24 hours","High-risk purchases may require verification","Meeting link delivered by email","Correct email address required"],"disclaimer":"This is a virtual consultation. Not a physical product. All digital purchases are non-refundable."},{"id":"service-2","name":"Social Media Growth Coaching Call","price":100,"image":"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800","description":"A one-hour strategy session focused on social media growth, branding, and content strategy. Topics include content review, growth obstacles, personalized roadmap, visibility strategy, and consistency planning.","included":["Goal setting","Brand & niche identification","Content pillars","Long-term growth strategy"],"benefits":["Personalized recap","Templates and resources","Optional follow-up coaching"],"notice":["Confirmation within 24 hours","High-risk purchases may require verification","Meeting link sent by email"],"disclaimer":"Virtual consultation only. Not a physical product. Digital purchases are non-refundable."}],"discountCodes":[{"id":"disc-1","code":"GROW4C","discountPercent":15,"isActive":true,"description":"15% Off Your Entire Cart for Hair Growth Day!"},{"id":"disc-2","code":"CARTIAE10","discountPercent":10,"isActive":true,"description":"10% Fan Welcome Discount"}],"seededAt":"migration"}'::jsonb, now())
on conflict (id) do nothing;

-- Confirm
select id, updated_at,
       jsonb_array_length(data->'products') as products,
       jsonb_array_length(data->'ebooks')   as ebooks,
       jsonb_array_length(data->'services') as services
from public.site_snapshots;
