import React, { useState, useRef, useEffect } from 'react';
import { WebViewProps } from '../types';

const FullScreenWebView: React.FC<WebViewProps> = ({
  url = 'https://www.instagram.com',
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webviewRef = useRef<HTMLWebViewElement>(null);

  useEffect(() => {
    const handleLoad = () => {
      setIsLoading(false);
      console.log('WebView loaded successfully');
    };

    const handleError = (event: any) => {
      const errorMessage = 'Failed to load page';
      setError(errorMessage);
      setIsLoading(false);
      console.error('WebView error:', errorMessage);
    };

    const webview = webviewRef.current;
    if (webview) {
      webview.addEventListener('did-finish-load', handleLoad);
      webview.addEventListener('did-fail-load', handleError);

      return () => {
        webview.removeEventListener('did-finish-load', handleLoad);
        webview.removeEventListener('did-fail-load', handleError);
      };
    }
  }, []);

  const handleClose = () => {
    onClose?.();
  };

  const handleRefresh = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
      setIsLoading(true);
      setError(null);
    }
  };

  const handleGoBack = () => {
    if (webviewRef.current && webviewRef.current.canGoBack()) {
      webviewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webviewRef.current && webviewRef.current.canGoForward()) {
      webviewRef.current.goForward();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        height: '50px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleGoBack}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleGoForward}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Forward →
          </button>
          <button
            onClick={handleRefresh}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ↻ Refresh
          </button>
        </div>
        
        <div style={{ fontSize: '14px', color: '#ccc' }}>
          WebView
        </div>
        
        <button
          onClick={handleClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 2,
          color: '#fff',
          fontSize: '18px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }}>Loading...</div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>Please wait</div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(220,53,69,0.9)',
          zIndex: 3,
          color: '#fff',
          fontSize: '18px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }}>Error: {error}</div>
            <button
              onClick={handleRefresh}
              style={{
                padding: '10px 20px',
                backgroundColor: '#fff',
                color: '#dc3545',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* WebView */}
      <webview
        ref={webviewRef}
        src={url}
        style={{
          flex: 1,
          width: '100%',
          height: '100%'
        }}
        webpreferences="nodeIntegration=no, contextIsolation=yes"
        allowpopups="true"
      />
    </div>
  );
};

export default FullScreenWebView;
