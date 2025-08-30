import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useBrowserExtension } from '../features/browser-extension/hooks/useBrowserExtension';
import { useInstagram } from '@/contexts/InstagramContext';
import { useWebViewControl } from '@/hooks/useWebViewControl';
import { useFollowersCollection } from '@/hooks/useFollowersCollection';
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

  // Allow closing overlay with Escape when header/menu is removed
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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
      <div className="flex-1 flex">
        {/* Left Panel - Settings only (controls/logs removed) */}
        {showSettings && (
          <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 flex flex-col">
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
          </div>
        )}

        {/* Right Panel - WebView */}
        <div className="flex-1 flex flex-col">
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
