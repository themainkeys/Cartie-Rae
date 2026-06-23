import React, { createContext, useContext, useState, useEffect } from 'react';
import { EBook, Product, TikTokVideo, PhotoGalleryItem, BlogPost, DiscountCode, CartItem, Order, NewsletterSignup, HomepageContent, WishlistItem, ContactRequest, AdminUser, Service } from '../types';
import { initialEBooks, initialProducts, initialVideos, initialGallery, initialBlogPosts, initialDiscountCodes, initialHomepageContent, initialServices } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

// ─── Tombstone helpers ──────────────────────────────────────────────────────
// A "tombstone" is a persisted Set of deleted IDs per entity type.
// This prevents seeded/demo data from re-appearing after page refresh.
const TOMBSTONE_KEYS = {
  products:  'cartiae_deleted_products',
  ebooks:    'cartiae_deleted_ebooks',
  videos:    'cartiae_deleted_videos',
  gallery:   'cartiae_deleted_gallery',
  blogs:     'cartiae_deleted_blogs',
  discounts: 'cartiae_deleted_discounts',
  contacts:  'cartiae_deleted_contacts',
  services:  'cartiae_deleted_services',
} as const;

function readTombstones(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function writeTombstone(key: string, id: string): void {
  const set = readTombstones(key);
  set.add(id);
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

function filterTombstoned<T extends { id: string }>(items: T[], tombstoneKey: string): T[] {
  const deleted = readTombstones(tombstoneKey);
  if (deleted.size === 0) return items;
  return items.filter(item => !deleted.has(item.id));
}
// ────────────────────────────────────────────────────────────────────────────

interface AppContextType {
  ebooks: EBook[];
  products: Product[];
  videos: TikTokVideo[];
  gallery: PhotoGalleryItem[];
  blogs: BlogPost[];
  discountCodes: DiscountCode[];
  homepageContent: HomepageContent;
  newsletterSignups: NewsletterSignup[];
  cart: CartItem[];
  orders: Order[];
  appliedDiscount: DiscountCode | null;
  isAdminLoggedIn: boolean;
  currentAdminUser: AdminUser | null;
  wishlist: WishlistItem[];
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  triggerToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  
  // Contact Request Operations
  contactRequests: ContactRequest[];
  addContactRequest: (request: Omit<ContactRequest, 'id' | 'date' | 'status'>) => void;
  respondToContactRequest: (id: string) => void;
  deleteContactRequest: (id: string) => void;
  updateContactRequestStatus: (id: string, status: 'Pending' | 'Responded' | 'Read' | 'Archived') => void;
  
  // EBook Operations
  addEBook: (ebook: Omit<EBook, 'reviews'>) => void;
  updateEBook: (id: string, updated: Partial<EBook>) => void;
  deleteEBook: (id: string) => void;
  
  // Product Operations
  addProduct: (product: Omit<Product, 'reviews'>) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Video Operations
  addVideo: (video: Omit<TikTokVideo, 'id'>) => void;
  updateVideo: (id: string, updated: Partial<TikTokVideo>) => void;
  deleteVideo: (id: string) => void;
  
  // Gallery Operations
  addGalleryItem: (item: Omit<PhotoGalleryItem, 'id'>) => void;
  updateGalleryItem: (id: string, updated: Partial<Omit<PhotoGalleryItem, 'id'>>) => void;
  deleteGalleryItem: (id: string) => void;
  
  // Blog Operations
  addBlogPost: (post: Omit<BlogPost, 'id' | 'likes' | 'date'>) => void;
  updateBlogPost: (id: string, updated: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  likeBlogPost: (id: string) => void;
  
  // Discount Code Operations
  addDiscountCode: (code: Omit<DiscountCode, 'id'>) => void;
  updateDiscountCode: (id: string, patch: Partial<DiscountCode>) => void;
  deleteDiscountCode: (id: string) => void;
  
  // CMS Home/About
  updateHomepageContent: (content: Partial<HomepageContent>) => void;

  // Services
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;
  
  // Newsletter Signups
  signupNewsletter: (email: string) => boolean;
  
  // Cart Actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, qty: number) => void;
  applyPromoCode: (code: string) => string | null; // returns error message or null if success
  clearCart: () => void;
  
  // Wishlist Actions (Save for Later)
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  moveToWishlist: (id: string) => void; // Moves an item from cart to saved for later
  moveToCart: (item: WishlistItem) => void; // Moves an item from saved for later to cart
  
  // Order Actions
  createOrder: (customerName: string, customerEmail: string, customerPhone?: string, shippingAddress?: string) => Order;
  fulfillOrder: (id: string) => void;
  
  // Admin auth
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logoutAdmin: () => void;

  // Settings & Preferences
  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: (enabled: boolean) => void;
  prefersReducedMotion: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- States with LocalStorage Initialization ---
  const [ebooks, setEbooks] = useState<EBook[]>(() => {
    const local = localStorage.getItem('cartiae_ebooks');
    const base: EBook[] = local ? JSON.parse(local) : initialEBooks;
    return filterTombstoned(base, TOMBSTONE_KEYS.ebooks);
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('cartiae_products');
    const base: Product[] = local ? JSON.parse(local) : initialProducts;
    return filterTombstoned(base, TOMBSTONE_KEYS.products);
  });

  const [videos, setVideos] = useState<TikTokVideo[]>(() => {
    const local = localStorage.getItem('cartiae_videos');
    let base: TikTokVideo[];
    if (local) {
      try {
        const parsed = JSON.parse(local) as TikTokVideo[];

        // ── Migration: move legacy TikTok URLs from videoUrl → tiktokUrl ─────
        // This runs once per load and self-heals old localStorage data where
        // TikTok links were incorrectly stored as the primary videoUrl.
        const isTikTokUrl = (url: string) =>
          url.includes('tiktok.com') || /^\d{18,20}$/.test(url.trim());

        base = parsed.map(item => {
          // Fix broken thumbnail URL from an earlier migration
          const fixedThumb = item.thumbnailUrl?.includes('photo-1608139556157-196be06511fc')
            ? '/about-portrait.jpg'
            : item.thumbnailUrl;

          const url = (item.videoUrl || '').trim();

          if (url && isTikTokUrl(url)) {
            // videoUrl is a TikTok link — migrate to tiktokUrl
            return {
              ...item,
              thumbnailUrl: fixedThumb,
              // Preserve tiktokUrl if admin already set one; otherwise use the migrated URL
              tiktokUrl: item.tiktokUrl || url,
              // Clear videoUrl — this becomes a TikTok-only card
              // (frontend will show thumbnail + Watch on TikTok button)
              videoUrl: '',
            };
          }

          // videoUrl is already MP4/YouTube/empty — no migration needed
          return { ...item, thumbnailUrl: fixedThumb };
        });
        // ──────────────────────────────────────────────────────────────────────
      } catch (e) {
        base = initialVideos;
      }
    } else {
      base = initialVideos;
    }
    return filterTombstoned(base, TOMBSTONE_KEYS.videos);
  });


  const [gallery, setGallery] = useState<PhotoGalleryItem[]>(() => {
    const tombstoned = readTombstones(TOMBSTONE_KEYS.gallery);
    const local = localStorage.getItem('cartiae_gallery');
    let base: PhotoGalleryItem[];
    if (local) {
      try {
        const parsed = JSON.parse(local) as PhotoGalleryItem[];
        const mapped = parsed.map(item => {
          if (item.id === 'gal-5' && item.image.includes('photo-1509967419530-da38b4704bc6')) {
            return { ...item, image: '/hero-portrait.jpg' };
          }
          return item;
        });

        // Seed new lookbook photos (gal-11 to gal-20) only if not already tombstoned
        const parsedIds = new Set(mapped.map(g => g.id));
        const newSeedIds = [
          'gal-11', 'gal-12', 'gal-13', 'gal-14', 'gal-15',
          'gal-16', 'gal-17', 'gal-18', 'gal-19', 'gal-20'
        ];
        const missingNewSeeds = initialGallery.filter(
          g => newSeedIds.includes(g.id) && !parsedIds.has(g.id) && !tombstoned.has(g.id)
        );
        base = missingNewSeeds.length > 0 ? [...missingNewSeeds, ...mapped] : mapped;
      } catch (e) {
        base = initialGallery;
      }
    } else {
      base = initialGallery;
    }
    return base.filter(item => !tombstoned.has(item.id));
  });

  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    const local = localStorage.getItem('cartiae_blogs');
    let base: BlogPost[];
    if (local) {
      try {
        const parsed = JSON.parse(local) as BlogPost[];
        base = parsed.map(item => {
          if (item.image && item.image.includes('photo-1608139556157-196be06511fc')) {
            return { ...item, image: '/about-portrait.jpg' };
          }
          return item;
        });
      } catch (e) {
        base = initialBlogPosts;
      }
    } else {
      base = initialBlogPosts;
    }
    return filterTombstoned(base, TOMBSTONE_KEYS.blogs);
  });

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(() => {
    const local = localStorage.getItem('cartiae_discounts');
    const base: DiscountCode[] = local ? JSON.parse(local) : initialDiscountCodes;
    return filterTombstoned(base, TOMBSTONE_KEYS.discounts);
  });

  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => {
    const local = localStorage.getItem('cartiae_home');
    return local ? JSON.parse(local) : initialHomepageContent;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const local = localStorage.getItem('cartiae_services');
    const base: Service[] = local ? JSON.parse(local) : initialServices;
    return filterTombstoned(base, TOMBSTONE_KEYS.services);
  });

  const [newsletterSignups, setNewsletterSignups] = useState<NewsletterSignup[]>(() => {
    const local = localStorage.getItem('cartiae_newsletter');
    return local ? JSON.parse(local) : [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const local = localStorage.getItem('cartiae_cart');
    return local ? JSON.parse(local) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const local = localStorage.getItem('cartiae_orders');
    return local ? JSON.parse(local) : [
      {
        id: 'ORD-4029',
        customerName: 'Aria Carter',
        customerEmail: 'aria.carter@gmail.com',
        customerPhone: '+1 (555) 728-1923',
        shippingAddress: '435 Peachtree St, Atlanta, GA 30308',
        items: [
          { id: 'ebook-1', type: 'ebook', name: 'The 4C Growth Blueprint', price: 24.99, image: 'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800', quantity: 1 }
        ],
        subtotal: 24.99,
        discountAmount: 0,
        total: 24.99,
        date: '2026-06-08',
        status: 'Fulfilled'
      },
      {
        id: 'ORD-4030',
        customerName: 'Shayla Jenkins',
        customerEmail: 'shayla.j@yahoo.com',
        customerPhone: '+1 (555) 381-8109',
        shippingAddress: '128 Crown Heights Blvd, Brooklyn, NY 11213',
        items: [
          { id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800', quantity: 1 },
          { id: 'prod-2', type: 'product', name: 'Silk Sleep Cap', price: 25.00, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800', quantity: 1 }
        ],
        subtotal: 63.00,
        discountAmount: 9.45,
        total: 53.55,
        discountCodeApplied: 'GROW4C',
        date: '2026-06-10',
        status: 'Pending'
      }
    ];
  });

  const [contactRequests, setContactRequests] = useState<ContactRequest[]>(() => {
    if (isSupabaseConfigured) return [];
    const local = localStorage.getItem('cartiae_contacts');
    if (local) return JSON.parse(local);
    return [
      {
        id: 'CON-101',
        name: 'Tiffany Adams',
        email: 'tiff.adams@gmail.com',
        porosity: 'Low Porosity 4C',
        message: 'Hi Cartiae! I bought your organic oils last week, and I am struggling with severe breakage around my Crown region. How often should I apply the oil under my steam cap? Attached is a photo of my hair condition.',
        photoAttachment: 'https://images.unsplash.com/photo-1595959183075-c1d0a5113cc3?auto=format&fit=crop&q=80&w=600',
        date: '2026-06-11',
        status: 'Pending'
      },
      {
        id: 'CON-102',
        name: 'Nailah Vance',
        email: 'nailah.v@outlook.com',
        porosity: 'High Porosity 4C',
        message: 'My hair is extremely dry and absorbs water within five minutes, then gets flaky again. I attached a photo of my natural curls. Please advise if the Botanical formula will build up on my locs.',
        photoAttachment: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&q=80&w=600',
        date: '2026-06-12',
        status: 'Pending'
      }
    ];
  });

  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(() => {
    const local = localStorage.getItem('cartiae_applied_discount');
    return local ? JSON.parse(local) : null;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (isSupabaseConfigured) return false;
    return localStorage.getItem('cartiae_admin_auth') === 'true';
  });

  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(() => {
    if (isSupabaseConfigured) return null;
    const local = localStorage.getItem('cartiae_admin_user');
    return local ? JSON.parse(local) : null;
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const local = localStorage.getItem('cartiae_wishlist');
    return local ? JSON.parse(local) : [];
  });

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(() => {
    const local = localStorage.getItem('cartiae_email_notifications_enabled');
    return local !== null ? local === 'true' : true;
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // --- Supabase Authentication & Session Synchronizer ---
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const handleAuthSession = async (session: any) => {
      if (session?.user) {
        try {
          const { data: adminProfile, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error || !adminProfile) {
            console.error('Access denied. No admin profile found.', error);
            await supabase.auth.signOut();
            setIsAdminLoggedIn(false);
            setCurrentAdminUser(null);
          } else {
            const adminUser: AdminUser = {
              id: adminProfile.id,
              name: adminProfile.name || 'Admin Staff',
              email: adminProfile.email || session.user.email,
              role: adminProfile.role as any,
            };
            setIsAdminLoggedIn(true);
            setCurrentAdminUser(adminUser);
          }
        } catch (err) {
          console.error('Error fetching admin profile:', err);
          setIsAdminLoggedIn(false);
          setCurrentAdminUser(null);
        }
      } else {
        setIsAdminLoggedIn(false);
        setCurrentAdminUser(null);
      }
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthSession(session);
    });

    // 2. Subscribe to session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- Fetch Contacts from Supabase ---
  useEffect(() => {
    if (isSupabaseConfigured && isAdminLoggedIn) {
      const fetchContacts = async () => {
        try {
          const { data, error } = await supabase
            .from('contact_requests')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching contact requests:', error);
            triggerToast('❌ Failed to fetch contact requests from database.', 'error');
          } else if (data) {
            const mapped: ContactRequest[] = data.map(item => ({
              id: item.id,
              name: item.name,
              email: item.email,
              porosity: item.porosity || undefined,
              phone: item.phone || undefined,
              message: item.message,
              photoAttachment: item.photo_attachment || undefined,
              date: item.date || item.created_at?.split('T')[0],
              status: item.status as any,
            }));
            setContactRequests(mapped);
          }
        } catch (err) {
          console.error('Error fetching contact requests:', err);
        }
      };
      fetchContacts();
    } else if (isSupabaseConfigured && !isAdminLoggedIn) {
      setContactRequests([]);
    }
  }, [isAdminLoggedIn]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // Clear toast after 4 seconds automatically
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Storage synchronizer triggers ---
  useEffect(() => { localStorage.setItem('cartiae_ebooks', JSON.stringify(ebooks)); }, [ebooks]);
  useEffect(() => { localStorage.setItem('cartiae_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('cartiae_videos', JSON.stringify(videos)); }, [videos]);
  useEffect(() => { localStorage.setItem('cartiae_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { localStorage.setItem('cartiae_blogs', JSON.stringify(blogs)); }, [blogs]);
  useEffect(() => { localStorage.setItem('cartiae_discounts', JSON.stringify(discountCodes)); }, [discountCodes]);
  useEffect(() => { localStorage.setItem('cartiae_services', JSON.stringify(services)); }, [services]);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('cartiae_contacts', JSON.stringify(contactRequests));
    }
  }, [contactRequests, isSupabaseConfigured]);
  useEffect(() => { localStorage.setItem('cartiae_newsletter', JSON.stringify(newsletterSignups)); }, [newsletterSignups]);
  useEffect(() => { localStorage.setItem('cartiae_home', JSON.stringify(homepageContent)); }, [homepageContent]);
  useEffect(() => { localStorage.setItem('cartiae_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('cartiae_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('cartiae_contacts', JSON.stringify(contactRequests)); }, [contactRequests]);
  useEffect(() => { localStorage.setItem('cartiae_applied_discount', JSON.stringify(appliedDiscount)); }, [appliedDiscount]);
  useEffect(() => { localStorage.setItem('cartiae_wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('cartiae_email_notifications_enabled', String(emailNotificationsEnabled)); }, [emailNotificationsEnabled]);
  useEffect(() => {
    if (currentAdminUser) {
      localStorage.setItem('cartiae_admin_user', JSON.stringify(currentAdminUser));
    } else {
      localStorage.removeItem('cartiae_admin_user');
    }
  }, [currentAdminUser]);

  // --- Contact Request Operations ---
  const addContactRequest = async (request: Omit<ContactRequest, 'id' | 'date' | 'status'>) => {
    const id = `CON-${Math.floor(100 + Math.random() * 900)}`;
    const date = new Date().toISOString().split('T')[0];
    const status = 'Pending';

    const newRequest: ContactRequest = {
      ...request,
      id,
      date,
      status
    };

    setContactRequests(prev => [newRequest, ...prev]);

    if (emailNotificationsEnabled) {
      triggerToast(`✉ Dispatching notification email regarding ${request.name}'s contact message!`, 'success');
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('contact_requests')
          .insert({
            id,
            name: request.name,
            email: request.email,
            phone: request.phone || null,
            message: request.message,
            porosity: request.porosity || null,
            photo_attachment: request.photoAttachment || null,
            status,
            date
          });

        if (error) {
          console.error('Failed to save contact request to database:', error);
          triggerToast('⚠️ Local submission succeeded, but failed to sync to database.', 'info');
        }
      } catch (err) {
        console.error('Database connection error during contact submission:', err);
      }
    }
  };

  const respondToContactRequest = async (id: string) => {
    setContactRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Responded' } : req));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('contact_requests')
          .update({ status: 'Responded' })
          .eq('id', id);

        if (error) {
          console.error('Failed to update contact request status on database:', error);
          triggerToast('❌ Failed to update status in database.', 'error');
        }
      } catch (err) {
        console.error('Database update error:', err);
      }
    }
  };

  const deleteContactRequest = async (id: string) => {
    setContactRequests(prev => prev.filter(req => req.id !== id));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('contact_requests')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Failed to delete contact request from database:', error);
          triggerToast('❌ Failed to delete from database.', 'error');
        } else {
          triggerToast('✓ Inquiry deleted successfully.', 'success');
        }
      } catch (err) {
        console.error('Database delete error:', err);
      }
    } else {
      writeTombstone(TOMBSTONE_KEYS.contacts, id);
      triggerToast('✓ Inquiry deleted successfully.', 'success');
    }
  };

  const updateContactRequestStatus = async (id: string, status: 'Pending' | 'Responded' | 'Read' | 'Archived') => {
    setContactRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('contact_requests')
          .update({ status })
          .eq('id', id);

        if (error) {
          console.error('Failed to update status on database:', error);
          triggerToast('❌ Failed to update status in database.', 'error');
        }
      } catch (err) {
        console.error('Database status update error:', err);
      }
    }
  };

  // --- EBook Operations ---
  const addEBook = (ebook: Omit<EBook, 'reviews'>) => {
    const newEBook: EBook = {
      ...ebook,
      reviews: []
    };
    setEbooks(prev => [newEBook, ...prev]);
  };

  const updateEBook = (id: string, updated: Partial<EBook>) => {
    setEbooks(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
  };

  const deleteEBook = (id: string) => {
    writeTombstone(TOMBSTONE_KEYS.ebooks, id);
    setEbooks(prev => prev.filter(item => item.id !== id));
    // Remove stale references from cart and wishlist
    setCart(prev => prev.filter(item => item.id !== id));
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  // --- Product Operations ---
  const addProduct = (product: Omit<Product, 'reviews'>) => {
    const newProduct: Product = {
      ...product,
      reviews: []
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
  };

  const deleteProduct = (id: string) => {
    writeTombstone(TOMBSTONE_KEYS.products, id);
    setProducts(prev => prev.filter(item => item.id !== id));
    // Remove stale references from cart and wishlist
    setCart(prev => prev.filter(item => item.id !== id));
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  // --- Video Operations ---
  const addVideo = (video: Omit<TikTokVideo, 'id'>) => {
    const newVideo: TikTokVideo = {
      ...video,
      id: `vid-${Date.now()}`
    };
    setVideos(prev => [newVideo, ...prev]);
  };

  const updateVideo = (id: string, updated: Partial<TikTokVideo>) => {
    setVideos(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
  };

  const deleteVideo = (id: string) => {
    writeTombstone(TOMBSTONE_KEYS.videos, id);
    setVideos(prev => prev.filter(item => item.id !== id));
  };

  // --- Gallery Operations ---
  const addGalleryItem = (item: Omit<PhotoGalleryItem, 'id'>) => {
    const newItem: PhotoGalleryItem = {
      ...item,
      id: `gal-${Date.now()}`
    };
    setGallery(prev => [newItem, ...prev]);
  };

  const updateGalleryItem = (id: string, updated: Partial<Omit<PhotoGalleryItem, 'id'>>) => {
    setGallery(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
  };

  const deleteGalleryItem = (id: string) => {
    writeTombstone(TOMBSTONE_KEYS.gallery, id);
    setGallery(prev => prev.filter(item => item.id !== id));
  };

  // --- Blog Operations ---
  const addBlogPost = (post: Omit<BlogPost, 'id' | 'likes' | 'date'>) => {
    const newPost: BlogPost = {
      ...post,
      id: `post-${Date.now()}`,
      likes: 0,
      date: new Date().toISOString().split('T')[0]
    };
    setBlogs(prev => [newPost, ...prev]);
  };

  const updateBlogPost = (id: string, updated: Partial<BlogPost>) => {
    setBlogs(prev => prev.map(post => post.id === id ? { ...post, ...updated } : post));
  };

  const deleteBlogPost = (id: string) => {
    writeTombstone(TOMBSTONE_KEYS.blogs, id);
    setBlogs(prev => prev.filter(post => post.id !== id));
  };

  const likeBlogPost = (id: string) => {
    setBlogs(prev => prev.map(post => post.id === id ? { ...post, likes: post.likes + 1 } : post));
  };

  // --- Discount Code Operations ---
  const addDiscountCode = (code: Omit<DiscountCode, 'id'>) => {
    const newCode: DiscountCode = {
      ...code,
      id: `disc-${Date.now()}`
    };
    setDiscountCodes(prev => [newCode, ...prev]);
  };

  const deleteDiscountCode = (id: string) => {
    writeTombstone(TOMBSTONE_KEYS.discounts, id);
    setDiscountCodes(prev => prev.filter(item => item.id !== id));
  };

  const updateDiscountCode = (id: string, patch: Partial<DiscountCode>) => {
    setDiscountCodes(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  // --- CMS Content ---
  const updateHomepageContent = (content: Partial<HomepageContent>) => {
    setHomepageContent(prev => ({ ...prev, ...content }));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...service,
      id: `svc-${Date.now()}`
    };
    setServices(prev => [...prev, newService]);
  };

  const updateService = (id: string, patch: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const deleteService = (id: string) => {
    writeTombstone(TOMBSTONE_KEYS.services, id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // --- Newsletter Signups ---
  const signupNewsletter = (email: string): boolean => {
    if (!email || !email.includes('@')) return false;
    const exists = newsletterSignups.some(sub => sub.email.toLowerCase() === email.toLowerCase());
    if (exists) return true; // Pretend it worked

    const newSub: NewsletterSignup = {
      id: `sub-${Date.now()}`,
      email: email.trim(),
      date: new Date().toISOString().split('T')[0]
    };
    setNewsletterSignups(prev => [newSub, ...prev]);
    return true;
  };

  // --- Cart Actions ---
  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const applyPromoCode = (code: string): string | null => {
    const cleanCode = code.trim().toUpperCase();
    const found = discountCodes.find(c => c.code.toUpperCase() === cleanCode && c.isActive);
    if (!found) {
      return 'Invalid or expired discount code.';
    }
    setAppliedDiscount(found);
    return null;
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscount(null);
  };

  // --- Wishlist Actions (Save for Later) ---
  const addToWishlist = (item: WishlistItem) => {
    setWishlist(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        triggerToast(`"${item.name}" is already saved for later! ✔`, 'info');
        return prev;
      }
      triggerToast(`"${item.name}" successfully saved for later! ✔`, 'success');
      return [...prev, item];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  const moveToWishlist = (id: string) => {
    const cartItem = cart.find(item => item.id === id);
    if (!cartItem) return;
    
    addToWishlist({
      id: cartItem.id,
      type: cartItem.type,
      name: cartItem.name,
      price: cartItem.price,
      image: cartItem.image
    });
    
    removeFromCart(id);
  };

  const moveToCart = (item: WishlistItem) => {
    addToCart({
      id: item.id,
      type: item.type,
      name: item.name,
      price: item.price,
      image: item.image
    });
    
    removeFromWishlist(item.id);
    triggerToast(`"${item.name}" successfully moved to your Shopping Bag! 👜`, 'success');
  };

  // --- Order Actions ---
  const createOrder = (customerName: string, customerEmail: string, customerPhone?: string, shippingAddress?: string): Order => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = appliedDiscount 
      ? Math.round((subtotal * (appliedDiscount.discountPercent / 100)) * 100) / 100
      : 0;
    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items: [...cart],
      subtotal,
      discountAmount,
      total,
      discountCodeApplied: appliedDiscount?.code,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Decrease stock count for physical products
    cart.forEach(item => {
      if (item.type === 'product') {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
          const updateCount = Math.max(0, prod.stockCount - item.quantity);
          const updateStatus = updateCount === 0 
            ? 'Out of Stock' 
            : updateCount <= 15 ? 'Low Stock' : 'In Stock';
          updateProduct(prod.id, { stockCount: updateCount, stockStatus: updateStatus });
        }
      }
    });

    clearCart();
    return newOrder;
  };

  const fulfillOrder = (id: string) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status: 'Fulfilled' } : order));
  };

  // --- Admin Auth ---
  // Credential pairs: email must match password role exactly
  const ADMIN_CREDENTIALS = [
    { email: 'admin@cartiaerae.com', passwords: ['admin', 'cartiae123'], user: { id: 'adm-001', name: 'Cartiae Rae', email: 'admin@cartiaerae.com', role: 'super_admin' as const } },
    { email: 'manager@cartiaerae.com', passwords: ['manager'], user: { id: 'adm-002', name: 'Elena Vance (Manager)', email: 'manager@cartiaerae.com', role: 'store_manager' as const } },
    { email: 'content@cartiaerae.com', passwords: ['content'], user: { id: 'adm-003', name: 'Brianna Smith (Editor)', email: 'content@cartiaerae.com', role: 'content_manager' as const } },
  ];

  const loginAdmin = async (email: string, password: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          triggerToast(`❌ Login failed: ${error.message}`, 'error');
          return false;
        }

        if (data.user) {
          const { data: adminProfile, error: profileError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError || !adminProfile) {
            triggerToast('❌ Access denied: You are not authorized as administrator.', 'error');
            await supabase.auth.signOut();
            return false;
          }
          
          triggerToast(`✓ Welcome back, ${adminProfile.name}!`, 'success');
          return true;
        }
        return false;
      } catch (err) {
        console.error('Authentication error:', err);
        triggerToast('❌ An authentication error occurred.', 'error');
        return false;
      }
    } else {
      const match = ADMIN_CREDENTIALS.find(
        (cred) => cred.email.toLowerCase() === email.trim().toLowerCase() && cred.passwords.includes(password)
      );
      const user: AdminUser | null = match ? match.user : null;

      if (user) {
        setIsAdminLoggedIn(true);
        setCurrentAdminUser(user);
        localStorage.setItem('cartiae_admin_auth', 'true');
        localStorage.setItem('cartiae_admin_user', JSON.stringify(user));
        triggerToast(`✓ Welcome back, ${user.name}! (Demo Mode)`, 'success');
        return true;
      }
      return false;
    }
  };

  const logoutAdmin = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
        triggerToast('✓ Logged out successfully.', 'info');
      } catch (err) {
        console.error('Error logging out:', err);
      }
    } else {
      setIsAdminLoggedIn(false);
      setCurrentAdminUser(null);
      localStorage.removeItem('cartiae_admin_auth');
      localStorage.removeItem('cartiae_admin_user');
      triggerToast('✓ Logged out successfully (Demo Mode).', 'info');
    }
  };

  return (
    <AppContext.Provider value={{
      ebooks, products, videos, gallery, blogs, discountCodes, homepageContent, services, newsletterSignups, cart, orders, appliedDiscount, isAdminLoggedIn, currentAdminUser, wishlist,
      contactRequests,
      toast, triggerToast,
      addEBook, updateEBook, deleteEBook,
      addProduct, updateProduct, deleteProduct,
      addVideo, updateVideo, deleteVideo,
      addGalleryItem, updateGalleryItem, deleteGalleryItem,
      addBlogPost, updateBlogPost, deleteBlogPost, likeBlogPost,
      addDiscountCode, updateDiscountCode, deleteDiscountCode,
      updateHomepageContent,
      addService, updateService,
      deleteService,
      signupNewsletter,
      addToCart, removeFromCart, updateCartQuantity, applyPromoCode, clearCart,
      addToWishlist, removeFromWishlist, moveToWishlist, moveToCart,
      createOrder, fulfillOrder,
      loginAdmin, logoutAdmin,
      addContactRequest, respondToContactRequest, deleteContactRequest, updateContactRequestStatus,
      emailNotificationsEnabled, setEmailNotificationsEnabled,
      prefersReducedMotion
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
