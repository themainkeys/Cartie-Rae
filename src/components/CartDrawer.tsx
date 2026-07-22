import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, X, Trash2, ArrowLeft, Lock,
  CheckCircle, Download, Smartphone, Sparkles, ChevronRight, ShoppingBag, Heart, Clock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { stripeService, isStripeConfigured } from '../services/stripe';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    appliedDiscount, 
    removeFromCart, 
    updateCartQuantity, 
    applyPromoCode, 
    createOrder,
    wishlist,
    removeFromWishlist,
    moveToWishlist,
    moveToCart,
    prefersReducedMotion
  } = useApp();

  // Checkout sequence state tracking
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Cart financial computations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    const pct = Math.min(100, Math.max(0, appliedDiscount.discountPercent));
    return Math.round((subtotal * (pct / 100)) * 100) / 100;
  }, [appliedDiscount, subtotal]);

  const total = useMemo(() => {
    return Math.round((subtotal - discountAmount) * 100) / 100;
  }, [subtotal, discountAmount]);

  const holdsPhysicalItems = useMemo(() => {
    return cart.some(item => item.type === 'product');
  }, [cart]);

  const holdsDigitalItems = useMemo(() => {
    return cart.some(item => item.type === 'ebook');
  }, [cart]);

  const holdsServiceItems = useMemo(() => {
    return cart.some(item => item.type === 'service');
  }, [cart]);

  // --- Functions ---
  const handlePromoApply = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput) return;
    const err = applyPromoCode(promoInput);
    if (err) {
      setPromoError(err);
    } else {
      setPromoInput('');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) return;

    setCheckoutError(null);
    setIsSubmitting(true);

    const result = await stripeService.redirectToCheckout({
      cart,
      customerEmail,
      customerName,
      customerPhone:   customerPhone   || undefined,
      shippingAddress: shippingAddress || undefined,
      appliedDiscount,
    });

    // If redirectToCheckout succeeded, the browser is already navigating to Stripe.
    // We only reach here on failure.
    if (!result.success) {
      setCheckoutError(result.error || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
    // Do not reset isSubmitting on success — the page is redirecting
  };

  const handleInitCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep('form');
  };

  const handleCloseCheckout = () => {
    setCheckoutStep('cart');
    // Clear wizard states
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setShippingAddress('');
    setCheckoutError(null);
    onClose();
  };

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseCheckout();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"]'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0] as HTMLElement;
        const last = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus close button initially
    setTimeout(() => {
      const closeBtn = drawerRef.current?.querySelector('button');
      if (closeBtn) closeBtn.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            id="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseCheckout}
            className="fixed inset-0 z-50 bg-brand-dark/65 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Slide-Over Sheet */}
          <motion.div
            ref={drawerRef}
            id="cart-drawer-container"
            initial={{ x: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 0 }}
            transition={prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', damping: 26, stiffness: 210 }}
            className="fixed top-0 right-0 z-50 w-full max-w-md bg-brand-cream h-full shadow-2xl flex flex-col font-sans"
          >
            {/* Slide-over header */}
            <div className="p-5 border-b border-brand-warm-tan/20 flex items-center justify-between bg-brand-beige select-none">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-rose" />
                <h3 className="font-serif text-lg font-bold text-brand-dark">
                  {checkoutStep === 'cart' ? 'Your Shopping Bag' : 'Checkout Details'}
                </h3>
              </div>
              <button
                id="close-cart-slideover-btn"
                onClick={handleCloseCheckout}
                className="p-1.5 rounded-full bg-brand-cream text-brand-dark hover:bg-brand-rose hover:text-[#FAF6F0] transition-all focus:outline-none cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* CASE A: CART DISPLAY */}
              {checkoutStep === 'cart' && (
                <motion.div
                  key="cart-step"
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Cart Items List */}
                    <div>
                      {cart.length === 0 ? (
                        <div className="py-8 min-h-[200px] flex flex-col items-center justify-center text-center px-4 select-none">
                          <ShoppingBag className="w-12 h-12 text-brand-warm-tan mb-3 animate-pulse" />
                          <p className="font-serif text-base text-brand-dark font-medium">Your shopping bag is empty.</p>
                          <p className="font-sans text-xs text-brand-dark/50 mt-1 max-w-xs leading-relaxed">
                            Add fine 4C hair oils, mulberry silk caps, or our high-definition eBooks to begin your retention journey!
                          </p>
                          <button
                            id="empty-cart-explore-btn"
                            onClick={onClose}
                            className="mt-6 px-5 py-2.5 bg-brand-rose hover:bg-brand-berry text-white text-xs font-semibold uppercase tracking-wider rounded-xl focus:outline-none transition-all cursor-pointer"
                          >
                            Start Exploring
                          </button>
                        </div>
                      ) : (
                        <motion.div 
                          layout={prefersReducedMotion ? false : "position"}
                          className="space-y-4"
                        >
                          <AnimatePresence mode="popLayout">
                            {cart.map((item) => (
                              <motion.div 
                                layout={prefersReducedMotion ? false : "position"}
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="flex gap-3 bg-brand-beige/35 p-3 rounded-xl border border-brand-warm-tan/10 text-xs items-center justify-between text-left"
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-lg object-cover border border-brand-warm-tan/30 shrink-0"
                                />
                                <div className="flex-1 min-w-0 mx-2">
                                  <h4 className="font-serif font-bold text-brand-dark line-clamp-1">{item.name}</h4>
                                  <p className="text-[10px] text-brand-rose font-mono font-medium mt-0.5">${item.price.toFixed(2)} each</p>
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-brand-dark/40 bg-brand-beige px-1.5 py-0.5 rounded inline-block mt-1">
                                    {item.type === 'ebook' ? 'Digital Guide' : item.type === 'service' ? 'Virtual Consultation' : 'Physical Product'}
                                  </span>
                                </div>
                                {/* Quantities spinner */}
                                <div className="flex items-center gap-1.5 shrink-0 select-none">
                                  <button
                                    id={`qty-dec-${item.id}`}
                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                    className="bg-brand-beige hover:bg-brand-rose text-brand-dark hover:text-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold focus:outline-none cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-xs font-bold w-5 text-center text-[#B11B41]">{item.quantity}</span>
                                  <button
                                    id={`qty-inc-${item.id}`}
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                    className="bg-brand-beige hover:bg-brand-rose text-brand-dark hover:text-white w-5 h-5 rounded flex items-center justify-center text-xs font-bold focus:outline-none cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                                
                                {/* Save to wishlist */}
                                <button
                                  id={`save-cart-item-drawer-${item.id}`}
                                  onClick={() => moveToWishlist(item.id)}
                                  className="p-1 text-[#A67E6B] hover:text-brand-rose hover:bg-brand-rose/5 rounded transition-all focus:outline-none shrink-0 ml-1 cursor-pointer"
                                  title="Save for Later"
                                  aria-label="Save for Later"
                                >
                                  <Heart className="w-4 h-4" />
                                </button>

                                {/* Delete single item */}
                                <button
                                  id={`delete-cart-item-drawer-${item.id}`}
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1 text-zinc-400 hover:text-brand-rose hover:bg-brand-rose/5 rounded transition-all focus:outline-none shrink-0 ml-1 cursor-pointer"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </div>

                    {/* SAVED FOR LATER (WISHLIST) SECTION */}
                    <div className="pt-4 border-t border-brand-warm-tan/20 text-left">
                      <div className="flex items-center justify-between mb-3 select-none">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-brand-rose fill-brand-rose" />
                          <span className="font-serif text-sm font-bold text-brand-dark">Saved for Later</span>
                        </div>
                        <span className="text-[10px] font-mono bg-brand-rose/10 text-brand-rose px-2 py-0.5 rounded-full font-bold">
                          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {wishlist.length === 0 ? (
                        <div className="bg-[#FAF6F0] border border-dashed border-brand-warm-tan/20 rounded-2xl p-5 text-center text-xs text-brand-dark/50 select-none">
                          <p className="font-serif font-medium">No items saved yet.</p>
                          <p className="mt-1 text-[10px] leading-relaxed">
                            Save essentials from your bag to hold them for later review!
                          </p>
                        </div>
                      ) : (
                        <motion.div 
                          layout={prefersReducedMotion ? false : "position"}
                          className="space-y-3"
                        >
                          <AnimatePresence mode="popLayout">
                            {wishlist.map((item) => (
                              <motion.div 
                                layout={prefersReducedMotion ? false : "position"}
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="flex gap-3 bg-brand-beige/20 border border-brand-warm-tan/15 p-3 rounded-xl text-xs items-center justify-between"
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-lg object-cover border border-brand-warm-tan/30 shrink-0"
                                />
                                <div className="flex-1 min-w-0 mx-2">
                                  <h4 className="font-serif font-bold text-brand-dark line-clamp-1">{item.name}</h4>
                                  <p className="text-[10px] text-brand-rose font-mono font-medium mt-0.5">${item.price.toFixed(2)}</p>
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-brand-dark/40 bg-brand-beige px-1.5 py-0.5 rounded inline-block mt-1">
                                    {item.type === 'ebook' ? 'Digital Guide' : item.type === 'service' ? 'Virtual Consultation' : 'Physical Product'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <motion.button
                                    id={`move-wishlist-to-bag-${item.id}`}
                                    onClick={() => moveToCart(item)}
                                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
                                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                                    className="px-2.5 py-1.5 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors focus:outline-none cursor-pointer"
                                  >
                                    Add to Bag
                                  </motion.button>
                                  <button
                                    id={`delete-wishlist-item-${item.id}`}
                                    onClick={() => removeFromWishlist(item.id)}
                                    className="p-1 text-zinc-400 hover:text-brand-rose hover:bg-brand-rose/5 rounded transition-all focus:outline-none shrink-0 cursor-pointer"
                                    title="Remove from Saved"
                                    aria-label="Remove saved item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Bottom billing recap */}
                  {cart.length > 0 && (
                    <div className="p-4 bg-brand-beige border-t border-brand-warm-tan/30 space-y-3 shrink-0 text-brand-dark select-none">
                      {/* Voucher promo execution row */}
                      <form onSubmit={handlePromoApply} className="flex gap-2">
                        <input
                          id="promo-code-input-drawer"
                          type="text"
                          placeholder="ENTER COUPON... (GROW4C)"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/40 text-[10.5px] uppercase placeholder-brand-dark/30 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                        />
                        <button
                          id="apply-promo-btn-drawer"
                          type="submit"
                          className="bg-brand-chocolate hover:bg-brand-dark text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all focus:outline-none cursor-pointer"
                        >
                          Apply
                        </button>
                      </form>
                      {promoError && <p className="text-brand-rose text-[10px] leading-tight font-medium text-left">{promoError}</p>}
                      {appliedDiscount && (
                        <p className="text-emerald-700 text-[10.5px] flex items-center gap-1 font-semibold border border-emerald-200/50 bg-emerald-50 px-2.5 py-1 rounded-xl">
                          <Sparkles className="w-3" />
                          Code &quot;{appliedDiscount.code}&quot; APPLIED ({appliedDiscount.discountPercent}% OFF!)
                        </p>
                      )}

                      <div className="space-y-1.5 text-xs text-brand-dark/70 border-t border-brand-warm-tan/20 pt-2.5">
                        <div className="flex justify-between">
                          <span>Items Subtotal:</span>
                          <span className="font-mono">${subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-800 font-medium">
                            <span>Applied Promo Discount:</span>
                            <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-extrabold text-sm text-brand-chocolate pt-1 border-t border-dashed border-brand-dark/10">
                          <span>Grand Total:</span>
                          <span className="font-mono">${total.toFixed(2)}</span>
                        </div>
                      </div>

                      <motion.button
                        id="proceed-checkout-btn-drawer"
                        onClick={handleInitCheckout}
                        whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
                        whileTap={{ scale: prefersReducedMotion ? 1 : 0.99 }}
                        className="w-full bg-brand-rose hover:bg-brand-berry text-[#FAF6F0] py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none mt-2 shadow-sm cursor-pointer"
                      >
                        <span>Proceed to Secure Checkout</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* CASE B: SECURE CHECKOUT FORM SCREEN */}
              {checkoutStep === 'form' && (
                <motion.div
                  key="form-step"
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden text-brand-dark"
                >
                  <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col overflow-hidden text-left">
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {/* Back button */}
                      <button
                        type="button"
                        onClick={() => { setCheckoutStep('cart'); setCheckoutError(null); }}
                        className="text-brand-rose hover:text-brand-berry flex items-center gap-1 text-xs font-bold focus:outline-none mb-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Shopping Bag</span>
                      </button>

                      {/* Step description */}
                      <div className="p-3 bg-brand-rose/5 rounded-xl border border-brand-rose/10 flex gap-2 select-none">
                        <Lock className="w-4 h-4 text-brand-rose shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-rose">Instant delivery ready</p>
                          <p className="text-[10px] text-brand-dark/80 mt-0.5">eBooks are delivered instantly upon receipt of confirmation!</p>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="space-y-2.5">
                        <h4 className="font-serif text-xs font-extrabold uppercase tracking-widest text-brand-chocolate border-b border-brand-warm-tan/30 pb-1.5 select-none">
                          1. Contact Information
                        </h4>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Customer Full Name *</label>
                          <input
                            id="checkout-name-drawer"
                            type="text"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Maya Jenkins"
                            className="w-full px-4 py-3 bg-[#FAF6F0] border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all text-brand-dark"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Email Delivery Address *</label>
                          <input
                            id="checkout-email-drawer"
                            type="email"
                            required
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="maya.jenk@gmail.com"
                            className="w-full px-4 py-3 bg-[#FAF6F0] border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all text-brand-dark"
                          />
                          <span className="text-[9px] text-[#A67E6B] block mt-1 font-mono select-none">We will send confirmation and receipt logs here.</span>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Phone Number (Optional)</label>
                          <input
                            id="checkout-phone-drawer"
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+1 (555) 0192-384"
                            className="w-full px-4 py-3 bg-[#FAF6F0] border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all text-brand-dark"
                          />
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {holdsPhysicalItems && (
                        <div className="space-y-2.5 pt-2">
                          <h4 className="font-serif text-xs font-extrabold uppercase tracking-widest text-brand-chocolate border-b border-brand-warm-tan/30 pb-1.5 select-none">
                            2. Shipping Destination
                          </h4>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Street Address & Apartment *</label>
                            <input
                              id="checkout-shipping-drawer"
                              type="text"
                              required
                              value={shippingAddress}
                              onChange={(e) => setShippingAddress(e.target.value)}
                              placeholder="742 Evergreen Terrace, Apt 101"
                              className="w-full px-4 py-3 bg-[#FAF6F0] border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all text-brand-dark"
                            />
                          </div>
                        </div>
                      )}

                      {/* Stripe Hosted Checkout Notice */}
                      <div className="space-y-2.5 pt-2">
                        <h4 className="font-serif text-xs font-extrabold uppercase tracking-widest text-brand-chocolate border-b border-brand-warm-tan/30 pb-1.5 select-none">
                          {holdsPhysicalItems ? '3. Secure Payment' : '2. Secure Payment'}
                        </h4>
                        {isStripeConfigured ? (
                          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wide">Stripe Secured Checkout</p>
                              <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                                Clicking the button below will redirect you to Stripe's secure, encrypted payment page. Your card details are never shared with us.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wide">Demo Mode — Payment Disabled</p>
                              <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                                The Stripe payment gateway is not configured yet, so no real payment will be taken. Add the Stripe keys to enable live checkout.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Submit checkout bar */}
                    <div className="p-4 bg-brand-beige border-t border-brand-warm-tan/30 shrink-0 space-y-2 select-none">
                      <div className="flex justify-between text-xs text-brand-chocolate/80 px-1 font-semibold">
                        <span>Total to pay:</span>
                        <span className="font-mono font-bold text-sm text-brand-rose">${total.toFixed(2)}</span>
                      </div>

                      {/* Checkout error message */}
                      {checkoutError && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[10.5px] text-red-700 leading-snug font-medium">{checkoutError}</p>
                        </div>
                      )}

                      <motion.button
                        id="submit-payment-btn-drawer"
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: isSubmitting || prefersReducedMotion ? 1 : 1.01 }}
                        whileTap={{ scale: isSubmitting || prefersReducedMotion ? 1 : 0.99 }}
                        className="w-full bg-brand-berry hover:bg-brand-dark text-[#FAF6F0] py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer disabled:bg-zinc-400 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mr-1" />
                            <span>Connecting to Stripe...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Continue to Secure Payment (${total.toFixed(2)})</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
