import React from 'react';
import { CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const BillingTab: React.FC = () => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <CreditCard className="h-5 w-5 mr-2" />
          Billing & Subscription
        </CardTitle>
        <CardDescription className="text-gray-300">Payment management through Stripe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="p-6 border border-white/20 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Pro Plan</h3>
                <p className="text-sm text-gray-300">$29.99/month</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-300">Next Payment</span>
                <p className="text-sm font-medium text-white">Jan 15, 2024</p>
              </div>
            </div>
          </div>

          {/* Billing Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">
              <CreditCard className="h-4 w-4 mr-2" />
              Change Payment Method
            </Button>
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
              Change Subscription
            </Button>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="text-sm text-gray-300">Usage</div>
              <div className="text-lg font-semibold text-white">75%</div>
            </div>
            <div className="p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="text-sm text-gray-300">Remaining Credits</div>
              <div className="text-lg font-semibold text-white">1,250</div>
            </div>
            <div className="p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="text-sm text-gray-300">This Month's Spend</div>
              <div className="text-lg font-semibold text-white">$29.99</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
