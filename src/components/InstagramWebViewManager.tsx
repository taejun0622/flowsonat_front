import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Info, Loader2, Users, Bot } from 'lucide-react';
import { WebView, WebViewHandle } from './WebView';
import { useInstagramWebView } from '@/hooks/useInstagramWebView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstagramUsernameConfirmModal } from './InstagramUsernameConfirmModal';
import { InstagramManualUsernameModal } from './InstagramManualUsernameModal';
import { useInstagram } from '@/contexts/InstagramContext';
import { collectFollowingToBenchmark, FollowingCollectorResult } from '@/services/followingCollectorService';
import { executeAutomation, AutomationResult } from '@/services/automationService';

interface InstagramWebViewManagerProps {
  className?: string;
  minimal?: boolean; // hide headers/menus for clean webview
}

export const InstagramWebViewManager: React.FC<InstagramWebViewManagerProps> = ({ 
  className = "",
  minimal = false
}) => {
  const navigate = useNavigate();
  const { disconnectAccount, instagramAccount } = useInstagram();
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
    setIsWebViewReady(true);
    console.log('[WebView] Load completed, WebView is ready');
  }, []);

  // WebView 에러 핸들러
  const handleWebViewError = useCallback((error: any) => {
    console.error('WebView error:', error);
    setIsLoading(false);
  }, []);
  
  // Whether to block native input (overlay + pointer-events: none)
  const [blockNativeInput, setBlockNativeInput] = useState<boolean>(true);
  const toggleBlockNative = useCallback(() => {
    const next = !blockNativeInput;
    console.log('[HUD] toggle blockNativeInput ->', next);
    setBlockNativeInput(next);
  }, [blockNativeInput]);

  // Extension active when IG is logged in AND server-registered
  // Temporary dev override: ?forceExtension=1 to force-enable HUD/overlay
  const forceExtension = (() => {
    try { return new URLSearchParams(window.location.search).get('forceExtension') === '1'; } catch { return false; }
  })();
  const extensionActive = (webViewStatus.isInstagramLoggedIn && webViewStatus.isServerRegistered) || forceExtension;

  // HUD state
  const [testText, setTestText] = useState<string>('');
  const [typeTextInput, setTypeTextInput] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  
  // Following collection state
  const [isCollectingFollowing, setIsCollectingFollowing] = useState<boolean>(false);
  const [collectedFollowing, setCollectedFollowing] = useState<string[]>([]);
  const [collectionProgress, setCollectionProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [collectionStatus, setCollectionStatus] = useState<string>('');
  const [isWebViewReady, setIsWebViewReady] = useState<boolean>(false);
  
  // Automation state
  const [isRunningAutomation, setIsRunningAutomation] = useState<boolean>(false);
  const [automationProgress, setAutomationProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [automationStatus, setAutomationStatus] = useState<string>('');
  const [automationResult, setAutomationResult] = useState<AutomationResult | null>(null);
  const handleClickByText = useCallback(async (text: string) => {
    if (!webviewApiRef.current || !extensionActive) return;
    try {
      console.log('[HUD] clickByText start:', text);
      const ok = await webviewApiRef.current.clickByText(text);
      console.log('[HUD] clickByText done:', { text, ok });
    } catch (err) {
      console.error('[HUD] clickByText error:', err);
    }
  }, [extensionActive]);

  // Following collection function
  const startFollowingCollection = useCallback(async () => {
    if (!webviewApiRef.current || !extensionActive || !instagramAccount?.username) {
      console.error('[Following Collection] Cannot start: missing requirements');
      return;
    }

    if (!isWebViewReady) {
      console.error('[Following Collection] Cannot start: WebView not ready');
      setCollectionStatus('WebView not ready. Please wait...');
      return;
    }

    setIsCollectingFollowing(true);
    setCollectedFollowing([]);
    setCollectionProgress({ current: 0, total: 0 });
    setCollectionStatus('Starting collection...');

    try {
      // Navigate to user's profile first
      const profileUrl = `https://www.instagram.com/${instagramAccount.username}`;
      setCurrentUrl(profileUrl);
      setCollectionStatus('Navigating to profile...');
      
      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Use the following collection service
      setCollectionStatus('Starting following collection service...');
      const result: FollowingCollectorResult = await collectFollowingToBenchmark(
        webviewApiRef.current,
        instagramAccount.username,
        {
          scrollDelay: 2000, // Increased delay
          pageLoadDelay: 3000,
          onProgress: (current: number, total: number, status: string) => {
            setCollectionProgress({ current, total });
            setCollectionStatus(status);
          }
        }
      );

      if (result.success) {
        setCollectedFollowing(result.following);
        setCollectionProgress({ current: result.collectedCount, total: result.collectedCount });
        setCollectionStatus(`Successfully collected ${result.collectedCount} following!`);
        
        // Navigate back to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setCollectionStatus(`Error: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('[Following Collection] Error:', error);
      setCollectionStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCollectingFollowing(false);
    }
  }, [extensionActive, instagramAccount?.username, navigate, isWebViewReady]);
  
  // Automation execution function
  const startAutomation = useCallback(async () => {
    if (!webviewApiRef.current || !extensionActive || !instagramAccount?.username) {
      console.error('[Automation] Cannot start: missing requirements');
      return;
    }

    if (!isWebViewReady) {
      console.error('[Automation] Cannot start: WebView not ready');
      setAutomationStatus('WebView not ready. Please wait...');
      return;
    }

    setIsRunningAutomation(true);
    setAutomationProgress({ current: 0, total: 0 });
    setAutomationStatus('Starting automation...');
    setAutomationResult(null);

    try {
      // For now, we'll use a mock benchmark
      // In real implementation, you would get the actual benchmark from props or context
      const mockBenchmark = {
        id: 'mock-benchmark',
        user_id: 'mock-user-id',
        ig_id: 'mock-ig-id',
        ig: { 
          id: 'mock-ig-id',
          username: instagramAccount.username,
          status: 'ACTIVE' as any,
          created_at: new Date().toISOString()
        },
        status: 'ACTIVE' as any,
        health: 'HEALTHY' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result: AutomationResult = await executeAutomation(
        webviewApiRef.current,
        instagramAccount.username,
        mockBenchmark,
        {
          scrollDelay: 2000,
          pageLoadDelay: 3000,
          maxIterations: 10, // Limit for testing
          onProgress: (current: number, total: number, status: string) => {
            setAutomationProgress({ current, total });
            setAutomationStatus(status);
          },
          onAction: (action: string, target: string, result: boolean) => {
            console.log(`[Automation] Action: ${action} on ${target} - ${result ? 'Success' : 'Failed'}`);
          }
        }
      );

      setAutomationResult(result);
      
      if (result.success) {
        setAutomationStatus(`Automation completed successfully! ${result.actionsPerformed} actions performed in ${result.executionTime}ms`);
        
        // Navigate back to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setAutomationStatus(`Automation failed: ${result.errors.join(', ')}`);
      }
      
    } catch (error) {
      console.error('[Automation] Error:', error);
      setAutomationStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningAutomation(false);
    }
  }, [extensionActive, instagramAccount?.username, navigate, isWebViewReady]);
  const handleScrollStep = useCallback((dy: number) => {
    if (!webviewApiRef.current || !extensionActive) return;
    // Use center of container for scroll if no recent mouse event
    const container = document.getElementById('ig-webview-container');
    const rect = container?.getBoundingClientRect();
    const x = rect ? rect.width / 2 : 500;
    const y = rect ? rect.height / 2 : 400;
    webviewApiRef.current.scroll(x, y, 0, dy);
  }, [extensionActive]);

  const handleOpenProfile = useCallback(() => {
    const raw = (usernameInput || '').trim();
    if (!raw) return;
    const username = raw.replace(/^@/, '');
    const profileUrl = `https://www.instagram.com/${username}/`;
    console.log('[HUD] navigate: open profile', { username, profileUrl });
    setCurrentUrl(profileUrl);
  }, [usernameInput]);

  const openFollowersModal = useCallback(async () => {
    console.log('[HUD] openFollowersModal');
    const ok = await (webviewApiRef.current?.clickFollowers?.());
    console.log('[HUD] openFollowersModal result:', ok);
  }, []);

  const openFollowingModal = useCallback(async () => {
    console.log('[HUD] openFollowingModal');
    const ok = await (webviewApiRef.current?.clickFollowing?.());
    console.log('[HUD] openFollowingModal result:', ok);
  }, []);

  const scrollPrimaryArea = useCallback(async (deltaY: number) => {
    if (!webviewApiRef.current) return;
    console.log('[HUD] scrollPrimaryArea start', { deltaY });
    try {
      const ok = await webviewApiRef.current.scrollForemost(deltaY);
      console.log('[HUD] scrollPrimaryArea result', ok);
    } catch (e) {
      console.error('[HUD] scrollPrimaryArea error', e);
    }
  }, []);

  const closeModal = useCallback(async () => {
    console.log('[HUD] closeModal via Escape');
    const ok = await webviewApiRef.current?.pressEscape();
    console.log('[HUD] closeModal result:', ok);
  }, []);

  const clickFollow = useCallback(async () => {
    console.log('[HUD] clickFollow');
    const ok = await webviewApiRef.current?.clickFollowButton();
    console.log('[HUD] clickFollow result:', {ok});
  }, []);

  const clickFollowing = useCallback(async () => {
    console.log('[HUD] clickFollowing');
    const ok = await webviewApiRef.current?.clickFollowingButton();
    console.log('[HUD] clickFollowing result:', {ok});
  }, []);

  const clickRequested = useCallback(async () => {
    console.log('[HUD] clickRequested');
    const ok = await webviewApiRef.current?.clickRequestedButton();
    console.log('[HUD] clickRequested result:', {ok});
  }, []);

  const clickUnfollow = useCallback(async () => {
    console.log('[HUD] clickUnfollow');
    const ok = await webviewApiRef.current?.clickUnfollowButton();
    console.log('[HUD] clickUnfollow result:', {ok});
  }, []);

  // Extension 활성화 상태 로깅
  console.log('🎯 InstagramWebViewManager - Extension 상태:', {
    webViewStatusState: webViewStatus.state,
    extensionActive,
    isInstagramLoggedIn: webViewStatus.isInstagramLoggedIn,
    isServerRegistered: webViewStatus.isServerRegistered
  });

  // Block-only handler: physical mouse events are blocked from reaching the WebView
  const blockOnly = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

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
      <div className="flex-1 relative" id="ig-webview-container">
      <WebView
        ref={webviewApiRef}
        src={currentUrl}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
        onInstagramLogin={handleInstagramLogin}
        onLoginStatusCheck={handleInstagramStatusCheck}
        instagramState={webViewStatus.state}
        enableExtension={extensionActive}
        disablePointerEvents={extensionActive && blockNativeInput}
        className="w-full h-full"
      />

        {/* Interaction layer: blocks native input and drives extension */}
        {extensionActive && blockNativeInput && (
          <div
            className="absolute inset-0 z-30 bg-transparent cursor-none"
            onMouseMove={blockOnly as any}
            onMouseDown={blockOnly as any}
            onMouseUp={blockOnly as any}
            onClick={blockOnly as any}
            onDoubleClick={blockOnly as any}
            onContextMenu={blockOnly as any}
            onWheel={blockOnly as any}
            aria-hidden="true"
          />
        )}

          {/* Test HUD - minimal controls, events proxied into webview */}
          {extensionActive && (
            <div
              className="absolute top-4 right-4 z-40 w-80 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg backdrop-blur p-3 space-y-2"
              onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); }}
              onMouseUp={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); }}
              onWheel={(e: React.WheelEvent<HTMLDivElement>) => { e.stopPropagation(); }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Extension Test HUD</div>
                <Button size="sm" variant={blockNativeInput ? 'default' : 'outline'} onClick={toggleBlockNative}>
                  {blockNativeInput ? 'Blocking Input' : 'Passthrough'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="@username"
                  value={usernameInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsernameInput(e.target.value)}
                />
                <Button size="sm" onClick={handleOpenProfile}>Open Profile</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={openFollowersModal}>Open Followers</Button>
                <Button size="sm" variant="outline" onClick={openFollowingModal}>Open Following</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => scrollPrimaryArea(-400)}>Scroll Up</Button>
                <Button size="sm" variant="outline" onClick={() => scrollPrimaryArea(400)}>Scroll Down</Button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button size="sm" variant="outline" onClick={closeModal}>Close Modal</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={clickFollow}>Follow</Button>
                <Button size="sm" onClick={clickUnfollow}>Unfollow</Button>
                <Button size="sm" onClick={clickFollowing}>Following</Button>
                <Button size="sm" onClick={clickRequested}>Requested</Button>
              </div>
              
              {/* Following Collection Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Following Collection</div>
                <Button 
                  size="sm" 
                  onClick={startFollowingCollection}
                  disabled={isCollectingFollowing || !extensionActive || !isWebViewReady}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {isCollectingFollowing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Collecting...
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3 mr-1" />
                      Collect My Following
                    </>
                  )}
                </Button>
                
                {/* Automation Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Automation</div>
                  <Button 
                    size="sm" 
                    onClick={startAutomation}
                    disabled={isRunningAutomation || !extensionActive || !isWebViewReady}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  >
                    {isRunningAutomation ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3 mr-1" />
                        Execute Automation
                      </>
                    )}
                  </Button>
                  
                  {isRunningAutomation && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {automationStatus}
                      </div>
                      {automationProgress.total > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Progress: {automationProgress.current} / {automationProgress.total}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {automationResult && (
                    <div className="mt-2 space-y-1">
                      <div className={`text-xs ${automationResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {automationResult.success ? 'Success' : 'Failed'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Actions: {automationResult.actionsPerformed}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Time: {automationResult.executionTime}ms
                      </div>
                    </div>
                  )}
                </div>
                
                {isCollectingFollowing && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {collectionStatus}
                    </div>
                    {collectionProgress.total > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Progress: {collectionProgress.current} / {collectionProgress.total}
                      </div>
                    )}
                    {collectedFollowing.length > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Collected: {collectedFollowing.length} following
                      </div>
                    )}
                  </div>
                )}
                
                {!isWebViewReady && (
                  <div className="mt-2">
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Waiting for WebView to load...
                    </div>
                  </div>
                )}
              </div>
            </div>
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
