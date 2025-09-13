import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { WebView, WebViewHandle } from './WebView';
import { useInstagramWebView } from '@/hooks/useInstagramWebView';
import { Button } from '@/components/ui/button';
import { InstagramUsernameConfirmModal } from './InstagramUsernameConfirmModal';
import { InstagramManualUsernameModal } from './InstagramManualUsernameModal';
import { useInstagram } from '@/contexts/InstagramContext';

interface InstagramConnectionFlowProps {
  className?: string;
}

export const InstagramConnectionFlow: React.FC<InstagramConnectionFlowProps> = ({ 
  className = "" 
}) => {
  const navigate = useNavigate();
  const { disconnectAccount, prepareWebViewForState } = useInstagram();
  const [currentUrl, setCurrentUrl] = useState<string>('https://www.instagram.com/accounts/login/');
  const [isLoading, setIsLoading] = useState(false);
  const [webviewKey, setWebviewKey] = useState(0);
  const webviewApiRef = useRef<WebViewHandle>(null);
  
  const {
    webViewStatus,
    modalState,
    isCheckingStatus,
    uiConfig,
    handleInstagramLoginDetected,
    handleInstagramStatusCheck,
    handleAction,
    handleConfirmConnection,
    handleManualUsername,
    handleManualUsernameConfirm,
    handleCancelConnection
  } = useInstagramWebView();

  // 뒤로가기 핸들러
  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Listen for reload requests from the main process
  React.useEffect(() => {
    if (window.IG) {
      const unsubscribe = window.IG.onReloadRequest(() => {
        console.log('Reload request received from main process. Remounting webview.');
        setWebviewKey(prevKey => prevKey + 1);
      });
      // return unsubscribe; // This will cause an error because ipcRenderer.on returns void
    }
  }, []);

  // 액션 버튼 클릭 핸들러
  const handleActionClick = useCallback(async (action: string) => {
    const result = await handleAction(action as any);
    if (result) {
      setCurrentUrl(result);
    }
  }, [handleAction]);

  // WebView 로드 완료 핸들러
  const handleWebViewLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // WebView 에러 핸들러
  const handleWebViewError = useCallback((error: any) => {
    console.error('WebView error:', error);
    setIsLoading(false);
  }, []);

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    webviewApiRef.current?.reload();
  }, []);

  // Instagram 로그인 감지 핸들러
  const handleInstagramLogin = useCallback((sessionData: any) => {
    console.log('=== InstagramLogoutFlow: Instagram Login Handler ===');
    console.log('Session data received in component:', sessionData);
    console.log('Calling handleInstagramLoginDetected...');
    handleInstagramLoginDetected(sessionData, window.location.pathname);
  }, [handleInstagramLoginDetected]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md border-b border-black/30">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-white hover:bg-black/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="h-4 w-px bg-white/20" />
          
          <div className="flex items-center space-x-2">
            {isCheckingStatus && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
            <span className="text-sm font-medium text-white">
              Instagram Login Flow
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-white hover:bg-black/20"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      {uiConfig.showStatusBar && (
        <div className={`px-4 py-2 border-b ${getStatusBarClass()}`}>
          <div className="flex items-center space-x-2">
            {renderStatusIcon()}
            <span className="text-sm font-medium">
              {uiConfig.description}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 bg-black/10 border-b border-black/20">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => uiConfig.primaryAction?.action && handleActionClick(uiConfig.primaryAction.action)}
            variant={uiConfig.primaryAction?.variant || 'default'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {uiConfig.primaryAction?.label}
          </Button>
          
          {uiConfig.secondaryAction && (
            <Button
              onClick={() => handleActionClick(uiConfig.secondaryAction!.action)}
              variant={uiConfig.secondaryAction.variant || 'outline'}
              className="border-black/30 text-white hover:bg-black/20"
            >
              {uiConfig.secondaryAction.label}
            </Button>
          )}
        </div>
        
        <div className="text-xs text-white/60">
          {webViewStatus.lastChecked?.toLocaleTimeString()}
        </div>
      </div>

      {/* WebView Container */}
      <div className="flex-1 relative">
        <WebView
          key={webviewKey}
          ref={webviewApiRef}
          src={currentUrl}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onInstagramLogin={handleInstagramLogin}
          onLoginStatusCheck={handleInstagramStatusCheck}
          instagramState={webViewStatus.state}
          onPrepareWebView={prepareWebViewForState}
          obscured={modalState.showConfirmModal || modalState.showManualModal}
          className="w-full h-full"
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading Instagram...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <InstagramUsernameConfirmModal
        open={modalState.showConfirmModal}
        username={modalState.detectedUsername || ''}
        sessionData={modalState.detectedSessionData}
        onConfirm={handleConfirmConnection}
        onCancel={handleManualUsername}
      />
      
      <InstagramManualUsernameModal
        open={modalState.showManualModal}
        sessionData={modalState.detectedSessionData}
        onConfirm={handleManualUsernameConfirm}
        onSecondary={handleCancelConnection}
        secondaryLabel="Cancel"
      />
    </div>
  );

  // Helper functions
  function renderStatusIcon() {
    switch (uiConfig.statusBarType) {
      case 'success':
        return <div className="h-4 w-4 text-green-600 dark:text-green-400">✓</div>;
      case 'warning':
        return <div className="h-4 w-4 text-yellow-600 dark:text-yellow-400">⚠</div>;
      case 'error':
        return <div className="h-4 w-4 text-red-600 dark:text-red-400">✗</div>;
      case 'info':
      default:
        return <div className="h-4 w-4 text-blue-600 dark:text-blue-400">ℹ</div>;
    }
  }

  function getStatusBarClass() {
    switch (uiConfig.statusBarType) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
    }
  }
};
