import React, { useState, useEffect, useRef } from 'react';
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
import { ServicesPage } from './views/ServicesPage';
import { CartDrawer } from './components/CartDrawer';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { 
  ArrowRight, ArrowUp, Sparkles, BookOpen, Droplet, Star, ShieldCheck, 
  Clock, Heart, Compass, CheckCircle2, Check, Send, ShoppingBag, Video
} from 'lucide-react';

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
  openCart: () => void;
}> = ({ setActivePart, setShopFilter, openCart }) => {
  const { homepageContent, prefersReducedMotion } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
      
      {/* Editorial Split Hero & Intro Section */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={getRevealContainer(prefersReducedMotion)}
        className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center"
      >
        {/* Left Column: Vertical Portrait of Cartiae Rae */}
        <motion.div 
          variants={getRevealItemScale(prefersReducedMotion)}
          className="md:col-span-5 relative"
        >
          <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-warm-tan/20 rounded-3xl shadow-md">
            <img
              src="/hero-portrait.jpg"
              alt="Cartiae Rae"
              className="w-full h-full object-cover select-none"
            />
          </div>
        </motion.div>

        {/* Right Column: Title & Personal Sincere Introduction */}
        <div className="md:col-span-7 text-left space-y-6">
          <div className="space-y-3">
            <motion.h1 
              variants={getRevealItem(prefersReducedMotion)}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-dark tracking-tight leading-none font-normal"
            >
              Cartiae Rae
            </motion.h1>
            <motion.div 
              variants={getRevealItem(prefersReducedMotion)}
              className="h-[1px] w-16 bg-brand-rose/60" 
            />
          </div>

          <motion.p 
            variants={getRevealItem(prefersReducedMotion)}
            className="font-sans text-sm sm:text-base text-[#5C453C]/95 leading-relaxed"
          >
            {homepageContent.heroSubheadline || "Welcome to Cartiae Rae Hair Studio. Private hair consultancy and digital curricula designed to help you calibrate your natural coily hair routine, master length retention, and elevate your personal brand."}
          </motion.p>
        </div>
      </motion.section>

      {/* Prominent Conversion Navigation Cards */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={getRevealContainer(prefersReducedMotion)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        {/* Card 1: eBook */}
        <motion.div 
          variants={getRevealItemScale(prefersReducedMotion)}
          onClick={() => {
            setShopFilter('eBooks');
            setActivePart('shop');
          }}
          className="group cursor-pointer bg-brand-cream hover:bg-brand-beige/40 border border-brand-warm-tan/25 p-6 rounded-3xl transition-all duration-350 shadow-sm hover:shadow-md text-left flex flex-col justify-between h-48"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-brand-pink-light rounded-2xl flex items-center justify-center text-brand-rose select-none">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
              Shop the eBook
            </h3>
            <p className="font-sans text-xs text-[#6C5347]/85 line-clamp-2 leading-relaxed">
              Get immediate access to the step-by-step master guides detailing how to grow, hydrate, and retain fragile 4C natural coils.
            </p>
          </div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#B11B41] font-bold mt-4 block">
            Explore eBooks &rarr;
          </span>
        </motion.div>

        {/* Card 2: Services */}
        <motion.div 
          variants={getRevealItemScale(prefersReducedMotion)}
          onClick={() => setActivePart('services')}
          className="group cursor-pointer bg-brand-cream hover:bg-brand-beige/40 border border-brand-warm-tan/25 p-6 rounded-3xl transition-all duration-350 shadow-sm hover:shadow-md text-left flex flex-col justify-between h-48"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-brand-pink-light rounded-2xl flex items-center justify-center text-brand-rose select-none">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
              Virtual Coaching &amp; Services
            </h3>
            <p className="font-sans text-xs text-[#6C5347]/85 line-clamp-2 leading-relaxed">
              Book private 1-on-1 virtual strategy calls ($100) with Cartiae Rae for personalized hair assessments or brand growth coaching.
            </p>
          </div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#B11B41] font-bold mt-4 block">
            Book Session ($100) &rarr;
          </span>
        </motion.div>

        {/* Card 3: Visuals */}
        <motion.div 
          variants={getRevealItemScale(prefersReducedMotion)}
          onClick={() => setActivePart('tutorials')}
          className="group cursor-pointer bg-brand-cream hover:bg-brand-beige/40 border border-brand-warm-tan/25 p-6 rounded-3xl transition-all duration-350 shadow-sm hover:shadow-md text-left flex flex-col justify-between h-48"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-brand-pink-light rounded-2xl flex items-center justify-center text-brand-rose select-none">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
              Watch Visuals
            </h3>
            <p className="font-sans text-xs text-[#6C5347]/85 line-clamp-2 leading-relaxed">
              Step into the studio to browse high-definition regimens, hairstyle lookbooks, and length retention walk-throughs.
            </p>
          </div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#B11B41] font-bold mt-4 block">
            Step Into the Studio &rarr;
          </span>
        </motion.div>

        {/* Card 4: Shop */}
        <motion.div 
          variants={getRevealItemScale(prefersReducedMotion)}
          onClick={() => {
            setShopFilter('All');
            setActivePart('shop');
          }}
          className="group cursor-pointer bg-[#FAF6F0] hover:bg-brand-cream border border-brand-warm-tan/25 p-6 rounded-3xl transition-all duration-350 shadow-sm hover:shadow-md text-left flex flex-col justify-between h-48"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 bg-brand-pink-light rounded-2xl flex items-center justify-center text-brand-rose select-none">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-normal text-brand-dark group-hover:text-brand-rose transition-colors">
              Shop the Studio
            </h3>
            <p className="font-sans text-xs text-[#6C5347]/85 line-clamp-2 leading-relaxed">
              Explore curated essentials, guides, and tools designed for high-performance moisture retention.
            </p>
          </div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#B11B41] font-bold mt-4 block">
            Browse Shop &rarr;
          </span>
        </motion.div>
      </motion.section>

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
            className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-brand-dark text-[#FAF6F0] px-5 py-3.5 shadow-2xl border border-[#FAF6F0]/10 rounded-xl w-auto max-w-sm"
          >
            <span className="font-serif text-[10px] uppercase tracking-[0.2em] block font-bold text-brand-rose">
              {toast.type === 'info' ? 'ℹ Info' : toast.type === 'error' ? '⚠ Error' : '✔ Saved'}
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
            initial={{ opacity: 0, scale: 0.8, y: prefersReducedMotion ? 0 : 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: prefersReducedMotion ? 0 : 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
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
