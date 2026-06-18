import React, { useState } from 'react';
import { EBook } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Check, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface EBookCardProps {
  ebook: EBook;
  onViewDetails: (ebook: EBook) => void;
}

export const EBookCard: React.FC<EBookCardProps> = ({ ebook, onViewDetails }) => {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist, prefersReducedMotion } = useApp();
  const [added, setAdded] = useState(false);

  const isSaved = wishlist.some(item => item.id === ebook.id);

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
        y: prefersReducedMotion ? 0 : -4,
        boxShadow: prefersReducedMotion ? "none" : "0 12px 32px -8px rgba(0,0,0,0.10)"
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col bg-brand-cream border border-brand-warm-tan/30 cursor-pointer rounded-2xl overflow-hidden"
    >
      {/* Book Cover Image */}
      <div className="relative aspect-[4/5] w-full bg-brand-beige overflow-hidden">
        <img
          src={ebook.image}
          alt={ebook.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/15 to-transparent pointer-events-none" />

        {/* Instant Download Badge */}
        <span className="absolute top-3 left-3 bg-emerald-700 text-white px-2 py-0.5 text-[7px] font-sans font-extrabold uppercase tracking-wider rounded shadow-xs z-10">
          Instant Download
        </span>

        {/* Best Seller */}
        {ebook.isFeatured && (
          <span className="absolute top-3 right-10 bg-brand-rose text-white px-2 py-0.5 text-[7.5px] font-bold uppercase tracking-wider rounded z-10">
            Best Seller
          </span>
        )}

        {/* Wishlist Heart */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (isSaved) {
              removeFromWishlist(ebook.id);
            } else {
              addToWishlist({ id: ebook.id, type: 'ebook', name: ebook.name, price: ebook.price, image: ebook.image });
            }
          }}
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-sm hover:bg-brand-rose hover:text-white text-brand-dark transition-colors focus:outline-none z-10 cursor-pointer"
          aria-label="Save to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand-rose text-brand-rose' : 'text-zinc-500'}`} />
        </motion.button>

        {/* Quick Preview on hover */}
        <div className="absolute inset-0 bg-brand-dark/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onViewDetails(ebook); }}
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            className="px-3 py-1.5 bg-white hover:bg-brand-rose hover:text-white text-brand-dark text-[9px] uppercase font-semibold tracking-widest shadow-md transition-all duration-300 flex items-center gap-1.5 cursor-pointer rounded-lg"
          >
            <Eye className="w-3 h-3" />
            Preview
          </motion.button>
        </div>
      </div>

      {/* Card Content: Title + Price + CTA */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <span className="font-sans text-[8px] uppercase tracking-widest text-brand-rose font-bold block mb-0.5">
            Digital Guide
          </span>
          <h3 className="font-serif text-base text-brand-dark leading-snug group-hover:text-brand-rose transition-colors line-clamp-1">
            {ebook.name}
          </h3>
          <p className="font-mono text-sm font-semibold text-brand-dark mt-0.5">
            ${ebook.price.toFixed(2)}
          </p>
        </div>

        <motion.button
          id={`add-ebook-cart-${ebook.id}`}
          onClick={handleAdd}
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
          className={`w-full py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all duration-300 focus:outline-none cursor-pointer flex items-center justify-center gap-1.5 ${
            added
              ? 'bg-brand-rose text-white'
              : 'bg-brand-dark hover:bg-brand-rose text-white'
          }`}
        >
          {added ? <><Check className="w-3.5 h-3.5" /> Added</> : 'Add to Bag'}
        </motion.button>
      </div>
    </motion.div>
  );
};
