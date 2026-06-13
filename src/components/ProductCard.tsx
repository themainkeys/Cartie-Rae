import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Star, ShoppingBag, Heart, Check, Flame, Share2, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist } = useApp();
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

  // Calculate average rating
  const avgRating = product.reviews.length > 0
    ? Math.round((product.reviews.reduce((acc, r) => acc + r.score, 0) / product.reviews.length) * 10) / 10
    : 4.8; // default beautiful rating

  const reviewCount = product.reviews.length > 0 ? product.reviews.length : 124;

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

  const getStockColor = () => {
    switch (product.stockStatus) {
      case 'Out of Stock':
        return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      case 'Low Stock':
        return 'bg-amber-50 text-amber-800 border-amber-200/50';
      case 'In Stock':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/50';
    }
  };

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group flex flex-col bg-[#FAF6F0] overflow-hidden border border-brand-warm-tan/20 transition-all duration-300 cursor-pointer h-full"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] w-full bg-brand-beige overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-101"
        />

        {/* Quick View Hover Backdrop Overlay */}
        <div className="absolute inset-0 bg-brand-dark/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="px-4 py-2 bg-[#FAF6F0] hover:bg-brand-rose hover:text-white text-brand-dark text-[10px] uppercase font-semibold tracking-widest shadow-md transition-all duration-300 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </button>
        </div>

        {/* Favorite Button Overlay (Subtle) */}
        <button
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
          className="absolute top-4 right-4 p-2 rounded-none bg-white/90 shadow-sm hover:bg-brand-rose hover:text-white text-brand-dark transition-colors focus:outline-none"
          aria-label="Wishlist product"
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand-rose text-brand-rose' : 'text-brand-dark/70'}`} />
        </button>

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
            <span className="font-sans text-[8px] uppercase font-bold text-amber-700">
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
          <button
            id={`add-to-bag-${product.id}`}
            onClick={handleAdd}
            disabled={product.stockStatus === 'Out of Stock'}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-colors duration-300 focus:outline-none ${
              product.stockStatus === 'Out of Stock'
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : added
                ? 'bg-[#3b82f6] text-white'
                : 'bg-brand-dark hover:bg-brand-rose text-white'
            }`}
          >
            {added ? 'Added to Bag' : 'Add to Bag'}
          </button>
          
          <button
            id={`share-product-${product.id}`}
            onClick={handleShare}
            className="px-3 py-2.5 text-[10px] bg-[#FAF6F0] border border-brand-warm-tan/30 hover:bg-brand-rose hover:text-[#FAF6F0] text-brand-dark transition-colors duration-300 focus:outline-none flex items-center justify-center cursor-pointer"
            title="Share Product"
            aria-label="Share product"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
