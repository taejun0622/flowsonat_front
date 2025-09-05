import React from 'react';
import { Check, Crown, Zap, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SUBSCRIPTION_PLANS } from '@/constants/subscription';
import { useBilling } from '@/hooks/useBilling';
import { StripePaymentWebView } from '@/components/StripePaymentWebView';

interface SubscriptionPlanSelectorProps {
  onPlanSelect?: (planId: string) => void;
  currentPlanId?: string;
}

export const SubscriptionPlanSelector = ({
  onPlanSelect,
  currentPlanId,
}: SubscriptionPlanSelectorProps) => {
  const { 
    createPaymentLink, 
    isLoading,
    showPaymentWebView,
    paymentUrl,
    handlePaymentComplete,
    handlePaymentCancel,
    handleCloseWebView
  } = useBilling();

  // Test function to check if Electron API is working
  const testElectronAPI = async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      console.log('Testing Electron API...');
      console.log('electronAPI exists:', !!electronAPI);
      console.log('openExternal exists:', !!(electronAPI && electronAPI.openExternal));
      
      if (electronAPI && electronAPI.openExternal) {
        console.log('Testing with a simple URL...');
        await electronAPI.openExternal('https://www.google.com');
        console.log('Test successful!');
      } else {
        console.log('Electron API not available, using window.open');
        window.open('https://www.google.com', '_blank');
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    console.log('🚀 handlePlanSelect called with planId:', planId);
    
    if (onPlanSelect) {
      console.log('📞 onPlanSelect callback exists, calling it');
      onPlanSelect(planId);
      return;
    }

    console.log('💳 Creating payment link...');
    const paymentUrl = await createPaymentLink(planId);
    console.log('Payment URL created:', paymentUrl);
    
    // WebView는 useBilling 훅에서 자동으로 처리됩니다
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Basic Plan':
        return <Zap className="h-6 w-6" />;
      case 'Pro Plan':
        return <Crown className="h-6 w-6" />;
      case 'Enterprise Plan':
        return <Building className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  return (
    <div>
      {/* Test button for debugging */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">Debug: Test Electron API</p>
        <button 
          onClick={testElectronAPI}
          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
        >
          Test Open External
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
        const isCurrentPlan = currentPlanId === plan.id;
        const isPopular = plan.name === 'Pro Plan';

        return (
          <Card
            key={plan.id}
            className={`relative bg-black/10 backdrop-blur-sm border-black/20 transition-all duration-200 hover:scale-105 ${
              isCurrentPlan ? 'ring-2 ring-blue-500' : ''
            } ${isPopular ? 'ring-2 ring-yellow-500' : ''}`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            {isCurrentPlan && (
              <div className="absolute -top-3 right-3">
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Current
                </span>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <div className="p-2 rounded-full bg-black/10">
                  {getPlanIcon(plan.name)}
                </div>
              </div>
              <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-gray-300">
                <span className="text-2xl font-bold text-white">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                /{plan.interval}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  isCurrentPlan
                    ? 'bg-gray-600 text-white cursor-not-allowed'
                    : isPopular
                    ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => {
                  console.log('🔘 Button clicked for plan:', plan.id);
                  handlePlanSelect(plan.id);
                }}
                disabled={isLoading || isCurrentPlan}
              >
                {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
      </div>

      {/* Stripe Payment WebView */}
      {showPaymentWebView && paymentUrl && (
        <StripePaymentWebView
          paymentUrl={paymentUrl}
          onPaymentComplete={handlePaymentComplete}
          onPaymentCancel={handlePaymentCancel}
          onClose={handleCloseWebView}
        />
      )}
    </div>
  );
};
