# Client Handoff Guide — Cartiae Rae storefront

Welcome to your finalized premium creator platform! This platform has been built to mirror the luxury, minimalist, and feminine aesthetics of top beauty brands like **Rhode** and **Apple**, while remaining simple and intuitive for you to manage.

This guide provides everything you need to operate, edit, and expand the platform.

---

## 🔗 Quick Reference URLs
- **Production URL**: [https://cartiaerae.netlify.app](https://cartiaerae.netlify.app)
- **Local Dev Server**: `http://localhost:3000` (after running `npm run dev`)

---

## 🔑 Administrative Credentials (CMS Console)
To access the CMS Console and update your storefront, click **Admin** in the footer of your website. Enter one of the following credentials depending on the role you wish to simulate:

1. **Super Admin** (Full control over catalog, content, discounts, and design copywriting):
   - **Username**: `admin`
   - **Password**: `cartiae123`

2. **Store Manager** (Manages orders, products, and eBooks; blocked from design copywriting and global settings):
   - **Username**: `manager`
   - **Password**: `cartiae123`

3. **Content Manager** (Manages videos, gallery items, and copywriting; blocked from catalog database modifications and order lists):
   - **Username**: `content`
   - **Password**: `cartiae123`

---

## 💎 Premium Customer Experience Features

### 1. Minimalist Homepage
- **Clean Structure**: The landing page features a hero portrait of Cartiae Rae, a brief elegant brand introduction, and immediate, clean navigation cards linking directly to the main site paths: **eBook**, **Services**, **Visuals**, and **Shop**. All cluttered sections (testimonials, bio cards, product sliders, and newsletters) have been removed for high-intent conversion.

### 2. Private Coaching & Services Page
- **Coaching Products**: Dedicated Services page featuring two private virtual calls ($100 each): *Hair Assessment Guidance Call* and *Social Media Growth Coaching Call*, complete with deliverables, notices, and disclaimers.
- **Digital Booking Workflow**: Booking a coaching session adds a virtual item to the cart. During checkout, these digital service items bypass the shipping address form. On success, the Cart Drawer displays clear instructions: *"Virtual Booking Confirmed: We will contact you at your email address within 24 hours to schedule your session."*

### 3. Immersive Watch Tutorials (Visuals)
- **Step Into the Studio**: The video feed is renamed to **Visuals** and features a clean grid.
- **Isolated Hover Previews**: Muted video previews play automatically on desktop mouse hover and stop instantly when the mouse leaves.
- **Lightbox Details**: Clicking a card opens a full-screen theater overlay, allowing comments, and listing products featured. The `"Cornrows"` category has been retired.

### 4. Simplified Lookbook (Gallery)
- **Lookbook view**: Replaces the old multi-tab lookbook sections with a sleek, minimalist slideshow styled as a premium Editorial Lookbook. The `"Lifestyle"` category has been retired.

### 5. Streamlined Contact & FAQs
- **Contact Form**: Removed porosity, hair type, and reference photo attachment fields. Added a **Phone Number** field and renamed the submit button to a bold `"Dispatch Message to Cartiae Rae"`.
- **Frequently Asked Questions**: Updated answers to detail the instant eBook delivery process and how 1-on-1 consultations are booked and scheduled.
---

## 🛠️ CMS Console Operations (How to Manage Content)

### 1. Adding a Video Tutorial
1. Navigate to the **Admin Portal** and log in.
2. Select the **Videos** tab.
3. Paste a YouTube or TikTok link into the **Video URL** field. 
   * **YouTube Auto-Thumbnails**: Pasting a YouTube link automatically extracts its ID and fetches a high-definition thumbnail.
   * **TikTok Link Parsing**: Paste raw 19-digit video IDs or standard desktop links. (Mobile links will prompt you to input desktop URLs or raw IDs due to TikTok redirect limits).
   * **Local File Uploads**: Drag and drop (or select) `.mp4` files inside the dropzone for direct hosting.
4. Pick a category, write a title and description, and check **Featured Video** if it should appear first.
5. Set release status: **Publish Now**, **Save Draft**, or **Schedule** for future release.
6. Click **Publish Video**.

### 2. Featured Video Reordering
Inside the **Videos** tab, use the featured reordering pane to click Up (`↑`) and Down (`↓`) arrow indicators. This instantly swaps their position inside your storefront's video feed.

### 3. Editing Store Catalog (Products & eBooks)
Navigate to the **Catalog** tab. You can click **Edit** directly inside any row of your Products or eBooks table to change titles, stock status, pages, prices, and quantities inline.

---

## ⚡ Technical Architecture & Deployment

### 1. Environment Configurations
Create a `.env` file in your project root using the templates below:
```env
# Stripe Payment Keys
VITE_STRIPE_PUBLIC_KEY=pk_test_51...
VITE_STRIPE_SECRET_KEY=sk_test_51...

# eBook Email Delivery Configurations
VITE_SENDGRID_API_KEY=SG.example...
VITE_SENDER_EMAIL=hello@cartiaerae.com
```

### 2. Local Setup
```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run TypeScript checking
npm run lint

# Build production bundle
npm run build
```

### 3. Deployment Flow (Netlify)
If you update files, compile locally first and run a draft deploy to check the build:
```bash
npm run build
npx netlify deploy --dir=dist
```
Copy the generated `deployId` from the terminal output, update it in `scratch/deploy.js`, and run:
```bash
node scratch/deploy.js
```
This promotes your draft build to the live production URL.

---

## ⚠️ Backend Status — Current Data Persistence (Important)

> **The current version of the site uses browser `localStorage` for all admin data.**  
> This is a functional demo/prototype system — not a production database.

### What This Means For You

All products, eBooks, videos, gallery items, blog posts, discount codes, orders, and contact requests you manage through the Admin Portal are saved **only in the browser on the device you're using**.

| Limitation | Explanation |
|---|---|
| **Not multi-device** | Admin changes on your laptop are not visible on your phone or another computer |
| **Not persistent across browsers** | Clearing browser cache or using a different browser wipes all data |
| **Customers can't reach you** | Contact form submissions and orders are stored on the customer's browser only — you cannot see them from another device |
| **No real payments** | Stripe checkout is built and structured but the server-side session creation is commented out — no money is actually collected |

### What You Currently Can Do Safely

✅ Manage your admin catalog (products, eBooks) as a single-device demo  
✅ Upload and delete videos, gallery photos, blog posts  
✅ Test the full checkout flow in simulation mode  
✅ Review the contact form UI and submission flow  

### What's Required for Full Production

To run the site as a real, multi-device business platform you will need:

1. **A real database** — Supabase (recommended), Firebase, or Postgres
2. **Backend API functions** — Netlify Functions or a separate Express/Node server
3. **Stripe backend** — a server function to call `stripe.checkout.sessions.create()` and return the redirect URL
4. **Email delivery** — SendGrid or Postmark integration to send eBook download links automatically
5. **Secure admin authentication** — JWT tokens with server-side session validation instead of hardcoded passwords

Contact your developer when you're ready to connect a real backend.
