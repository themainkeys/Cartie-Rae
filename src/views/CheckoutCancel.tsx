import React from 'react';
import { ShoppingCart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * CheckoutCancel — displayed at /checkout/cancel when the user backs out of Stripe.
 * Reassures the user their cart is intact and gives them easy paths back.
 */
interface CheckoutCancelProps {
  openCart: () => void;
  setActivePart: (part: string) => void;
}

export const CheckoutCancel: React.FC<CheckoutCancelProps> = ({ openCart, setActivePart }) => {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-warm-tan/20 overflow-hidden"
      >
        {/* Thin top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-warm-tan via-brand-rose/40 to-brand-warm-tan" />

        <div className="p-8 text-center space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-brand-pink-light rounded-full flex items-center justify-center mx-auto shadow-sm"
          >
            <ShoppingCart className="w-8 h-8 text-brand-rose" />
          </motion.div>

          {/* Copy */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-normal text-brand-dark">
              Payment Cancelled
            </h1>
            <p className="font-sans text-sm text-zinc-500 leading-relaxed">
              No worries — you were not charged. Your shopping bag is exactly as you left it.
            </p>
          </div>

          {/* Reassurance badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <span className="text-emerald-600 text-base select-none">✓</span>
            <p className="text-[11px] text-emerald-800 font-medium text-left leading-snug">
              Your cart items are saved. You can review them and try again whenever you're ready.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <motion.button
              id="checkout-cancel-return-cart-btn"
              onClick={() => {
                setActivePart('shop');
                setTimeout(() => openCart(), 100);
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-brand-rose hover:bg-brand-berry text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none cursor-pointer shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Return to Cart
            </motion.button>

            <motion.button
              id="checkout-cancel-continue-shopping-btn"
              onClick={() => setActivePart('shop')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-brand-cream hover:bg-brand-beige border border-brand-warm-tan/40 text-brand-chocolate py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Continue Shopping
            </motion.button>

            <button
              id="checkout-cancel-home-btn"
              onClick={() => setActivePart('home')}
              className="w-full flex items-center justify-center gap-1 text-brand-chocolate/60 hover:text-brand-rose text-xs font-semibold uppercase tracking-wider py-2 transition-colors focus:outline-none cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </button>
          </div>

          {/* Support note */}
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Having trouble checking out?{' '}
            <button
              onClick={() => setActivePart('contact')}
              className="text-brand-rose hover:underline font-medium focus:outline-none cursor-pointer"
            >
              Contact us
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
