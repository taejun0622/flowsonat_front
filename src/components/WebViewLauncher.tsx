import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface WebViewLauncherProps {
  url: string;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export const WebViewLauncher: React.FC<WebViewLauncherProps> = ({
  url,
  children,
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true
}) => {
  const navigate = useNavigate();

  const handleOpenWebView = () => {
    // Navigate to webview page with URL as search parameter
    const targetUrl = `/webview?url=${encodeURIComponent(url)}`;
    console.log('[WebViewLauncher] Opening WebView with URL:', url);
    console.log('[WebViewLauncher] Target route:', targetUrl);
    navigate(targetUrl);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenWebView}
      className={`flex items-center space-x-2 ${className}`}
    >
      {showIcon && <ExternalLink className="h-4 w-4" />}
      {children || 'Open in WebView'}
    </Button>
  );
};
