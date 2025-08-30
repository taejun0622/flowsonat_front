import React, { useRef, useEffect, useState } from 'react';

interface WebViewProps {
  src: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

export const WebView: React.FC<WebViewProps> = ({ 
  src, 
  onLoad, 
  onError, 
  className = "" 
}) => {
  const webviewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
    };

    webview.addEventListener('did-finish-load', handleLoad);
    webview.addEventListener('did-fail-load', handleError);
    webview.addEventListener('dom-ready', handleDomReady);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      webview.removeEventListener('did-fail-load', handleError);
      webview.removeEventListener('dom-ready', handleDomReady);
    };
  }, [onLoad, onError]);

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
        src={src}
        className="w-full h-full"
        webpreferences="contextIsolation=yes, nodeIntegration=no"
        allowpopups={true}
        security="true"
      />
    </div>
  );
};
