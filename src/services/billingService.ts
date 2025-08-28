import { StripeService } from '@/api/services/StripeService';
import { PaymentLinkResponse } from '@/api/models/PaymentLinkResponse';
import { Subscription, BillingInfo, Invoice } from '@/types/subscription';
import { STRIPE_CONFIG } from '@/constants/subscription';

export class BillingService {
  /**
   * Get user subscription with transformed data
   */
  static async getUserSubscription(): Promise<BillingInfo> {
    try {
      const response = await StripeService.getUserSubscriptionApiV1StripeSubscriptionGet();
      
      // Transform the API response to match our interfaces
      const subscription: Subscription | null = response.subscription ? {
        id: response.subscription.id,
        status: response.subscription.status,
        current_period_start: response.subscription.current_period_start,
        current_period_end: response.subscription.current_period_end,
        cancel_at_period_end: response.subscription.cancel_at_period_end || false,
        plan: {
          id: response.subscription.plan.id,
          name: response.subscription.plan.name,
          price: response.subscription.plan.price,
          currency: response.subscription.plan.currency,
          interval: response.subscription.plan.interval,
        },
        usage: {
          current: response.subscription.usage?.current || 0,
          limit: response.subscription.usage?.limit || 0,
          percentage: response.subscription.usage?.percentage || 0,
        },
        next_payment_date: response.subscription.next_payment_date,
      } : null;

      const paymentMethod = response.payment_method ? {
        brand: response.payment_method.brand,
        last4: response.payment_method.last4,
        exp_month: response.payment_method.exp_month,
        exp_year: response.payment_method.exp_year,
      } : null;

      const invoices: Invoice[] = (response.invoices || []).map((invoice: any) => ({
        id: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        due_date: invoice.due_date,
        pdf_url: invoice.pdf_url,
      }));

      return {
        subscription,
        payment_method: paymentMethod,
        invoices,
      };
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      throw error;
    }
  }

  /**
   * Create payment link for subscription
   * Uses production price ID in production environment
   */
  static async createPaymentLink(priceId?: string): Promise<string> {
    try {
      // Debug environment variables
      console.log('=== Environment Variables Debug ===');
      console.log('import.meta.env.VITE_STRIPE_PRICE_ID:', import.meta.env.VITE_STRIPE_PRICE_ID);
      console.log('import.meta.env.PROD:', import.meta.env.PROD);
      console.log('STRIPE_CONFIG.priceId:', STRIPE_CONFIG.priceId);
      console.log('Provided priceId:', priceId);
      
      // Use STRIPE_CONFIG for consistent price ID handling
      const actualPriceId = priceId || STRIPE_CONFIG.priceId;
      
      console.log(`Creating payment link with price ID: ${actualPriceId}`);
      console.log('=== End Debug ===');
      
      const response: PaymentLinkResponse = await StripeService.createPaymentLinkApiV1StripePaymentLinkPost(actualPriceId);
      return response.url;
    } catch (error) {
      console.error('Failed to create payment link:', error);
      throw error;
    }
  }

  /**
   * Cancel user subscription
   */
  static async cancelSubscription(): Promise<void> {
    try {
      await StripeService.cancelSubscriptionApiV1StripeSubscriptionCancelPost();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate subscription (placeholder for future API implementation)
   */
  static async reactivateSubscription(): Promise<void> {
    try {
      // This would need to be implemented in the backend API
      // For now, we'll just throw an error indicating it's not implemented
      throw new Error('Reactivate subscription API not implemented yet');
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  /**
   * Update payment method
   */
  static async updatePaymentMethod(priceId: string): Promise<string> {
    try {
      const paymentUrl = await this.createPaymentLink(priceId);
      return paymentUrl;
    } catch (error) {
      console.error('Failed to update payment method:', error);
      throw error;
    }
  }
}
