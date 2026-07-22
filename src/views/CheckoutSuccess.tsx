import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, Clock, ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

/**
 * CheckoutSuccess — displayed at /checkout/success after a completed Stripe payment.
 * Reads the Stripe session_id from the URL query string for reference.
 */
interface CheckoutSuccessProps {
  openCart: () => void;
  setActivePart: (part: string) => void;
}

export const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({ openCart, setActivePart }) => {
  const { clearCart } = useApp();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get('session_id'));
    // Payment succeeded → empty the cart so the paid items can't be re-purchased.
    // (Authoritative order recording happens server-side via the Stripe webhook.)
    clearCart();
    // Clean the URL without a page reload so the session_id doesn't persist on refresh
    window.history.replaceState({}, '', '/checkout/success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-warm-tan/20 overflow-hidden"
      >
        {/* Gradient header bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-rose via-brand-berry to-brand-rose" />

        <div className="p-8 text-center space-y-6">
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm"
          >
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </motion.div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-normal text-brand-dark">
              Payment Confirmed
            </h1>
            <p className="font-sans text-sm text-zinc-500 leading-relaxed">
              Thank you for your purchase. A confirmation and receipt have been sent to your email.
            </p>
            {sessionId && (
              <p className="font-mono text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1.5 inline-block mt-1 select-all">
                Ref: {sessionId.slice(0, 32)}…
              </p>
            )}
          </div>

          {/* What happens next */}
          <div className="text-left space-y-3">
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-chocolate">
              What happens next
            </p>

            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <Download className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-emerald-800">eBooks</p>
                <p className="text-[10.5px] text-emerald-700 mt-0.5 leading-relaxed">
                  Secure download links will be delivered to your email inbox within a few minutes (valid 24 hours).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-brand-beige border border-brand-warm-tan/40 rounded-xl">
              <Clock className="w-4 h-4 text-brand-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-brand-chocolate">Consultation Sessions</p>
                <p className="text-[10.5px] text-brand-dark/70 mt-0.5 leading-relaxed">
                  We will contact you within 24 hours to schedule your virtual 1-on-1 session.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-brand-beige border border-brand-warm-tan/40 rounded-xl">
              <Sparkles className="w-4 h-4 text-brand-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-brand-chocolate">Physical Products</p>
                <p className="text-[10.5px] text-brand-dark/70 mt-0.5 leading-relaxed">
                  Hand-packaged and shipped within 2–4 business days. Tracking details sent via email.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <motion.button
              id="checkout-success-return-shop-btn"
              onClick={() => setActivePart('shop')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-brand-rose hover:bg-brand-berry text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Continue Shopping
            </motion.button>
            <button
              id="checkout-success-home-btn"
              onClick={() => setActivePart('home')}
              className="w-full text-brand-chocolate/70 hover:text-brand-rose text-xs font-semibold uppercase tracking-wider py-2 transition-colors focus:outline-none cursor-pointer"
            >
              Return Home
            </button>
          </div>

          {/* Support note */}
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Questions? Contact{' '}
            <a
              href="mailto:orders@cartiaerae.com"
              className="text-brand-rose hover:underline font-medium"
            >
              orders@cartiaerae.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
