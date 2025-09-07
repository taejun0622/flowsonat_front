import { getGA4MeasurementId, getGA4ApiSecret, isProduction, getAppVersion } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';

interface GA4Event {
  name: string;
  params?: Record<string, any>;
}

interface MeasurementProtocolPayload {
  client_id: string;
  events: GA4Event[];
  user_properties?: Record<string, { value: any }>;
}

interface EventBatch {
  events: GA4Event[];
  timestamp: number;
}

class GA4Service {
  private isInitialized = false;
  private measurementId: string | undefined;
  private apiSecret: string | undefined;
  private clientId: string;
  private sessionId: string;
  private eventQueue: GA4Event[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly maxBatchSize = 25;
  private readonly batchDelayMs = 1000; // 1초 후 배치 전송

  constructor() {
    this.measurementId = getGA4MeasurementId();
    this.apiSecret = getGA4ApiSecret();
    this.clientId = this.getOrCreateClientId();
    this.sessionId = this.generateSessionId();
  }

  private getOrCreateClientId(): string {
    const stored = localStorage.getItem('ga4_client_id');
    if (stored) {
      return stored;
    }
    
    const newClientId = uuidv4();
    localStorage.setItem('ga4_client_id', newClientId);
    return newClientId;
  }

  private generateSessionId(): string {
    return Date.now().toString();
  }

  async initialize(): Promise<void> {
    console.log('🔍 GA4 Service initialize() called');
    console.log('  - isInitialized:', this.isInitialized);
    console.log('  - measurementId:', this.measurementId);
    console.log('  - apiSecret:', this.apiSecret ? '[SET]' : '[NOT SET]');
    
    if (this.isInitialized || !this.measurementId) {
      console.log('  → Skipping initialization (already initialized or no Measurement ID)');
      return;
    }

    try {
      this.isInitialized = true;
      console.log('✅ GA4 Service (Measurement Protocol) initialized:', this.measurementId);
      
      // Send multiple events to ensure client registration
      
      // 1. Send multiple standard events without debug_mode to register client
      await this.sendEventBatch([
        {
          name: 'page_view', // GA4가 잘 이해하는 표준 이벤트
          params: {
            page_title: 'FlowSonat App',
            page_location: 'app://flowsonat/main',
            page_path: '/main',
            session_id: this.sessionId,
            engagement_time_msec: 1
          }
        },
        {
          name: 'user_engagement',
          params: {
            session_id: this.sessionId,
            engagement_time_msec: 100
          }
        }
      ], false);
      
      // 2. Wait and send initial session event with debug_mode
      setTimeout(async () => {
        await this.sendEventBatch([
          {
            name: 'app_session_start',
            params: {
              session_id: this.sessionId,
              engagement_time_msec: 1
            }
          }
        ], true); // true = force debug_mode
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to initialize GA4 Service:', error);
    }
  }

  private async sendEventBatch(events: GA4Event[], forceDebugMode?: boolean): Promise<void> {
    if (!this.isInitialized || !this.measurementId || !this.apiSecret) {
      if (!isProduction()) {
        console.log('GA4 (dev - batch):', events);
      }
      return;
    }

    // Use Electron main process for analytics if available (avoids CORS issues)
    if (typeof window !== 'undefined' && window.analytics) {
      console.log('✅ Using Electron analytics for batch of', events.length, 'events');
      try {
        // Send events individually through Electron (it will batch internally)
        for (const event of events) {
          await window.analytics.trackEvent(event.name, {
            ...event.params,
            session_id: this.sessionId,
            app_name: 'FlowSonat',
            app_version: getAppVersion(),
            platform: 'desktop',
            os: this.getOS(),
          });
        }
        return;
      } catch (error) {
        console.warn('Failed to send batch via Electron analytics, falling back to direct:', error);
      }
    }

    // Now we can send in all environments thanks to Vite proxy
    // Log for debugging but don't block

    try {
      // Use Vite proxy in development mode to avoid CORS
      const isDev = !isProduction();
      const isViteDevMode = isDev && window.location.protocol.startsWith('http');
      
      let url: string;
      if (isViteDevMode) {
        // Use Vite proxy for development - always use /mp/collect (not debug endpoint)
        url = `/ga4-mp/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;
      } else {
        // Direct connection for production or Electron
        const host = 'www.google-analytics.com';
        const path = '/mp/collect'; // Always use standard endpoint
        url = `https://${host}${path}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;
      }

      // Determine if we should add debug_mode
      const shouldAddDebugMode = forceDebugMode !== undefined ? forceDebugMode : !isProduction();
      
      const enhancedEvents: GA4Event[] = events.map(event => ({
        name: event.name,
        params: {
          ...event.params,
          session_id: this.sessionId,
          app_name: 'FlowSonat',
          app_version: getAppVersion(),
          platform: 'desktop',
          os: this.getOS(),
          ...(shouldAddDebugMode && { debug_mode: 1 })
        }
      }));

      const payload: MeasurementProtocolPayload = {
        client_id: this.clientId,
        events: enhancedEvents,
        user_properties: {
          app_version: { value: getAppVersion() },
          platform: { value: 'desktop' }
        }
      };


      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle response
      if (response.status === 204 || response.status === 200) {
        // Success - only log in development
        if (!isProduction()) {
          console.log('✅ GA4 events sent:', events.length);
        }
      } else {
        console.warn('GA4 unexpected status:', response.status);
      }

    } catch (error) {
      console.error('Failed to send GA4 event batch:', error);
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

  private flushEventQueue(): void {
    if (this.eventQueue.length === 0) return;
    
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    
    this.sendEventBatch(eventsToSend).catch(console.error);
  }

  private scheduleFlush(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushEventQueue();
      this.batchTimeout = null;
    }, this.batchDelayMs);
  }

  async trackEvent(name: string, params: Record<string, any> = {}): Promise<void> {
    const event: GA4Event = { name, params };
    
    this.eventQueue.push(event);

    // Flush immediately if batch is full, otherwise schedule flush
    if (this.eventQueue.length >= this.maxBatchSize) {
      this.flushEventQueue();
    } else {
      this.scheduleFlush();
    }
  }

  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    const params: Record<string, any> = {
      screen_name: screenName
    };
    
    if (screenClass) {
      params.screen_class = screenClass;
    }

    await this.trackEvent('screen_view', params);
  }

  // Enhanced convenience methods following GA4 best practices
  async trackAppStart(): Promise<void> {
    await this.trackEvent('application_start', {
      app_version: getAppVersion(),
    });
  }

  async trackAppClose(): Promise<void> {
    // Flush any remaining events before closing
    this.flushEventQueue();
    
    await this.trackEvent('application_close', {
      session_duration: Date.now() - parseInt(this.sessionId),
    });
  }

  async trackButtonClick(buttonName: string, location?: string): Promise<void> {
    await this.trackEvent('button_click', {
      button_name: buttonName,
      location: location,
    });
  }

  async trackFeatureUsage(featureName: string, action?: string): Promise<void> {
    await this.trackEvent('feature_usage', {
      feature_name: featureName,
      action: action,
    });
  }

  async trackError(errorName: string, errorMessage?: string, fatal: boolean = false): Promise<void> {
    await this.trackEvent('exception', {
      description: errorMessage || errorName,
      fatal: fatal,
    });
  }

  async trackUserAction(action: string, category: string = 'user_actions'): Promise<void> {
    await this.trackEvent('user_action', {
      action: action,
      category: category,
    });
  }

  // Instagram automation specific events
  async trackInstagramAction(action: string, accountId?: string): Promise<void> {
    await this.trackEvent('instagram_action', {
      action: action,
      has_account_id: !!accountId, // Don't send actual account IDs for privacy
    });
  }

  async trackSubscriptionEvent(eventType: 'subscribe' | 'cancel' | 'upgrade' | 'downgrade'): Promise<void> {
    await this.trackEvent('subscription_event', {
      event_type: eventType,
    });
  }

  async trackAutomationStart(automationType: string): Promise<void> {
    await this.trackEvent('automation_start', {
      automation_type: automationType,
    });
  }

  async trackAutomationComplete(automationType: string, success: boolean, duration?: number): Promise<void> {
    await this.trackEvent('automation_complete', {
      automation_type: automationType,
      success: success,
      duration_ms: duration,
    });
  }
}

export const ga4 = new GA4Service();