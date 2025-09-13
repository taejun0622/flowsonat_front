import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Info, Loader2, Users, Bot } from 'lucide-react';
import { WebView, WebViewHandle } from './WebView';
import { useInstagramWebView } from '@/hooks/useInstagramWebView';
import { Button } from '@/components/ui/button';
import { InstagramUsernameConfirmModal } from './InstagramUsernameConfirmModal';
import { InstagramManualUsernameModal } from './InstagramManualUsernameModal';
import { useInstagram } from '@/contexts/InstagramContext';
import { collectFollowingToBenchmark, FollowingCollectorResult } from '@/services/followingCollectorService';
import { executeAutomation, AutomationResult } from '@/services/automationService';
import { ProfileCollectionService } from '@/services/profileCollectionService';
import { InstagramService } from '@/api/services/InstagramService';
import { HealthEnum, StatusEnum } from '@/api';

interface InstagramWebViewManagerProps {
  className?: string;
  minimal?: boolean; // hide headers/menus for clean webview
}

export const InstagramWebViewManager: React.FC<InstagramWebViewManagerProps> = ({ 
  className = "",
  minimal = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { disconnectAccount, instagramAccount, prepareWebViewForState } = useInstagram();
  
  // Check URL parameters for initial URL and auto-execution
  const params = new URLSearchParams(location.search);
  const urlParam = params.get('url');
  const freshParam = params.get('fresh') === '1';
  const autoExecute = params.get('autoExecute') === '1';
  const autoCollectFollowing = params.get('autoCollectFollowing') === '1';
  
  // Use URL parameter if provided, otherwise default based on connection status
  const getInitialUrl = () => {
    if (urlParam) {
      return decodeURIComponent(urlParam);
    }
    // If user is connected to server, go to main Instagram page (cookies will be injected before DOM ready)
    // If not connected, go to login page
    return instagramAccount ? 'https://www.instagram.com/' : 'https://www.instagram.com/accounts/login/';
  };
  
  const [currentUrl, setCurrentUrl] = useState<string>(getInitialUrl());
  const [isLoading, setIsLoading] = useState(false);
  const webviewApiRef = useRef<WebViewHandle>(null);
  const profileCollectionServiceRef = useRef<ProfileCollectionService | null>(null);
  
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

  // Update currentUrl when URL parameter changes
  useEffect(() => {
    if (urlParam) {
      const decodedUrl = decodeURIComponent(urlParam);
      if (decodedUrl !== currentUrl) {
        console.log('[WebView] URL parameter changed, updating currentUrl:', decodedUrl);
        console.log('[WebView] Previous URL:', currentUrl);
        setCurrentUrl(decodedUrl);
      }
    }
  }, [urlParam, currentUrl]);

  // Update currentUrl when Instagram account status changes
  useEffect(() => {
    if (!urlParam) { // Only update if not overridden by URL parameter
      const newUrl = getInitialUrl();
      if (newUrl !== currentUrl) {
        console.log('[WebView] Instagram account status changed, updating URL:', newUrl);
        console.log('[WebView] Previous URL:', currentUrl);
        setCurrentUrl(newUrl);
      }
    }
  }, [instagramAccount, urlParam, currentUrl]);

  // Log when currentUrl changes
  useEffect(() => {
    console.log('[WebView] Current URL updated:', currentUrl);
  }, [currentUrl]);

  // Initialize profile collection service when webview is ready
  useEffect(() => {
    if (webviewApiRef.current && !profileCollectionServiceRef.current) {
      profileCollectionServiceRef.current = new ProfileCollectionService(webviewApiRef.current);
    }
  }, [webviewApiRef.current]);

  // Monitor URL changes and collect profile history when entering profile pages
  useEffect(() => {
    const handleUrlChange = async () => {
      if (!profileCollectionServiceRef.current || !currentUrl) return;

      // Skip URL change handling if we're in a modal (followers/following pages) or during automation
      if (currentUrl.includes('/followers/') || currentUrl.includes('/following/') || 
          isRunningAutomation || isCollectingFollowing) {
        console.log('[WebView] Skipping URL change handling - in modal or during automation:', currentUrl);
        return;
      }

      // Check if current URL is a profile page (not our own profile)
      const profileMatch = currentUrl.match(/instagram\.com\/([^/?]+)\/?$/);
      if (profileMatch && profileMatch[1] && profileMatch[1] !== 'accounts' && profileMatch[1] !== 'explore' && profileMatch[1] !== 'reels') {
        const username = profileMatch[1];
        
        // Don't collect history for our own profile
        if (instagramAccount?.username && username === instagramAccount.username) {
          return;
        }

        try {
          console.log('[WebView] Detected profile page visit:', username);
          
          // Wait a bit for page to fully load
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Collect and send profile history
          const result = await profileCollectionServiceRef.current.collectAndSendProfileHistory();
          
          if (result.success) {
            console.log('[WebView] Successfully collected profile history for:', username);
          } else {
            console.warn('[WebView] Failed to collect profile history for:', username, result.error);
          }
        } catch (error) {
          console.error('[WebView] Error collecting profile history:', error);
        }
      }
    };

    // Debounce URL change handling
    const timeoutId = setTimeout(handleUrlChange, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentUrl, instagramAccount?.username]);

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
    
    // Instagram detection will be handled directly by WebView component on dom-ready
  }, [currentUrl]);

  // WebView 에러 핸들러
  const handleWebViewError = useCallback((error: any) => {
    console.error('WebView error:', error);
    setIsLoading(false);
  }, []);

  // WebView URL 변경 핸들러 (세션 유지를 위해 상태 업데이트하지 않음)
  const handleUrlChange = useCallback((url: string) => {
    console.log('[WebView] URL changed from WebView:', url);
    console.log('[WebView] Current URL state:', currentUrl);
    
    // WebView 내부에서 URL이 변경되어도 React 상태는 업데이트하지 않음
    // 이렇게 하면 WebView의 src prop이 변경되지 않아 세션이 유지됨
    console.log('[WebView] Skipping currentUrl state update to preserve session');
  }, [currentUrl]);
  
  // Whether to block native input (overlay + pointer-events: none)
  const [blockNativeInput, setBlockNativeInput] = useState<boolean>(true);
  
  // Extension active when IG is logged in AND server-registered
  // Temporary dev override: ?forceExtension=1 to force-enable HUD/overlay
  const forceExtension = (() => {
    try { return new URLSearchParams(window.location.search).get('forceExtension') === '1'; } catch { return false; }
  })();
  // Activate extension only when IG is logged in AND server-registered, unless forced via query
  const extensionActive = (webViewStatus.isInstagramLoggedIn && webViewStatus.isServerRegistered) || forceExtension;

  // Block-only handler: physical mouse events are blocked from reaching the WebView
  const blockOnly = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
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
      // Get actual benchmark data from API
      setAutomationStatus('Fetching benchmark data...');
      const benchmarksResponse = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet();
      
      console.log('[Automation] Available benchmarks:', benchmarksResponse.benchmarks.map(b => b.ig?.username));
      console.log('[Automation] Looking for username:', instagramAccount.username);
      
      // Select a benchmark for automation (not the current user's account)
      console.log('[Automation] Available benchmarks:', benchmarksResponse.benchmarks.map(b => b.ig?.username));
      console.log('[Automation] Current user account:', instagramAccount.username);
      
      // Find a healthy and active benchmark (exclude current user's account)
      let userBenchmark = benchmarksResponse.benchmarks.find(
        benchmark => 
          benchmark.status === StatusEnum.ACTIVE && 
          benchmark.health === HealthEnum.HEALTHY &&
          benchmark.ig?.username !== instagramAccount.username // Don't use current user's account
      );
      
      if (!userBenchmark) {
        const availableUsernames = benchmarksResponse.benchmarks.map(b => b.ig?.username).filter(Boolean);
        console.warn(
          `No suitable benchmark found for automation\n` +
          `Current account: ${instagramAccount.username}\n` +
          `Available benchmarks: ${availableUsernames.join(', ')}\n` +
          `Total benchmarks: ${benchmarksResponse.total}`
        );
        
        // Try to find any active benchmark as fallback
        const fallbackBenchmark = benchmarksResponse.benchmarks.find(
          benchmark => benchmark.status === StatusEnum.ACTIVE
        );
        
        if (fallbackBenchmark) {
          console.log(`[Automation] Using fallback benchmark: ${fallbackBenchmark.ig?.username}`);
          userBenchmark = fallbackBenchmark;
          setAutomationStatus(`Using benchmark: ${fallbackBenchmark.ig?.username} for automation`);
        } else {
          throw new Error(
            `No suitable benchmark found for automation\n` +
            `Current account: ${instagramAccount.username}\n` +
            `Available benchmarks: ${availableUsernames.join(', ')}\n` +
            `Total benchmarks: ${benchmarksResponse.total}`
          );
        }
      } else {
        console.log(`[Automation] Selected benchmark: ${userBenchmark.ig?.username}`);
        setAutomationStatus(`Using benchmark: ${userBenchmark.ig?.username} for automation`);
      }
      
      if (userBenchmark.status !== StatusEnum.ACTIVE) {
        throw new Error(`Benchmark is not active. Current status: ${userBenchmark.status}`);
      }
      
      if (userBenchmark.health !== HealthEnum.HEALTHY) {
        throw new Error(`Benchmark is not healthy. Current health: ${userBenchmark.health}`);
      }

      setAutomationStatus('Starting automation with real benchmark data...');
      const result: AutomationResult = await executeAutomation(
        webviewApiRef.current,
        instagramAccount.username,
        userBenchmark,
        {
          scrollDelay: 2000,
          pageLoadDelay: 3000,
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

  // Auto-execute automation after 5 seconds when autoExecute is true
  useEffect(() => {
    if (autoExecute && isWebViewReady && extensionActive && !isRunningAutomation) {
      const timer = setTimeout(() => {
        console.log('[Auto-Execute] Starting automation after 5 seconds...');
        startAutomation();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [autoExecute, isWebViewReady, extensionActive, isRunningAutomation, startAutomation]);

  // Auto-execute following collection when autoCollectFollowing is true
  useEffect(() => {
    if (autoCollectFollowing && isWebViewReady && extensionActive && !isCollectingFollowing) {
      const timer = setTimeout(() => {
        console.log('[Auto-Collect] Starting following collection after 5 seconds...');
        startFollowingCollection();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [autoCollectFollowing, isWebViewReady, extensionActive, isCollectingFollowing, startFollowingCollection]);

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
          onUrlChange={handleUrlChange}
          instagramState={webViewStatus.state}
          freshPartition={freshParam}
          enableExtension={extensionActive}
          onPrepareWebView={prepareWebViewForState}
          obscured={modalState.showConfirmModal || modalState.showManualModal}
          // Do not block native pointer events until server registration is done
          disablePointerEvents={extensionActive && blockNativeInput && webViewStatus.isServerRegistered}
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
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading Instagram...</span>
            </div>
          </div>
        )}

        {/* Auto-execution status overlay */}
        {(autoExecute || autoCollectFollowing) && (
          <div className="absolute top-4 left-4 z-40 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-3 text-white">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {autoExecute && isRunningAutomation && 'Running automation...'}
                {autoCollectFollowing && isCollectingFollowing && 'Collecting following...'}
                {!isRunningAutomation && !isCollectingFollowing && 'Preparing to execute...'}
              </span>
            </div>
            {(automationStatus || collectionStatus) && (
              <div className="text-xs text-gray-300 mt-1 max-w-xs">
                {automationStatus || collectionStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals (always rendered; minimal hides headers only) */}
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
    </div>
  );
};
