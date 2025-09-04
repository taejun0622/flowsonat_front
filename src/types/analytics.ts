export interface AnalyticsAPI {
  trackEvent: (name: string, params?: Record<string, any>) => Promise<{ success: boolean }>
  trackScreen: (screenName: string, screenClass?: string) => Promise<{ success: boolean }>
  trackError: (error: string, fatal?: boolean) => Promise<{ success: boolean }>
  trackUserAction: (
    action: string, 
    category?: string, 
    label?: string, 
    value?: number
  ) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    analytics: AnalyticsAPI
  }
}

export {}