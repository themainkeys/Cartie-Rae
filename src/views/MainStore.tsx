import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, EBook } from '../types';
import { ProductCard } from '../components/ProductCard';
import { EBookCard } from '../components/EBookCard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingBag, X, BookOpen, Droplet, 
  CheckCircle, AlertCircle, Sparkles, Star, Heart, Share2
} from 'lucide-react';

interface MainStoreProps {
  initialFilter?: string;
  isCartOpen: boolean;
  closeCart: () => void;
  openCart: () => void;
}

export const MainStore: React.FC<MainStoreProps> = ({ initialFilter = 'All', isCartOpen, closeCart, openCart }) => {
  const { 
    products, ebooks, cart, appliedDiscount,
    addToCart, applyPromoCode,
    wishlist, addToWishlist, removeFromWishlist, triggerToast, prefersReducedMotion
  } = useApp();

  // --- Filtering & Searching Stage ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialFilter);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedEBook, setSelectedEBook] = useState<EBook | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    const ebookId = params.get('ebook');

    if (prodId) {
      const prod = products.find(p => p.id === prodId);
      if (prod) {
        setSelectedProduct(prod);
      }
    } else if (ebookId) {
      const ebook = ebooks.find(e => e.id === ebookId);
      if (ebook) {
        setSelectedEBook(ebook);
      }
    }
  }, [products, ebooks]);

  // States
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const productModalRef = useRef<HTMLDivElement>(null);
  const ebookModalRef = useRef<HTMLDivElement>(null);

  // Keyboard trap and ESC key closure for product modal
  useEffect(() => {
    if (!selectedProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProduct(null);
        return;
      }
      if (e.key === 'Tab' && productModalRef.current) {
        const focusableElements = productModalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"]'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0] as HTMLElement;
        const last = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Focus close button initially
    setTimeout(() => {
      const closeBtn = productModalRef.current?.querySelector('button');
      if (closeBtn) closeBtn.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct]);

  // Keyboard trap and ESC key closure for eBook modal
  useEffect(() => {
    if (!selectedEBook) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEBook(null);
        return;
      }
      if (e.key === 'Tab' && ebookModalRef.current) {
        const focusableElements = ebookModalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"]'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0] as HTMLElement;
        const last = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Focus close button initially
    setTimeout(() => {
      const closeBtn = ebookModalRef.current?.querySelector('button');
      if (closeBtn) closeBtn.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEBook]);

  const categories = ['All', 'eBooks'];

  const categoryDisplayMap: Record<string, { label: string; icon: React.ReactNode }> = {
    'All': { label: 'All', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    'eBooks': { label: 'Digital', icon: <BookOpen className="w-3.5 h-3.5" /> },
    'Hair Oils': { label: 'Oils', icon: <Droplet className="w-3.5 h-3.5" /> },
    'Accessories': { label: 'Tools', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    'Treatments': { label: 'Treatments', icon: <Sparkles className="w-3.5 h-3.5" /> }
  };

  // Filter items logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Check if product's category is currently in active categories list
      // Note: 'Accessories' or 'Hair Oils' could be added to categories list in the future
      const isCategoryActive = categories.includes(p.category) || (p.category === 'Accessories' && categories.includes('Tools'));
      if (!isCategoryActive) return false;

      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch && activeCategory !== 'eBooks';
    });
  }, [products, activeCategory, searchQuery, categories]);

  const filteredEBooks = useMemo(() => {
    return ebooks.filter(eb => {
      const matchCat = activeCategory === 'All' || activeCategory === 'eBooks';
      const matchSearch = eb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          eb.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [ebooks, activeCategory, searchQuery]);

  // Cart financial computations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    return Math.round((subtotal * (appliedDiscount.discountPercent / 100)) * 100) / 100;
  }, [appliedDiscount, subtotal]);

  const total = useMemo(() => {
    return Math.round((subtotal - discountAmount) * 100) / 100;
  }, [subtotal, discountAmount]);

  const handlePromoApply = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput) return;
    const err = applyPromoCode(promoInput);
    if (err) {
      setPromoError(err);
    } else {
      setPromoInput('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      
      {/* Banner introduction with text design */}
      <div className="text-center mb-16 space-y-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-brand-rose font-bold block">
          Digital Guides &amp; Essentials
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark font-normal">
          Shop Essentials
        </h1>
      </div>

      {/* Search and Filter Area (Mobile sticky row and desktop grid) */}
      
      {/* 📱 Mobile Sticky Category pill bar */}
      <div className="sticky top-20 z-30 bg-brand-cream/95 backdrop-blur-md border-b border-brand-warm-tan/15 shadow-sm py-3 -mx-6 px-6 overflow-x-auto whitespace-nowrap flex items-center gap-2 md:hidden scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const displayData = categoryDisplayMap[cat];
          return (
            <button
              key={cat}
              id={`cat-mobile-${cat.toLowerCase().replace(' ', '-')}`}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery('');
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold rounded-full border relative transition-colors duration-300 cursor-pointer focus:outline-none ${
                isActive
                  ? 'text-white border-brand-rose font-bold z-10 bg-transparent'
                  : 'bg-white text-brand-dark/70 border-brand-warm-tan/30 hover:bg-[#FAF6F0]'
              }`}
            >
              {isActive && (
                <motion.span 
                  layoutId="activeCategoryPillMobile"
                  className="absolute inset-0 bg-brand-rose rounded-full border border-brand-rose z-[-1]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {displayData.icon}
              <span>{displayData.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Search field */}
      <div className="relative w-full md:hidden my-6">
        <input
          id="mobile-store-search-field"
          type="text"
          placeholder="Search apothecary products & digital guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-3 bg-[#FAF6F0] border border-brand-warm-tan/25 rounded-xl text-xs text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose transition-all"
        />
        <Search className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-brand-dark/30" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 text-brand-dark/40 hover:text-brand-rose focus:outline-none cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main layout with sticky sidebar and product display grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mt-4">
        {/* Sticky Sidebar on Desktop */}
        <aside className="hidden md:block md:col-span-3">
          <div className="sticky top-24 self-start space-y-8 bg-[#FAF6F0]/65 p-6 rounded-3xl border border-brand-warm-tan/20 shadow-sm">
            <div>
              <h3 className="font-serif text-sm tracking-widest text-brand-dark uppercase font-semibold border-b border-brand-warm-tan/20 pb-2 mb-4">
                Apothecary Shop
              </h3>
              
              {/* Category List */}
              <div className="flex flex-col gap-1.5">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  const displayData = categoryDisplayMap[cat];
                  return (
                    <button
                      key={cat}
                      id={`cat-sidebar-${cat.toLowerCase().replace(' ', '-')}`}
                      onClick={() => {
                        setActiveCategory(cat);
                        setSearchQuery('');
                      }}
                      className={`flex items-center gap-3 px-3.5 py-3 text-[10px] uppercase tracking-[0.16em] font-semibold rounded-xl relative transition-colors duration-300 text-left focus:outline-none w-full cursor-pointer ${
                        isActive
                          ? 'text-[#FAF6F0] font-bold z-10 bg-transparent'
                          : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-rose/5'
                      }`}
                    >
                      {isActive && (
                        <motion.span 
                          layoutId="activeCategoryPillDesktop"
                          className="absolute inset-0 bg-brand-rose rounded-xl z-[-1]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {displayData.icon}
                      <span>{displayData.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline search box */}
            <div>
              <h4 className="font-serif text-xs tracking-wider text-brand-dark uppercase font-semibold mb-3">
                Search Directory
              </h4>
              <div className="relative">
                <input
                  id="sidebar-search-field"
                  type="text"
                  placeholder="Type keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-[#FAF6F0] border border-brand-warm-tan/20 text-xs text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose transition-all"
                />
                <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-brand-dark/30" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-brand-dark/40 hover:text-brand-rose focus:outline-none cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Exclusive brand note */}
            <div className="pt-2 border-t border-brand-warm-tan/15">
              <div className="p-4 rounded-xl bg-brand-cream/50 text-center border border-brand-warm-tan/10">
                <Sparkles className="w-4 h-4 text-brand-rose mx-auto mb-2" />
                <p className="font-serif text-[10px] text-brand-chocolate uppercase tracking-widest font-bold">Cold-Pressed Seal</p>
                <p className="font-sans text-[10px] text-brand-dark/50 mt-1 leading-relaxed">100% organic recipes curated for optimal growth.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area grid displaying matching products */}
        <div className="md:col-span-9 space-y-12">
          
          {/* eBooks Segment (Featured spacing) */}
          {(activeCategory === 'All' || activeCategory === 'eBooks') && filteredEBooks.length > 0 && (
            <div>
              <div className="border-b border-brand-warm-tan/15 pb-2 mb-6 flex justify-between items-center">
                <h2 className="font-serif text-lg tracking-wide text-brand-dark font-medium">
                  Digital Curriculum & Guides
                </h2>
                <span className="font-sans text-[9px] text-[#6C5347]/50 uppercase tracking-widest">
                  {filteredEBooks.length} Available
                </span>
              </div>
              <motion.div 
                layout={prefersReducedMotion ? false : "position"}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {filteredEBooks.map((ebook) => (
                    <motion.div
                      layout={prefersReducedMotion ? false : "position"}
                      key={ebook.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                    >
                      <EBookCard
                        ebook={ebook}
                        onViewDetails={setSelectedEBook}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Physical Products Segment */}
          {activeCategory !== 'eBooks' && filteredProducts.length > 0 && (
            <div>
              <div className="border-b border-brand-warm-tan/15 pb-2 mb-6 flex justify-between items-center">
                <h2 className="font-serif text-lg tracking-wide text-brand-dark font-medium">
                  Botanical Elixirs & Accessories
                </h2>
                <span className="font-sans text-[9px] text-[#6C5347]/50 uppercase tracking-widest">
                  {filteredProducts.length} Available
                </span>
              </div>
              <motion.div 
                layout={prefersReducedMotion ? false : "position"}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout={prefersReducedMotion ? false : "position"}
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ProductCard
                        product={product}
                        onViewDetails={setSelectedProduct}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Empty State warning */}
          {filteredEBooks.length === 0 && filteredProducts.length === 0 && (
            <div className="py-20 text-center bg-brand-beige/20 rounded-2xl border border-dashed border-brand-warm-tan/30">
              <AlertCircle className="w-8 h-8 text-brand-rose/60 mx-auto mb-3" />
              <p className="font-serif text-base text-[#6C5347] font-medium">No results match your criteria.</p>
              <p className="font-sans text-xs text-brand-dark/50 mt-1">Try resetting the search query or changing filters.</p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-6 py-2.5 bg-brand-rose text-white text-[10px] uppercase font-bold tracking-widest hover:bg-brand-berry focus:outline-none transition-all cursor-pointer rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 🌟 1. PRODUCT DETAIL MODAL SHEET (QUICK VIEW) */}
      {/* ======================================= */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-dark/70 backdrop-blur-xs"
              onClick={() => setSelectedProduct(null)}
            />
            
            {/* Modal Box */}
            <motion.div
              ref={productModalRef}
              initial={{ opacity: 0, scale: 0.95, y: prefersReducedMotion ? 0 : 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: prefersReducedMotion ? 0 : 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative bg-[#FAF6F0] border border-[#E5D5C8]/80 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10"
            >
              {/* Close Button */}
              <button
                id="close-prod-details"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-35 p-2 rounded-full bg-white/95 hover:bg-brand-rose hover:text-white text-brand-dark shadow-md transition-all duration-200 focus:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2">
                {/* Left Column: Premium Image Presentation Area */}
                <div className="relative bg-brand-beige min-h-[280px] md:min-h-full">
                  <div className="aspect-[4/5] md:aspect-auto md:h-full w-full overflow-hidden flex items-center justify-center relative">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Category Overlay Pill */}
                    <span className="absolute bottom-4 left-4 bg-brand-dark text-[#FAF6F0] text-[9px] uppercase tracking-widest font-black px-3.5 py-1.5 shadow-sm rounded-lg">
                      {selectedProduct.category}
                    </span>

                    {/* Quick View Badge Indicator */}
                    <span className="absolute top-4 left-4 bg-brand-rose text-white text-[9px] uppercase tracking-widest font-black px-3.5 py-1.5 shadow-sm flex items-center gap-1.5 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      <span>Quick View</span>
                    </span>
                  </div>
                </div>

                {/* Right Column: Descriptions, Botanical Ingredients & Instructions */}
                <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-sans text-[10px] uppercase tracking-wider text-brand-rose font-bold">
                        {selectedProduct.category}
                      </span>
                      {selectedProduct.stockStatus && (
                        <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase border rounded ${
                          selectedProduct.stockStatus === 'In Stock' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' 
                            : selectedProduct.stockStatus === 'Low Stock'
                            ? 'bg-amber-50 text-amber-800 border-amber-200/50'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          {selectedProduct.stockStatus}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-dark leading-tight">
                        {selectedProduct.name}
                      </h3>
                      <p className="font-mono text-sm font-semibold text-brand-chocolate mt-1">
                        Price: ${selectedProduct.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-4 border-t border-[#E5D5C8]/30 pt-4">
                      {/* Description */}
                      <div className="space-y-1">
                        <h4 className="font-serif text-[11px] uppercase font-bold tracking-wider text-brand-chocolate">
                          Description Overview
                        </h4>
                        <p className="font-sans text-xs text-[#8C6D62] leading-relaxed">
                          {selectedProduct.description}
                        </p>
                      </div>

                      {/* Ingredients */}
                      {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                        <div className="p-4 bg-[#FAF7F2] border border-[#E5D5C8]/45 rounded-2xl">
                          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-brand-chocolate mb-2 flex items-center gap-1.5">
                            <Droplet className="w-3.5 h-3.5 text-brand-rose" />
                            <span>Featured Botanical Ingredients</span>
                          </h4>
                          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px] text-[#8C6D62]">
                            {selectedProduct.ingredients.map((ing, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-brand-rose rounded-full"></span>
                                <span className="line-clamp-1">{ing}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Professional Practice */}
                      {selectedProduct.howToUse && selectedProduct.howToUse.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="font-serif text-[11px] uppercase font-bold tracking-wider text-brand-chocolate">
                            Professional Practice & Use
                          </h4>
                          <ol className="space-y-1.5 text-[11px] text-[#8C6D62] list-decimal list-inside leading-relaxed">
                            {selectedProduct.howToUse.slice(0, 2).map((step, i) => (
                              <li key={i} className="pl-0.5">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 border-t border-[#E5D5C8]/30 pt-4">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <span className="text-[10.5px] text-brand-chocolate font-bold">
                      Verified Cartiae Rae Quality
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Add to Cart action banner */}
              <div className="p-4 bg-[#FAF7F2] border-t border-[#E5D5C8]/50 flex items-center justify-between gap-4 z-20">
                <span className="font-sans text-base sm:text-lg font-black text-brand-dark">${selectedProduct.price.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <motion.button
                    id="modal-toggle-prod-wishlist"
                    type="button"
                    onClick={() => {
                      const isProductSaved = wishlist.some(item => item.id === selectedProduct.id);
                      if (isProductSaved) {
                        removeFromWishlist(selectedProduct.id);
                      } else {
                        addToWishlist({
                          id: selectedProduct.id,
                          type: 'product',
                          name: selectedProduct.name,
                          price: selectedProduct.price,
                          image: selectedProduct.image
                        });
                      }
                    }}
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                    className="p-2.5 rounded-full bg-white hover:bg-brand-rose hover:text-white text-brand-dark border border-[#E5D5C8]/60 flex items-center justify-center focus:outline-none transition-colors cursor-pointer"
                    aria-label="Wishlist product"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.some(item => item.id === selectedProduct.id) ? 'fill-brand-rose text-brand-rose' : ''}`} />
                  </motion.button>
                  <motion.button
                    id="modal-share-prod"
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?product=${selectedProduct.id}`;
                      navigator.clipboard.writeText(shareUrl).then(() => {
                        triggerToast('Link Copied', 'success');
                      });
                    }}
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                    className="p-2.5 rounded-full bg-white hover:bg-brand-rose hover:text-white text-brand-dark border border-[#E5D5C8]/60 flex items-center justify-center focus:outline-none transition-colors cursor-pointer"
                    aria-label="Share product"
                    title="Share product link"
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    id="modal-add-prod-to-cart"
                    onClick={() => {
                      addToCart({
                        id: selectedProduct.id,
                        type: 'product',
                        name: selectedProduct.name,
                        price: selectedProduct.price,
                        image: selectedProduct.image
                      });
                      setSelectedProduct(null);
                      openCart();
                    }}
                    disabled={selectedProduct.stockStatus === 'Out of Stock'}
                    whileHover={{ scale: selectedProduct.stockStatus === 'Out of Stock' || prefersReducedMotion ? 1 : 1.02 }}
                    whileTap={{ scale: selectedProduct.stockStatus === 'Out of Stock' || prefersReducedMotion ? 1 : 0.98 }}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose transition-all duration-200 cursor-pointer ${
                      selectedProduct.stockStatus === 'Out of Stock'
                        ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        : 'bg-brand-rose hover:bg-brand-berry text-white shadow-[0_2px_10px_rgba(194,57,90,0.2)] hover:shadow-lg'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add To Bag</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🌟 2. EBOOK DETAIL MODAL SHEET          */}
      {/* ======================================= */}
      <AnimatePresence>
        {selectedEBook && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-dark/70 backdrop-blur-xs"
              onClick={() => setSelectedEBook(null)}
            />
            
            {/* Modal Box */}
            <motion.div
              ref={ebookModalRef}
              initial={{ opacity: 0, scale: 0.95, y: prefersReducedMotion ? 0 : 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: prefersReducedMotion ? 0 : 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative bg-[#FAF6F0] border border-[#E5D5C8]/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10"
            >
              {/* Close */}
              <button
                id="close-ebook-details"
                onClick={() => setSelectedEBook(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-brand-cream/90 hover:bg-brand-rose hover:text-white text-brand-dark shadow-sm transition-all focus:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto flex-1">
                {/* Cover head */}
                <div className="bg-brand-chocolate/10 p-8 flex justify-center border-b border-brand-warm-tan/20">
                  <div className="w-40 aspect-[3/4] rounded-xl overflow-hidden bg-brand-beige shadow-lg border border-brand-warm-tan/40">
                    <img
                      src={selectedEBook.image}
                      alt={selectedEBook.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Core description text */}
                <div className="p-6">
                  <span className="bg-emerald-50 text-emerald-800 text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded border border-emerald-200/50">
                    Instant Digital Download
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-brand-dark leading-tight mt-2.5">
                    {selectedEBook.name}
                  </h3>
                  
                  <div className="flex gap-4 text-xs text-brand-dark/50 font-mono mt-1 mb-4">
                    <span>Format: Interactive PDF</span>
                    <span>|</span>
                    <span>Length: {selectedEBook.pages} Pages</span>
                    <span>|</span>
                    <span>File Size: {selectedEBook.fileSize}</span>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-brand-dark/70 leading-relaxed">
                    {selectedEBook.description}
                  </p>

                  {/* Benefits */}
                  <div className="mt-6 border-t border-brand-warm-tan/20 pt-5">
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-brand-rose mb-2.5">
                      What You Will Learn In These Chapters:
                    </h4>
                    <ul className="space-y-2 text-xs text-brand-dark/80">
                      {selectedEBook.benefits.map((ben, i) => (
                        <li key={i} className="flex items-start gap-2 bg-brand-cream/60 p-2 rounded border border-brand-warm-tan/10">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span className="leading-relaxed">{ben}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Excerpt */}
                  <div className="mt-5 p-4 rounded-xl bg-brand-dark/5 border border-brand-dark/10">
                    <h5 className="font-serif text-[11px] uppercase tracking-wider text-brand-chocolate font-bold mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-brand-pink" />
                      <span>Exclusive Chapter 1 Sneak-Peek snippet:</span>
                    </h5>
                    <p className="text-[11px] italic text-brand-dark/60 leading-relaxed font-sans">
                      &ldquo;Natural 4C curls are highly fragile not because of genetic weakness, but because their elliptical structure causes moisture molecules to escape the cortex ten times faster than straight cuticles. This is why standard dry sealants fail...&rdquo;
                    </p>
                  </div>

                  {/* Reviews */}
                  <div className="mt-6 border-t border-brand-warm-tan/30 pt-6">
                    <h4 className="font-serif text-sm font-bold text-brand-dark mb-4">
                      Reader Reviews ({selectedEBook.reviews.length || 1})
                    </h4>
                    {selectedEBook.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {selectedEBook.reviews.map((rev) => (
                          <div key={rev.id} className="bg-brand-cream/40 p-4 rounded-xl border border-brand-warm-tan/10 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-brand-chocolate">{rev.rater}</span>
                              <span className="text-brand-dark/40 font-mono text-[10px]">{rev.date}</span>
                            </div>
                            <div className="flex text-amber-500 my-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < rev.score ? 'fill-amber-500' : 'text-amber-200'}`} />
                              ))}
                            </div>
                            <p className="text-brand-dark/70 italic mt-1 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-sans text-xs italic text-brand-dark/40">No reviews yet. Be the first to leave a review!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Add to Cart action banner */}
              <div className="p-4 bg-[#FAF7F2] border-t border-[#E5D5C8]/50 flex items-center justify-between gap-4">
                <span className="font-sans text-lg font-bold text-brand-chocolate">${selectedEBook.price.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <motion.button
                    id="modal-toggle-ebook-wishlist"
                    type="button"
                    onClick={() => {
                      const isEBookSaved = wishlist.some(item => item.id === selectedEBook.id);
                      if (isEBookSaved) {
                        removeFromWishlist(selectedEBook.id);
                      } else {
                        addToWishlist({
                          id: selectedEBook.id,
                          type: 'ebook',
                          name: selectedEBook.name,
                          price: selectedEBook.price,
                          image: selectedEBook.image
                        });
                      }
                    }}
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                    className="p-2.5 rounded-full bg-white hover:bg-brand-rose hover:text-white text-brand-dark border border-brand-warm-tan/20 flex items-center justify-center focus:outline-none transition-colors cursor-pointer"
                    aria-label="Wishlist ebook"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.some(item => item.id === selectedEBook.id) ? 'fill-brand-rose text-brand-rose' : ''}`} />
                  </motion.button>
                  <motion.button
                    id="modal-add-ebook-to-cart"
                    onClick={() => {
                      addToCart({
                        id: selectedEBook.id,
                        type: 'ebook',
                        name: selectedEBook.name,
                        price: selectedEBook.price,
                        image: selectedEBook.image
                      });
                      setSelectedEBook(null);
                      openCart();
                    }}
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                    className="bg-brand-rose hover:bg-brand-berry text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add To Bag</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
