import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WebView } from '@/components/WebView';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, ExternalLink, CheckCircle } from 'lucide-react';
import { useInstagram } from '@/contexts/InstagramContext';
import { useToast } from '@/hooks/use-toast';

export const WebViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInstagramLoginDetected, setIsInstagramLoginDetected] = useState(false);
  const [loginData, setLoginData] = useState<any>(null);
  const [isCheckingLoginStatus, setIsCheckingLoginStatus] = useState(true);
  
  const { saveInstagramSession } = useInstagram();
  const { toast } = useToast();

  // Get URL from search params or use default
  const url = searchParams.get('url') || 'https://www.google.com';
  const isInstagramPage = url.includes('instagram.com');

  useEffect(() => {
    setCurrentUrl(url);
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    console.error('WebView error:', error);
    setIsLoading(false);
  };

  const handleInstagramLogin = async (sessionData: any) => {
    console.log('Instagram login detected in WebViewPage:', sessionData);
    setLoginData(sessionData);
    setIsInstagramLoginDetected(true);
    setIsCheckingLoginStatus(false);
    
    try {
      // Instagram 세션 정보를 저장
      await saveInstagramSession(sessionData);
      
      toast({
        title: "Instagram Connected!",
        description: `Successfully connected to Instagram account @${sessionData.username || 'unknown'}.`,
      });
      
      // 3초 후 대시보드로 돌아가기
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Failed to save Instagram session:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to save Instagram session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoginStatusCheck = (isLoggedIn: boolean) => {
    console.log('Login status check result:', isLoggedIn);
    setIsCheckingLoginStatus(false);
    
    if (isLoggedIn) {
      // 이미 로그인되어 있다면 즉시 로그인 성공으로 처리
      console.log('User is already logged in to Instagram');
      
      // 실제 세션 데이터는 WebView에서 전송될 것이므로
      // 여기서는 상태만 업데이트하고 실제 데이터는 기다림
      setIsInstagramLoginDetected(true);
      
      // 로그인 성공 메시지 표시
      toast({
        title: "Instagram Already Connected!",
        description: "You are already logged in to Instagram. Connecting to your account...",
      });
      
      // 3초 후 대시보드로 돌아가기
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } else {
      // 로그인되지 않은 경우에만 안내 메시지 표시
      console.log('User is not logged in to Instagram');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // The WebView component will handle the actual reload
    window.location.reload();
  };

  const handleOpenInBrowser = () => {
    // Open in default browser
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(currentUrl);
    } else {
      // Fallback for web
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          {/* Instagram 로그인 성공 표시 */}
          {isInstagramLoginDetected && (
            <div className="flex items-center space-x-2 ml-4 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Instagram Connected!
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInBrowser}
            className="flex items-center space-x-1"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in Browser</span>
          </Button>
        </div>
      </div>

      {/* Instagram 로그인 안내 (Instagram 페이지인 경우) */}
      {isInstagramPage && !isInstagramLoginDetected && !isCheckingLoginStatus && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-center justify-center text-sm text-blue-700 dark:text-blue-300">
            <span>
              {url.includes('/accounts/login/') 
                ? 'Please log in to your Instagram account. The system will automatically detect when you are logged in.'
                : 'Instagram page loaded. The system will automatically detect your login status.'
              }
            </span>
          </div>
        </div>
      )}

      {/* Instagram 로그인 상태 확인 중 */}
      {isInstagramPage && isCheckingLoginStatus && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3">
          <div className="flex items-center justify-center text-sm text-yellow-700 dark:text-yellow-300">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <span>Checking Instagram login status...</span>
          </div>
        </div>
      )}

      {/* WebView Container */}
      <div className="flex-1 w-full">
        <WebView
          src={currentUrl}
          onLoad={handleLoad}
          onError={handleError}
          onInstagramLogin={isInstagramPage ? handleInstagramLogin : undefined}
          onLoginStatusCheck={isInstagramPage ? handleLoginStatusCheck : undefined}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
