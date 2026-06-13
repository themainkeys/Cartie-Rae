import React, { createContext, useContext, useState, useEffect } from 'react';
import { EBook, Product, TikTokVideo, PhotoGalleryItem, BlogPost, DiscountCode, CartItem, Order, NewsletterSignup, HomepageContent, WishlistItem, ContactRequest } from '../types';
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
    return local ? JSON.parse(local) : initialGallery;
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
    return local ? JSON.parse(local) : [];
  });

  const [contactRequests, setContactRequests] = useState<ContactRequest[]>(() => {
    const local = localStorage.getItem('cartiae_contacts');
    if (local) return JSON.parse(local);
    return [];
  });

  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(() => {
    const local = localStorage.getItem('cartiae_applied_discount');
    return local ? JSON.parse(local) : null;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('cartiae_admin_auth') === 'true';
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const local = localStorage.getItem('cartiae_wishlist');
    return local ? JSON.parse(local) : [];
  });

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState<boolean>(() => {
    const local = localStorage.getItem('cartiae_email_notifications_enabled');
    return local !== null ? local === 'true' : true;
  });

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
    // Private administrative password for the live storefront owner
    const ADMIN_PASSWORD = 'CartiaeRae2026!';
    if (password === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('cartiae_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('cartiae_admin_auth');
  };

  return (
    <AppContext.Provider value={{
      ebooks, products, videos, gallery, blogs, discountCodes, homepageContent, newsletterSignups, cart, orders, appliedDiscount, isAdminLoggedIn, wishlist,
      contactRequests,
      toast, triggerToast,
      addEBook, updateEBook, deleteEBook,
      addProduct, updateProduct, deleteProduct,
      addVideo, deleteVideo,
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
      emailNotificationsEnabled, setEmailNotificationsEnabled
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
