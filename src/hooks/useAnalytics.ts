import { useCallback } from 'react'

export const useAnalytics = () => {
  const trackEvent = useCallback(async (name: string, params?: Record<string, any>) => {
    try {
      if (window.analytics) {
        await window.analytics.trackEvent(name, params)
      }
    } catch (error) {
      console.warn('Analytics trackEvent failed:', error)
    }
  }, [])

  const trackScreen = useCallback(async (screenName: string, screenClass?: string) => {
    try {
      if (window.analytics) {
        await window.analytics.trackScreen(screenName, screenClass)
      }
    } catch (error) {
      console.warn('Analytics trackScreen failed:', error)
    }
  }, [])

  const trackError = useCallback(async (error: string | Error, fatal: boolean = false) => {
    try {
      if (window.analytics) {
        const errorMessage = typeof error === 'string' ? error : error.message
        await window.analytics.trackError(errorMessage, fatal)
      }
    } catch (err) {
      console.warn('Analytics trackError failed:', err)
    }
  }, [])

  const trackUserAction = useCallback(async (
    action: string, 
    category?: string, 
    label?: string, 
    value?: number
  ) => {
    try {
      if (window.analytics) {
        await window.analytics.trackUserAction(action, category, label, value)
      }
    } catch (error) {
      console.warn('Analytics trackUserAction failed:', error)
    }
  }, [])

  return {
    trackEvent,
    trackScreen,
    trackError,
    trackUserAction
  }
}

// 페이지 이동 추적을 위한 커스텀 훅
export const usePageTracking = () => {
  const { trackScreen } = useAnalytics()

  const trackPageView = useCallback((pageName: string, pageClass?: string) => {
    trackScreen(pageName, pageClass)
  }, [trackScreen])

  return { trackPageView }
}