import React, { useState, useRef, useEffect } from 'react';
import { WebViewProps } from '../types';
import { useBrowserExtension } from '../../browser-extension/hooks/useBrowserExtension';
import BrowserExtensionControls from '../../browser-extension/components/BrowserExtensionControls';
import { cursorAnimations } from '../../browser-extension/utils/cursorStyles';

const FullScreenWebView: React.FC<WebViewProps> = ({
  url = 'https://www.instagram.com',
  onClose,
  onLoginSuccess,
  webviewRef: externalWebviewRef
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const internalWebviewRef = useRef<HTMLWebViewElement>(null);
  const webviewRef = externalWebviewRef || internalWebviewRef;

  // 브라우저 익스텐션 훅 사용 (Instagram 로그인에서는 비활성화)
  const { state: extensionState, toggleExtension, isWebViewLoaded } = useBrowserExtension({
    webviewRef: webviewRef,
    onWebViewLoad: () => {
      setIsLoading(false);
      console.log('WebView loaded successfully');
    },
    onWebViewError: (errorMessage) => {
      setError(errorMessage);
      setIsLoading(false);
      console.error('WebView error:', errorMessage);
    }
  });

  // Instagram 로그인 페이지에서는 extension 비활성화
  const isInstagramLogin = url.includes('instagram.com');



  // 커서 애니메이션 스타일 추가
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cursorAnimations;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // webview 로딩 상태 직접 감지
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoadStop = () => {
      console.log('WebView load stopped');
      setIsLoading(false);
    };

    const handleDidFinishLoad = () => {
      console.log('WebView did finish load');
      setIsLoading(false);
    };

    const handleDomReady = () => {
      console.log('WebView DOM ready');
      setIsLoading(false);
    };

    webview.addEventListener('did-stop-loading', handleLoadStop);
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('dom-ready', handleDomReady);

    return () => {
      webview.removeEventListener('did-stop-loading', handleLoadStop);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('dom-ready', handleDomReady);
    };
  }, [webviewRef]);

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
          WebView {extensionState.isActive && '(Extension Active)'}
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
            <div style={{ fontSize: '14px', color: '#ccc' }}>
              {isInstagramLogin 
                ? 'Loading Instagram login page...' 
                : isWebViewLoaded 
                  ? 'Extension will be activated automatically' 
                  : 'Please wait'
              }
            </div>
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
        allowpopups={true}
      />

      {/* Browser Extension Controls - Instagram 로그인에서는 숨김 */}
      {!url.includes('instagram.com') && (
        <BrowserExtensionControls
          state={extensionState}
          onToggle={toggleExtension}
        />
      )}
    </div>
  );
};

export default FullScreenWebView;
