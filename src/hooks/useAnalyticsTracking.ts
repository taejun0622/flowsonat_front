import { useCallback, useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';

/**
 * Hook for tracking component mount/unmount
 */
export function useComponentAnalytics(componentName: string) {
  const { trackFeatureUsage } = useAnalytics();

  useEffect(() => {
    trackFeatureUsage(componentName, 'view');
  }, [componentName, trackFeatureUsage]);
}

/**
 * Hook for tracking button clicks with automatic event binding
 */
export function useButtonAnalytics() {
  const { trackButtonClick } = useAnalytics();

  return useCallback(
    (buttonName: string, location?: string) => {
      return () => trackButtonClick(buttonName, location);
    },
    [trackButtonClick]
  );
}

/**
 * Hook for tracking form submissions
 */
export function useFormAnalytics() {
  const { trackEvent } = useAnalytics();

  const trackFormSubmit = useCallback(
    (formName: string, success: boolean = true) => {
      trackEvent({
        event_name: 'form_submit',
        event_category: 'forms',
        event_label: formName,
        custom_parameters: {
          success,
        },
      });
    },
    [trackEvent]
  );

  const trackFormValidation = useCallback(
    (formName: string, errors: string[]) => {
      trackEvent({
        event_name: 'form_validation_error',
        event_category: 'forms',
        event_label: formName,
        custom_parameters: {
          error_count: errors.length,
          errors: errors.join(', '),
        },
      });
    },
    [trackEvent]
  );

  return {
    trackFormSubmit,
    trackFormValidation,
  };
}

/**
 * Hook for tracking Instagram automation events
 */
export function useInstagramAnalytics() {
  const { trackInstagramAction } = useAnalytics();

  const trackAutomationStart = useCallback(
    (automationType: string) => {
      trackInstagramAction(`${automationType}_start`);
    },
    [trackInstagramAction]
  );

  const trackAutomationComplete = useCallback(
    (automationType: string, success: boolean = true, duration?: number) => {
      // Use the new analytics service method for better tracking
      if (typeof (window as any).__analytics?.trackAutomationComplete === 'function') {
        (window as any).__analytics.trackAutomationComplete(automationType, success, duration);
      } else {
        trackInstagramAction(`${automationType}_${success ? 'complete' : 'failed'}`);
      }
    },
    [trackInstagramAction]
  );

  const trackAccountConnect = useCallback(() => {
    trackInstagramAction('account_connect');
  }, [trackInstagramAction]);

  const trackAccountDisconnect = useCallback(() => {
    trackInstagramAction('account_disconnect');
  }, [trackInstagramAction]);

  return {
    trackAutomationStart,
    trackAutomationComplete,
    trackAccountConnect,
    trackAccountDisconnect,
  };
}

/**
 * Hook for tracking errors with automatic error boundary integration
 */
export function useErrorAnalytics() {
  const { trackError } = useAnalytics();

  const trackComponentError = useCallback(
    (componentName: string, error: Error) => {
      trackError(`${componentName}_error`, error.message);
    },
    [trackError]
  );

  const trackApiError = useCallback(
    (endpoint: string, status: number, message?: string) => {
      trackError(`api_error_${status}`, `${endpoint}: ${message || 'Unknown error'}`);
    },
    [trackError]
  );

  return {
    trackComponentError,
    trackApiError,
  };
}

/**
 * Hook for tracking subscription-related events
 */
export function useSubscriptionAnalytics() {
  const { trackSubscriptionEvent, trackEvent } = useAnalytics();

  const trackPlanView = useCallback(
    (planName: string) => {
      trackEvent({
        event_name: 'plan_view',
        event_category: 'subscription',
        event_label: planName,
      });
    },
    [trackEvent]
  );

  const trackPaymentAttempt = useCallback(
    (planName: string, success: boolean) => {
      trackEvent({
        event_name: 'payment_attempt',
        event_category: 'subscription',
        event_label: planName,
        custom_parameters: {
          success,
        },
      });
    },
    [trackEvent]
  );

  return {
    trackSubscriptionEvent,
    trackPlanView,
    trackPaymentAttempt,
  };
}