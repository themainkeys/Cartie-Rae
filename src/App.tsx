import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MainStore } from './views/MainStore';

import { VideoGallery } from './views/VideoGallery';
import { PhotoGallery } from './views/PhotoGallery';
import { AboutAndBlog } from './views/AboutAndBlog';
import { ContactPage } from './views/ContactPage';
import { AdminPortal } from './views/AdminPortal';
import { ServicesPage } from './views/ServicesPage';
import { CheckoutSuccess } from './views/CheckoutSuccess';
import { CheckoutCancel } from './views/CheckoutCancel';
import { CartDrawer } from './components/CartDrawer';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ArrowUp, BookOpen, Compass, ShoppingBag, Video } from 'lucide-react';

const getRevealContainer = (prefersReducedMotion: boolean) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.08,
      delayChildren: prefersReducedMotion ? 0 : 0.05
    }
  }
});

const getRevealItem = (prefersReducedMotion: boolean) => ({
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.4,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
});

const getRevealItemScale = (prefersReducedMotion: boolean) => ({
  hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.97, y: prefersReducedMotion ? 0 : 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
});

export const AnimatedCounter: React.FC<{ value: number; suffix?: string; prefix?: string; duration?: number }> = ({ value, suffix = '', prefix = '', duration = 1.2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 16);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const Homepage: React.FC<{ 
  setActivePart: (part: string) => void;
  setShopFilter: (filter: string) => void;
}> = ({ setActivePart, setShopFilter }) => {
  const { homepageContent, prefersReducedMotion } = useApp();

  return (
    <div className="w-full">

      {/* ── Hero Portrait: Full Width, Dominant ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }}
        className="relative w-full aspect-[4/5] sm:aspect-[3/2] lg:aspect-[16/9] overflow-hidden bg-brand-beige"
      >
        <img
          src={homepageContent.heroImageUrl || '/hero-portrait.jpg'}
          alt="Cartiae Rae"
          className="w-full h-full object-cover object-top select-none"
        />
        {/* Gradient overlay — bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/65 via-brand-dark/10 to-transparent" />

        {/* Name + tagline overlaid at bottom-left */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: prefersReducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-8 left-6 sm:left-10 lg:left-16 space-y-2 select-none"
        >
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none font-normal">
            Cartiae Rae
          </h1>
          {homepageContent.heroHeadline && (
            <p className="font-sans text-xs sm:text-sm text-white/75 max-w-xs leading-relaxed">
              {homepageContent.heroHeadline}
            </p>
          )}
          <div className="h-[1.5px] w-14 bg-brand-rose" />
        </motion.div>
      </motion.section>

      {/* ── Intro + CTA Cards ── */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 pt-10 pb-16 space-y-8">

        {/* Short personal intro */}
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.1 }}
          className="font-sans text-sm text-zinc-500 leading-relaxed max-w-xl"
        >
          {homepageContent.heroSubheadline || 'Private hair consultancy and digital guides for natural 4C coily hair — moisture, growth, and personal brand.'}
        </motion.p>

        {/* 4 Conversion Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={getRevealContainer(prefersReducedMotion)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Card 1: eBook */}
          <motion.div
            variants={getRevealItemScale(prefersReducedMotion)}
            onClick={() => { setShopFilter('eBooks'); setActivePart('shop'); }}
            className="group cursor-pointer bg-brand-cream hover:bg-brand-beige border border-brand-warm-tan/30 p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md text-left flex flex-col justify-between min-h-[140px]"
          >
            <div className="space-y-1.5">
              <div className="w-9 h-9 bg-brand-pink-light rounded-xl flex items-center justify-center text-brand-rose select-none">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-base font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
                Shop the eBook
              </h3>
              <p className="font-sans text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                Instant digital guides for 4C moisture retention and length growth.
              </p>
            </div>
            <span className="font-sans text-[9px] uppercase tracking-widest text-brand-rose font-bold mt-3 block">
              Explore eBooks &rarr;
            </span>
          </motion.div>

          {/* Card 2: Services */}
          <motion.div
            variants={getRevealItemScale(prefersReducedMotion)}
            onClick={() => setActivePart('services')}
            className="group cursor-pointer bg-brand-cream hover:bg-brand-beige border border-brand-warm-tan/30 p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md text-left flex flex-col justify-between min-h-[140px]"
          >
            <div className="space-y-1.5">
              <div className="w-9 h-9 bg-brand-pink-light rounded-xl flex items-center justify-center text-brand-rose select-none">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-base font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
                Book a Service
              </h3>
              <p className="font-sans text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                Private 1-on-1 virtual sessions — hair assessment or social media growth coaching.
              </p>
            </div>
            <span className="font-sans text-[9px] uppercase tracking-widest text-brand-rose font-bold mt-3 block">
              Book Session ($100) &rarr;
            </span>
          </motion.div>

          {/* Card 3: Visuals */}
          <motion.div
            variants={getRevealItemScale(prefersReducedMotion)}
            onClick={() => setActivePart('tutorials')}
            className="group cursor-pointer bg-brand-cream hover:bg-brand-beige border border-brand-warm-tan/30 p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md text-left flex flex-col justify-between min-h-[140px]"
          >
            <div className="space-y-1.5">
              <div className="w-9 h-9 bg-brand-pink-light rounded-xl flex items-center justify-center text-brand-rose select-none">
                <Video className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-base font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
                Visuals
              </h3>
              <p className="font-sans text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                Step-by-step regimens, hairstyle lookbooks, and length retention walkthroughs.
              </p>
            </div>
            <span className="font-sans text-[9px] uppercase tracking-widest text-brand-rose font-bold mt-3 block">
              Step Into the Studio &rarr;
            </span>
          </motion.div>

          {/* Card 4: Shop Essentials */}
          <motion.div
            variants={getRevealItemScale(prefersReducedMotion)}
            onClick={() => { setShopFilter('All'); setActivePart('shop'); }}
            className="group cursor-pointer bg-brand-cream hover:bg-brand-beige border border-brand-warm-tan/30 p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md text-left flex flex-col justify-between min-h-[140px]"
          >
            <div className="space-y-1.5">
              <div className="w-9 h-9 bg-brand-pink-light rounded-xl flex items-center justify-center text-brand-rose select-none">
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-base font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
                Shop Essentials
              </h3>
              <p className="font-sans text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                Curated essentials and tools designed for high-performance moisture retention.
              </p>
            </div>
            <span className="font-sans text-[9px] uppercase tracking-widest text-brand-rose font-bold mt-3 block">
              Browse Shop &rarr;
            </span>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
};

export const AppContent: React.FC = () => {
  const { toast, prefersReducedMotion } = useApp();
  const [activePart, setActivePart] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shopFilter, setShopFilter] = useState('All');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    if (path === '/checkout/success') {
      setActivePart('checkout-success');
    } else if (path === '/checkout/cancel') {
      setActivePart('checkout-cancel');
    } else if (path === '/admin' || path === '/admin/') {
      // Secret admin route — not linked anywhere on the public site
      setActivePart('admin');
      // Clean up the URL so it shows / without reloading
      window.history.replaceState(null, '', '/');
    } else if (params.get('product') || params.get('ebook')) {
      setActivePart('shop');
    } else if (params.get('video')) {
      setActivePart('tutorials');
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
    <div className="min-h-screen bg-brand-cream text-brand-dark flex flex-col relative">
      {/* Global beauty sticky Navigation header */}
      <Header 
        activePart={activePart} 
        setActivePart={setActivePart} 
        openCart={openCart} 
      />

      {/* Main core pages router layouts with Framer Motion Page Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePart}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {activePart === 'home' && (
              <Homepage 
                setActivePart={setActivePart} 
                setShopFilter={setShopFilter} 
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

            {activePart === 'services' && (
              <ServicesPage openCart={openCart} />
            )}

            {activePart === 'tutorials' && (
              <VideoGallery />
            )}

            {activePart === 'gallery' && (
              <PhotoGallery />
            )}

            {activePart === 'about' && (
              <AboutAndBlog />
            )}

            {activePart === 'contact' && (
              <ContactPage />
            )}

            {activePart === 'admin' && (
              <AdminPortal />
            )}

            {activePart === 'checkout-success' && (
              <CheckoutSuccess openCart={openCart} setActivePart={setActivePart} />
            )}

            {activePart === 'checkout-cancel' && (
              <CheckoutCancel openCart={openCart} setActivePart={setActivePart} />
            )}
          </motion.div>
        </AnimatePresence>
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
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-brand-dark text-white px-5 py-3.5 shadow-2xl border border-white/10 rounded-xl w-auto max-w-sm"
          >
            <span className="font-serif text-[10px] uppercase tracking-[0.2em] block font-bold text-brand-rose">
              {toast.type === 'info' ? 'ℹ Info' : toast.type === 'error' ? '⚠ Error' : '✔ Saved'}
            </span>
            <span className="h-3.5 w-[1px] bg-white/20 select-none" />
            <p className="font-sans text-[11px] font-medium leading-normal tracking-wide text-white/90 flex-1">
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
            initial={{ opacity: 0, scale: 0.8, y: prefersReducedMotion ? 0 : 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: prefersReducedMotion ? 0 : 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 bg-brand-dark hover:bg-brand-rose text-white p-3 rounded-full shadow-md hover:shadow-lg transition-colors border border-brand-warm-tan/30 flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-rose focus:ring-offset-2"
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
