import React from 'react';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download,
  RefreshCw,
  Loader2,
  Check,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Invoice } from '@/types/subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { STRIPE_CONFIG } from '@/constants/subscription';
import { useComponentAnalytics, useButtonAnalytics, useSubscriptionAnalytics } from '@/hooks/useAnalyticsTracking';

export const BillingTab = () => {
  const { billingInfo, isLoading, isLoadingSubscription, cancelSubscription, reactivateSubscription, updatePaymentMethod } = useBilling();
  const { user } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = React.useState(false);

  // Analytics hooks
  useComponentAnalytics('BillingTab');
  const createButtonTracker = useButtonAnalytics();
  const { trackSubscriptionEvent, trackPlanView } = useSubscriptionAnalytics();

  const subscription = billingInfo?.subscription;
  const paymentMethod = billingInfo?.payment_method;
  const invoices: Invoice[] = billingInfo?.invoices || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'canceled':
        return 'text-red-400';
      case 'past_due':
        return 'text-yellow-400';
      case 'unpaid':
        return 'text-red-400';
      case 'trialing':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'past_due':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'unpaid':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'trialing':
        return <CheckCircle className="h-4 w-4 text-blue-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Assuming amount is in cents
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoadingSubscription) {
    return (
      <Card className="bg-black/10 backdrop-blur-sm border-black/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <span className="ml-2 text-white">Loading billing information...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card - Only show if subscription exists */}
      {subscription && (
        <Card className="bg-black/10 backdrop-blur-sm border-black/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <CreditCard className="h-5 w-5 mr-2" />
              Current Plan
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your active subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Plan Details */}
              <div className="p-6 border border-white/20 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{subscription.plan.name}</h3>
                    <p className="text-sm text-gray-300">
                      {formatCurrency(subscription.plan.price, subscription.plan.currency)}/{subscription.plan.interval}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(subscription.status)}
                    <span className={`text-sm font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-300">Current Period:</span>
                    <p className="text-white">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-300">Next Payment:</span>
                    <p className="text-white">{formatDate(subscription.next_payment_date)}</p>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                      <span className="text-yellow-400 text-sm">
                        Subscription will be canceled at the end of the current billing period
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              {paymentMethod && (
                <div className="p-4 border border-black/20 rounded-lg bg-black/5">
                  <h4 className="text-sm font-medium text-white mb-2">Payment Method</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-300" />
                      <span className="text-white">
                        {paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)} •••• {paymentMethod.last4}
                      </span>
                    </div>
                    <span className="text-sm text-gray-300">
                      Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                    </span>
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-black/20 rounded-lg bg-black/5">
                  <div className="text-sm text-gray-300">Usage</div>
                  <div className="text-lg font-semibold text-white">
                    {subscription.usage.percentage}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {subscription.usage.current} / {subscription.usage.limit}
                  </div>
                </div>
                <div className="p-4 border border-black/20 rounded-lg bg-black/5">
                  <div className="text-sm text-gray-300">Remaining Credits</div>
                  <div className="text-lg font-semibold text-white">
                    {subscription.usage.limit - subscription.usage.current}
                  </div>
                </div>
                <div className="p-4 border border-black/20 rounded-lg bg-black/5">
                  <div className="text-sm text-gray-300">This Month's Spend</div>
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(subscription.plan.price, subscription.plan.currency)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Plan Card - Only show if no subscription */}
      {!subscription && (
        <Card className="bg-black/10 backdrop-blur-sm border-black/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Zap className="h-5 w-5 mr-2" />
              Get Started
            </CardTitle>
            <CardDescription className="text-gray-300">
              Choose a plan to start using our services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <Card className="bg-black/10 backdrop-blur-sm border-black/20">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-full bg-black/10">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-xl">Basic Plan</CardTitle>
                  <CardDescription className="text-gray-300">
                    <span className="text-2xl font-bold text-white">$9.99</span>/month
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">Basic Instagram analytics</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">Up to 100 posts per month</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">Email support</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full bg-white text-gray-900 hover:bg-gray-100"
                    onClick={() => updatePaymentMethod(STRIPE_CONFIG.priceId)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Actions */}
      {subscription && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Billing Actions</CardTitle>
            <CardDescription className="text-gray-300">Manage your subscription and payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                className="w-full bg-white text-gray-900 hover:bg-gray-100"
                onClick={() => updatePaymentMethod(subscription.plan.id)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Update Payment Method
              </Button>
              
              {subscription.cancel_at_period_end ? (
                <Button 
                  variant="outline" 
                  className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                  onClick={() => setShowReactivateDialog(true)}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reactivate Subscription
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Invoices</CardTitle>
            <CardDescription className="text-gray-300">Your recent billing history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-white font-medium">Invoice #{invoice.id.slice(-8)}</p>
                      <p className="text-sm text-gray-300">{formatDate(invoice.created)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(invoice.amount, invoice.currency)}</p>
                      <p className={`text-sm ${
                        invoice.status === 'paid' ? 'text-green-400' : 
                        invoice.status === 'open' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </p>
                    </div>
                    {invoice.pdf_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:text-white"
                        onClick={() => window.open(invoice.pdf_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Cancel Subscription</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-black/30 text-white hover:bg-black/20"
            >
              Keep Subscription
            </Button>
            <Button
              onClick={async () => {
                await cancelSubscription();
                setShowCancelDialog(false);
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Subscription Dialog */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Reactivate Subscription</DialogTitle>
            <DialogDescription className="text-gray-300">
              Reactivate your subscription to continue using all features without interruption.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReactivateDialog(false)}
              className="border-black/30 text-white hover:bg-black/20"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await reactivateSubscription();
                setShowReactivateDialog(false);
              }}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
