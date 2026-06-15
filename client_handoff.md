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

### 1. Homepage Conversion
- **Tags & Headlines**: Displays clear taglines indicating your key offerings: *Hair Education • eBooks • Products • Tutorials*.
- **Tactile CTAs**: High-contrast buttons like *"Start Your Hair Journey"* and *"Shop the Routine"* direct customers directly to conversion points.
- **Founder Story**: Redesigned to show your portrait (`/about-portrait.jpg`) alongside a professional statement explaining why clients should trust your coily-hair expertise.
- **Social Proof Grid**: Displays detailed customer testimonials with 5-star verified badges.

### 2. Immersive Watch Tutorials Page
- **9:16 Video Mockups**: Render coily hair regimens similarly to TikTok and YouTube Shorts.
- **Isolated Desktop Hover Previews**: Hovering over a card starts a muted preview after 300ms. If the mouse leaves or moves to another card, the previous preview instantly stops (ensuring only *one* video plays at a time).
- **Cinematic Lightbox Modal**: Clicking a card opens a full-screen theater overlay. Customers can read full details, browse and **"Add to Bag"** products used in the video, or participate in the **Q&A Discussion comments**.
- **Close Gestures**: Tap the close `X`, click the backdrop outside the frame, or press the `Escape` key.

### 3. Apothecary Shop
- **Buy CTAs**: Upgraded visual hierarchy with high-contrast, bold buttons featuring hover scaling and soft shadows.
- **Instant Digital Download**: Digital eBooks render an emerald-green badge indicating instant access upon purchase.
- **Best Seller Badging**: Featured guides and elixirs render prominent labels.

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
