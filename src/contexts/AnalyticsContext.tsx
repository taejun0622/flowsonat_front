import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, PageViewEvent, CustomEvent } from '@/services/analytics';
import { getGoogleAnalyticsId } from '@/config/env';

interface AnalyticsContextType {
  trackPageView: (event: Omit<PageViewEvent, 'page_location'>) => void;
  trackEvent: (event: CustomEvent) => void;
  trackButtonClick: (buttonName: string, location?: string) => void;
  trackFeatureUsage: (featureName: string, action?: string) => void;
  trackError: (errorName: string, errorMessage?: string) => void;
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
  const isEnabled = !!getGoogleAnalyticsId();

  // Initialize analytics when the provider mounts
  useEffect(() => {
    if (isEnabled) {
      analytics.initialize();
    }
  }, [isEnabled]);

  // Track page views automatically when route changes
  useEffect(() => {
    if (isEnabled) {
      const pageTitle = document.title || 'FlowSonat';
      const pageLocation = window.location.href;
      const pagePath = location.pathname + location.search + location.hash;

      analytics.trackPageView({
        page_title: pageTitle,
        page_location: pageLocation,
        page_path: pagePath,
      });
    }
  }, [location, isEnabled]);

  const contextValue: AnalyticsContextType = {
    trackPageView: (event) => {
      analytics.trackPageView({
        ...event,
        page_location: window.location.href,
      });
    },
    trackEvent: analytics.trackEvent.bind(analytics),
    trackButtonClick: analytics.trackButtonClick.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackInstagramAction: analytics.trackInstagramAction.bind(analytics),
    trackSubscriptionEvent: analytics.trackSubscriptionEvent.bind(analytics),
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