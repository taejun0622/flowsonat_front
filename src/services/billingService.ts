import { StripeService } from '@/api/services/StripeService';
import { PaymentLinkResponse } from '@/api/models/PaymentLinkResponse';
import { CustomerPortalResponse } from '@/api/models/CustomerPortalResponse';
import { Subscription, BillingInfo, Invoice } from '@/types/subscription';
import { STRIPE_CONFIG } from '@/constants/subscription';

export class BillingService {
  /**
   * Get plan name from price ID
   */
  private static getPlanNameFromPriceId(priceId: string): string {
    // Map price IDs to plan names
    // You may need to update these mappings based on your actual Stripe price IDs
    const priceIdToPlanMap: Record<string, string> = {
      'price_1S3njeCWtfUyHnEExNTvaHpA': 'Basic Plan', // User's actual price ID
      'price_1S0mZgCVaHm33FAQxI3ZvEeD': 'Basic Plan', // Production price ID
      // Add more mappings as needed
    };
    
    return priceIdToPlanMap[priceId] || 'Basic Plan'; // Default to Basic Plan
  }

  /**
   * Get plan price from price ID
   */
  private static getPlanPriceFromPriceId(priceId: string): number {
    // Map price IDs to plan prices (in cents)
    // You may need to update these mappings based on your actual Stripe price IDs
    const priceIdToPriceMap: Record<string, number> = {
      'price_1S3njeCWtfUyHnEExNTvaHpA': 999, // $9.99 in cents - User's actual price ID
      'price_1S0mZgCVaHm33FAQxI3ZvEeD': 999, // $9.99 in cents - Production price ID
      // Add more mappings as needed
    };
    
    return priceIdToPriceMap[priceId] || 999; // Default to $9.99
  }

  /**
   * Get user subscription with transformed data
   */
  static async getUserSubscription(): Promise<BillingInfo> {
    try {
      const response = await StripeService.getUserSubscriptionApiV1StripeSubscriptionGet();
      
      // Debug: Log the actual API response
      console.log('🔍 API Response:', response);
      
      // Transform the API response to match our interfaces
      // API response structure: { subscription_id, status, price_id, current_period_start, current_period_end, cancel_at_period_end }
      const subscription: Subscription | null = response.subscription_id ? {
        id: response.subscription_id,
        status: response.status,
        current_period_start: response.current_period_start,
        current_period_end: response.current_period_end,
        cancel_at_period_end: response.cancel_at_period_end || false,
        plan: {
          id: response.price_id,
          name: this.getPlanNameFromPriceId(response.price_id),
          price: this.getPlanPriceFromPriceId(response.price_id),
          currency: 'USD',
          interval: 'month' as const,
        },
        usage: {
          current: 0,
          limit: 0,
          percentage: 0,
        },
        next_payment_date: response.current_period_end,
      } : null;

      // Debug: Log the transformed subscription
      console.log('🔄 Transformed Subscription:', subscription);

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
      // Debug environment variables (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('=== Environment Variables Debug ===');
        console.log('STRIPE_CONFIG.priceId:', STRIPE_CONFIG.priceId);
        console.log('Provided priceId:', priceId);
        console.log('=== End Environment Variables Debug ===');
      }
      
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
   * Note: This redirects to the customer portal since direct cancellation API is not available
   */
  static async cancelSubscription(): Promise<void> {
    try {
      // Since there's no direct cancel API, redirect to customer portal
      const portalUrl = await this.createCustomerPortalSession();
      window.open(portalUrl, '_blank');
    } catch (error) {
      console.error('Failed to open customer portal for subscription cancellation:', error);
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

  /**
   * Create customer portal session
   */
  static async createCustomerPortalSession(): Promise<string> {
    try {
      const response: CustomerPortalResponse = await StripeService.createCustomerPortalSessionApiV1StripeCustomerPortalPost();
      return response.url;
    } catch (error) {
      console.error('Failed to create customer portal session:', error);
      throw error;
    }
  }
}
