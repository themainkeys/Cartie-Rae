import React, { createContext, useContext, useState, useEffect } from 'react';
import { EBook, Product, TikTokVideo, PhotoGalleryItem, BlogPost, DiscountCode, CartItem, Order, NewsletterSignup, HomepageContent, WishlistItem, ContactRequest, AdminUser } from '../types';
import { initialEBooks, initialProducts, initialVideos, initialGallery, initialBlogPosts, initialDiscountCodes, initialHomepageContent } from '../data/initialData';

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
  deleteGalleryItem: (id: string) => void;
  
  // Blog Operations
  addBlogPost: (post: Omit<BlogPost, 'id' | 'likes' | 'date'>) => void;
  updateBlogPost: (id: string, updated: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  likeBlogPost: (id: string) => void;
  
  // Discount Code Operations
  addDiscountCode: (code: Omit<DiscountCode, 'id'>) => void;
  deleteDiscountCode: (id: string) => void;
  
  // CMS Home/About
  updateHomepageContent: (content: Partial<HomepageContent>) => void;
  
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
  loginAdmin: (password: string) => boolean;
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
    return local ? JSON.parse(local) : initialEBooks;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('cartiae_products');
    return local ? JSON.parse(local) : initialProducts;
  });

  const [videos, setVideos] = useState<TikTokVideo[]>(() => {
    const local = localStorage.getItem('cartiae_videos');
    return local ? JSON.parse(local) : initialVideos;
  });

  const [gallery, setGallery] = useState<PhotoGalleryItem[]>(() => {
    const local = localStorage.getItem('cartiae_gallery');
    if (local) {
      try {
        const parsed = JSON.parse(local) as PhotoGalleryItem[];
        return parsed.map(item => {
          if (item.id === 'gal-5' && item.image.includes('photo-1509967419530-da38b4704bc6')) {
            return { ...item, image: '/hero-portrait.jpg' };
          }
          return item;
        });
      } catch (e) {
        return initialGallery;
      }
    }
    return initialGallery;
  });

  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    const local = localStorage.getItem('cartiae_blogs');
    return local ? JSON.parse(local) : initialBlogPosts;
  });

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(() => {
    const local = localStorage.getItem('cartiae_discounts');
    return local ? JSON.parse(local) : initialDiscountCodes;
  });

  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => {
    const local = localStorage.getItem('cartiae_home');
    return local ? JSON.parse(local) : initialHomepageContent;
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
    return localStorage.getItem('cartiae_admin_auth') === 'true';
  });

  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(() => {
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
  useEffect(() => { localStorage.setItem('cartiae_home', JSON.stringify(homepageContent)); }, [homepageContent]);
  useEffect(() => { localStorage.setItem('cartiae_newsletter', JSON.stringify(newsletterSignups)); }, [newsletterSignups]);
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
  const addContactRequest = (request: Omit<ContactRequest, 'id' | 'date' | 'status'>) => {
    const newRequest: ContactRequest = {
      ...request,
      id: `CON-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setContactRequests(prev => [newRequest, ...prev]);

    if (emailNotificationsEnabled) {
      triggerToast(`✉ Dispatching notification email regarding ${request.name}'s contact message!`, 'success');
      console.log(`[SIMULATOR] Admin Email Notification: New contact form inquiry from ${request.name} <${request.email}>.`);
    } else {
      console.log(`[SIMULATOR] Admin Email Notification suppressed (Settings set to Disabled) for submission from ${request.name}.`);
    }
  };

  const respondToContactRequest = (id: string) => {
    setContactRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Responded' } : req));
  };

  const deleteContactRequest = (id: string) => {
    setContactRequests(prev => prev.filter(req => req.id !== id));
  };

  const updateContactRequestStatus = (id: string, status: 'Pending' | 'Responded' | 'Read' | 'Archived') => {
    setContactRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
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
    setEbooks(prev => prev.filter(item => item.id !== id));
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
    setProducts(prev => prev.filter(item => item.id !== id));
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

  const deleteGalleryItem = (id: string) => {
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
    setDiscountCodes(prev => prev.filter(item => item.id !== id));
  };

  // --- CMS Content ---
  const updateHomepageContent = (content: Partial<HomepageContent>) => {
    setHomepageContent(prev => ({ ...prev, ...content }));
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
  const loginAdmin = (password: string): boolean => {
    let user: AdminUser | null = null;
    if (password === 'admin' || password === 'cartiae123') {
      user = { id: 'adm-001', name: 'Cartiae Rae', email: 'admin@cartiaerae.com', role: 'super_admin' };
    } else if (password === 'manager') {
      user = { id: 'adm-002', name: 'Elena Vance (Manager)', email: 'manager@cartiaerae.com', role: 'store_manager' };
    } else if (password === 'content') {
      user = { id: 'adm-003', name: 'Brianna Smith (Editor)', email: 'content@cartiaerae.com', role: 'content_manager' };
    }

    if (user) {
      setIsAdminLoggedIn(true);
      setCurrentAdminUser(user);
      localStorage.setItem('cartiae_admin_auth', 'true');
      localStorage.setItem('cartiae_admin_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setCurrentAdminUser(null);
    localStorage.removeItem('cartiae_admin_auth');
    localStorage.removeItem('cartiae_admin_user');
  };

  return (
    <AppContext.Provider value={{
      ebooks, products, videos, gallery, blogs, discountCodes, homepageContent, newsletterSignups, cart, orders, appliedDiscount, isAdminLoggedIn, currentAdminUser, wishlist,
      contactRequests,
      toast, triggerToast,
      addEBook, updateEBook, deleteEBook,
      addProduct, updateProduct, deleteProduct,
      addVideo, updateVideo, deleteVideo,
      addGalleryItem, deleteGalleryItem,
      addBlogPost, updateBlogPost, deleteBlogPost, likeBlogPost,
      addDiscountCode, deleteDiscountCode,
      updateHomepageContent,
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
