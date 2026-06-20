import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist, prefersReducedMotion } = useApp();
  const [added, setAdded] = useState(false);

  const isSaved = wishlist.some(item => item.id === product.id);

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
        y: prefersReducedMotion ? 0 : -4,
        boxShadow: prefersReducedMotion ? "none" : "0 12px 32px -8px rgba(0,0,0,0.10)"
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col bg-brand-cream border border-brand-warm-tan/30 cursor-pointer rounded-2xl overflow-hidden"
    >
      {/* Product Image */}
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
          <span className="absolute top-3 left-3 bg-brand-rose text-white px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-widest rounded shadow-xs z-10">
            Best Seller
          </span>
        )}

        {/* Out of Stock ribbon */}
        {product.stockStatus === 'Out of Stock' && (
          <div className="absolute inset-x-0 bottom-0 bg-brand-dark/80 text-white py-2 text-center text-[10px] uppercase tracking-widest">
            Out of Stock
          </div>
        )}

        {/* Wishlist Heart */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (isSaved) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist({ id: product.id, type: 'product', name: product.name, price: product.price, image: product.image });
            }
          }}
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-sm hover:bg-brand-rose hover:text-white text-brand-dark transition-colors focus:outline-none z-10 cursor-pointer"
          aria-label="Save to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand-rose text-brand-rose' : 'text-zinc-500'}`} />
        </motion.button>
      </div>

      {/* Card Content: Title + Price + CTA */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-serif text-base text-brand-dark leading-snug group-hover:text-brand-rose transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="font-mono text-sm font-semibold text-brand-dark mt-0.5">
            ${product.price.toFixed(2)}
          </p>
        </div>

        <motion.button
          id={`add-to-bag-${product.id}`}
          onClick={handleAdd}
          disabled={product.stockStatus === 'Out of Stock'}
          whileHover={{ scale: product.stockStatus === 'Out of Stock' || prefersReducedMotion ? 1 : 1.01 }}
          whileTap={{ scale: product.stockStatus === 'Out of Stock' || prefersReducedMotion ? 1 : 0.98 }}
          className={`w-full py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all duration-300 focus:outline-none cursor-pointer flex items-center justify-center gap-1.5 ${
            product.stockStatus === 'Out of Stock'
              ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              : added
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
