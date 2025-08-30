import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Instagram } from 'lucide-react';
import { useInstagramSession } from '@/hooks/useInstagramSession';
import { useDynamicWebViewSettings } from '@/hooks/useDynamicWebViewSettings';
import { INSTAGRAM_SESSION_PARTITION } from '@/constants/session';
import { useBrowserExtension } from '@/features/browser-extension/hooks/useBrowserExtension';
import { cursorAnimations } from '@/features/browser-extension/utils/cursorStyles';

interface InstagramWebViewProps {
  onClose?: () => void;
  onLoginSuccess?: (sessionData: any) => void;
  onAutomationReady?: (username: string) => void;
  initialUrl?: string;
  showInstructions?: boolean;
}

export const InstagramWebView = ({
  onClose,
  onLoginSuccess,
  onAutomationReady,
  initialUrl = 'https://www.instagram.com',
  showInstructions = false
}: InstagramWebViewProps) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showInstructionsCard, setShowInstructionsCard] = React.useState(showInstructions);
  const webviewRef = React.useRef<HTMLWebViewElement>(null);

  // Instagram 세션 관리
  const { loginStatus, refreshLoginStatus } = useInstagramSession({
    webviewRef,
    onLoginStatusChange: (status) => {
      console.log('Instagram login status changed:', status);
      
      if (status.isLoggedIn && status.username) {
        onAutomationReady?.(status.username);
      }
    }
  });

  // 동적 웹뷰 설정
  const { currentMode, settings, setMode } = useDynamicWebViewSettings({
    loginStatus,
    onModeChange: (mode) => {
      console.log(`WebView mode changed to: ${mode}`);
    }
  });

  // 브라우저 익스텐션 훅
  const { state: extensionState } = useBrowserExtension({
    webviewRef,
    onWebViewLoad: () => {
      setIsLoading(false);
      console.log('Instagram WebView loaded successfully');
    },
    onWebViewError: (errorMessage) => {
      setError(errorMessage);
      setIsLoading(false);
      console.error('Instagram WebView error:', errorMessage);
    },
    disableAutoActivation: !settings.enableExtension,
    blockPhysicalMouse: settings.blockPhysicalMouse,
    enabled: settings.enableExtension,
  });

  // 커서 애니메이션 스타일 추가 (automation 모드에서만)
  React.useEffect(() => {
    if (!settings.enableExtension) return;
    
    const style = document.createElement('style');
    style.textContent = cursorAnimations;
    document.head.appendChild(style);

    return () => {
      try {
        document.head.removeChild(style);
      } catch (error) {
        // Style element already removed or not found
      }
    };
  }, [settings.enableExtension]);

  // 로그인 성공 처리
  const handleLoginSuccess = React.useCallback((sessionData: any) => {
    console.log('Login success detected:', sessionData);
    onLoginSuccess?.(sessionData);
  }, [onLoginSuccess]);

  // 웹뷰 새로고침
  const handleRefresh = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
      setIsLoading(true);
      setError(null);
    }
  };

  // 로그인 모드로 강제 전환
  const handleForceLoginMode = () => {
    setMode('login');
    if (webviewRef.current) {
      webviewRef.current.src = 'https://www.instagram.com/accounts/login/';
    }
  };

  // Automation 모드로 강제 전환
  const handleForceAutomationMode = () => {
    setMode('automation');
    if (webviewRef.current) {
      webviewRef.current.src = 'https://www.instagram.com/';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      {settings.showHeader && (
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            <span className="font-semibold">Instagram Automation</span>
            <span className="text-sm text-gray-400">
              Mode: {currentMode} | Status: {loginStatus.isLoggedIn ? 'Logged In' : 'Not Logged In'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} size="sm" variant="outline">
              Refresh
            </Button>
            <Button onClick={handleForceLoginMode} size="sm" variant="outline">
              Login Mode
            </Button>
            <Button onClick={handleForceAutomationMode} size="sm" variant="outline">
              Automation Mode
            </Button>
            <Button onClick={onClose} size="sm" variant="destructive">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Instructions Card */}
      {showInstructionsCard && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 max-w-md w-11/12">
          <Card className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Instagram className="h-5 w-5 text-pink-500" />
                Instagram WebView
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-300 space-y-2">
                <div>• This WebView automatically detects login status</div>
                <div>• Login mode: Manual interaction enabled</div>
                <div>• Automation mode: Custom cursor and automation features enabled</div>
                <div>• Current mode: <span className="text-pink-400">{currentMode}</span></div>
              </div>
              <Button
                onClick={() => setShowInstructionsCard(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Got it
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p>Loading Instagram...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center z-20">
          <div className="text-center text-white">
            <div className="mb-4">Error: {error}</div>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* WebView */}
      <webview
        ref={webviewRef}
        src={initialUrl}
        style={{
          flex: 1,
          width: '100%',
          height: '100%'
        }}
        partition={INSTAGRAM_SESSION_PARTITION}
        webpreferences="nodeIntegration=no, contextIsolation=yes"
        allowpopups={true}
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Accept-Language: en-US,en;q=0.9"
      />
    </div>
  );
};
