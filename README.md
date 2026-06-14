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

## ⚡ Production Persistence & Persisting Mock Services

The platform operates in local-first demo mode (sandbox) by default. To hook it up to live databases:

1. **Database Persistence (Supabase/Postgres)**:
   - Schema definitions are available in `src/types.ts`.
   - Update `src/services/api.ts` to call your API endpoints or Supabase client SDK methods instead of localStorage.
2. **Stripe Payments Integration**:
   - In `src/services/stripe.ts`, replace the simulator redirect URL with your backend API endpoint `POST /api/checkout/create-session`.
   - Configure a webhook receiver on your backend listening for `checkout.session.completed` events to decrement product inventory and trigger digital delivery.
3. **Secure eBook Delivery**:
   - Digital download generation (generating signed expiring tokens) should be handled on your server-side environment.
   - The token verification logic is documented in `src/services/ebookDelivery.ts`. Ensure links expire after 24 hours.
4. **Media Upload Persistence**:
   - The drag-and-drop CMS console dropzone in `src/views/AdminPortal.tsx` calls `mediaAPI.upload` in `src/services/api.ts`.
   - Swap the S3/storage upload mock with a real FormData request to save user uploaded images.
