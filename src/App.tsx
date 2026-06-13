import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FAQ } from './components/FAQ';
import { MainStore } from './views/MainStore';
import { VideoGallery } from './views/VideoGallery';
import { PhotoGallery } from './views/PhotoGallery';
import { AboutAndBlog } from './views/AboutAndBlog';
import { ContactPage } from './views/ContactPage';
import { AdminPortal } from './views/AdminPortal';
import { CartDrawer } from './components/CartDrawer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ArrowUp, Sparkles, BookOpen, Droplet, Star, ShieldCheck, 
  Clock, Heart, Compass, CheckCircle2, Check, Send, ShoppingBag
} from 'lucide-react';

const transitionRefined = {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1] as const
};

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

const revealItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionRefined
  }
};

const revealItemScale = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

const Homepage: React.FC<{ 
  setActivePart: (part: string) => void;
  setShopFilter: (filter: string) => void;
  openCart: () => void;
}> = ({ setActivePart, setShopFilter, openCart }) => {
  const { homepageContent, signupNewsletter, addToCart } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const res = signupNewsletter(emailInput);
    if (res) {
      setSuccess(true);
      setEmailInput('');
      setTimeout(() => setSuccess(false), 5000);
    }
  };

  const handleQuickBuyBlueprint = () => {
    // Quick add main eBook to cart
    addToCart({
      id: 'ebook-1',
      type: 'ebook',
      name: 'The 4C Growth Blueprint',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800'
    });
    openCart();
  };

  return (
    <div className="space-y-24 pb-16 overflow-hidden">
      
      {/* ======================================= */}
      {/* 🌸 1. EDITORIAL MINIMALIST HERO LAYOUT */}
      {/* ======================================= */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={revealContainer}
        className="relative bg-brand-cream pt-8 pb-16 lg:pt-12 lg:pb-20 border-b border-brand-warm-tan/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column texts */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="space-y-4">
                <motion.span 
                  variants={revealItem}
                  className="font-sans text-[10px] uppercase tracking-[0.3em] text-brand-rose font-semibold block animate-pulse"
                >
                  Natural 4C Hair Science
                </motion.span>
                <motion.h1 
                  variants={revealItem}
                  className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-dark tracking-tight leading-[1.1] font-normal"
                >
                  {homepageContent.heroHeadline}
                </motion.h1>
              </div>

              <motion.p 
                variants={revealItem}
                className="font-sans text-xs sm:text-sm text-[#5C453C]/80 leading-relaxed max-w-xl"
              >
                {homepageContent.heroSubheadline}
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                variants={revealItem}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <button
                  id="hero-buy-blueprint"
                  onClick={handleQuickBuyBlueprint}
                  className="bg-brand-dark hover:bg-[#3d1a10] text-[#FAF6F0] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-300 flex items-center justify-center cursor-pointer"
                >
                  <span>eBook Blueprint — $24.99</span>
                </button>

                <button
                  id="hero-view-tutorials"
                  onClick={() => setActivePart('tutorials')}
                  className="bg-transparent border border-brand-dark/20 hover:border-brand-dark text-brand-dark px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-300 flex items-center justify-center cursor-pointer"
                >
                  <span>Watch Free Tutorials</span>
                </button>
              </motion.div>

              {/* Trust triggers ribbon */}
              <motion.div 
                variants={revealItem}
                className="pt-8 border-t border-brand-warm-tan/20 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-brand-dark/60 font-sans tracking-wide"
              >
                <span>✓ Instant digital downloads</span>
                <span>•</span>
                <span>✓ Pure botanical ingredients</span>
                <span>•</span>
                <span>✓ Made with care</span>
              </motion.div>
            </div>

            {/* Right Column Portrait - Extremely clean with subtle editorial float */}
            <motion.div 
              variants={revealItemScale}
              className="lg:col-span-5 relative font-sans"
            >
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="aspect-[4/5] overflow-hidden bg-brand-cream border border-brand-warm-tan/25 shadow-sm"
              >
                <img
                  src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80&w=800"
                  alt="Cartiae Rae portrait"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none"
                />
              </motion.div>
              <div className="mt-4 text-center sm:text-left space-y-1">
                <p className="font-serif italic text-xs text-brand-dark/80 leading-relaxed">
                  &ldquo;{homepageContent.promoQuote}&rdquo;
                </p>
                <p className="font-sans text-[10px] uppercase tracking-widest text-[#B11B41] font-semibold block">
                  — {homepageContent.promoAuthor}
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.section>

      {/* ======================================= */}
      {/* 🛒 2. ELEGANT FEATURED SELECTIONS GRID */}
      {/* ======================================= */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={revealContainer}
        className="max-w-7xl mx-auto px-6 lg:px-8"
      >
        <motion.div 
          variants={revealItem}
          className="flex justify-between items-end border-b border-brand-warm-tan/20 pb-4 mb-8"
        >
          <div>
            <span className="text-[10px] uppercase tracking-widest text-brand-rose font-semibold block mb-1">Our Focus</span>
            <h2 className="font-serif text-2xl lg:text-3xl text-brand-dark font-normal">Featured Growth Essentials</h2>
          </div>
          <button
            id="browse-all-shop-link"
            onClick={() => {
              setShopFilter('All');
              setActivePart('shop');
            }}
            className="text-brand-dark hover:text-brand-rose text-xs uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5 focus:outline-none transition-colors cursor-pointer"
          >
            <span>Explore All Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Minimal Lookbook Product Grid */}
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8"
        >
          {/* Item 1 Oil */}
          <motion.div 
            variants={revealItemScale}
            onClick={() => {
              setShopFilter('Products');
              setActivePart('shop');
            }}
            className="group cursor-pointer space-y-3 pl-0"
          >
            <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-warm-tan/15 relative">
              <img
                src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400"
                alt="Oil dropper"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none"
              />
              {/* Floating Quick Add Shopping Bag Icon */}
              <button
                type="button"
                id="quick-add-overlay-oil"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({
                    id: 'prod-1',
                    type: 'product',
                    name: 'Botanical Growth Oil',
                    price: 38.00,
                    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400'
                  });
                  openCart();
                }}
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] rounded-full shadow-md flex items-center justify-center transition-all duration-300 opacity-95 sm:opacity-0 group-hover:opacity-100 transform sm:translate-y-2 group-hover:translate-y-0 focus:opacity-100 focus:translate-y-0 cursor-pointer border border-brand-warm-tan/20"
                aria-label="Add Botanical Growth Oil to Bag"
              >
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
            <div className="flex justify-between items-start pt-1">
              <h3 className="font-serif text-sm sm:text-base text-brand-dark group-hover:text-brand-rose transition-colors">Botanical Growth Oil</h3>
              <span className="font-mono text-xs text-brand-dark/70 font-medium">$38.00</span>
            </div>
          </motion.div>

          {/* Item 2 Cap */}
          <motion.div 
            variants={revealItemScale}
            onClick={() => {
              setShopFilter('Products');
              setActivePart('shop');
            }}
            className="group cursor-pointer space-y-3"
          >
            <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-warm-tan/15 relative">
              <img
                src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400"
                alt="Sleep Bonnet"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none"
              />
              {/* Floating Quick Add Shopping Bag Icon */}
              <button
                type="button"
                id="quick-add-overlay-cap"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({
                    id: 'prod-2',
                    type: 'product',
                    name: 'Silk Sleep Cap',
                    price: 25.00,
                    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'
                  });
                  openCart();
                }}
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] rounded-full shadow-md flex items-center justify-center transition-all duration-300 opacity-95 sm:opacity-0 group-hover:opacity-100 transform sm:translate-y-2 group-hover:translate-y-0 focus:opacity-100 focus:translate-y-0 cursor-pointer border border-brand-warm-tan/20"
                aria-label="Add Silk Sleep Cap to Bag"
              >
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
            <div className="flex justify-between items-start pt-1">
              <h3 className="font-serif text-sm sm:text-base text-brand-dark group-hover:text-brand-rose transition-colors">Silk Sleep Cap</h3>
              <span className="font-mono text-xs text-brand-dark/70 font-medium">$25.00</span>
            </div>
          </motion.div>

          {/* Item 3 Detangling Comb */}
          <motion.div 
            variants={revealItemScale}
            onClick={() => {
              setShopFilter('Products');
              setActivePart('shop');
            }}
            className="group cursor-pointer space-y-3"
          >
            <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-warm-tan/15 relative">
              <img
                src="https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=400"
                alt="Sandalwood comb"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none"
              />
              {/* Floating Quick Add Shopping Bag Icon */}
              <button
                type="button"
                id="quick-add-overlay-comb"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({
                    id: 'prod-3',
                    type: 'product',
                    name: 'Detangling Collection',
                    price: 45.00,
                    image: 'https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=400'
                  });
                  openCart();
                }}
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] rounded-full shadow-md flex items-center justify-center transition-all duration-300 opacity-95 sm:opacity-0 group-hover:opacity-100 transform sm:translate-y-2 group-hover:translate-y-0 focus:opacity-100 focus:translate-y-0 cursor-pointer border border-brand-warm-tan/20"
                aria-label="Add Detangling Collection to Bag"
              >
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
            <div className="flex justify-between items-start pt-1">
              <h3 className="font-serif text-sm sm:text-base text-brand-dark group-hover:text-brand-rose transition-colors">Detangling Collection</h3>
              <span className="font-mono text-xs text-brand-dark/70 font-medium">$45.00</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ======================================= */}
      {/* 🚪 3. SIMPLE & REFINED HAIR STORY BIO   */}
      {/* ======================================= */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={revealContainer}
        className="bg-brand-beige/25 border-y border-brand-warm-tan/10 py-20"
      >
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <motion.span variants={revealItem} className="text-[10px] uppercase tracking-widest text-[#B11B41] font-semibold block">Our Approach</motion.span>
          <motion.h2 
            variants={revealItem}
            className="font-serif text-3xl font-medium text-brand-dark leading-tight"
          >
            {homepageContent.aboutHeadline}
          </motion.h2>
          <motion.div variants={revealItem} className="h-[1px] w-12 bg-brand-rose/40 mx-auto" />
          
          <motion.p 
            variants={revealItem}
            className="font-sans text-sm text-[#5C453C]/85 leading-relaxed text-center"
          >
            {homepageContent.aboutStory.split('.').slice(0, 4).join('.') + '.'}
          </motion.p>

          <motion.div variants={revealItem} className="pt-4">
            <button
              id="read-bio-story-btn"
              onClick={() => setActivePart('story')}
              className="px-8 py-3 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Read Our Full Story
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ======================================= */}
      {/* 🙋‍♀️ 3.5 MOTION-ANIMATED FAQ ACCORDION     */}
      {/* ======================================= */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={revealContainer}
      >
        <FAQ />
      </motion.section>

      {/* ======================================= */}
      {/* 📬 4. MINIMALIST NEWSLETTER FORM       */}
      {/* ======================================= */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={revealContainer}
        className="max-w-4xl mx-auto px-6"
      >
        <motion.div 
          variants={revealItemScale}
          className="border border-brand-warm-tan/35 bg-[#FAF6F0] p-8 sm:p-12 text-center space-y-6"
        >
          <div className="space-y-2">
            <motion.span variants={revealItem} className="text-[9px] uppercase tracking-[0.25em] text-[#B11B41] font-bold block">Exclusive Access</motion.span>
            <motion.h2 variants={revealItem} className="font-serif text-2xl sm:text-3xl font-normal text-brand-dark">
              Join &apos;The Growth List&apos;
            </motion.h2>
          </div>
          
          <motion.p variants={revealItem} className="font-sans text-xs text-[#6D5448]/90 max-w-lg mx-auto leading-relaxed">
            Register your email to obtain Cartiae Rae&apos;s moisturizing cheat-sheet, masterclass ebooks, pre-order updates, and special promotions.
          </motion.p>

          <motion.form 
            variants={revealItem}
            onSubmit={handleSubscribe} 
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 pt-2"
          >
            <input
              id="hero-newsletter-field"
              type="email"
              required
              placeholder="Your email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-brand-warm-tan/30 text-brand-dark placeholder-brand-dark/40 text-xs focus:outline-none focus:border-brand-dark transition-colors"
            />
            <button
              id="hero-newsletter-submit"
              type="submit"
              className="px-6 py-3 bg-brand-dark hover:bg-[#32170f] text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
            >
              Subscribe
            </button>
          </motion.form>

          {success && (
            <motion.p 
              variants={revealItem}
              className="text-emerald-700 text-xs font-mono py-2 font-medium"
            >
              ✓ Study Cheat-sheet transmitted to your inbox!
            </motion.p>
          )}
        </motion.div>
      </motion.section>

    </div>
  );
};

export const AppContent: React.FC = () => {
  const { toast } = useApp();
  const [activePart, setActivePart] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shopFilter, setShopFilter] = useState('All');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('product') || params.get('ebook')) {
      setActivePart('shop');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col relative">
      {/* Global beauty sticky Navigation header */}
      <Header 
        activePart={activePart} 
        setActivePart={setActivePart} 
        openCart={openCart} 
      />

      {/* Main core pages router layouts */}
      <main className="flex-1">
        {activePart === 'home' && (
          <Homepage 
            setActivePart={setActivePart} 
            setShopFilter={setShopFilter} 
            openCart={openCart} 
          />
        )}
        
        {activePart === 'shop' && (
          <MainStore 
            initialFilter={shopFilter}
            isCartOpen={isCartOpen}
            closeCart={closeCart}
            openCart={openCart}
          />
        )}

        {activePart === 'tutorials' && (
          <VideoGallery />
        )}

        {activePart === 'gallery' && (
          <PhotoGallery />
        )}

        {activePart === 'story' && (
          <AboutAndBlog />
        )}

        {activePart === 'contact' && (
          <ContactPage />
        )}

        {activePart === 'admin' && (
          <AdminPortal />
        )}
      </main>

      {/* Luxury Footer */}
      <Footer setActivePart={setActivePart} />

      {/* Global Luxury Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />

      {/* Global Subtle Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="global-app-toast"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-brand-dark text-[#FAF6F0] px-5 py-3.5 shadow-2xl border border-[#FAF6F0]/10 rounded-sm w-auto max-w-sm"
          >
            <span className="font-serif text-[10px] uppercase tracking-[0.2em] block font-bold text-brand-rose">
              {toast.type === 'info' ? 'ℹ Info' : '✔ Saved'}
            </span>
            <span className="h-3.5 w-[1px] bg-[#FAF6F0]/20 select-none" />
            <p className="font-sans text-[11px] font-medium leading-normal tracking-wide text-[#FAF6F0]/90 flex-1">
              {toast.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="back-to-top-btn"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] p-3 rounded-full shadow-md hover:shadow-lg transition-colors border border-brand-warm-tan/30 flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-offset-2 focus:ring-[#FAF7F2]"
            title="Back to Top"
            aria-label="Back to Top"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] transition-transform group-hover:-translate-y-0.5 duration-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppContent;
