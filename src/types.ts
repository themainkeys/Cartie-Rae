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
  pdfUrl: string; // Simulated file name or download key
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
