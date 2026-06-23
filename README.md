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
2. Open `.env` and fill in your Stripe, database, and JWT security keys.

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
3. Copy and run the SQL statements from [supabase_schema.sql](file:///C:/Users/Anderson/Documents/antigravity/jolly-archimedes/supabase_schema.sql) to create the tables (`admin_users` and `contact_requests`) and configure Row Level Security (RLS) policies.

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

## ⚡ Production Persistence & Persisting Mock Services (Phase 2 & 3)

For remaining entities (products, eBooks, videos, etc.), the platform still operates in local-first demo mode (sandbox) by default. To hook them up to live databases:

1. **Stripe Payments Integration**:
   - In `src/services/stripe.ts`, replace the simulator redirect URL with your backend API endpoint `POST /api/checkout/create-session`.
   - Configure a webhook receiver on your backend listening for `checkout.session.completed` events to decrement product inventory and trigger digital delivery.
2. **Secure eBook Delivery**:
   - Digital download generation (generating signed expiring tokens) should be handled on your server-side environment.
   - The token verification logic is documented in `src/services/ebookDelivery.ts`. Ensure links expire after 24 hours.
3. **Media Upload Persistence**:
   - The drag-and-drop CMS console dropzone in `src/views/AdminPortal.tsx` calls `mediaAPI.upload` in `src/services/api.ts`.
   - Swap the S3/storage upload mock with a real FormData request to save user uploaded images.
