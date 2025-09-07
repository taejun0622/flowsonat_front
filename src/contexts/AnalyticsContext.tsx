import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ga4 } from '@/services/ga4';
import { getGA4MeasurementId } from '@/config/env';

interface AnalyticsContextType {
  trackScreenView: (screenName: string, screenClass?: string) => void;
  trackEvent: (name: string, params?: Record<string, any>) => void;
  trackButtonClick: (buttonName: string, location?: string) => void;
  trackFeatureUsage: (featureName: string, action?: string) => void;
  trackError: (errorName: string, errorMessage?: string, fatal?: boolean) => void;
  trackUserAction: (action: string, category?: string) => void;
  trackInstagramAction: (action: string, accountId?: string) => void;
  trackSubscriptionEvent: (eventType: 'subscribe' | 'cancel' | 'upgrade' | 'downgrade') => void;
  isEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps): JSX.Element {
  const location = useLocation();
  const isEnabled = !!getGA4MeasurementId();

  // Initialize GA4 when the provider mounts
  useEffect(() => {
    if (isEnabled) {
      ga4.initialize();
    }
  }, [isEnabled]);

  // Track screen views automatically when route changes (GA4 desktop app standard)
  useEffect(() => {
    if (isEnabled) {
      const screenName = location.pathname.replace('/', '') || 'dashboard';
      const screenClass = 'app_screen';

      ga4.trackScreenView(screenName, screenClass);
    }
  }, [location, isEnabled]);

  const contextValue: AnalyticsContextType = {
    trackScreenView: ga4.trackScreenView.bind(ga4),
    trackEvent: ga4.trackEvent.bind(ga4),
    trackButtonClick: ga4.trackButtonClick.bind(ga4),
    trackFeatureUsage: ga4.trackFeatureUsage.bind(ga4),
    trackError: ga4.trackError.bind(ga4),
    trackUserAction: ga4.trackUserAction.bind(ga4),
    trackInstagramAction: ga4.trackInstagramAction.bind(ga4),
    trackSubscriptionEvent: ga4.trackSubscriptionEvent.bind(ga4),
    isEnabled,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}