import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, X } from 'lucide-react';

interface TrialOverNotificationProps {
  onGoToBilling: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const TrialOverNotification: React.FC<TrialOverNotificationProps> = ({
  onGoToBilling,
  onDismiss,
  showDismiss = true,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-orange-800 dark:text-orange-200">
                Trial Period Ended
              </CardTitle>
            </div>
            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-orange-700 dark:text-orange-300 mb-4">
            Your trial period has ended. To continue using FlowSonat, please upgrade to a paid plan.
          </CardDescription>
          <div className="flex space-x-2">
            <Button
              onClick={onGoToBilling}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Go to Billing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Banner version for dashboard
export const TrialOverBanner: React.FC<TrialOverNotificationProps> = ({
  onGoToBilling,
  onDismiss,
  showDismiss = true,
}) => {
  return (
    <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-orange-800 dark:text-orange-200 font-semibold">
                Trial Period Ended
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                Your trial period has ended. To continue using FlowSonat, please upgrade to a paid plan.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              onClick={onGoToBilling}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Go to Billing
            </Button>
            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
