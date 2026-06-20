/**
 * Stripe Payment Gateway Integration Service
 *
 * Calls the Netlify serverless function `create-checkout-session` to initiate
 * a real Stripe Hosted Checkout Session and redirects the user to Stripe's
 * secure payment page.
 *
 * On success  → Stripe redirects to /checkout/success?session_id=...
 * On cancel   → Stripe redirects to /checkout/cancel
 */

import { CartItem, DiscountCode } from '../types';

export interface StripeCheckoutRequest {
  cart: CartItem[];
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: string;
  appliedDiscount: DiscountCode | null;
}

export const stripeService = {
  /**
   * Sends cart + customer info to the Netlify function, receives a Stripe
   * Hosted Checkout URL, then redirects the browser to it.
   *
   * Returns { success: false, error: string } if anything goes wrong so the
   * caller can display an error — never fakes a successful payment.
   */
  async redirectToCheckout(
    request: StripeCheckoutRequest
  ): Promise<{ success: boolean; error?: string }> {
    const {
      cart,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      appliedDiscount,
    } = request;

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          customerEmail,
          customerName,
          customerPhone:   customerPhone   || '',
          shippingAddress: shippingAddress || '',
          appliedDiscount,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || `Server error (${response.status}). Please try again.`,
        };
      }

      if (!data.url) {
        return {
          success: false,
          error: 'No checkout URL was returned. Please try again.',
        };
      }

      // Redirect to Stripe Hosted Checkout
      window.location.href = data.url;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown network error.';
      console.error('[stripe.ts] redirectToCheckout error:', message);
      return {
        success: false,
        error: 'Could not connect to the payment gateway. Check your connection and try again.',
      };
    }
  },
};
