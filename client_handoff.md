# Client Handoff Guide — Cartiae Rae storefront

Welcome to your creator platform. This guide covers how to operate and edit the
site, and — importantly — **what is fully working today vs. what still needs a
backend** before it is production-ready. Please read the "Production Status"
section and `audit_report.md` before going live.

---

## 🔗 Quick Reference URLs
- **Production URL**: https://cartiaerae.netlify.app
- **Local Dev Server**: `http://localhost:3000` (after `npm run dev`)

---

## 🔑 Admin Console Access

Click **Admin** in the footer to open the console. How you log in depends on
whether Supabase Auth is configured:

### Demo mode (Supabase not configured) — **not secure**
The login screen shows a **passwordless role picker** clearly labeled "Demo
Mode". Pick a role to preview the console:

- **Super Admin** — full access to everything.
- **Store Manager** — products, eBooks, orders, discounts, store analytics.
- **Content Manager** — videos, gallery, homepage content, blog/editorial.

There are **no passwords** in demo mode — this is a preview only and must not be
relied on for security. There are intentionally **no credentials stored anywhere
in the app**.

### Production mode (Supabase configured) — real login
Once you set the Supabase environment variables and register staff (below), the
login screen becomes a real email + password form backed by **Supabase Auth**,
and roles are verified server-side against your `admin_users` table.

> ⚠️ **Do not deploy with real customer data or payments in demo mode.** Configure
> Supabase Auth first so access is actually authenticated.

---

## 👥 Roles & Permissions

| Area | Super Admin | Store Manager | Content Manager |
|---|:---:|:---:|:---:|
| Products & eBooks | ✅ | ✅ | — |
| Orders, Discounts, Analytics | ✅ | ✅ | — |
| Videos & Gallery | ✅ | — | ✅ |
| Homepage / Blog / Services text | ✅ | — | ✅ |

Restricted users who try a blocked action get a clear on-screen message. (These
role checks are a UX guard — real enforcement also happens server-side via
Supabase Row Level Security once configured.)

---

## 🛠️ Managing Content

- **Videos (Visuals):** Admin → *Store Editor*. Paste a YouTube/TikTok link or
  upload an MP4, pick a category, add a title/description, set featured/status.
- **Catalog (Products & eBooks):** Admin → *Catalog & Coupons*. Add items and
  edit rows inline (name, price, stock, pages).
- **Homepage & copy:** Admin → *Store Editor* CMS panel.
- **Consultations:** Admin → *Consult Inquiries*.

---

## 💳 Stripe Payments

Checkout is wired to a Netlify serverless function
(`netlify/functions/create-checkout-session.js`) that creates a Stripe Hosted
Checkout session. **Card details never touch our servers.**

Until Stripe keys are configured, checkout runs in **demo mode**: the cart shows a
"Demo Mode — Payment Disabled" notice and no payment is attempted (it never fakes
a successful order).

### Add Stripe keys (in Netlify → Site settings → Environment variables)

| Variable | Where to get it | Scope |
|---|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe → API keys (`pk_...`) | **Frontend** (safe to expose) |
| `STRIPE_SECRET_KEY` | Stripe → API keys (`sk_...`) | **Server only** — never `VITE_` prefixed |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing secret | Server only |
| `SITE_URL` | Your site URL, no trailing slash | Server only |

> 🚫 **Never** prefix the secret key with `VITE_` and never commit real keys to
> Git. `VITE_`-prefixed variables are compiled into the public browser bundle.

Test with `pk_test_`/`sk_test_` and card `4242 4242 4242 4242` (any future expiry,
any CVV). Switch to `pk_live_`/`sk_live_` and redeploy when ready.

---

## 🔐 Enabling Real Auth & Database (Supabase)

1. Create a Supabase project. In the SQL editor, create `admin_users` and
   `contact_requests` tables with Row Level Security enabled.
2. **Add staff:** Supabase Dashboard → Authentication → Users → Add User (email +
   password). Copy their User ID (UUID).
3. Map the UUID to a role:
   ```sql
   INSERT INTO public.admin_users (id, name, email, role)
   VALUES ('PASTE-USER-UUID', 'Staff Name', 'staff@cartiaerae.com',
           'store_manager'); -- or 'super_admin' / 'content_manager'
   ```
4. Set env vars (Netlify or `.env`):
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

---

## 🧱 Local Setup

```bash
npm install
npm run dev      # local dev server on :3000
npm run lint     # TypeScript type-check (tsc --noEmit)
npm run build    # production build into dist/
```

Environment variables: copy `.env.example` to `.env` and fill in values. Nothing
is required just to run the site locally — missing integrations degrade to clearly
labeled demo behavior.

---

## ✅ Production Status (read before launch — see `audit_report.md`)

**Working now (safe):** storefront browsing, product/eBook filtering & search,
Visuals deep links, newsletter capture (local), cart, demo admin console.

**Demo / local only (per-browser `localStorage`):** products, eBooks, videos,
gallery, orders, newsletter signups, and (in demo mode) admin access. Data does
not sync between devices/visitors and is not authenticated.

**Needs a backend before production:**
- **Auth:** configure Supabase Auth (until then, demo role picker — not secure).
- **Data persistence:** migrate catalog/orders/content to Supabase.
- **Payments:** set Stripe keys + function env (checkout is disabled otherwise).
- **eBook delivery:** files must live in a **private** bucket and be delivered via
  short-lived **signed URLs** generated server-side after a verified purchase. The
  current in-app token is a labeled **demo** (base64 — not secure/tamper-proof).
