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
import { CartDrawer } from './components/CartDrawer';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { 
  ArrowRight, ArrowUp, Sparkles, BookOpen, Droplet, Star, ShieldCheck, 
  Clock, Heart, Compass, CheckCircle2, Check, Send, ShoppingBag
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
  const { homepageContent, signupNewsletter, addToCart, prefersReducedMotion } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [success, setSuccess] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const testimonials = [
    {
      quote: homepageContent.promoQuote,
      author: homepageContent.promoAuthor
    },
    {
      quote: "Botanical Growth Oil literally changed my edges in 3 weeks. The peppermint scent is so refreshing!",
      author: "Nia J., Edges Reborn"
    },
    {
      quote: "Wash Day Mastery book helped me cut down my shampoo session from 6 hours to 90 minutes. A true blueprint!",
      author: "Brianna S., Wash Day Survivor"
    },
    {
      quote: "Mulberry silk cap doesn't slide off my head at night! My hair stays perfectly moisturized.",
      author: "Tamera W., Satin Convert"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

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
    <div className="space-y-20 pb-16 overflow-hidden">
      
      {/* ======================================= */}
      {/* 🌸 1. EDITORIAL MINIMALIST HERO LAYOUT */}
      {/* ======================================= */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={getRevealContainer(prefersReducedMotion)}
        className="relative bg-brand-cream pt-8 pb-16 lg:pt-12 lg:pb-20 border-b border-brand-warm-tan/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column texts */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-3">
                <motion.span 
                  variants={getRevealItem(prefersReducedMotion)}
                  className="font-sans text-[10px] uppercase tracking-[0.3em] text-brand-rose font-semibold block"
                >
                  Natural 4C Hair Science
                </motion.span>
                <motion.h1 
                  variants={getRevealItem(prefersReducedMotion)}
                  className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-dark tracking-tight leading-[1.1] font-normal"
                >
                  {homepageContent.heroHeadline}
                </motion.h1>
              </div>

              <motion.p 
                variants={getRevealItem(prefersReducedMotion)}
                className="font-sans text-xs sm:text-sm text-[#5C453C]/80 leading-relaxed max-w-xl"
              >
                {homepageContent.heroSubheadline}
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                variants={getRevealItem(prefersReducedMotion)}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <motion.button
                  id="hero-buy-blueprint"
                  onClick={handleQuickBuyBlueprint}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.99 }}
                  className="bg-brand-dark hover:bg-[#3d1a10] text-[#FAF6F0] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-300 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md rounded-xl"
                >
                  <span>eBook Blueprint — $24.99</span>
                </motion.button>

                <motion.button
                  id="hero-view-tutorials"
                  onClick={() => setActivePart('tutorials')}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.99 }}
                  className="bg-transparent border border-brand-dark/20 hover:border-brand-dark hover:bg-brand-dark/5 text-brand-dark px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center cursor-pointer rounded-xl"
                >
                  <span>Watch Free Tutorials</span>
                </motion.button>
              </motion.div>

              {/* Trust triggers ribbon */}
              <motion.div 
                variants={getRevealItem(prefersReducedMotion)}
                className="pt-6 border-t border-brand-warm-tan/20 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-brand-dark/60 font-sans tracking-wide"
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
              variants={getRevealItemScale(prefersReducedMotion)}
              className="lg:col-span-5 relative font-sans"
            >
              <motion.div 
                animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="aspect-[4/5] overflow-hidden bg-brand-cream border border-brand-warm-tan/25 shadow-sm rounded-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80&w=800"
                  alt="Cartiae Rae portrait"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none"
                />
              </motion.div>
              
              {/* Testimonials Carousel inside Hero right-hand side */}
              <div className="mt-4 text-center sm:text-left space-y-1 min-h-[72px] relative overflow-hidden flex flex-col justify-center border-l-2 border-brand-rose/25 pl-4 py-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={testimonialIndex}
                    initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <p className="font-serif italic text-xs text-brand-dark/80 leading-relaxed">
                      &ldquo;{testimonials[testimonialIndex].quote}&rdquo;
                    </p>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-[#B11B41] font-semibold block mt-1">
                      — {testimonials[testimonialIndex].author}
                    </p>
                  </motion.div>
                </AnimatePresence>
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
        variants={getRevealContainer(prefersReducedMotion)}
        className="max-w-7xl mx-auto px-6 lg:px-8"
      >
        <motion.div 
          variants={getRevealItem(prefersReducedMotion)}
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
          variants={getRevealContainer(prefersReducedMotion)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8"
        >
          {/* Item 1 Oil */}
          <motion.div 
            variants={getRevealItemScale(prefersReducedMotion)}
            onClick={() => {
              setShopFilter('Products');
              setActivePart('shop');
            }}
            className="group cursor-pointer space-y-3 pl-0"
          >
            <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-warm-tan/15 relative rounded-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
              <img
                src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400"
                alt="Oil dropper"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out select-none"
              />
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
            variants={getRevealItemScale(prefersReducedMotion)}
            onClick={() => {
              setShopFilter('Products');
              setActivePart('shop');
            }}
            className="group cursor-pointer space-y-3"
          >
            <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-warm-tan/15 relative rounded-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
              <img
                src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400"
                alt="Sleep Bonnet"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out select-none"
              />
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
            variants={getRevealItemScale(prefersReducedMotion)}
            onClick={() => {
              setShopFilter('Products');
              setActivePart('shop');
            }}
            className="group cursor-pointer space-y-3"
          >
            <div className="aspect-[4/5] overflow-hidden bg-brand-beige border border-brand-warm-tan/15 relative rounded-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
              <img
                src="https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=400"
                alt="Sandalwood comb"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out select-none"
              />
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
      {/* 📊 2.5 STATS SECTION */}
      {/* ======================================= */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={getRevealContainer(prefersReducedMotion)}
        className="bg-brand-beige/15 py-14 border-y border-brand-warm-tan/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <motion.div variants={getRevealItem(prefersReducedMotion)} className="space-y-1">
            <span className="font-serif text-3xl sm:text-4xl text-brand-dark block font-medium">
              {prefersReducedMotion ? "10,000+" : <AnimatedCounter value={10000} suffix="+" />}
            </span>
            <span className="font-sans text-[9px] uppercase tracking-widest text-[#B11B41] font-bold block">Edges Restored</span>
          </motion.div>
          <motion.div variants={getRevealItem(prefersReducedMotion)} className="space-y-1">
            <span className="font-serif text-3xl sm:text-4xl text-brand-dark block font-medium">
              {prefersReducedMotion ? "90 Min" : <AnimatedCounter value={90} suffix=" Min" />}
            </span>
            <span className="font-sans text-[9px] uppercase tracking-widest text-[#B11B41] font-bold block">Cleanse Routine</span>
          </motion.div>
          <motion.div variants={getRevealItem(prefersReducedMotion)} className="space-y-1">
            <span className="font-serif text-3xl sm:text-4xl text-brand-dark block font-medium">
              {prefersReducedMotion ? "15,000+" : <AnimatedCounter value={15000} suffix="+" />}
            </span>
            <span className="font-sans text-[9px] uppercase tracking-widest text-[#B11B41] font-bold block">Coily Clients</span>
          </motion.div>
          <motion.div variants={getRevealItem(prefersReducedMotion)} className="space-y-1">
            <span className="font-serif text-3xl sm:text-4xl text-brand-dark block font-medium">
              {prefersReducedMotion ? "99%" : <AnimatedCounter value={99} suffix="%" />}
            </span>
            <span className="font-sans text-[9px] uppercase tracking-widest text-[#B11B41] font-bold block">Organic Formulas</span>
          </motion.div>
        </div>
      </motion.section>

      {/* ======================================= */}
      {/* 🚪 3. SIMPLE & REFINED HAIR STORY BIO   */}
      {/* ======================================= */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={getRevealContainer(prefersReducedMotion)}
        className="bg-brand-beige/25 py-20"
      >
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <motion.span variants={getRevealItem(prefersReducedMotion)} className="text-[10px] uppercase tracking-widest text-[#B11B41] font-semibold block">Our Approach</motion.span>
          <motion.h2 
            variants={getRevealItem(prefersReducedMotion)}
            className="font-serif text-3xl font-medium text-brand-dark leading-tight"
          >
            {homepageContent.aboutHeadline}
          </motion.h2>
          <motion.div variants={getRevealItem(prefersReducedMotion)} className="h-[1px] w-12 bg-brand-rose/40 mx-auto" />
          
          <motion.p 
            variants={getRevealItem(prefersReducedMotion)}
            className="font-sans text-sm text-[#5C453C]/85 leading-relaxed text-center"
          >
            {homepageContent.aboutStory.split('.').slice(0, 4).join('.') + '.'}
          </motion.p>

          <motion.div variants={getRevealItem(prefersReducedMotion)} className="pt-4">
            <motion.button
              id="read-bio-story-btn"
              onClick={() => setActivePart('story')}
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
              className="px-8 py-3 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer rounded-xl"
            >
              Read Our Full Story
            </motion.button>
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
        variants={getRevealContainer(prefersReducedMotion)}
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
        variants={getRevealContainer(prefersReducedMotion)}
        className="max-w-4xl mx-auto px-6"
      >
        <motion.div 
          variants={getRevealItemScale(prefersReducedMotion)}
          className="border border-brand-warm-tan/35 bg-[#FAF6F0] p-8 sm:p-12 text-center space-y-6 rounded-3xl"
        >
          <div className="space-y-2">
            <motion.span variants={getRevealItem(prefersReducedMotion)} className="text-[9px] uppercase tracking-[0.25em] text-[#B11B41] font-bold block">Exclusive Access</motion.span>
            <motion.h2 variants={getRevealItem(prefersReducedMotion)} className="font-serif text-2xl sm:text-3xl font-normal text-brand-dark">
              Join &apos;The Growth List&apos;
            </motion.h2>
          </div>
          
          <motion.p variants={getRevealItem(prefersReducedMotion)} className="font-sans text-xs text-[#6D5448]/90 max-w-lg mx-auto leading-relaxed">
            Register your email to obtain Cartiae Rae&apos;s moisturizing cheat-sheet, masterclass ebooks, pre-order updates, and special promotions.
          </motion.p>

          <motion.form 
            variants={getRevealItem(prefersReducedMotion)}
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
              className="w-full px-4 py-3 bg-white border border-brand-warm-tan/30 text-brand-dark placeholder-brand-dark/40 text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose transition-all rounded-xl"
            />
            <motion.button
              id="hero-newsletter-submit"
              type="submit"
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
              className="px-6 py-3 bg-brand-dark hover:bg-brand-rose text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 cursor-pointer rounded-xl"
            >
              Subscribe
            </motion.button>
          </motion.form>

          {success && (
            <motion.p 
              variants={getRevealItem(prefersReducedMotion)}
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
