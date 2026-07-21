# Cartiae Rae — Security & Core-Functionality Audit Report

**Scope:** Tier 1 security and core-functionality pass. No visual redesign, no new
unrelated features. This report describes what was fixed, what remains demo-only,
and what still requires a backend to be production-ready.

> **Headline:** Frontend-only authentication and client-side "secure" tokens are
> **not** real security. This pass removes the dangerous parts (hardcoded
> passwords, auto-granted admin, always-true permission checks, false crypto
> claims) and adds honest, clearly-labeled demo behavior plus documented
> integration points for Supabase Auth, Supabase Storage, and Stripe. Real
> enforcement **must** happen server-side.

---

## Status legend
- ✅ **Safe for production** — behaves correctly and securely as-is.
- 🟡 **Demo / localStorage** — works locally, clearly labeled, not for real use.
- 🔴 **Needs backend** — requires Supabase/serverless to be production-ready.

---

## Priority 1 — Frontend authentication vulnerabilities  ✅ fixed

| Issue (before) | Fix |
|---|---|
| Hardcoded plaintext passwords in `src/services/api.ts` (`admin`, `manager`, `content`, `super_admin_pass`, …) | Removed. `authAPI.login`/`validateSession` are now credential-free server-integration stubs. |
| Hardcoded credential list `ADMIN_CREDENTIALS` in `src/context/AppContext.tsx` (`cartiae123`, etc.) | Removed entirely. |
| `validateSession(token)` returned a **super_admin** for *any* non-empty string | Now returns `null`; a client token can never grant a role. Real validation is server-side. |
| `checkPermission()` **always returned `true`** | Now enforces `allowedRoles.includes(currentAdminUser.role)`; unauthenticated → `false`. A `requirePermission()` wrapper shows a clear denial message to restricted users. |
| Plaintext passwords printed in `client_handoff.md` | Removed from the doc. |

**Role matrix now enforced** (client-side UX gate; also enforce server-side):

| Area | super_admin | store_manager | content_manager |
|---|:---:|:---:|:---:|
| Products, eBooks | ✅ | ✅ | — |
| Orders, Discounts, Store analytics | ✅ | ✅ | — |
| Videos, Gallery | ✅ | — | ✅ |
| Homepage content, Blog/editorial, Services text | ✅ | — | ✅ |
| Destructive service delete | ✅ | — | — |

Restricted users attempting a blocked action see: *"Your role (…) does not have
permission for this action."*

**Demo mode (no Supabase configured):** the login screen is now a **passwordless,
clearly-labeled role picker** ("Admin Console — Demo Mode / Not secure — demo
only"). There is **no secret** in the bundle — we did not swap hardcoded
passwords for another visible frontend secret.

**Integration point for real auth:** set `VITE_SUPABASE_URL` +
`VITE_SUPABASE_ANON_KEY`, register staff in Supabase Auth, and map them in the
`admin_users` table. `AppContext.loginAdmin` already performs
`supabase.auth.signInWithPassword` + an `admin_users` role lookup.

---

## Priority 2 — Session handling  🟡 demo (hardened) / 🔴 server for real

- Only a **minimal** session `{ role, exp }` is stored (`cartiae_admin_session`).
  The full user object is no longer persisted.
- On load the session is **validated**: expiry checked, role checked against a
  trusted enum map; anything invalid/expired is cleared.
- The user object (name/email/role) is always **re-derived** from the trusted
  role map — stored fields are never trusted.
- Admin views/actions are gated behind `isAdminLoggedIn` + `requirePermission`.

**Limitation (documented):** in a browser-only demo, a determined user can still
edit `localStorage` to set a valid role value. This cannot be fully prevented
client-side. **True security requires server-side/Supabase validation** (RLS +
`auth.uid()`), which is the production path.

---

## Priority 3 — eBook delivery  🟡 demo / 🔴 needs backend

- Removed all "secure / tamper-proof" claims. The base64 token is explicitly
  documented as **encoding, not signing** — reversible and forgeable.
- `ebookDelivery.ts` now exposes:
  - `demo*` helpers (clearly labeled, local only) so the sandbox still works;
  - a `productionDelivery` interface documenting the real server contract:
    `verifyPurchase` + `createSignedDownloadUrl` (e.g. Supabase Storage
    `createSignedUrl`), with expiration + purchase-verification placeholders.
- **Production requirement:** eBook files live in a **private** bucket; a backend
  verifies the purchase (Stripe webhook) and emails a **short-lived signed URL**.
  Never expose permanent private files publicly.

---

## Priority 4 — Stripe architecture  ✅ / 🔴 keys needed

- **No server-only Stripe SDK in the browser bundle.** The `stripe` package is
  used *only* by `netlify/functions/create-checkout-session.js`; it is not
  imported anywhere in `src/` (verified: 0 occurrences in `dist`).
- **No secret keys in the frontend.** The browser reads only
  `VITE_STRIPE_PUBLISHABLE_KEY`. `STRIPE_SECRET_KEY` is server-only.
- Checkout session creation is already behind the serverless function.
- Added a browser-safe `isStripeConfigured` flag: when the publishable key is
  absent, checkout runs in **demo mode** — the cart shows a "Demo Mode — Payment
  Disabled" notice and `redirectToCheckout` returns a clear error instead of ever
  faking success.
- **Required env vars:** `VITE_STRIPE_PUBLISHABLE_KEY` (frontend),
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL` (server). See
  `.env.example`.

---

## Priority 5 — Store product filtering bug  ✅ fixed

- **Bug:** `MainStore.tsx` gated product visibility on the filter-tab list
  (`['All','eBooks']`). Since no product category (`Hair Oils`/`Accessories`/
  `Treatments`) is ever in that list, **every physical product was hidden**.
- **Fix:** visibility is now governed by an explicit, client-approved
  `ENABLED_PRODUCT_CATEGORIES` config, separate from the tab list. Physical
  products appear under **All**; eBooks still appear; search + category filters
  work together; the eBooks tab correctly shows no physical products.

---

## Priority 6 — Visuals deep links  ✅ fixed

- **Bug:** a `?video=` link set the route key to `visuals`, but the Visuals page
  renders under the `tutorials` key → blank page.
- **Fix:** the deep-link now sets `tutorials` (the canonical key used by the
  homepage card, Header, and Footer). `VideoGallery` reads `?video=<id>` on mount,
  scrolls the matching video into view, and **falls back safely to the feed** when
  the id is unknown. No blank page.

---

## Priority 7 — Newsletter  ✅ rendered

- The newsletter form was coded but never rendered (dead UI). It is now rendered
  in the **Footer** and is functional in demo/local mode (stores signups in
  `localStorage`; visible to admins in the dashboard). Unused footer imports were
  trimmed.

---

## Priority 8 — Documentation  ✅ updated

- `audit_report.md` (this file), `client_handoff.md`, `.env.example`, and
  `README.md` updated to clearly distinguish implemented / demo / backend-required
  behavior, and to stop instructing insecure practices (e.g. a `VITE_`-prefixed
  Stripe secret key).

---

## What is safe to deploy now
- Storefront browsing, product/eBook filtering & search, Visuals deep links,
  newsletter capture (local), cart, and the demo admin console.

## What is NOT production-ready without a backend
- **Auth:** demo role picker until Supabase Auth is configured.
- **Data:** products/eBooks/videos/gallery/orders persist in `localStorage`
  (per-browser) until migrated to Supabase.
- **Payments:** disabled until Stripe keys + the serverless function env are set.
- **eBook delivery:** demo tokens only; needs private storage + signed URLs +
  purchase verification.

## Verification performed
- `npm run lint` (tsc --noEmit) — passes.
- `npm run build` (vite build) — passes.
- `grep` confirms: no plaintext admin passwords in `src`, no Stripe secret keys in
  frontend, server `stripe` SDK absent from `dist`, `checkPermission` no longer
  hardcoded to `true`.
