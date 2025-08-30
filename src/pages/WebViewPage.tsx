import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WebView } from '@/components/WebView';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';

export const WebViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get URL from search params or use default
  const url = searchParams.get('url') || 'https://www.google.com';

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

      {/* WebView Container */}
      <div className="flex-1 w-full">
        <WebView
          src={currentUrl}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
