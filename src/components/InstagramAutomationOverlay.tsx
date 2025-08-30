import React from 'react';
import { X, Play, Square, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { useBrowserExtension } from '../features/browser-extension/hooks/useBrowserExtension';
import { useInstagram } from '@/contexts/InstagramContext';
import { useWebViewControl } from '@/hooks/useWebViewControl';
import { useFollowersCollection } from '@/hooks/useFollowersCollection';
import { useAutomationService } from '@/hooks/useAutomationService';
import { useAutomationLogs } from '@/hooks/useAutomationLogs';
import { useAutomationConfig } from '@/hooks/useAutomationConfig';
import { useWebViewNavigation } from '@/hooks/useWebViewNavigation';

interface InstagramAutomationOverlayProps {
  onClose?: () => void;
  isCollectingFollowers?: boolean;
  onFollowersCollected?: () => void;
}

export const InstagramAutomationOverlay = ({
  onClose,
  isCollectingFollowers,
  onFollowersCollected
}: InstagramAutomationOverlayProps) => {
  const { instagramAccount, isConnected } = useInstagram();
  const [showSettings, setShowSettings] = React.useState(false);
  
  // Get current username from connected Instagram account
  const currentUsername = instagramAccount?.username || '';

  // Custom hooks
  const { webviewRef, webViewControl } = useWebViewControl();
  const { config, updateConfig } = useAutomationConfig();
  const { logs, addLog, clearLogs } = useAutomationLogs();
  const { currentUrl, setCurrentUrl, goBack, goForward, reload, loadUrl } = useWebViewNavigation();
  
  // Automation service
  const { state, startWorkflow, stopWorkflow } = useAutomationService({
    webViewControl,
    config,
    currentUsername,
    isConnected
  });

  // Followers collection
  const { 
    collectedFollowers, 
    isCollecting, 
    startFollowersCollection, 
    collectFollowersFromProfile 
  } = useFollowersCollection({
    webViewControl,
    currentUsername,
    isConnected,
    onFollowersCollected
  });

  // Browser extension hook
  const { state: extensionState } = useBrowserExtension({
    webviewRef: webviewRef,
    onWebViewLoad: () => {
      console.log('WebView loaded, automation ready');
      
      // 팔로워 수집 중이고 프로필 페이지에 있다면 팔로워 수집 시작
      if (isCollectingFollowers && isCollecting) {
        console.log('WebView loaded during followers collection, starting collection...');
        setTimeout(() => {
          collectFollowersFromProfile();
        }, 2000);
      }
    },
    onWebViewError: (errorMessage) => {
      console.error('WebView error:', errorMessage);
      // Toast notification will be handled by the automation service hook
    }
  });

  // 팔로워 수집 자동 시작
  React.useEffect(() => {
    console.log('useEffect triggered:', { isCollectingFollowers, isCollecting });
    if (isCollectingFollowers && !isCollecting) {
      console.log('Starting followers collection...');
      startFollowersCollection();
    }
  }, [isCollectingFollowers, isCollecting, startFollowersCollection]);

  // 웹뷰 로드 이벤트 처리
  React.useEffect(() => {
    if (webviewRef.current) {
      let hasNavigated = false; // 한 번만 이동하도록 플래그

      const handleLoad = () => {
        console.log('handleLoad called');
        // 웹뷰의 실제 URL 확인
        if (webviewRef.current) {
          const actualUrl = (webviewRef.current as any).getURL ? (webviewRef.current as any).getURL() : webviewRef.current.src;
          console.log('WebView loaded, current URL:', currentUrl, 'actual URL:', actualUrl);
          
          // 팔로워 수집 중이고 프로필 페이지에 있다면 팔로워 수집 시작
          if (isCollectingFollowers && isCollecting && actualUrl.includes('/')) {
            console.log('Profile page loaded, starting followers collection...');
            setTimeout(() => {
              collectFollowersFromProfile();
            }, 2000);
          } else {
            console.log('Conditions not met for followers collection:', {
              isCollectingFollowers,
              isCollecting,
              actualUrl,
              hasFollowers: actualUrl.includes('/')
            });
          }
        }
      };

      const handleDomReady = () => {
        console.log('WebView DOM ready');
        // 웹뷰가 준비되면 프로필 페이지로 이동 (한 번만)
        if (isCollectingFollowers && isCollecting && currentUsername && !hasNavigated) {
          hasNavigated = true;
          const profileUrl = `https://www.instagram.com/${currentUsername}/`;
          console.log('DOM ready, navigating to:', profileUrl);
          
          // setTimeout으로 지연시켜서 안정성 확보
          setTimeout(() => {
            if (webviewRef.current) {
              webviewRef.current.src = profileUrl;
              setCurrentUrl(profileUrl);
              
              // URL 변경 후 load 이벤트를 기다리지 않고 직접 팔로워 수집 시작
              setTimeout(() => {
                console.log('Starting followers collection after navigation...');
                collectFollowersFromProfile();
              }, 3000);
            }
          }, 1000);
        }
      };

      webviewRef.current.addEventListener('load', handleLoad);
      webviewRef.current.addEventListener('dom-ready', handleDomReady);
      
      return () => {
        if (webviewRef.current) {
          webviewRef.current.removeEventListener('load', handleLoad);
          webviewRef.current.removeEventListener('dom-ready', handleDomReady);
        }
      };
    }
  }, [currentUrl, isCollectingFollowers, isCollecting, currentUsername]);



  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Instagram Automation</h1>
          <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm text-gray-300">Extension Always Active</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 flex flex-col">
          {/* Control Panel */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-white">Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={startWorkflow}
                  disabled={state.isRunning || !isConnected || !currentUsername}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {state.isRunning ? 'Running...' : 'Start'}
                </Button>
                <Button
                  onClick={stopWorkflow}
                  disabled={!state.isRunning}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>



              {state.isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white">
                    <span>Progress</span>
                    <span>{Math.round(state.progress)}%</span>
                  </div>
                  <Progress value={state.progress} className="w-full" />
                  <p className="text-sm text-gray-300">{state.currentStep}</p>
                </div>
              )}

              {/* Followers Collection Status */}
              {isCollectingFollowers && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white">
                    <span>Followers Collection</span>
                    <span>{collectedFollowers.length} collected</span>
                  </div>
                  {isCollecting && (
                    <div className="text-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                      <p className="text-xs text-gray-300 mt-1">Collecting followers...</p>
                    </div>
                  )}
                  {collectedFollowers.length > 0 && (
                    <div className="text-xs text-gray-300">
                      Collected: {collectedFollowers.slice(0, 5).join(', ')}
                      {collectedFollowers.length > 5 && ` and ${collectedFollowers.length - 5} more...`}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-white">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTargets" className="text-white">Max Targets</Label>
                  <Input
                    id="maxTargets"
                    type="number"
                    value={config.maxTargets}
                    onChange={(e: any) => updateConfig({ maxTargets: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUnfollows" className="text-white">Max Unfollows</Label>
                  <Input
                    id="maxUnfollows"
                    type="number"
                    value={config.maxUnfollows}
                    onChange={(e: any) => updateConfig({ maxUnfollows: parseInt(e.target.value) })}
                    min="1"
                    max="500"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clickDelay" className="text-white">Click Delay (ms)</Label>
                  <Input
                    id="clickDelay"
                    type="number"
                    value={config.clickDelay}
                    onChange={(e: any) => updateConfig({ clickDelay: parseInt(e.target.value) })}
                    min="100"
                    max="3000"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs Panel */}
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Logs</CardTitle>
                <Button
                  onClick={clearLogs}
                  variant="outline"
                  size="sm"
                  className="text-white border-gray-600 hover:bg-gray-700"
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800 text-green-400 p-3 rounded-md h-64 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No logs available.</p>
                ) : (
                  logs.map((log: string, index: number) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - WebView */}
        <div className="flex-1 flex flex-col">
          {/* WebView Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center space-x-2">
            <Button
              onClick={() => goBack(webviewRef)}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              ←
            </Button>
            <Button
              onClick={() => goForward(webviewRef)}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              →
            </Button>
            <Button
              onClick={() => reload(webviewRef)}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              ↻
            </Button>
            <Input
              value={currentUrl}
              onChange={(e: any) => setCurrentUrl(e.target.value)}
              onKeyPress={(e: any) => {
                if (e.key === 'Enter') {
                  loadUrl(webviewRef, currentUrl);
                }
              }}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* WebView */}
          <div className="flex-1 relative">
            <webview
              ref={webviewRef}
              src={currentUrl}
              style={{
                width: '100%',
                height: '100%'
              }}
              webpreferences="nodeIntegration=no, contextIsolation=yes"
              allowpopups={true}
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
