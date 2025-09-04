import { getGoogleAnalyticsId, getGAApiSecret, isProduction, getAppVersion } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';

export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface CustomEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface MeasurementProtocolPayload {
  client_id: string;
  events: Array<{
    name: string;
    params?: Record<string, any>;
  }>;
  user_properties?: Record<string, any>;
}

class AnalyticsService {
  private isInitialized = false;
  private gaId: string | undefined;
  private clientId: string;
  private sessionId: string;
  private apiSecret: string | undefined;
  private measurementEndpoint = 'https://www.google-analytics.com/mp/collect';
  
  constructor() {
    this.gaId = getGoogleAnalyticsId();
    this.clientId = this.getOrCreateClientId();
    this.sessionId = this.generateSessionId();
    this.apiSecret = getGAApiSecret();
  }

  private getOrCreateClientId(): string {
    const stored = localStorage.getItem('ga_client_id');
    if (stored) {
      return stored;
    }
    
    const newClientId = uuidv4();
    localStorage.setItem('ga_client_id', newClientId);
    return newClientId;
  }

  private generateSessionId(): string {
    return Date.now().toString();
  }

  async initialize(): Promise<void> {
    console.log('🔍 Analytics initialize() called');
    console.log('  - isInitialized:', this.isInitialized);
    console.log('  - gaId:', this.gaId);
    console.log('  - apiSecret:', this.apiSecret ? '[SET]' : '[NOT SET]');
    
    if (this.isInitialized || !this.gaId) {
      console.log('  → Skipping initialization (already initialized or no GA ID)');
      return;
    }

    try {
      this.isInitialized = true;
      console.log('✅ Google Analytics (Measurement Protocol) initialized:', this.gaId);
      
      // Send initial session_start event
      await this.sendEvent('session_start', {
        session_id: this.sessionId,
        engagement_time_msec: 1
      });
    } catch (error) {
      console.error('❌ Failed to initialize Google Analytics:', error);
    }
  }

  private async sendEvent(eventName: string, params: Record<string, any> = {}): Promise<void> {
    if (!this.isInitialized || !this.gaId || !this.apiSecret) {
      if (!isProduction()) {
        console.log('Analytics (dev):', eventName, params);
      }
      return;
    }

    // Skip actual sending in browser development mode due to CORS
    if (!isProduction() && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      console.log('Analytics (browser dev mode):', eventName, params);
      console.log('  → Would send to GA Measurement Protocol');
      console.log('  → Payload:', JSON.stringify({
        client_id: this.clientId,
        events: [{ name: eventName, params }],
        user_properties: { app_version: { value: getAppVersion() }, platform: { value: 'desktop' } }
      }, null, 2));
      return;
    }

    try {
      const payload: MeasurementProtocolPayload = {
        client_id: this.clientId,
        events: [
          {
            name: eventName,
            params: {
              ...params,
              session_id: this.sessionId,
              app_name: 'FlowSonat',
              app_version: getAppVersion(),
              platform: 'desktop',
              os: this.getOS(),
            }
          }
        ],
        user_properties: {
          app_version: {
            value: getAppVersion()
          },
          platform: {
            value: 'desktop'
          }
        }
      };

      const url = `${this.measurementEndpoint}?measurement_id=${this.gaId}&api_secret=${this.apiSecret}`;
      
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private getOS(): string {
    if (typeof navigator !== 'undefined') {
      const platform = navigator.platform.toLowerCase();
      if (platform.includes('win')) return 'Windows';
      if (platform.includes('mac')) return 'macOS';
      if (platform.includes('linux')) return 'Linux';
    }
    return 'Unknown';
  }

  trackPageView(event: PageViewEvent): void {
    // Use custom protocol for desktop app URLs
    const appLocation = event.page_location.startsWith('http') 
      ? event.page_location 
      : `flowsonat-app://${event.page_path}`;
    
    this.sendEvent('page_view', {
      page_title: event.page_title,
      page_location: appLocation,
      page_path: event.page_path,
    });
  }

  trackEvent(event: CustomEvent): void {
    const params: Record<string, any> = {};
    
    if (event.event_category) params.event_category = event.event_category;
    if (event.event_label) params.event_label = event.event_label;
    if (event.value !== undefined) params.value = event.value;
    if (event.custom_parameters) {
      Object.assign(params, event.custom_parameters);
    }

    this.sendEvent(event.event_name, params);
  }

  // Convenience methods for common events
  trackButtonClick(buttonName: string, location?: string): void {
    this.sendEvent('button_click', {
      button_name: buttonName,
      location: location,
    });
  }

  trackFeatureUsage(featureName: string, action?: string): void {
    this.sendEvent('feature_usage', {
      feature_name: featureName,
      action: action,
    });
  }

  trackError(errorName: string, errorMessage?: string): void {
    this.sendEvent('app_error', {
      error_name: errorName,
      error_message: errorMessage,
      fatal: false,
    });
  }

  trackUserAction(action: string, category: string = 'user_actions'): void {
    this.sendEvent('user_action', {
      action: action,
      category: category,
    });
  }

  // Instagram automation specific events
  trackInstagramAction(action: string, accountId?: string): void {
    this.sendEvent('instagram_action', {
      action: action,
      has_account_id: !!accountId, // Don't send actual account IDs for privacy
    });
  }

  trackSubscriptionEvent(eventType: 'subscribe' | 'cancel' | 'upgrade' | 'downgrade'): void {
    this.sendEvent('subscription_event', {
      event_type: eventType,
    });
  }

  // Enhanced events for desktop app
  trackAppStart(): void {
    this.sendEvent('app_start', {
      app_version: getAppVersion(),
    });
  }

  trackAppClose(): void {
    this.sendEvent('app_close', {
      session_duration: Date.now() - parseInt(this.sessionId),
    });
  }

  trackAutomationStart(automationType: string): void {
    this.sendEvent('automation_start', {
      automation_type: automationType,
    });
  }

  trackAutomationComplete(automationType: string, success: boolean, duration?: number): void {
    this.sendEvent('automation_complete', {
      automation_type: automationType,
      success: success,
      duration_ms: duration,
    });
  }
}

export const analytics = new AnalyticsService();