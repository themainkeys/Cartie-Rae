import React, { useState } from 'react';
import { EBook } from '../types';
import { useApp } from '../context/AppContext';
import { BookOpen, Star, ShoppingBag, Check, Heart, Share2, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface EBookCardProps {
  ebook: EBook;
  onViewDetails: (ebook: EBook) => void;
}

export const EBookCard: React.FC<EBookCardProps> = ({ ebook, onViewDetails }) => {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist, prefersReducedMotion } = useApp();
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  const isSaved = wishlist.some(item => item.id === ebook.id);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?ebook=${encodeURIComponent(ebook.id)}`;
    const shareData = {
      title: ebook.name,
      text: `Discover ${ebook.name} at Cartiae Rae Hair Studio. Check it out here:`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const avgRating = ebook.reviews.length > 0
    ? Math.round((ebook.reviews.reduce((acc, r) => acc + r.score, 0) / ebook.reviews.length) * 10) / 10
    : 4.9;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: ebook.id,
      type: 'ebook',
      name: ebook.name,
      price: ebook.price,
      image: ebook.image
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      onClick={() => onViewDetails(ebook)}
      whileHover={{ 
        y: prefersReducedMotion ? 0 : -6,
        boxShadow: prefersReducedMotion ? "none" : "0 12px 30px -10px rgba(74, 43, 32, 0.08)"
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-[#FAF6F0] p-6 border border-brand-warm-tan/20 cursor-pointer flex flex-col md:flex-row gap-8 rounded-2xl style-perspective-container"
      style={{ perspective: 1000 }}
    >
      {/* Book Cover Cover Stage with 3D Tilt */}
      <motion.div 
        whileHover={prefersReducedMotion ? {} : { 
          rotateY: -12,
          rotateX: 4,
          z: 10,
          boxShadow: "10px 10px 20px rgba(0,0,0,0.15)"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-full md:w-36 shrink-0 aspect-[3/4] overflow-hidden bg-brand-beige border border-brand-warm-tan/25 relative rounded-xl shadow-md transform-style-3d origin-left"
      >
        <img
          src={ebook.image}
          alt={ebook.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/10 to-transparent pointer-events-none" />
        
        {/* Quick View Hover Backdrop Overlay */}
        <div className="absolute inset-0 bg-brand-dark/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(ebook);
            }}
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-brand-rose hover:text-white text-brand-dark text-[9px] uppercase font-semibold tracking-widest shadow-md transition-all duration-300 flex items-center gap-1 cursor-pointer rounded-lg"
          >
            <Eye className="w-3 h-3" />
            Preview
          </motion.button>
        </div>
        
        {/* Favorite Button Overlay */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (isSaved) {
              removeFromWishlist(ebook.id);
            } else {
              addToWishlist({
                id: ebook.id,
                type: 'ebook',
                name: ebook.name,
                price: ebook.price,
                image: ebook.image
              });
            }
          }}
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.08 }}
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.92 }}
          className="absolute top-3 right-3 p-2 rounded-full bg-[#FAF6F0]/90 shadow-sm hover:bg-brand-rose hover:text-white text-brand-dark transition-colors focus:outline-none z-10 cursor-pointer"
          aria-label="Wishlist ebook"
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand-rose text-brand-rose' : 'text-brand-dark/70'}`} />
        </motion.button>

        {/* PDF Badge */}
        <span className="absolute bottom-3 left-3 bg-[#FAF6F0]/90 text-brand-dark px-2 py-0.5 text-[9px] font-mono border border-brand-warm-tan/30 uppercase tracking-widest font-semibold rounded">
          PDF Guide
        </span>
      </motion.div>

      {/* Detailed Technical Metadata and Bullet Benefits */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Tagline */}
          <span className="font-sans text-[9px] uppercase tracking-widest text-[#B11B41] font-bold block">
            Digital Curriculum
          </span>

          {/* Title */}
          <h3 className="font-serif text-xl text-brand-dark leading-tight group-hover:text-brand-rose transition-colors">
            {ebook.name}
          </h3>

          {/* Info badges */}
          <div className="flex gap-3 text-[10px] text-[#6D5448] font-mono">
            <span>{ebook.pages} Pages</span>
            <span>•</span>
            <span>PDF {ebook.fileSize}</span>
          </div>

          {/* Brief description */}
          <p className="font-sans text-xs text-brand-dark/70 leading-relaxed">
            {ebook.description}
          </p>

          {/* Core benefits list */}
          <div className="pt-2">
            <ul className="space-y-1">
              {ebook.benefits.slice(0, 3).map((benefit, bIdx) => (
                <li key={bIdx} className="text-[#6D5448] text-xs font-sans flex items-start gap-1.5">
                  <span className="text-brand-rose leading-tight text-[11px] font-bold">✓</span>
                  <span className="line-clamp-1">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-4 border-t border-brand-warm-tan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-brand-dark/40 font-semibold leading-none">Price</span>
            <span className="font-sans text-base font-bold text-brand-chocolate mt-1">
              ${ebook.price.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <motion.button
              id={`add-ebook-cart-${ebook.id}`}
              onClick={handleAdd}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.97 }}
              className={`flex-1 sm:flex-initial px-6 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-colors duration-300 focus:outline-none rounded-xl cursor-pointer ${
                added
                  ? 'bg-brand-rose text-white'
                  : 'bg-brand-dark hover:bg-brand-rose text-white'
              }`}
            >
              {added ? 'Added to Bag ✓' : 'Add to Bag'}
            </motion.button>
            <motion.button
              id={`share-ebook-${ebook.id}`}
              onClick={handleShare}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
              className="px-3 py-2.5 text-[10px] bg-[#FAF6F0] border border-brand-warm-tan/30 hover:bg-brand-rose hover:text-[#FAF6F0] text-brand-dark transition-colors duration-300 focus:outline-none flex items-center justify-center cursor-pointer rounded-xl"
              title="Share EBook"
              aria-label="Share eBook"
            >
              {shared ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
