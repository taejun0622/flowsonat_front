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
import { BenchmarkCreate } from '@/api/models/BenchmarkCreate';
import { HealthEnum } from '@/api/models/HealthEnum';
import { StatusEnum } from '@/api/models/StatusEnum';
import { useInstagram } from '@/contexts/InstagramContext';

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
  const [collectedFollowers, setCollectedFollowers] = React.useState<string[]>([]);
  const [isCollecting, setIsCollecting] = React.useState(false);

  
  const webviewRef = React.useRef<HTMLWebViewElement>(null);
  const { toast } = useToast();

  // Get current username from connected Instagram account
  const currentUsername = instagramAccount?.username || '';

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



  // 설정 업데이트
  const updateConfig = (newConfig: Partial<InstagramAutomationConfig>) => {
    setConfig((prev: InstagramAutomationConfig) => ({ ...prev, ...newConfig }));
  };

  // 팔로워 수집 시작
  const startFollowersCollection = async () => {
    console.log('startFollowersCollection called');
    console.log('Current state:', { isConnected, currentUsername });
    
    if (!isConnected || !currentUsername) {
      console.log('Not connected or no username');
      toast({
        title: "Error",
        description: "Please connect to Instagram first",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Setting isCollecting to true');
      setIsCollecting(true);
      setCollectedFollowers([]);
      
      addLog(`Preparing to navigate to profile: ${currentUsername}`);
      
      // 웹뷰가 이미 로드되어 있다면 바로 이동, 아니면 dom-ready 이벤트를 기다림
      if (webviewRef.current && (webviewRef.current as any).isLoading === false) {
        const profileUrl = `https://www.instagram.com/${currentUsername}/`;
        console.log('WebView ready, navigating to:', profileUrl);
        webviewRef.current.src = profileUrl;
        setCurrentUrl(profileUrl);
      } else {
        console.log('WebView not ready, waiting for dom-ready event...');
      }
      
    } catch (error) {
      console.error('Failed to start followers collection:', error);
      toast({
        title: "Error",
        description: "Failed to start followers collection",
        variant: "destructive"
      });
      setIsCollecting(false);
    }
  };

  // 프로필에서 팔로워 수집
  const collectFollowersFromProfile = async () => {
    console.log('collectFollowersFromProfile called');
    
    if (!webviewRef.current) {
      console.log('No webviewRef.current');
      return;
    }

    try {
      // 현재 페이지 URL 확인
      const currentPageUrl = await webviewRef.current.executeJavaScript(`
        (() => {
          return window.location.href;
        })()
      `);
      console.log('Current page URL:', currentPageUrl);
      
      // 프로필 페이지가 아니라면 경고
      if (!currentPageUrl.includes('/')) {
        console.log('Not on profile page, current URL:', currentPageUrl);
        addLog('Not on profile page, cannot collect followers');
        setIsCollecting(false);
        return;
      }
      
      console.log('On profile page, proceeding with followers collection...');
      
      console.log('Executing JavaScript to find followers link...');
      addLog('Starting followers collection...');
      
      // Click on followers link
      const result = await webviewRef.current.executeJavaScript(`
        (() => {
          console.log('Looking for followers link...');
          
          // 페이지 로딩 대기
          if (document.readyState !== 'complete') {
            console.log('Page not fully loaded, waiting...');
            return 'waiting';
          }
          
          // 여러 방법으로 팔로워 링크 찾기
          let followersLink = null;
          
          // 방법 1: 텍스트로 찾기 (더 정확하게)
          followersLink = Array.from(document.querySelectorAll('a')).find(link => 
            link.textContent && link.textContent.toLowerCase().includes('followers') && 
            !link.textContent.toLowerCase().includes('following')
          );
          
          // 방법 2: href로 찾기
          if (!followersLink) {
            followersLink = Array.from(document.querySelectorAll('a')).find(link => 
              link.href && link.href.includes('/followers')
            );
          }
          
          // 방법 3: 더 구체적인 선택자로 찾기
          if (!followersLink) {
            followersLink = document.querySelector('a[href*="/followers"]');
          }
          
          // 방법 4: 모든 링크를 로그로 확인
          if (!followersLink) {
            console.log('All links on page:');
            Array.from(document.querySelectorAll('a')).forEach((link, index) => {
              if (link.textContent && link.textContent.trim()) {
                console.log(\`Link \${index}:\`, {
                  text: link.textContent.trim(),
                  href: link.href,
                  className: link.className
                });
              }
            });
          }
          
          console.log('Found followers link:', followersLink);
          
          if (followersLink) {
            console.log('Clicking followers link...');
            followersLink.click();
            console.log('Clicked followers link');
            return true;
          }
          
          console.log('No followers link found');
          return false;
        })()
      `);

      console.log('JavaScript execution result:', result);

      // 결과에 따라 처리
      if (result === 'waiting') {
        // 페이지가 아직 로딩 중이면 다시 시도
        console.log('Page still loading, retrying in 2 seconds...');
        setTimeout(() => {
          collectFollowersFromProfile();
        }, 2000);
        return;
      } else if (result === true) {
        // 팔로워 링크를 클릭했으면 모달 대기
        console.log('Followers link clicked, waiting for modal...');
        setTimeout(() => {
          console.log('Starting scrollAndCollectFollowers...');
          scrollAndCollectFollowers();
        }, 3000); // 3초로 늘림
      } else {
        // 팔로워 링크를 찾지 못함
        console.log('Failed to find followers link');
        addLog('Failed to find followers link on profile page');
        setIsCollecting(false);
      }
      
    } catch (error) {
      console.error('Failed to open followers modal:', error);
      addLog('Failed to open followers modal');
      setIsCollecting(false);
    }
  };

  // 스크롤하면서 팔로워 수집
  const scrollAndCollectFollowers = async () => {
    if (!webviewRef.current) return;

    try {
      addLog('Scrolling and collecting followers...');
      
      const followers = await webviewRef.current.executeJavaScript(`
        (() => {
          const followers = [];
          let scrollCount = 0;
          const maxScrolls = 10; // 최대 스크롤 횟수
          
          function scrollAndCollect() {
            // Find follower usernames in the modal
            const usernameElements = document.querySelectorAll('a[href^="/"]');
            usernameElements.forEach(element => {
              const href = element.getAttribute('href');
              if (href && href.startsWith('/') && !href.includes('/p/') && !href.includes('/reel/')) {
                const username = href.substring(1);
                if (username && !followers.includes(username)) {
                  followers.push(username);
                }
              }
            });
            
            // Scroll down in the modal
            const modal = document.querySelector('[role="dialog"]');
            if (modal && scrollCount < maxScrolls) {
              modal.scrollTop = modal.scrollHeight;
              scrollCount++;
              setTimeout(scrollAndCollect, 1000);
            } else {
              return followers;
            }
          }
          
          scrollAndCollect();
          return followers;
        })()
      `);

      setCollectedFollowers(followers || []);
      addLog(`Collected ${followers?.length || 0} followers`);
      
      // Send to server
      await sendFollowersToServer(followers || []);
      
    } catch (error) {
      console.error('Failed to collect followers:', error);
      addLog('Failed to collect followers');
    } finally {
      setIsCollecting(false);
    }
  };

  // 서버에 팔로워 전송
  const sendFollowersToServer = async (followers: string[]) => {
    try {
      addLog('Sending followers to server...');
      
      // 팔로워 데이터로 새로운 Benchmark 생성
      // TODO: 실제 API 호출로 팔로워 데이터와 함께 Benchmark 생성
      // 예: await InstagramService.createBenchmarkWithFollowers(followers);
      
      addLog(`Successfully created benchmark with ${followers.length} followers`);
      
      toast({
        title: "Success",
        description: `Created benchmark with ${followers.length} followers`
      });
      
      // Callback to parent component
      if (onFollowersCollected) {
        onFollowersCollected();
      }
      
    } catch (error) {
      console.error('Failed to create benchmark with followers:', error);
      addLog('Failed to create benchmark with followers');
      toast({
        title: "Error",
        description: "Failed to create benchmark with followers",
        variant: "destructive"
      });
    }
  };

  // 팔로워 수집 자동 시작
  React.useEffect(() => {
    console.log('useEffect triggered:', { isCollectingFollowers, isCollecting });
    if (isCollectingFollowers && !isCollecting) {
      console.log('Starting followers collection...');
      startFollowersCollection();
    }
  }, [isCollectingFollowers, isCollecting]);

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
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
