import React, { useState, useEffect, useRef } from 'react';
import { InstagramAutomationService, InstagramAutomationConfig, AutomationState } from '../services/instagramAutomationService';
import { WebViewControl } from '../features/browser-extension/types';
import { useBrowserExtension } from '../features/browser-extension/hooks/useBrowserExtension';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';

interface InstagramAutomationManagerProps {
  webviewRef: React.RefObject<HTMLWebViewElement>;
}

const InstagramAutomationManager: React.FC<InstagramAutomationManagerProps> = ({
  webviewRef
}) => {
  const [automationService, setAutomationService] = useState<InstagramAutomationService | null>(null);
  const [state, setState] = useState<AutomationState>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    totalSteps: 0,
    currentStepIndex: 0
  });
  const [username, setUsername] = useState('');
  const [config, setConfig] = useState<InstagramAutomationConfig>({
    maxTargets: 500,
    maxUnfollows: 250,
    unfollowDelayDays: 4,
    scrollDelay: 1000,
    clickDelay: 500
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  
  const { toast } = useToast();
  const logRef = useRef<HTMLDivElement>(null);

  // Browser extension hook usage
  const { state: extensionState } = useBrowserExtension({
    webviewRef: webviewRef,
    onWebViewLoad: () => {
      setIsWebViewReady(true);
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
        // Note: webview doesn't support mouseMove events directly
        // This would need to be implemented differently for hover functionality
        console.log('Hover at:', x, y);
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
        // Drag implementation
        webviewRef.current.sendInputEvent({
          type: 'mouseDown',
          x: startX,
          y: startY,
          button: 'left',
          clickCount: 1
        });
        // Note: webview doesn't support mouseMove events directly
        // This would need to be implemented differently for drag functionality
        console.log('Drag to:', endX, endY);
        webviewRef.current.sendInputEvent({
          type: 'mouseUp',
          x: endX,
          y: endY,
          button: 'left',
          clickCount: 1
        });
      }
    }
  };

  // Service initialization
  useEffect(() => {
    if (isWebViewReady && !automationService) {
      const automationServiceInstance = new InstagramAutomationService(config, webViewControl);
      
      setAutomationService(automationServiceInstance);
      
      addLog('Instagram automation service initialized');
    }
  }, [isWebViewReady, automationService, config, webViewControl]);

  // State monitoring
  useEffect(() => {
    if (!automationService) return;

    const interval = setInterval(() => {
      const currentState = automationService.getState();
      setState(currentState);
    }, 1000);

    return () => clearInterval(interval);
  }, [automationService]);

  // Log scroll
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Add log
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Start workflow
  const startWorkflow = async () => {
    if (!automationService || !username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username and wait for WebView to be ready.",
        variant: "destructive"
      });
      return;
    }

    try {
      addLog(`Starting workflow: ${username}`);
      toast({
        title: "Workflow Started",
        description: `Starting Instagram automation for ${username}.`
      });

      await automationService.runWorkflow(username);
      
      addLog('Workflow completed');
      toast({
        title: "Workflow Completed",
        description: "Instagram automation completed successfully."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Workflow failed: ${errorMessage}`);
      toast({
        title: "Workflow Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Stop workflow
  const stopWorkflow = () => {
    if (automationService) {
      automationService.stopWorkflow();
      addLog('Workflow stopped');
      toast({
        title: "Workflow Stopped",
        description: "Instagram automation has been stopped."
      });
    }
  };

  // Update config
  const updateConfig = (newConfig: Partial<InstagramAutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Instagram Automation Manager</h1>
        <p className="text-gray-600">
          Manage and monitor Instagram automation workflows.
        </p>
      </div>

      <Tabs defaultValue="control" className="space-y-6">
        <TabsList>
          <TabsTrigger value="control">Control</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Control</CardTitle>
              <CardDescription>
                Start or stop Instagram automation workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Instagram Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={state.isRunning}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={startWorkflow}
                  disabled={!isWebViewReady || state.isRunning || !username.trim()}
                  className="flex-1"
                >
                  {state.isRunning ? 'Running...' : 'Start Workflow'}
                </Button>
                <Button
                  onClick={stopWorkflow}
                  disabled={!state.isRunning}
                  variant="destructive"
                  className="flex-1"
                >
                  Stop
                </Button>
              </div>

              {state.isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(state.progress)}%</span>
                  </div>
                  <Progress value={state.progress} className="w-full" />
                  <p className="text-sm text-gray-600">{state.currentStep}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Adjust the behavior of Instagram automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTargets">Max Targets</Label>
                  <Input
                    id="maxTargets"
                    type="number"
                    value={config.maxTargets}
                    onChange={(e) => updateConfig({ maxTargets: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUnfollows">Max Unfollows</Label>
                  <Input
                    id="maxUnfollows"
                    type="number"
                    value={config.maxUnfollows}
                    onChange={(e) => updateConfig({ maxUnfollows: parseInt(e.target.value) })}
                    min="1"
                    max="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unfollowDelayDays">Unfollow Delay Days</Label>
                  <Input
                    id="unfollowDelayDays"
                    type="number"
                    value={config.unfollowDelayDays}
                    onChange={(e) => updateConfig({ unfollowDelayDays: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scrollDelay">Scroll Delay (ms)</Label>
                  <Input
                    id="scrollDelay"
                    type="number"
                    value={config.scrollDelay}
                    onChange={(e) => updateConfig({ scrollDelay: parseInt(e.target.value) })}
                    min="100"
                    max="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clickDelay">Click Delay (ms)</Label>
                  <Input
                    id="clickDelay"
                    type="number"
                    value={config.clickDelay}
                    onChange={(e) => updateConfig({ clickDelay: parseInt(e.target.value) })}
                    min="100"
                    max="3000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>
                View logs from the automation execution process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Total {logs.length} logs
                </span>
                <Button onClick={clearLogs} variant="outline" size="sm">
                  Clear Logs
                </Button>
              </div>
              <div
                ref={logRef}
                className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm"
              >
                {logs.length === 0 ? (
                  <p className="text-gray-500">No logs available.</p>
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
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Check the current status of the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WebView Status</Label>
                  <div className={`px-3 py-2 rounded-md text-sm ${
                    isWebViewReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isWebViewReady ? 'Ready' : 'Preparing...'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Browser Extension</Label>
                  <div className={`px-3 py-2 rounded-md text-sm ${
                    extensionState.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {extensionState.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Automation Status</Label>
                  <div className={`px-3 py-2 rounded-md text-sm ${
                    state.isRunning ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {state.isRunning ? 'Running' : 'Idle'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Current Step</Label>
                  <div className="px-3 py-2 rounded-md text-sm bg-gray-100 text-gray-800">
                    {state.currentStep || 'None'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Progress</Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Step {state.currentStepIndex} / {state.totalSteps}</span>
                    <span>{Math.round(state.progress)}%</span>
                  </div>
                  <Progress value={state.progress} className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstagramAutomationManager;
