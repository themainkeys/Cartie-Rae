import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Star, ShoppingBag, Heart, Check, Share2, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist, prefersReducedMotion } = useApp();
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  const isSaved = wishlist.some(item => item.id === product.id);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
    const shareData = {
      title: product.name,
      text: `Discover ${product.name} at Cartiae Rae Hair Studio. Check it out here:`,
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

  const avgRating = product.reviews.length > 0
    ? Math.round((product.reviews.reduce((acc, r) => acc + r.score, 0) / product.reviews.length) * 10) / 10
    : 4.8;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      type: 'product',
      name: product.name,
      price: product.price,
      image: product.image
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      onClick={() => onViewDetails(product)}
      whileHover={{ 
        y: prefersReducedMotion ? 0 : -6,
        boxShadow: prefersReducedMotion ? "none" : "0 12px 30px -10px rgba(74, 43, 32, 0.08)"
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col bg-[#FAF6F0] overflow-hidden border border-brand-warm-tan/20 cursor-pointer h-full rounded-2xl"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] w-full bg-brand-beige overflow-hidden">
        <motion.img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-full object-cover"
        />

        {/* Best Seller Badge */}
        {product.isFeatured && (
          <span className="absolute top-4 left-4 bg-brand-rose text-white px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-widest rounded shadow-xs z-10">
            Best Seller
          </span>
        )}

        {/* Quick View Hover Backdrop Overlay */}
        <div className="absolute inset-0 bg-brand-dark/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            className="px-4 py-2 bg-[#FAF6F0] hover:bg-brand-rose hover:text-white text-brand-dark text-[10px] uppercase font-semibold tracking-widest shadow-md transition-all duration-300 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 cursor-pointer rounded-xl"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </motion.button>
        </div>

        {/* Favorite Button Overlay (Subtle) */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (isSaved) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist({
                id: product.id,
                type: 'product',
                name: product.name,
                price: product.price,
                image: product.image
              });
            }
          }}
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.08 }}
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.92 }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow-sm hover:bg-brand-rose hover:text-white text-brand-dark transition-colors focus:outline-none z-10 cursor-pointer"
          aria-label="Wishlist product"
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand-rose text-brand-rose' : 'text-brand-dark/70'}`} />
        </motion.button>

        {/* Out of Stock flag overlay (Subtle dark ribbon) */}
        {product.stockStatus === 'Out of Stock' && (
          <div className="absolute inset-x-0 bottom-0 bg-brand-dark/80 text-[#FAF6F0] py-2 text-center text-[10px] uppercase tracking-widest">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content Details Block */}
      <div className="p-4 flex flex-col flex-1 space-y-2 select-none">
        <div className="flex justify-between items-baseline gap-2">
          <span className="font-sans text-[9px] uppercase tracking-widest text-brand-rose font-semibold block">
            {product.category}
          </span>
          {product.stockStatus === 'Low Stock' && (
            <span className="font-sans text-[8px] uppercase font-bold text-amber-750">
              Low Stock
            </span>
          )}
        </div>

        {/* Title & Price Row */}
        <div>
          <h3 className="font-serif text-base text-brand-dark line-clamp-1 group-hover:text-brand-rose transition-colors">
            {product.name}
          </h3>
          <p className="font-mono text-xs text-brand-chocolate font-medium mt-0.5">
            ${product.price.toFixed(2)}
          </p>
        </div>

        {/* Brief Excerpt Description */}
        <p className="font-sans text-xs text-brand-dark/60 leading-relaxed line-clamp-2 pt-0.5">
          {product.description}
        </p>

        {/* Action Button at the very base */}
        <div className="pt-2 mt-auto flex gap-2">
          <motion.button
            id={`add-to-bag-${product.id}`}
            onClick={handleAdd}
            disabled={product.stockStatus === 'Out of Stock'}
            whileHover={{ scale: product.stockStatus === 'Out of Stock' || prefersReducedMotion ? 1 : 1.02 }}
            whileTap={{ scale: product.stockStatus === 'Out of Stock' || prefersReducedMotion ? 1 : 0.97 }}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 focus:outline-none rounded-xl cursor-pointer shadow-[0_2px_8px_rgba(74,43,32,0.15)] hover:shadow-lg ${
              product.stockStatus === 'Out of Stock'
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : added
                ? 'bg-brand-rose text-white'
                : 'bg-brand-dark hover:bg-brand-rose hover:text-white text-white'
            }`}
          >
            {added ? 'Added to Bag ✓' : 'Add to Bag'}
          </motion.button>
          
          <motion.button
            id={`share-product-${product.id}`}
            onClick={handleShare}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            className="px-3 py-2.5 text-[10px] bg-[#FAF6F0] border border-brand-warm-tan/30 hover:bg-brand-rose hover:text-[#FAF6F0] text-brand-dark transition-colors duration-300 focus:outline-none flex items-center justify-center cursor-pointer rounded-xl"
            title="Share Product"
            aria-label="Share product"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
