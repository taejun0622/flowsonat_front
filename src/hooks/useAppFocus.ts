import { useEffect, useRef } from 'react';

/**
 * Hook to detect when the app window gains focus
 * Useful for refreshing data when user returns from external payment flows
 */
export const useAppFocus = (callback: () => void, dependencies: any[] = [], shouldIgnoreFocus: boolean = false) => {
  const callbackRef = useRef(callback);
  const lastFocusTime = useRef<number>(0);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleFocus = () => {
      // WebView가 열려있을 때는 포커스 이벤트 무시
      if (shouldIgnoreFocus) {
        console.log('Focus event ignored (WebView is open)');
        return;
      }

      const now = Date.now();
      // Debounce focus events (ignore if less than 2 seconds since last focus)
      if (now - lastFocusTime.current < 2000) {
        console.log('Focus event ignored (too soon)');
        return;
      }
      lastFocusTime.current = now;
      
      console.log('App gained focus, executing callback');
      callbackRef.current();
    };

    // Listen for window focus events
    window.addEventListener('focus', handleFocus);
    
    // For Electron apps, also listen for visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [...dependencies, shouldIgnoreFocus]);
};
