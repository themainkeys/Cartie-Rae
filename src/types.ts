export interface Review {
  id: string;
  rater: string;
  score: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockCount: number;
  ingredients?: string[];
  howToUse?: string[];
  isFeatured?: boolean;
  reviews: Review[];
}

export interface EBook {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  pages: number;
  fileSize: string;
  benefits: string[];
  /**
   * @legacy Storage compatibility field.
   * After Phase 3A Step 2B this holds the Supabase Storage path of the active PDF
   * (e.g. "ebook-123/v2/guide.pdf"). It is updated on every admin upload so the
   * admin table can show which file is current without an ebook_assets query.
   *
   * This field MUST NOT be used as the authoritative source for download delivery.
   * The canonical delivery path is:
   *   EBook.id → ebook_assets (is_active = true) → Storage signed URL
   *
   * Once the secure download endpoint (Step 4) is live and all eBooks have been
   * migrated, this field should be removed from the EBook model.
   */
  pdfUrl: string;
  isFeatured?: boolean;
  reviews: Review[];
}

export interface TikTokVideo {
  id: string;
  title: string;
  views: string;
  category: 'Wash Day' | 'Styling' | 'Protective Styles' | 'Growth Tips' | 'Product Reviews' | 'Tutorials';
  videoUrl: string;       // Primary playable URL: uploaded MP4/WebM, blob:, or YouTube embed
  tiktokUrl?: string;     // Optional: external TikTok link (opens in new tab / shown as social button)
  youtubeUrl?: string;    // Optional: YouTube fallback when no uploaded video exists
  thumbnailUrl: string;
  description?: string;
  relatedIds?: string[];
  isFeatured?: boolean;
  status?: 'draft' | 'published' | 'scheduled';
  scheduledAt?: string;
  featuredOrder?: number;
  viewsCount?: number;
  likesCount?: number;
  savesCount?: number;
  sharesCount?: number;
  commentsCount?: number;
  shopClicks?: number;
  productAddClicks?: number;
  ebookAddClicks?: number;
  conversionCount?: number;
}


export interface PhotoGalleryItem {
  id: string;
  image: string;
  caption: string;
  category: 'Progress' | 'Hairstyles' | 'Routines';
}

export interface Service {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  included: string[];
  benefits: string[];
  notice: string[];
  disclaimer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  image: string;
  date: string;
  category: string;
  likes: number;
  status?: 'published' | 'draft'; // draft posts are hidden from the public About page
}

export interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number; // e.g. 20 for 20%
  isActive: boolean;
  description: string;
}

export interface CartItem {
  id: string;
  type: 'product' | 'ebook' | 'service';
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  type: 'product' | 'ebook' | 'service';
  name: string;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  discountCodeApplied?: string;
  date: string;
  status: 'Pending' | 'Fulfilled';
  customerPhone?: string;
  shippingAddress?: string;
}

export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  porosity?: string;
  phone?: string;
  message: string;
  photoAttachment?: string; // base64 string or image URL
  date: string;
  status: 'Pending' | 'Responded' | 'Read' | 'Archived';
}

export interface NewsletterSignup {
  id: string;
  email: string;
  date: string;
}

export interface HomepageContent {
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  aboutHeadline: string;
  aboutStory: string;
  aboutImageUrl: string;
  promoQuote: string;
  promoAuthor: string;
}

// Single-admin model: one authenticated administrator with full access.
// No role column needed — presence of an active admin_users record grants full access.
// Recommended Supabase schema: admin_users(id, email, is_active, created_at, updated_at)
export interface AdminUser {
  id: string;
  name: string;
  email: string;
}
export interface SecureDownloadToken {
  orderId: string;
  email: string;
  ebookId: string;
  expiresAt: string; // ISO string
  token: string; // signature
}

// ─── Database-shaped types ────────────────────────────────────────────────────
// These mirror Supabase table rows exactly. They are intentionally distinct from
// the frontend display model (Order, EBook) to avoid mixing DB column names with
// camelCase application fields.
//
// Monetary fields (subtotal, discount_total, etc.) are integer cents in the DB.
// TypeScript number is used here because JSON.parse returns number — callers must
// treat these as cents and convert to dollars only for display.

/** Raw row from public.orders — written by the Stripe webhook. */
export interface DbOrder {
  id: string;                          // uuid
  stripe_checkout_session_id: string;  // cs_...
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  payment_status:
    | 'unpaid'
    | 'processing'
    | 'paid'
    | 'failed'
    | 'refunded'
    | 'partially_refunded'
    | 'canceled';
  fulfillment_status:
    | 'pending'
    | 'available'   // digital items ready for download
    | 'fulfilled'   // physical shipped / digital confirmed delivered
    | 'revoked';
  currency: string;          // e.g. 'usd'
  subtotal: number;          // integer cents
  discount_total: number;    // integer cents
  shipping_total: number;    // integer cents
  tax_total: number;         // integer cents
  total: number;             // integer cents
  stripe_event_id: string | null;
  metadata: Record<string, unknown>;
  paid_at: string | null;    // ISO timestamptz
  refunded_at: string | null;
  created_at: string;        // ISO timestamptz
  updated_at: string;
}

/** Raw row from public.order_items — one row per line item in a Stripe checkout. */
export interface DbOrderItem {
  id: string;                // uuid
  order_id: string;          // uuid → orders.id
  product_id: string;        // matches EBook.id / Product.id / Service.id
  item_type: 'product' | 'ebook' | 'service';
  item_name: string;
  quantity: number;          // integer
  unit_price_cents: number;  // integer cents
  line_total_cents: number;  // integer cents
  currency: string;          // e.g. 'usd'
  stripe_price_id: string | null;
  created_at: string;        // ISO timestamptz
}

/** Raw row from public.ebook_assets — one row per uploaded PDF version. */
export interface EbookAsset {
  id: string;              // uuid
  ebook_id: string;        // matches EBook.id / order_items.product_id
  storage_bucket: string;  // always 'ebooks'
  storage_path: string;    // path within the bucket: {ebook_id}/v{n}/{filename}.pdf
  version: number;         // integer, sequential per ebook_id
  file_name: string;
  mime_type: string;       // currently 'application/pdf' only
  size_bytes: number;      // bigint in DB — use with caution > Number.MAX_SAFE_INTEGER
  checksum_sha256: string | null; // 64-char lowercase hex; null until Step 2B populates it
  is_active: boolean;      // true for the current downloadable version
  created_by: string | null; // uuid → auth.users.id
  created_at: string;      // ISO timestamptz
  updated_at: string;
}

