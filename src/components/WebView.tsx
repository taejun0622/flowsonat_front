import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { InstagramWebViewScripts } from './InstagramWebViewLogic';

export interface WebViewHandle {
  reload: () => void;
}

interface WebViewProps {
  src: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onInstagramLogin?: (sessionData: any) => void;
  onLoginStatusCheck?: (isLoggedIn: boolean) => void;
  className?: string;
  instagramState?: string; // Instagram 상태 추가
}

export const WebView = forwardRef<WebViewHandle, WebViewProps>(({ 
  src,
  onLoad,
  onError,
  onInstagramLogin,
  onLoginStatusCheck,
  className = "",
  instagramState
}, ref) => {
  const webviewRef = useRef<any>(null);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  useImperativeHandle(ref, () => ({
    reload: () => {
      if (webviewRef.current) {
        webviewRef.current.reload();
      }
    }
  }));

  // 주기적으로 Instagram 로그인 상태 확인 (로그아웃 + 서버 미등록 상태에서만)
  useEffect(() => {
    if (!webviewRef.current || !src.includes('instagram.com')) return;
    
    // instagram_logged_out_server_unregistered 상태에서만 주기적 체크 실행
    if (instagramState !== 'instagram_logged_out_server_unregistered') {
      console.log('Periodic check skipped - not in unregistered state:', instagramState);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCheckTime < 3000) return; // 3초마다 체크
      
      setLastCheckTime(now);
      
      webviewRef.current.executeJavaScript(InstagramWebViewScripts.getPeriodicCheckScript()).then((result: string) => {
        try {
          const data = JSON.parse(result);
          console.log('Periodic check result:', data);
          
          if (data.type === 'INSTAGRAM_LOGIN_SUCCESS') {
            console.log('Instagram login detected via periodic check:', data.data);
            onInstagramLogin?.(data.data);
          } else if (data.type === 'INSTAGRAM_LOGIN_STATUS_CHECK') {
            console.log('Instagram login status check via periodic check:', data.data);
            onLoginStatusCheck?.(data.data.isLoggedIn);
          }
        } catch (error) {
          console.error('Error parsing periodic check result:', error);
        }
      }).catch((error: any) => {
        console.error('Error in periodic check:', error);
      });
    }, 5000); // 5초로 늘림

    return () => clearInterval(interval);
  }, [src, lastCheckTime, onInstagramLogin, onLoginStatusCheck, instagramState]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (event: any) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(event);
    };

    const handleDomReady = () => {
      setIsLoading(false);
      
      // Instagram 페이지인지 확인
      const isInstagram = src.includes('instagram.com');
      
      if (isInstagram && (onInstagramLogin || onLoginStatusCheck)) {
        // Instagram은 동적으로 콘텐츠를 로드하므로 지연 후 실행
        setTimeout(() => {
          webview.executeJavaScript(InstagramWebViewScripts.getDetailedLoginCheckScript());
        }, 2000); // 2초 지연
      }
    };

    const handleMessage = (event: any) => {
      console.log('WebView message received:', event);
      
      if (event.data && event.data.type === 'INSTAGRAM_LOGIN_SUCCESS') {
        console.log('Instagram login detected:', event.data.data);
        onInstagramLogin?.(event.data.data);
      } else if (event.data && event.data.type === 'INSTAGRAM_LOGIN_STATUS_CHECK') {
        console.log('Instagram login status check:', event.data.data);
        onLoginStatusCheck?.(event.data.data.isLoggedIn);
      }
    };

    webview.addEventListener('did-finish-load', handleLoad);
    webview.addEventListener('did-fail-load', handleError);
    webview.addEventListener('dom-ready', handleDomReady);
    window.addEventListener('message', handleMessage);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      webview.removeEventListener('did-fail-load', handleError);
      webview.removeEventListener('dom-ready', handleDomReady);
      window.removeEventListener('message', handleMessage);
    };
  }, [onLoad, onError, onInstagramLogin, onLoginStatusCheck, src]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">Failed to load content</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <webview
        ref={webviewRef}
        src={currentSrc}
        className="w-full h-full"
        partition="persist:ig"
        webpreferences="contextIsolation=yes, nodeIntegration=no"
        allowpopups={true}
        security="true"
      />
    </div>
  );
});
