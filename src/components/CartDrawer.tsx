import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, X, Trash2, ArrowLeft, CreditCard, 
  CheckCircle, Download, Smartphone, Sparkles, ChevronRight, ShoppingBag, Heart, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { stripeService } from '../services/stripe';
import { ebookDeliveryService } from '../services/ebookDelivery';

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
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Credit Card checkout simulation state
  const [ccNumber, setCcNumber] = useState('');
  const [ccExpiry, setCcExpiry] = useState('');
  const [ccCvv, setCcCvv] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cart financial computations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    return Math.round((subtotal * (appliedDiscount.discountPercent / 100)) * 100) / 100;
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

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) return;
    
    setIsSubmitting(true);
    // Simulate secure processing latency
    setTimeout(() => {
      const order = createOrder(customerName, customerEmail, customerPhone || undefined, shippingAddress || undefined);
      
      // Generate expiring secure links for all eBooks in this transaction
      const ebooksInOrder = order.items.filter(item => item.type === 'ebook');
      const secureTokens = ebooksInOrder.map(ebook => 
        ebookDeliveryService.generateSecureLink(order.id, order.customerEmail, ebook.id)
      );

      // Trigger simulated SMTP receipt containing the expiration links
      if (secureTokens.length > 0) {
        ebookDeliveryService.sendConfirmationEmail(order.customerName, order.customerEmail, order.id, secureTokens);
      }

      setCreatedOrder({
        ...order,
        secureTokens
      });
      setCheckoutStep('success');
      setIsSubmitting(false);
    }, 1500);
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
    setCcNumber('');
    setCcExpiry('');
    setCcCvv('');
    setShippingAddress('');
    setCreatedOrder(null);
    onClose();
  };

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
                  {checkoutStep === 'cart' ? 'Your Shopping Bag' : checkoutStep === 'form' ? 'Checkout Details' : 'Purchase Receipt'}
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
                                    {item.type === 'ebook' ? 'Instant eBook PDF' : 'Physical Product'}
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
                                    {item.type === 'ebook' ? 'Instant eBook' : 'Physical Product'}
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
                        onClick={() => setCheckoutStep('cart')}
                        className="text-brand-rose hover:text-brand-berry flex items-center gap-1 text-xs font-bold focus:outline-none mb-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Shopping Bag</span>
                      </button>

                      {/* Step description */}
                      <div className="p-3 bg-brand-rose/5 rounded-xl border border-brand-rose/10 flex gap-2 select-none">
                        <CreditCard className="w-4 h-4 text-brand-rose shrink-0" />
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

                      {/* Simulated CC billing */}
                      <div className="space-y-2.5 pt-2">
                        <h4 className="font-serif text-xs font-extrabold uppercase tracking-widest text-brand-chocolate border-b border-brand-warm-tan/30 pb-1.5 select-none">
                          {holdsPhysicalItems ? '3. Simulated Billing Card' : '2. Simulated Billing Card'}
                        </h4>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Credit Card Number *</label>
                          <div className="relative">
                            <input
                              id="checkout-cc-number-drawer"
                              type="text"
                              required
                              placeholder="4111 2222 3333 4444"
                              value={ccNumber}
                              onChange={(e) => setCcNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
                              className="w-full pl-10 pr-4 py-3 bg-[#FAF6F0] border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all font-mono text-brand-dark"
                            />
                            <CreditCard className="absolute left-3 top-3.5 w-4 h-4 text-brand-dark/40 pointer-events-none" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Expiration *</label>
                            <input
                              id="checkout-cc-expiry-drawer"
                              type="text"
                              required
                              placeholder="04/28"
                              value={ccExpiry}
                              onChange={(e) => setCcExpiry(e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1/').trim().slice(0, 5))}
                              className="w-full px-4 py-3 bg-[#FAF6F0] border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all font-mono text-center text-brand-dark"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Security CVV *</label>
                            <input
                              id="checkout-cc-cvv-drawer"
                              type="password"
                              required
                              placeholder="123"
                              value={ccCvv}
                              onChange={(e) => setCcCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              className="w-full px-4 py-3 bg-[#FAF6F0] border border-brand-warm-tan/40 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all font-mono text-center text-brand-dark"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-[#A67E6B] leading-normal italic text-center font-serif select-none mt-2">
                          🔒 Secure demonstration sandbox engine. Please do not insert sensitive card info.<br />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!customerName || !customerEmail) {
                                alert("Please fill out Name and Email fields first to test Stripe checkout metadata generation.");
                                return;
                              }
                              if (confirm("Simulate redirecting to live Stripe Hosted Checkout session?")) {
                                const res = await stripeService.redirectToCheckout(cart, customerEmail, appliedDiscount);
                                if (res.success) {
                                  alert(`Successfully generated Stripe checkout payload session:\n\n${res.sessionUrl}\n\nIn production, client redirects directly to this URL.`);
                                }
                              }
                            }}
                            className="mt-1 text-[#B11B41] hover:underline font-semibold focus:outline-none cursor-pointer"
                          >
                            ⚡ Test Stripe checkout integration
                          </button>
                        </p>
                      </div>

                    </div>

                    {/* Submit checkout bar */}
                    <div className="p-4 bg-brand-beige border-t border-brand-warm-tan/30 shrink-0 space-y-2 select-none">
                      <div className="flex justify-between text-xs text-brand-chocolate/80 px-1 font-semibold">
                        <span>Total Invoice to pay:</span>
                        <span className="font-mono font-bold text-sm text-brand-rose">${total.toFixed(2)}</span>
                      </div>

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
                            <span>Authorizing Sandbox Gateway...</span>
                          </>
                        ) : (
                          <>
                            <span>Pay &amp; Finalize Order (${total.toFixed(2)})</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* CASE C: SUCCESSFUL CHECKOUT / RECEIPT LOGS VIEW */}
              {checkoutStep === 'success' && createdOrder && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col overflow-hidden text-brand-dark"
                >
                  <div className="flex-1 overflow-y-auto p-5 text-center space-y-5">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm select-none">
                      <CheckCircle className="w-8 h-8 text-emerald-600 animate-pulse" />
                    </div>
                    
                    <div>
                      <h4 className="font-serif text-xl font-bold text-brand-dark">Purchase Successful!</h4>
                      <span className="text-[10px] font-mono uppercase bg-brand-pink-light tracking-widest text-[#B11B41] font-bold px-3 py-1.5 rounded-xl inline-block mt-2 border border-brand-rose/25 select-none">
                        Receipt Code: {createdOrder.id}
                      </span>
                      <p className="font-sans text-[11px] text-[#5C453C]/90 leading-relaxed mt-2.5 max-w-xs mx-auto">
                        Thank you for trusting Cartiae Rae. We have sent a confirmation email copy to <strong className="font-bold underline text-brand-rose">{createdOrder.customerEmail}</strong>!
                      </p>
                    </div>

                    {/* CONVERT DIGITAL DOWNLOAD BUTTONS */}
                    {holdsDigitalItems && (
                      <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-2xl text-left space-y-2.5 shadow-sm">
                        <p className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1.5 select-none">
                          <Download className="w-4 h-4 text-emerald-600 animate-bounce" />
                          <span>Instant Digital Delivery</span>
                        </p>
                        <p className="text-[10.5px] text-emerald-900 leading-normal">
                          Your eBooks have been unlocked! Click below to download your professional study manuals instantly.
                        </p>
                        
                        {/* Expiration Banner Warning */}
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/50 p-2 rounded-xl text-[10px] font-medium leading-normal">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>Security Expiration: Download links are valid for exactly 24 hours (expire tomorrow).</span>
                        </div>
                        
                        {createdOrder.items.filter((item: any) => item.type === 'ebook').map((item: any) => {
                          const secureTokenObj = createdOrder.secureTokens?.find((t: any) => t.ebookId === item.id);
                          const downloadUrl = secureTokenObj 
                            ? `${window.location.origin}/download?token=${secureTokenObj.token}` 
                            : `#download-${item.id}`;

                          return (
                            <a
                              key={item.id}
                              id={`download-link-drawer-${item.id}`}
                              href={downloadUrl}
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Executing secure encrypted link verification for token:\n\n${secureTokenObj?.token || 'N/A'}\n\nInitiating secure compile download for eBook guide "${item.name}".`);
                              }}
                              className="flex items-center justify-between bg-white hover:bg-emerald-100 border border-emerald-300 p-2.5 rounded-lg text-xs font-semibold text-emerald-950 transition-colors"
                            >
                              <span className="truncate max-w-[220px]">{item.name} (PDF)</span>
                              <span className="text-[9px] uppercase font-bold bg-emerald-600 text-white px-2 py-0.5 rounded shrink-0">Download</span>
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* Physical items instructions */}
                    {holdsPhysicalItems && (
                      <div className="bg-brand-beige/50 border border-brand-warm-tan/40 p-4 rounded-2xl text-left shadow-sm">
                        <p className="text-[11px] font-bold text-brand-chocolate uppercase flex items-center gap-1 select-none">
                          <Smartphone className="w-4 h-4 text-brand-rose" />
                          <span>Physical Shipment Logistics</span>
                        </p>
                        <p className="text-[10.5px] text-[#6E5549] leading-relaxed mt-1">
                          Our botanical drops and detanglers are hand-packaged using recyclable soft linen. Since you ordered physical essentials, we will prepare shipment to your delivery address. Tracking details will be generated on your dashboard.
                        </p>
                      </div>
                    )}

                    {/* Detailed receipt itemizations */}
                    <div className="text-left bg-brand-cream border border-brand-warm-tan/30 rounded-2xl p-3.5 text-[11px] text-brand-dark/70 space-y-1.5 font-mono shadow-xs">
                      <p className="font-sans font-bold text-xs text-brand-chocolate uppercase mb-1 border-b border-brand-warm-tan/20 pb-1 select-none">Order Summary</p>
                      {createdOrder.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between">
                          <span className="truncate max-w-[200px]">{item.name} x{item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-brand-warm-tan/20 pt-1.5 flex justify-between font-bold text-brand-chocolate">
                        <span>Amount Paid:</span>
                        <span>${createdOrder.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <motion.button
                      id="receipt-return-shopper-drawer"
                      onClick={handleCloseCheckout}
                      whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.99 }}
                      className="w-full bg-brand-rose hover:bg-brand-berry text-[#FAF6F0] py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none shadow-sm cursor-pointer"
                    >
                      Return to Storefront
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
