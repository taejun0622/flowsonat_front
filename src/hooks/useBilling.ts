import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BillingInfo } from '@/types/subscription';
import { BillingService } from '@/services/billingService';

export const useBilling = () => {
  const [billingInfo, setBillingInfo] = React.useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = React.useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user subscription
  const fetchSubscription = async () => {
    if (!user) return;
    
    try {
      setIsLoadingSubscription(true);
      const billingData = await BillingService.getUserSubscription();
      setBillingInfo(billingData);
    } catch (error: any) {
      console.error('Failed to fetch subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Create payment link
  const createPaymentLink = async (priceId: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      const paymentUrl = await BillingService.createPaymentLink(priceId);
      
      toast({
        title: "Payment link created",
        description: "Redirecting to payment page...",
      });
      
      return paymentUrl;
    } catch (error: any) {
      console.error('Failed to create payment link:', error);
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      await BillingService.cancelSubscription();
      
      toast({
        title: "Subscription canceled",
        description: "Your subscription will be canceled at the end of the current billing period.",
      });
      
      // Refresh subscription data
      await fetchSubscription();
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reactivate subscription (if canceled)
  const reactivateSubscription = async () => {
    try {
      setIsLoading(true);
      await BillingService.reactivateSubscription();
      
      toast({
        title: "Subscription reactivated",
        description: "Your subscription has been reactivated.",
      });
      
      // Refresh subscription data
      await fetchSubscription();
    } catch (error: any) {
      console.error('Failed to reactivate subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update payment method
  const updatePaymentMethod = async (priceId: string) => {
    try {
      const paymentUrl = await BillingService.updatePaymentMethod(priceId);
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Failed to update payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    fetchSubscription();
  }, [user]);

  return {
    billingInfo,
    isLoading,
    isLoadingSubscription,
    fetchSubscription,
    createPaymentLink,
    cancelSubscription,
    reactivateSubscription,
    updatePaymentMethod,
  };
};
