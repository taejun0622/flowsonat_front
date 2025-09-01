import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { WebView, WebViewHandle } from './WebView';
import { useInstagramWebView } from '@/hooks/useInstagramWebView';
import { Button } from '@/components/ui/button';
import { InstagramUsernameConfirmModal } from './InstagramUsernameConfirmModal';
import { InstagramManualUsernameModal } from './InstagramManualUsernameModal';
import { useInstagram } from '@/contexts/InstagramContext';

interface InstagramWebViewManagerProps {
  className?: string;
  minimal?: boolean; // hide headers/menus for clean webview
}

export const InstagramWebViewManager: React.FC<InstagramWebViewManagerProps> = ({ 
  className = "",
  minimal = false
}) => {
  const navigate = useNavigate();
  const { disconnectAccount } = useInstagram();
  const [currentUrl, setCurrentUrl] = useState<string>('https://www.instagram.com/accounts/login/');
  const [isLoading, setIsLoading] = useState(false);
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
    handleManualUsernameConfirm
  } = useInstagramWebView();

  // 뒤로가기 핸들러
  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // WebView가 자동으로 새로고침됨
  }, []);

  // Clear cookies/session in the WebView and disconnect app session, then go dashboard
  const handleClearAndExit = useCallback(async () => {
    console.log('🔍 handleClearAndExit 함수 시작');
    try {
      // InstagramContext의 disconnectAccount 함수 호출
      await disconnectAccount();
      console.log('✅ disconnectAccount 완료');
    } catch (e) {
      console.error('Failed to disconnect Instagram account:', e);
    }
    
    // 대시보드로 이동
    navigate('/dashboard');
  }, [navigate, disconnectAccount]);

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

  // Extension active when IG is logged in AND server-registered
  const extensionActive = webViewStatus.isInstagramLoggedIn && webViewStatus.isServerRegistered;
  
  // Extension 활성화 상태 로깅
  console.log('🎯 InstagramWebViewManager - Extension 상태:', {
    webViewStatusState: webViewStatus.state,
    extensionActive,
    isInstagramLoggedIn: webViewStatus.isInstagramLoggedIn,
    isServerRegistered: webViewStatus.isServerRegistered
  });

  // Mouse control passthrough to extension while blocking native input
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!extensionActive || !webviewApiRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    webviewApiRef.current.moveCursor(x, y);
    e.preventDefault();
    e.stopPropagation();
  }, [extensionActive]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!extensionActive || !webviewApiRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    webviewApiRef.current.click(x, y);
    e.preventDefault();
    e.stopPropagation();
  }, [extensionActive]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!extensionActive || !webviewApiRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    webviewApiRef.current.doubleClick(x, y);
    e.preventDefault();
    e.stopPropagation();
  }, [extensionActive]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!extensionActive || !webviewApiRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    webviewApiRef.current.click(x, y, 'right');
    e.preventDefault();
    e.stopPropagation();
  }, [extensionActive]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!extensionActive || !webviewApiRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    webviewApiRef.current.scroll(x, y, e.deltaX, e.deltaY);
    e.preventDefault();
    e.stopPropagation();
  }, [extensionActive]);

  // Instagram 로그인 감지 핸들러
  const handleInstagramLogin = useCallback((sessionData: any) => {
    handleInstagramLoginDetected(sessionData);
  }, [handleInstagramLoginDetected]);

  // 상태바 아이콘 렌더링
  const renderStatusIcon = () => {
    switch (uiConfig.statusBarType) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  // 상태바 배경색 클래스
  const getStatusBarClass = () => {
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
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header, Status, and Actions hidden in minimal mode */}
      {!minimal && (
        <>
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
                  {uiConfig.title}
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

          <div className="flex items-center justify-between p-4 bg-black/10 border-b border-black/20">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handleActionClick(uiConfig.primaryAction.action)}
                variant={uiConfig.primaryAction.variant || 'default'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {uiConfig.primaryAction.label}
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
              {webViewStatus.lastChecked.toLocaleTimeString()}
            </div>
          </div>
        </>
      )}

      {/* WebView Container */}
      <div className="flex-1 relative">
      <WebView
        ref={webviewApiRef}
        src={currentUrl}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
        onInstagramLogin={handleInstagramLogin}
        onLoginStatusCheck={handleInstagramStatusCheck}
        instagramState={webViewStatus.state}
        enableExtension={extensionActive}
        disablePointerEvents={extensionActive}
        className="w-full h-full"
      />

        {/* Interaction layer: blocks native input and drives extension */}
        {extensionActive && (
          <div
            className="absolute inset-0 z-30 bg-transparent"
            onMouseMove={handleMouseMove}
            onMouseDown={handleClick}
            onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
            aria-hidden="true"
          />
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading Instagram...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals (hidden in minimal mode) */}
      {!minimal && (
        <>
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
            onSecondary={handleClearAndExit}
            secondaryLabel="Disconnect"
          />
        </>
      )}
    </div>
  );
};
