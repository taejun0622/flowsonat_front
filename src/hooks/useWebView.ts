import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseWebViewReturn {
  openWebView: (url: string) => void;
  openInBrowser: (url: string) => void;
  isElectron: boolean;
}

export const useWebView = (): UseWebViewReturn => {
  const navigate = useNavigate();
  const [isElectron] = useState(() => {
    return typeof window !== 'undefined' && (window as any).electronAPI?.isElectron === true;
  });

  const openWebView = useCallback((url: string) => {
    navigate(`/webview?url=${encodeURIComponent(url)}`);
  }, [navigate]);

  const openInBrowser = useCallback((url: string) => {
    if (isElectron && (window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      // Fallback for web environment
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [isElectron]);

  return {
    openWebView,
    openInBrowser,
    isElectron
  };
};
