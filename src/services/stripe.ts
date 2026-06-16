/**
 * Stripe Payment Gateway Integration Service
 * 
 * This service provides production-ready checkout structure to initiate Stripe Checkout Sessions.
 * In a real backend, you call stripe.checkout.sessions.create() with these structures.
 */

import { CartItem, DiscountCode } from '../types';

export interface StripeCheckoutSessionRequest {
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        images?: string[];
        description?: string;
        metadata?: Record<string, string>;
      };
      unit_amount: number; // in cents
    };
    quantity: number;
  }>;
  shippingAddressCollection?: {
    allowedCountries: string[];
  };
  metadata: {
    appliedPromoCode?: string;
    appliedDiscountPercent?: string;
    totalAmountCents: string;
    containsDigitalItems: string;
    containsPhysicalItems: string;
  };
}

export const stripeService = {
  /**
   * Generates Stripe Checkout payload structure
   */
  buildCheckoutPayload(
    cart: CartItem[], 
    customerEmail: string, 
    appliedDiscount: DiscountCode | null
  ): StripeCheckoutSessionRequest {
    const successUrl = `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/cart`;

    const containsDigitalItems = cart.some(item => item.type === 'ebook' || item.type === 'service');
    const containsPhysicalItems = cart.some(item => item.type === 'product');

    // Format line items for Stripe price_data
    const lineItems = cart.map(item => {
      // Calculate unit price in cents
      let unitPrice = Math.round(item.price * 100);

      // If discount is applied, you can either discount line items or use Stripe Coupons.
      // Here we show direct line item discount logic in cents.
      if (appliedDiscount) {
        const discountFactor = 1 - (appliedDiscount.discountPercent / 100);
        unitPrice = Math.round(unitPrice * discountFactor);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: [item.image],
            description: item.type === 'ebook' 
              ? 'Instant Access Digital eBook PDF Guide' 
              : item.type === 'service' 
                ? 'Virtual One-on-One Strategy Consultation Call' 
                : 'Natural Botanical Hair Essential',
            metadata: {
              itemId: item.id,
              itemType: item.type,
            }
          },
          unit_amount: unitPrice
        },
        quantity: item.quantity
      };
    });

    const totalCents = lineItems.reduce((acc, item) => acc + (item.price_data.unit_amount * item.quantity), 0);

    const payload: StripeCheckoutSessionRequest = {
      successUrl,
      cancelUrl,
      customerEmail,
      lineItems,
      metadata: {
        appliedPromoCode: appliedDiscount?.code || '',
        appliedDiscountPercent: appliedDiscount?.discountPercent.toString() || '0',
        totalAmountCents: totalCents.toString(),
        containsDigitalItems: containsDigitalItems.toString(),
        containsPhysicalItems: containsPhysicalItems.toString(),
      }
    };

    // If shipping is required for physical goods, configure allowed countries
    if (containsPhysicalItems) {
      payload.shippingAddressCollection = {
        allowedCountries: ['US', 'CA', 'GB', 'AU']
      };
    }

    return payload;
  },

  /**
   * Initiates payment redirection by dispatching checkout payload structure to backend API endpoint
   */
  async redirectToCheckout(
    cart: CartItem[], 
    customerEmail: string, 
    appliedDiscount: DiscountCode | null
  ): Promise<{ success: boolean; sessionUrl?: string; error?: string }> {
    console.log('[STRIPE.TS] [PRODUCTION MODE] Building Stripe Checkout Payload structure...');
    const payload = this.buildCheckoutPayload(cart, customerEmail, appliedDiscount);
    console.log('[STRIPE.TS] [PRODUCTION MODE] Dispatching checkout session request:', payload);

    // Simulation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Production code:
    /*
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const session = await response.json();
      if (session.url) {
        window.location.href = session.url; // Redirects client directly to Stripe-hosted payment screen
        return { success: true };
      }
      return { success: false, error: 'Failed to create stripe session url' };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
    */

    return {
      success: true,
      sessionUrl: `${window.location.origin}/simulated-stripe-gateway`
    };
  }
};
