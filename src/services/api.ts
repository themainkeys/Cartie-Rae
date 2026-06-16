/**
 * Cartiae Rae Backend API Client Integration Service
 * 
 * This service provides placeholders and structure for live production databases
 * (e.g., Supabase, Firebase, Postgres, or custom REST/GraphQL backends).
 * 
 * Replace the simulated local storage fallbacks below with live HTTP / SDK requests
 * to transition from client-only demo state to fully persisted remote data.
 */

import { Product, EBook, Order, AdminUser } from '../types';

const SIMULATE_LATENCY_MS = 300;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 1. Admin Authentication API
 */
export const authAPI = {
  /**
   * Log in administrative staff
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    await delay(SIMULATE_LATENCY_MS);
    
    // Production note: Replace with real JWT login endpoint e.g., POST /api/auth/login
    const cleanEmail = email.trim().toLowerCase();
    
    // Simulated credential database match
    if (password === 'admin' || password === 'super_admin_pass') {
      return {
        success: true,
        user: {
          id: 'adm-001',
          name: 'Cartiae Rae',
          email: cleanEmail,
          role: 'super_admin',
        }
      };
    } else if (password === 'manager' || password === 'manager_pass') {
      return {
        success: true,
        user: {
          id: 'adm-002',
          name: 'Elena Vance (Manager)',
          email: cleanEmail,
          role: 'store_manager',
        }
      };
    } else if (password === 'content' || password === 'content_pass') {
      return {
        success: true,
        user: {
          id: 'adm-003',
          name: 'Brianna Smith (Editor)',
          email: cleanEmail,
          role: 'content_manager',
        }
      };
    }
    
    return {
      success: false,
      error: 'Invalid staff email or password signature.'
    };
  },

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<AdminUser | null> {
    // Production note: Call GET /api/auth/me with Authorization header
    if (!token) return null;
    return {
      id: 'adm-001',
      name: 'Cartiae Rae',
      email: 'admin@cartiaerae.com',
      role: 'super_admin'
    };
  }
};

/**
 * 2. Products Database Sync API
 */
export const productsAPI = {
  async fetchAll(): Promise<Product[]> {
    // Production note: Replace with db.select() or GET /api/products
    return JSON.parse(localStorage.getItem('cartiae_products') || '[]');
  },

  async create(product: Omit<Product, 'reviews'>): Promise<Product> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with db.insert(product) or POST /api/products
    console.log('[API.TS] [PRODUCTION MODE] Synchronizing new product in db:', product);
    return { ...product, reviews: [] };
  },

  async update(id: string, updated: Partial<Product>): Promise<boolean> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with db.update(product).where(id) or PUT /api/products/:id
    console.log(`[API.TS] [PRODUCTION MODE] Updating product ${id} in db:`, updated);
    return true;
  },

  async delete(id: string): Promise<boolean> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with db.delete().where(id) or DELETE /api/products/:id
    console.log(`[API.TS] [PRODUCTION MODE] Deleting product ${id} from db.`);
    return true;
  }
};

/**
 * 3. eBooks Database Sync API
 */
export const ebooksAPI = {
  async fetchAll(): Promise<EBook[]> {
    // Production note: Replace with GET /api/ebooks
    return JSON.parse(localStorage.getItem('cartiae_ebooks') || '[]');
  },

  async create(ebook: Omit<EBook, 'reviews'>): Promise<EBook> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with POST /api/ebooks
    console.log('[API.TS] [PRODUCTION MODE] Synchronizing new eBook in db:', ebook);
    return { ...ebook, reviews: [] };
  },

  async update(id: string, updated: Partial<EBook>): Promise<boolean> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with PUT /api/ebooks/:id
    console.log(`[API.TS] [PRODUCTION MODE] Updating eBook ${id} in db:`, updated);
    return true;
  },

  async delete(id: string): Promise<boolean> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with DELETE /api/ebooks/:id
    console.log(`[API.TS] [PRODUCTION MODE] Deleting eBook ${id} from db.`);
    return true;
  }
};

/**
 * 4. Orders & Fulfillment DB Sync API
 */
export const ordersAPI = {
  async create(order: Omit<Order, 'id' | 'date'>): Promise<Order> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with POST /api/orders
    const newOrder: Order = {
      ...order,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0]
    };
    console.log('[API.TS] [PRODUCTION MODE] Creating order receipt in db:', newOrder);
    return newOrder;
  },

  async fulfill(id: string): Promise<boolean> {
    await delay(SIMULATE_LATENCY_MS);
    // Production note: Replace with PATCH /api/orders/:id/fulfill
    console.log(`[API.TS] [PRODUCTION MODE] Setting order ${id} status to Fulfilled.`);
    return true;
  }
};

/**
 * 5. Media & Assets Upload API
 */
export const mediaAPI = {
  /**
   * Upload an image to file bucket storage (e.g. AWS S3, Cloudinary, or Supabase Storage)
   */
  async upload(file: File): Promise<{ url: string; success: boolean; error?: string }> {
    await delay(SIMULATE_LATENCY_MS + 200);
    // Production note: Replace with POST /api/media/upload multipart file form
    console.log('[API.TS] [PRODUCTION MODE] Uploading raw file asset to storage bucket:', file.name);
    
    // Simulate return URL preview locally
    return {
      success: true,
      url: URL.createObjectURL(file)
    };
  }
};
