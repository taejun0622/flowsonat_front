import React from 'react';
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
import { InstagramService } from '@/api/services/InstagramService';
import { BenchmarkResponse } from '@/api/models/BenchmarkResponse';
import { HealthEnum } from '@/api/models/HealthEnum';
import { StatusEnum } from '@/api/models/StatusEnum';
import { useInstagram } from '@/contexts/InstagramContext';

interface InstagramAutomationOverlayProps {
  onClose: () => void;
}

export const InstagramAutomationOverlay = ({
  onClose
}: InstagramAutomationOverlayProps) => {
  const { instagramAccount, isConnected } = useInstagram();
  const [automationService, setAutomationService] = React.useState<InstagramAutomationService | null>(null);
  const [domHelper, setDomHelper] = React.useState<InstagramDOMHelper | null>(null);
  const [state, setState] = React.useState<AutomationState>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    totalSteps: 0,
    currentStepIndex: 0
  });
  const [config, setConfig] = React.useState<InstagramAutomationConfig>({
    maxTargets: 500,
    maxUnfollows: 250,
    unfollowDelayDays: 4,
    scrollDelay: 1000,
    clickDelay: 500
  });
  const [logs, setLogs] = React.useState<string[]>([]);
  const [showSettings, setShowSettings] = React.useState(false);
  const [currentUrl, setCurrentUrl] = React.useState('https://www.instagram.com');
  const [benchmarks, setBenchmarks] = React.useState<BenchmarkResponse[]>([]);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = React.useState<string>('');
  
  const webviewRef = React.useRef<HTMLWebViewElement>(null);
  const { toast } = useToast();

  // Get current username from connected Instagram account
  const currentUsername = instagramAccount?.username || '';

  // Browser extension hook
  const { state: extensionState } = useBrowserExtension({
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

  // WebView Control implementation
  const webViewControl: WebViewControl = {
    click: (x: number, y: number) => {
      if (webviewRef.current) {
        // mouse_control_extension 방식으로 DOM 이벤트 직접 발생
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            // mousedown, mouseup, click 이벤트 순서대로 발생
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
    },
    doubleClick: (x: number, y: number) => {
      if (webviewRef.current) {
        // mouse_control_extension 방식으로 더블클릭 이벤트 발생
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            // 첫 번째 클릭
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            // 두 번째 클릭
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
    },
    rightClick: (x: number, y: number) => {
      if (webviewRef.current) {
        // mouse_control_extension 방식으로 우클릭 이벤트 발생
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            element.dispatchEvent(new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
    },
    hover: (x: number, y: number) => {
      if (webviewRef.current) {
        // mouse_control_extension 방식으로 hover 이벤트 발생
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            element.dispatchEvent(new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
    },
    scroll: (deltaX: number, deltaY: number) => {
      if (webviewRef.current) {
        // mouse_control_extension 방식으로 스크롤
        webviewRef.current.executeJavaScript(`
          (() => {
            // mouse_control_extension과 동일한 방식으로 스크롤 가능한 요소 찾기
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;
            
            let scrollableElement = document.elementFromPoint(x, y);
            while (scrollableElement && (scrollableElement.scrollHeight <= scrollableElement.clientHeight || getComputedStyle(scrollableElement).overflowY === 'visible')) {
              scrollableElement = scrollableElement.parentElement;
            }
            
            if (scrollableElement) {
              console.log('스크롤 가능한 요소 발견:', scrollableElement);
              scrollableElement.scrollBy(${deltaX}, ${deltaY});
              return true;
            } else {
              console.log('스크롤 가능한 요소를 찾을 수 없음');
              // 폴백: 전체 페이지 스크롤
              window.scrollBy(${deltaX}, ${deltaY});
              return true;
            }
          })()
        `, true);
      }
    },
    drag: (startX: number, startY: number, endX: number, endY: number) => {
      if (webviewRef.current) {
        // mouse_control_extension 방식으로 드래그 이벤트 발생
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${startX}, ${startY});
            if (!element) return false;
            
            // mousedown
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${startX},
              clientY: ${startY}
            }));
            
            // mousemove
            element.dispatchEvent(new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${endX},
              clientY: ${endY}
            }));
            
            // mouseup
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${endX},
              clientY: ${endY}
            }));
            
            return true;
          })()
        `, true);
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
    exec: async <T,>(fn: (...fnArgs: any[]) => T | Promise<T>, ...fnArgs: any[]): Promise<T> => {
      // @ts-ignore executeJavaScript exists on Electron webview
      const argsStr = JSON.stringify(fnArgs);
      // Pass arguments via apply to the evaluated function in the webview context
      return await webviewRef.current!.executeJavaScript(`(${fn.toString()}).apply(null, ${argsStr})`, true);
    },
    getUrl: async () => {
      // @ts-ignore getURL exists on Electron webview
      return webviewRef.current?.getURL?.() || "";
    },
    reload: async () => {
      webviewRef.current?.reload();
    }
  };

  // Service initialization
  React.useEffect(() => {
    const domHelperInstance = new InstagramDOMHelper(webViewControl);
    const automationServiceInstance = new InstagramAutomationService(webViewControl, config, domHelperInstance);
    
    setDomHelper(domHelperInstance);
    setAutomationService(automationServiceInstance);
    
    addLog('Instagram automation service ready');
  }, [config]);

  // Load benchmarks
  React.useEffect(() => {
    const loadBenchmarks = async () => {
      try {
        const res = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet(HealthEnum.HEALTHY, StatusEnum.ACTIVE);
        setBenchmarks(res.benchmarks || []);
        if ((res.benchmarks || []).length > 0) {
          setSelectedBenchmarkId(res.benchmarks![0].id);
        }
      } catch (e) {
        console.error('Failed to load benchmarks', e);
      }
    };
    loadBenchmarks();
  }, []);

  // State monitoring
  React.useEffect(() => {
    if (!automationService) return;

    const interval = setInterval(() => {
      const currentState = automationService.getState();
      setState(currentState);
    }, 1000);

    return () => clearInterval(interval);
  }, [automationService]);

  // Add log
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev: string[]) => [...prev.slice(-99), `[${timestamp}] ${message}`]); // 최대 100개 로그 유지
  };

  // Start workflow
  const startWorkflow = async () => {
    if (!automationService || !isConnected || !currentUsername) {
      toast({ title: 'Error', description: 'Please connect to Instagram first.', variant: 'destructive' });
      return;
    }

    try {
      addLog(`Workflow started: ${currentUsername}`);
      toast({ title: 'Workflow Started', description: `Starting Instagram automation for ${currentUsername}.` });

      await automationService.runWorkflow(currentUsername);
      
      addLog('Workflow completed');
      toast({ title: 'Workflow Completed', description: 'Instagram automation completed successfully.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Workflow failed: ${errorMessage}`);
      toast({ title: 'Workflow Failed', description: errorMessage, variant: 'destructive' });
    }
  };

  // Stop workflow
  const stopWorkflow = () => {
    if (automationService) {
      automationService.stopWorkflow();
      addLog('Workflow stopped');
      toast({ title: 'Workflow Stopped', description: 'Instagram automation has been stopped.' });
    }
  };

  // Add my followers to selected benchmark
  const addMyFollowersToBenchmark = async () => {
    if (!automationService || !selectedBenchmarkId) {
      toast({ title: 'Error', description: 'Please select a benchmark.', variant: 'destructive' });
      return;
    }
    try {
      addLog(`Adding my followers to benchmark (benchmark=${selectedBenchmarkId})`);
      const { added, total } = await automationService.addFollowersToBenchmark(selectedBenchmarkId);
      addLog(`Completed: ${added}/${total}`);
      toast({ title: 'Completed', description: `Added ${added}/${total}` });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Failed', description: error?.message || 'Operation failed.', variant: 'destructive' });
    }
  };

  // 설정 업데이트
  const updateConfig = (newConfig: Partial<InstagramAutomationConfig>) => {
    setConfig((prev: InstagramAutomationConfig) => ({ ...prev, ...newConfig }));
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

              {/* Add my followers → benchmark */}
              <div className="space-y-2">
                <Label className="text-white">Select Benchmark</Label>
                <select
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-2 py-2"
                  value={selectedBenchmarkId}
                  onChange={(e: any) => setSelectedBenchmarkId(e.target.value)}
                >
                  {(benchmarks || []).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.ig.username}</option>
                  ))}
                </select>
                <Button
                  onClick={addMyFollowersToBenchmark}
                  disabled={!selectedBenchmarkId}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Add My Followers to Benchmark
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
              onChange={(e: any) => setCurrentUrl(e.target.value)}
              onKeyPress={(e: any) => {
                if (e.key === 'Enter' && webviewRef.current) {
                  (webviewRef.current as any).loadURL(currentUrl);
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
              useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Accept-Language: en-US,en;q=0.9"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
