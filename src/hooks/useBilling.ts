import React, { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BillingInfo } from '@/types/subscription';
import { BillingService } from '@/services/billingService';
import { useAppFocus } from '@/hooks/useAppFocus';

export const useBilling = () => {
  const [billingInfo, setBillingInfo] = React.useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = React.useState(true);
  const [showPaymentWebView, setShowPaymentWebView] = React.useState(false);
  const [paymentUrl, setPaymentUrl] = React.useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user subscription
  const fetchSubscription = useCallback(async () => {
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
  }, [user, toast]);

  // Create payment link
  const createPaymentLink = async (priceId: string): Promise<string | null> => {
    console.log('🔗 createPaymentLink called with priceId:', priceId);
    try {
      setIsLoading(true);
      console.log('📡 Calling BillingService.createPaymentLink...');
      const paymentUrl = await BillingService.createPaymentLink(priceId);
      console.log('✅ Payment URL received:', paymentUrl);
      
      if (paymentUrl) {
        // WebView로 결제 페이지 열기
        setPaymentUrl(paymentUrl);
        setShowPaymentWebView(true);
        
        toast({
          title: "Payment page opening",
          description: "Complete your payment in the window below.",
        });
      }
      
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
    console.log('🔄 updatePaymentMethod called with priceId:', priceId);
    try {
      console.log('📡 Calling BillingService.updatePaymentMethod...');
      const paymentUrl = await BillingService.updatePaymentMethod(priceId);
      console.log('✅ Payment URL received in updatePaymentMethod:', paymentUrl);
      
      if (paymentUrl) {
        // WebView로 결제 페이지 열기
        setPaymentUrl(paymentUrl);
        setShowPaymentWebView(true);
        
        toast({
          title: "Payment method update",
          description: "Please update your payment method in the window below.",
        });
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

  // Open customer portal
  const openCustomerPortal = async () => {
    try {
      setIsLoading(true);
      const portalUrl = await BillingService.createCustomerPortalSession();
      
      if (portalUrl) {
        // Open customer portal in new tab
        window.open(portalUrl, '_blank');
        
        toast({
          title: "Customer portal opened",
          description: "Manage your subscription and payment methods in the new tab.",
        });
      }
    } catch (error: any) {
      console.error('Failed to open customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Refresh subscription data when app gains focus
  // This helps detect payment completion when user returns from external payment flow
  // WebView가 열려있을 때는 포커스 이벤트를 완전히 무시
  useAppFocus(() => {
    if (user) {
      console.log('App focused, refreshing subscription data...');
      fetchSubscription();
    }
  }, [user], showPaymentWebView);

  // WebView 핸들러들 - useCallback으로 메모이제이션
  const handlePaymentComplete = useCallback(() => {
    console.log('✅ Payment completed successfully - closing WebView and refreshing billing data');
    setShowPaymentWebView(false);
    setPaymentUrl('');
    
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed successfully. Updating your subscription...",
    });
    
    // 구독 정보 새로고침
    fetchSubscription();
  }, [toast, fetchSubscription]);

  const handlePaymentCancel = useCallback(() => {
    console.log('❌ Payment cancelled');
    setShowPaymentWebView(false);
    setPaymentUrl('');
    
    toast({
      title: "Payment Cancelled",
      description: "Payment was cancelled. You can try again anytime.",
    });
  }, [toast]);

  const handleCloseWebView = useCallback(() => {
    setShowPaymentWebView(false);
    setPaymentUrl('');
  }, []);

  return {
    billingInfo,
    isLoading,
    isLoadingSubscription,
    showPaymentWebView,
    paymentUrl,
    fetchSubscription,
    createPaymentLink,
    cancelSubscription,
    reactivateSubscription,
    updatePaymentMethod,
    openCustomerPortal,
    handlePaymentComplete,
    handlePaymentCancel,
    handleCloseWebView,
  };
};
