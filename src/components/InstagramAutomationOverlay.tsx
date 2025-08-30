import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useBrowserExtension } from '../features/browser-extension/hooks/useBrowserExtension';
import { useInstagram } from '@/contexts/InstagramContext';
import { useWebViewControl } from '@/hooks/useWebViewControl';
import { useFollowersCollection } from '@/hooks/useFollowersCollection';
import { useAutomationConfig } from '@/hooks/useAutomationConfig';
import { useWebViewNavigation } from '@/hooks/useWebViewNavigation';
import { InstagramAutomation } from '@/features/automation/instagramAutomation';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showTester, setShowTester] = React.useState(false);
  
  // 테스터 상태
  const [logs, setLogs] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [targetUsername, setTargetUsername] = React.useState('');
  const [clickX, setClickX] = React.useState(100);
  const [clickY, setClickY] = React.useState(100);
  const [selectedButton, setSelectedButton] = React.useState('');
  const [isSelectingButton, setIsSelectingButton] = React.useState(false);
  
  // Get current username from connected Instagram account
  const currentUsername = instagramAccount?.username || '';

  // Custom hooks
  const { webviewRef, webViewControl } = useWebViewControl();
  const { config, updateConfig } = useAutomationConfig();
  const { currentUrl, setCurrentUrl } = useWebViewNavigation();
  
  // Navigation/collection guards to prevent loops
  const didNavigateToProfileRef = React.useRef(false);
  const didStartCollectionRef = React.useRef(false);

  // Followers collection
  const { 
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
    },
    blockPhysicalMouse: true
  });

  // 팔로워 수집 자동 시작
  React.useEffect(() => {
    console.log('useEffect triggered:', { isCollectingFollowers, isCollecting });
    if (isCollectingFollowers && !isCollecting) {
      console.log('Starting followers collection...');
      startFollowersCollection();
    }
  }, [isCollectingFollowers, isCollecting, startFollowersCollection]);

  // Allow closing overlay with Escape when header/menu is removed
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // 테스터 함수들
  const append = (line: string) => setLogs((prev: string[]) => [line, ...prev].slice(0, 100));

  // 웹뷰 이벤트 리스너 추가
  React.useEffect(() => {
    if (!webviewRef.current) return;

    const webview = webviewRef.current;
    
    const handleDidStartLoading = () => {
      console.log('WebView started loading:', currentUrl);
      append('🔄 웹뷰 로딩 시작');
    };
    
    const handleDidFinishLoad = () => {
      console.log('WebView finished loading:', currentUrl);
      append('✅ 웹뷰 로딩 완료');
    };
    
    const handleDidFailLoad = (e: any) => {
      console.error('WebView failed to load:', e);
      append(`❌ 웹뷰 로딩 실패: ${e.errorDescription || 'Unknown error'}`);
    };
    
    const handleDomReady = () => {
      console.log('WebView DOM ready');
      append('🎯 웹뷰 DOM 준비 완료');
    };

    // @ts-ignore - Electron webview events
    webview.addEventListener('did-start-loading', handleDidStartLoading);
    // @ts-ignore - Electron webview events
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    // @ts-ignore - Electron webview events
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    // @ts-ignore - Electron webview events
    webview.addEventListener('dom-ready', handleDomReady);

    return () => {
      // @ts-ignore - Electron webview events
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
      // @ts-ignore - Electron webview events
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      // @ts-ignore - Electron webview events
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      // @ts-ignore - Electron webview events
      webview.removeEventListener('dom-ready', handleDomReady);
    };
  }, [webviewRef, currentUrl, append]);

  const createAutomation = () => {
    if (!webviewRef.current || !currentUsername) {
      toast({
        title: "Error",
        description: "Instagram에 연결되어 있지 않습니다.",
        variant: "destructive"
      });
      return null;
    }

    return new InstagramAutomation(webviewRef.current, {
      myUsername: currentUsername,
      maxUnfollowPerRun: 250,
      followTargetCap: 500
    }, (p) => append(`${p.step}${p.detail ? ' - ' + p.detail : ''}${p.count!==undefined?` (${p.count}/${p.total ?? ''})`:''}`));
  };

  // 페이지 이동 테스트
  const testNavigate = async () => {
    if (!targetUsername) {
      toast({
        title: "Error",
        description: "사용자명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    append(`페이지 이동 테스트 시작: @${targetUsername}`);
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      await automation.testNavigate(`https://www.instagram.com/${targetUsername}/`);
      append(`✅ 페이지 이동 완료: @${targetUsername}`);
      
      toast({
        title: "Success",
        description: `@${targetUsername} 페이지로 이동했습니다.`
      });
    } catch (e) {
      append(`❌ 페이지 이동 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `페이지 이동 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 스크롤 수집 테스트
  const testScrollAndCollect = async () => {
    setIsRunning(true);
    append('스크롤 수집 테스트 시작');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      const users = await automation.testScrollAndCollect();
      append(`✅ 스크롤 수집 완료: ${users.length}명의 사용자 발견`);
      
      toast({
        title: "Success",
        description: `${users.length}명의 사용자를 수집했습니다.`
      });
    } catch (e) {
      append(`❌ 스크롤 수집 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `스크롤 수집 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 팔로워 모달 열기 테스트
  const testOpenFollowersModal = async () => {
    setIsRunning(true);
    append('팔로워 모달 열기 테스트 시작');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      await automation.testNavigate(`https://www.instagram.com/${currentUsername}/`);
      await automation.testOpenModal('followers');
      
      append('✅ 팔로워 모달 열기 완료');
      
      toast({
        title: "Success",
        description: "팔로워 모달을 열었습니다."
      });
    } catch (e) {
      append(`❌ 팔로워 모달 열기 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `팔로워 모달 열기 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 팔로잉 모달 열기 테스트
  const testOpenFollowingModal = async () => {
    setIsRunning(true);
    append('팔로잉 모달 열기 테스트 시작');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      await automation.testNavigate(`https://www.instagram.com/${currentUsername}/`);
      await automation.testOpenModal('following');
      
      append('✅ 팔로잉 모달 열기 완료');
      
      toast({
        title: "Success",
        description: "팔로잉 모달을 열었습니다."
      });
    } catch (e) {
      append(`❌ 팔로잉 모달 열기 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `팔로잉 모달 열기 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 팔로우 버튼 클릭 테스트
  const testClickFollowButton = async () => {
    setIsRunning(true);
    append('팔로우 버튼 클릭 테스트 시작');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      const result = await automation.testClickFollowVariant();
      append(`✅ 팔로우 버튼 클릭 완료: ${result}`);
      
      toast({
        title: "Success",
        description: `버튼 클릭 결과: ${result}`
      });
    } catch (e) {
      append(`❌ 팔로우 버튼 클릭 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `버튼 클릭 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 버튼 선택 모드 시작
  const startButtonSelection = async () => {
    setIsSelectingButton(true);
    append('버튼 선택 모드 시작 - 클릭할 버튼을 선택하세요');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      await automation.startButtonSelection();
      
      toast({
        title: "버튼 선택 모드",
        description: "클릭할 버튼을 선택하세요. 선택 후 자동으로 좌표가 설정됩니다."
      });
    } catch (e) {
      append(`❌ 버튼 선택 모드 시작 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `버튼 선택 모드 시작 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
      setIsSelectingButton(false);
    }
  };

  // 선택된 버튼 정보 가져오기
  const getSelectedButtonInfo = async () => {
    try {
      const automation = createAutomation();
      if (!automation) return;

      const result = await automation.getSelectedButtonInfo();

      if (result) {
        setClickX(result.x);
        setClickY(result.y);
        setSelectedButton(`${result.element} - ${result.text}`);
        append(`✅ 버튼 선택 완료: ${result.element} (${result.x}, ${result.y})`);
        
        toast({
          title: "버튼 선택 완료",
          description: `${result.element} 버튼이 선택되었습니다. (${result.x}, ${result.y})`
        });
      }
    } catch (e) {
      append(`❌ 버튼 정보 가져오기 실패: ${(e as Error).message}`);
    }
  };

  // 좌표 기반 클릭 테스트
  const testClickAtCoordinates = async () => {
    setIsRunning(true);
    append(`좌표 클릭 테스트 시작 (${clickX}, ${clickY})`);
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      const result = await automation.clickAtCoordinates(clickX, clickY);
      
      if (result.success) {
        append(`✅ 좌표 클릭 완료: (${clickX}, ${clickY}) - ${result.element}`);
        
        toast({
          title: "Success",
          description: `좌표 (${clickX}, ${clickY})에서 클릭을 실행했습니다.`
        });
      } else {
        append(`❌ 좌표 클릭 실패: ${result.message}`);
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (e) {
      append(`❌ 좌표 클릭 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `좌표 클릭 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 전체 자동화 테스트
  const testFullAutomation = async () => {
    setIsRunning(true);
    append('전체 자동화 테스트 시작');
    
    try {
      const automation = createAutomation();
      if (!automation) return;

      await automation.runAll();
      append('✅ 전체 자동화 테스트 완료');
      
      toast({
        title: "Success",
        description: "전체 자동화가 완료되었습니다."
      });
    } catch (e) {
      append(`❌ 전체 자동화 실패: ${(e as Error).message}`);
      toast({
        title: "Error",
        description: `전체 자동화 실패: ${(e as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 로그 초기화
  const clearLogs = () => {
    setLogs([]);
  };

  // 웹뷰 로드 이벤트 처리 (loop-safe)
  React.useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const handleDomReady = () => {
      try {
        const actualUrl = (wv as any).getURL ? (wv as any).getURL() : wv.src;
        const profileUrl = currentUsername ? `https://www.instagram.com/${currentUsername}/` : '';
        console.log('WebView DOM ready, actual URL:', actualUrl);

        if (isCollectingFollowers && isCollecting && currentUsername) {
          if (!didNavigateToProfileRef.current && profileUrl && !actualUrl.startsWith(profileUrl)) {
            didNavigateToProfileRef.current = true;
            console.log('Navigating once to profile:', profileUrl);
            // Navigate once to the target profile
            setTimeout(() => {
              // Double-check not already there
              const nowUrl = (wv as any).getURL ? (wv as any).getURL() : wv.src;
              if (!nowUrl.startsWith(profileUrl)) {
                wv.src = profileUrl;
                // Reflect in UI, but refs guard prevents loops
                setCurrentUrl(profileUrl);
              }
            }, 300);
          } else if (actualUrl.startsWith(profileUrl) && !didStartCollectionRef.current) {
            didStartCollectionRef.current = true;
            console.log('On profile URL; starting followers collection once');
            setTimeout(() => collectFollowersFromProfile(), 1000);
          }
        }
      } catch (e) {
        console.warn('dom-ready handler error', e);
      }
    };

    wv.addEventListener('dom-ready', handleDomReady);

    return () => {
      wv.removeEventListener('dom-ready', handleDomReady);
    };
  }, [isCollectingFollowers, isCollecting, currentUsername, collectFollowersFromProfile, setCurrentUrl]);



  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top Control Bar */}
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            {showSettings ? 'Settings ON' : 'Settings OFF'}
          </Button>
          <Button
            onClick={() => setShowTester(!showTester)}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            {showTester ? 'Tester ON' : 'Tester OFF'}
          </Button>
        </div>
        <Button
          onClick={onClose}
          variant="outline"
          size="sm"
          className="bg-red-600 border-red-600 text-white hover:bg-red-700"
        >
          Close
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 bg-gray-900 border-r border-gray-700 p-4">
            <Card>
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
          </div>
        )}

        {/* WebView Panel */}
        <div className="flex-1 flex flex-col">
          {/* WebView */}
          <div className="flex-1 relative">
            {/* Interaction-blocking overlay: blocks physical mouse from hitting webview */}
            <div
              className="absolute inset-0 z-10"
              style={{ pointerEvents: 'auto' }}
              onMouseDown={(e) => e.preventDefault()}
              onDoubleClick={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onWheel={(e) => e.preventDefault()}
            />
            
            {/* 테스터 오버레이 */}
            {showTester && (
              <div className="absolute top-4 right-4 z-20 w-80 bg-black/80 backdrop-blur-md border border-gray-600 rounded-lg p-4 text-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">자동화 테스터</h3>
                  <button
                    onClick={() => setShowTester(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {/* 테스트 컨트롤 */}
                <div className="space-y-3 mb-4">
                  {/* 페이지 이동 테스트 */}
                  <div className="flex gap-2">
                    <Input
                      value={targetUsername}
                      onChange={(e: any) => setTargetUsername(e.target.value)}
                      placeholder="사용자명"
                      className="flex-1 bg-gray-800 border-gray-600 text-white text-sm"
                    />
                    <Button 
                      onClick={testNavigate} 
                      disabled={isRunning || !isConnected}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      이동
                    </Button>
                  </div>
                  
                  {/* 기본 테스트 버튼들 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={testScrollAndCollect} 
                      disabled={isRunning || !isConnected}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      스크롤 수집
                    </Button>
                    <Button 
                      onClick={testClickFollowButton} 
                      disabled={isRunning || !isConnected}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      팔로우 버튼
                    </Button>
                  </div>
                  
                  {/* 모달 테스트 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={testOpenFollowersModal} 
                      disabled={isRunning || !isConnected}
                      size="sm"
                      variant="outline"
                    >
                      팔로워 모달
                    </Button>
                    <Button 
                      onClick={testOpenFollowingModal} 
                      disabled={isRunning || !isConnected}
                      size="sm"
                      variant="outline"
                    >
                      팔로잉 모달
                    </Button>
                  </div>
                  
                  {/* 버튼 선택 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={startButtonSelection} 
                      disabled={isRunning || !isConnected || isSelectingButton}
                      size="sm"
                      variant="outline"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isSelectingButton ? '선택 중...' : '버튼 선택'}
                    </Button>
                    <Button 
                      onClick={getSelectedButtonInfo} 
                      disabled={isRunning || !isConnected}
                      size="sm"
                      variant="outline"
                    >
                      정보 가져오기
                    </Button>
                  </div>
                  
                  {/* 좌표 클릭 */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={clickX}
                      onChange={(e: any) => setClickX(Number(e.target.value))}
                      placeholder="X"
                      className="w-16 bg-gray-800 border-gray-600 text-white text-sm"
                    />
                    <Input
                      type="number"
                      value={clickY}
                      onChange={(e: any) => setClickY(Number(e.target.value))}
                      placeholder="Y"
                      className="w-16 bg-gray-800 border-gray-600 text-white text-sm"
                    />
                    <Button 
                      onClick={testClickAtCoordinates} 
                      disabled={isRunning || !isConnected}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      좌표 클릭
                    </Button>
                  </div>
                  
                  {/* 전체 자동화 */}
                  <Button 
                    onClick={testFullAutomation} 
                    disabled={isRunning || !isConnected}
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    전체 자동화
                  </Button>
                </div>
                
                {/* 선택된 버튼 정보 */}
                {selectedButton && (
                  <div className="text-xs text-gray-300 bg-gray-800 p-2 rounded mb-3">
                    선택: {selectedButton}
                  </div>
                )}
                
                {/* 로그 */}
                <div className="bg-gray-900 text-green-400 p-2 rounded h-32 overflow-y-auto text-xs font-mono">
                  <div className="flex justify-between items-center mb-2">
                    <span>실행 로그</span>
                    <button
                      onClick={clearLogs}
                      className="text-gray-400 hover:text-white text-xs"
                    >
                      초기화
                    </button>
                  </div>
                  {logs.length === 0 ? (
                    <div className="text-gray-500">로그가 없습니다.</div>
                  ) : (
                    logs.slice(0, 10).map((log: string, index: number) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
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
