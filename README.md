<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Cartiae Rae Hair Studio - Educational Commerce Platform

A premium, performance-optimized coily hair educational storefront and administrative CMS designed with an editorial Rhode/Apple luxury brand aesthetic. Includes a coily hair store, step-by-step video masterclasses, 4C milestone progress logs, interactive consultation booking, and a robust administrative catalog and inline CMS editor.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: Version 18+ recommended.
- **npm**: Version 9+ recommended.

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
1. Copy `.env.example` to create a local configuration file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in values. **Nothing is required to run locally** — the app
   degrades to clearly-labeled demo behavior when integrations are absent. Note the
   `VITE_` (browser-safe) vs. non-prefixed (server-only) distinction in the file;
   never put a secret key behind a `VITE_` prefix.

### Step 3: Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with the application.

---

## 🛠️ Production Build & Verification

### Code Linter & Type Safety Check
Verify TypeScript compilation and type safety:
```bash
npm run lint
```

### Production Compilation
Build a compressed and minified production-ready bundle:
```bash
npm run build
```
The static files will be generated under the `dist/` directory, ready to be deployed to static hosting providers (Netlify, Vercel, AWS Amplify, etc.).

---

## 🗄️ Backend Persistence & Supabase Setup (Phase 1)

Phase 1 of the Supabase backend migration has been integrated for secure staff authentication and contact request persistence. Other features (products, eBooks, videos, etc.) still use client-side `localStorage` with seed data, operating in a hybrid fallback mode if environment variables are missing.

### Step 1: Bootstrapping the Database
1. Go to your [Supabase Dashboard](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in the dashboard.
3. Create the `admin_users` and `contact_requests` tables and configure Row Level
   Security (RLS) so only verified admin staff can read/update them while the
   public can submit contact requests.

### Step 2: Setting up Staff Auth Accounts
1. Go to **Authentication** -> **Users** in the Supabase Dashboard.
2. Click **Add User** -> **Create User** and enter staff credentials (email & password).
3. Copy the generated **User ID** (UUID).
4. Run the following insert query in the SQL Editor to assign their admin role:
   ```sql
   INSERT INTO public.admin_users (id, name, email, role)
   VALUES ('YOUR-USER-UUID', 'Cartiae Rae', 'admin@cartiaerae.com', 'super_admin');
   ```

### Step 3: Configure Environment Variables
1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
2. Populate the Supabase parameters:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

*(Note: If environment variables are missing, the application defaults to console warnings in development and uses the local storage fallbacks so the site remains fully operational as a demo).*

---

## ⚡ Production Status & Remaining Backend Work

See **`audit_report.md`** for the full breakdown of implemented / demo /
backend-required behavior. Summary:

**Working now:** storefront browsing, product/eBook filtering & search, Visuals
deep links, newsletter capture (local), cart, and the demo admin console.

**Demo / `localStorage` only:** products, eBooks, videos, gallery, orders, and
newsletter signups persist per-browser and are not authenticated.

**Requires a backend to be production-ready:**

1. **Auth (Supabase):** until `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are
   set, the admin console is a passwordless **demo** role picker (not secure).
   With them set, `AppContext.loginAdmin` uses real Supabase Auth + `admin_users`.
2. **Payments (Stripe):** checkout already posts to the serverless function
   `netlify/functions/create-checkout-session.js`. It stays in **demo mode**
   (disabled, never fakes success) until `VITE_STRIPE_PUBLISHABLE_KEY` and the
   server-side `STRIPE_SECRET_KEY` / `SITE_URL` are configured. Add a
   `checkout.session.completed` webhook to persist orders and trigger delivery.
3. **eBook delivery:** `src/services/ebookDelivery.ts` ships a **labeled demo**
   token (base64 — encoding, not security) plus a `productionDelivery` interface.
   Real delivery must generate short-lived **signed URLs** server-side (e.g.
   Supabase Storage `createSignedUrl`) after verifying the purchase, from a
   **private** bucket. Never expose permanent private files publicly.
4. **Media uploads:** implemented in `src/services/mediaUpload.ts` — uploads to the
   Supabase Storage `media` bucket and returns a public URL (active whenever
   `isMediaUploadEnabled`, i.e. Supabase creds are present). Run
   `supabase/storage_media_setup.sql` to create the bucket + policies.
   (`src/services/api.ts` and `src/services/ebookDelivery.ts` are unused scaffolding.)
