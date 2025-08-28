import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Square, Settings, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';
import { InstagramAutomationService, InstagramAutomationConfig, AutomationState } from '../services/instagramAutomationService';
import { InstagramDOMHelper } from '../services/instagramDOMHelper';
import { WebViewControl } from '../features/browser-extension/types';
import { useBrowserExtension } from '../features/browser-extension/hooks/useBrowserExtension';

interface InstagramAutomationOverlayProps {
  onClose: () => void;
}

export const InstagramAutomationOverlay: React.FC<InstagramAutomationOverlayProps> = ({
  onClose
}) => {
  const [username, setUsername] = useState('');
  const [automationService, setAutomationService] = useState<InstagramAutomationService | null>(null);
  const [domHelper, setDomHelper] = useState<InstagramDOMHelper | null>(null);
  const [state, setState] = useState<AutomationState>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    totalSteps: 0,
    currentStepIndex: 0
  });
  const [config, setConfig] = useState<InstagramAutomationConfig>({
    maxTargets: 500,
    maxUnfollows: 250,
    unfollowDelayDays: 4,
    scrollDelay: 1000,
    clickDelay: 500
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('https://www.instagram.com');
  
  const webviewRef = useRef<HTMLWebViewElement>(null);
  const { toast } = useToast();

  // 브라우저 익스텐션 훅 사용
  const { state: extensionState, toggleExtension } = useBrowserExtension({
    webviewRef: webviewRef,
    onWebViewLoad: () => {
      console.log('WebView loaded, automation ready');
    },
    onWebViewError: (errorMessage) => {
      console.error('WebView error:', errorMessage);
      toast({
        title: "WebView Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // WebView Control 구현
  const webViewControl: WebViewControl = {
    click: (x: number, y: number) => {
      if (webviewRef.current) {
        webviewRef.current.sendInputEvent({
          type: 'mouseDown',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1
        });
        webviewRef.current.sendInputEvent({
          type: 'mouseUp',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1
        });
      }
    },
    doubleClick: (x: number, y: number) => {
      if (webviewRef.current) {
        webviewRef.current.sendInputEvent({
          type: 'mouseDown',
          x: x,
          y: y,
          button: 'left',
          clickCount: 2
        });
        webviewRef.current.sendInputEvent({
          type: 'mouseUp',
          x: x,
          y: y,
          button: 'left',
          clickCount: 2
        });
      }
    },
    rightClick: (x: number, y: number) => {
      if (webviewRef.current) {
        webviewRef.current.sendInputEvent({
          type: 'mouseDown',
          x: x,
          y: y,
          button: 'right',
          clickCount: 1
        });
        webviewRef.current.sendInputEvent({
          type: 'mouseUp',
          x: x,
          y: y,
          button: 'right',
          clickCount: 1
        });
      }
    },
    hover: (x: number, y: number) => {
      if (webviewRef.current) {
        webviewRef.current.sendInputEvent({
          type: 'mouseMove',
          x: x,
          y: y
        });
      }
    },
    scroll: (deltaX: number, deltaY: number) => {
      if (webviewRef.current) {
        webviewRef.current.sendInputEvent({
          type: 'scrollWheel',
          x: 0,
          y: 0,
          deltaX: deltaX,
          deltaY: deltaY
        });
      }
    },
    drag: (startX: number, startY: number, endX: number, endY: number) => {
      if (webviewRef.current) {
        webviewRef.current.sendInputEvent({
          type: 'mouseDown',
          x: startX,
          y: startY,
          button: 'left',
          clickCount: 1
        });
        webviewRef.current.sendInputEvent({
          type: 'mouseMove',
          x: endX,
          y: endY
        });
        webviewRef.current.sendInputEvent({
          type: 'mouseUp',
          x: endX,
          y: endY,
          button: 'left',
          clickCount: 1
        });
      }
    },
    navigate: async (url: string) => {
      if (!webviewRef.current) return;
      webviewRef.current.loadURL(url);
      await new Promise<void>((resolve)=>{
        const f=()=>{ webviewRef.current?.removeEventListener('did-finish-load', f as any); resolve(); };
        webviewRef.current?.addEventListener('did-finish-load', f as any, { once: true } as any);
      });
    },
    exec: async <T>(fn: () => T | Promise<T>): Promise<T> => {
      // @ts-ignore executeJavaScript exists on Electron webview
      return await webviewRef.current!.executeJavaScript(`(${fn.toString()})()`, true);
    },
    getUrl: async () => {
      // @ts-ignore getURL exists on Electron webview
      return webviewRef.current?.getURL?.() || "";
    },
    reload: async () => {
      webviewRef.current?.reload();
    }
  };

  // 서비스 초기화
  useEffect(() => {
    const domHelperInstance = new InstagramDOMHelper(webViewControl);
    const automationServiceInstance = new InstagramAutomationService(webViewControl, config, domHelperInstance);
    
    setDomHelper(domHelperInstance);
    setAutomationService(automationServiceInstance);
    
    addLog('Instagram 자동화 서비스 초기화 완료');
  }, [config]);

  // 상태 모니터링
  useEffect(() => {
    if (!automationService) return;

    const interval = setInterval(() => {
      const currentState = automationService.getState();
      setState(currentState);
    }, 1000);

    return () => clearInterval(interval);
  }, [automationService]);

  // 로그 추가
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-99), `[${timestamp}] ${message}`]); // 최대 100개 로그 유지
  };

  // 워크플로우 시작
  const startWorkflow = async () => {
    if (!automationService || !username.trim()) {
      toast({
        title: "Error",
        description: "사용자명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      addLog(`워크플로우 시작: ${username}`);
      toast({
        title: "워크플로우 시작",
        description: `${username}에 대한 Instagram 자동화를 시작합니다.`
      });

      await automationService.runWorkflow(username);
      
      addLog('워크플로우 완료');
      toast({
        title: "워크플로우 완료",
        description: "Instagram 자동화가 성공적으로 완료되었습니다."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      addLog(`워크플로우 실패: ${errorMessage}`);
      toast({
        title: "워크플로우 실패",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // 워크플로우 중단
  const stopWorkflow = () => {
    if (automationService) {
      automationService.stopWorkflow();
      addLog('워크플로우 중단됨');
      toast({
        title: "워크플로우 중단",
        description: "Instagram 자동화가 중단되었습니다."
      });
    }
  };

  // 설정 업데이트
  const updateConfig = (newConfig: Partial<InstagramAutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // 로그 클리어
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Instagram 자동화</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${extensionState.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {extensionState.isActive ? 'Extension 활성화' : 'Extension 비활성화'}
            </span>
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
            설정
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
              <CardTitle className="text-white">제어</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Instagram 사용자명</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="사용자명을 입력하세요"
                  disabled={state.isRunning}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={startWorkflow}
                  disabled={state.isRunning || !username.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {state.isRunning ? '실행 중...' : '시작'}
                </Button>
                <Button
                  onClick={stopWorkflow}
                  disabled={!state.isRunning}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  중단
                </Button>
              </div>

              {state.isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white">
                    <span>진행률</span>
                    <span>{Math.round(state.progress)}%</span>
                  </div>
                  <Progress value={state.progress} className="w-full" />
                  <p className="text-sm text-gray-300">{state.currentStep}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-white">설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTargets" className="text-white">최대 Target 수</Label>
                  <Input
                    id="maxTargets"
                    type="number"
                    value={config.maxTargets}
                    onChange={(e) => updateConfig({ maxTargets: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUnfollows" className="text-white">최대 Unfollow 수</Label>
                  <Input
                    id="maxUnfollows"
                    type="number"
                    value={config.maxUnfollows}
                    onChange={(e) => updateConfig({ maxUnfollows: parseInt(e.target.value) })}
                    min="1"
                    max="500"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clickDelay" className="text-white">클릭 지연 (ms)</Label>
                  <Input
                    id="clickDelay"
                    type="number"
                    value={config.clickDelay}
                    onChange={(e) => updateConfig({ clickDelay: parseInt(e.target.value) })}
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
                <CardTitle className="text-white">로그</CardTitle>
                <Button
                  onClick={clearLogs}
                  variant="outline"
                  size="sm"
                  className="text-white border-gray-600 hover:bg-gray-700"
                >
                  클리어
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800 text-green-400 p-3 rounded-md h-64 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500">로그가 없습니다.</p>
                ) : (
                  logs.map((log, index) => (
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
              onClick={() => webviewRef.current?.goBack()}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              ←
            </Button>
            <Button
              onClick={() => webviewRef.current?.goForward()}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              →
            </Button>
            <Button
              onClick={() => webviewRef.current?.reload()}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              ↻
            </Button>
            <Input
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && webviewRef.current) {
                  webviewRef.current.loadURL(currentUrl);
                }
              }}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
            />
            <Button
              onClick={() => toggleExtension()}
              variant={extensionState.isActive ? "default" : "outline"}
              size="sm"
              className={extensionState.isActive ? "bg-green-600 hover:bg-green-700" : "text-white border-gray-600 hover:bg-gray-700"}
            >
              {extensionState.isActive ? 'Extension ON' : 'Extension OFF'}
            </Button>
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
              useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Accept-Language: en-US,en;q=0.9"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
