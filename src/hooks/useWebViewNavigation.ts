import { useState, useCallback } from 'react';

export const useWebViewNavigation = (initialUrl: string = 'https://www.instagram.com') => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  const navigateTo = useCallback((url: string) => {
    setCurrentUrl(url);
  }, []);

  const goBack = useCallback((webviewRef: React.RefObject<HTMLWebViewElement>) => {
    if (webviewRef.current) {
      webviewRef.current.goBack();
    }
  }, []);

  const goForward = useCallback((webviewRef: React.RefObject<HTMLWebViewElement>) => {
    if (webviewRef.current) {
      webviewRef.current.goForward();
    }
  }, []);

  const reload = useCallback((webviewRef: React.RefObject<HTMLWebViewElement>) => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  }, []);

  const loadUrl = useCallback((webviewRef: React.RefObject<HTMLWebViewElement>, url: string) => {
    if (webviewRef.current) {
      (webviewRef.current as any).loadURL(url);
      setCurrentUrl(url);
    }
  }, []);

  return {
    currentUrl,
    setCurrentUrl,
    navigateTo,
    goBack,
    goForward,
    reload,
    loadUrl
  };
};
