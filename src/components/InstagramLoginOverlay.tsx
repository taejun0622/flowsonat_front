import React from 'react';
import FullScreenWebView from '@/features/webview/components/FullScreenWebView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram } from 'lucide-react';
import { useInstagramLoginDetector } from '@/hooks/useInstagramLoginDetector';
import { InstagramUsernameConfirmModal } from './InstagramUsernameConfirmModal';
import { InstagramManualUsernameModal } from './InstagramManualUsernameModal';

interface InstagramLoginOverlayProps {
  onClose: () => void;
  onLoginSuccess: (sessionData: any) => void;
}

export const InstagramLoginOverlay = ({
  onClose,
  onLoginSuccess
}: InstagramLoginOverlayProps) => {
  const [showInstructions, setShowInstructions] = React.useState(true);
  const [showUsernameModal, setShowUsernameModal] = React.useState(false);
  const [showManualUsernameModal, setShowManualUsernameModal] = React.useState(false);
  const [detectedUsername, setDetectedUsername] = React.useState('');
  const [sessionData, setSessionData] = React.useState<any>(null);
  
  // Use a fresh, ephemeral partition for each login overlay to avoid reusing cookies
  const partition = React.useMemo(() => `temp-instagram-${Date.now()}`, []);

  const handleWebViewClose = () => {
    onClose();
  };

  const handleLoginSuccess = (sessionData: any) => {
    // username이 이미 확인된 경우 바로 진행
    onLoginSuccess(sessionData);
    onClose();
  };

  const handleUsernameFound = (username: string, sessionData: any) => {
    console.log('Username found, showing confirmation modal:', username);
    setDetectedUsername(username);
    setSessionData(sessionData);
    setShowUsernameModal(true);
  };

  const handleUsernameConfirm = (username: string, sessionData: any) => {
    console.log('Username confirmed:', username);
    // username을 sessionData에 추가
    const updatedSessionData = {
      ...sessionData,
      username: username
    };
    onLoginSuccess(updatedSessionData);
    setShowUsernameModal(false);
    onClose();
  };

  const handleUsernameCancel = () => {
    console.log('Username confirmation cancelled, showing manual input modal');
    setShowUsernameModal(false);
    // 수동 입력 모달 표시
    setShowManualUsernameModal(true);
  };

  const handleManualUsernameConfirm = (username: string, sessionData: any) => {
    console.log('Manual username confirmed:', username);
    onLoginSuccess(sessionData);
    setShowManualUsernameModal(false);
    onClose();
  };

  const handleManualUsernameCancel = () => {
    console.log('Manual username input cancelled');
    setShowManualUsernameModal(false);
    // 취소 시에도 기본 sessionData로 진행
    if (sessionData) {
      const updatedSessionData = {
        ...sessionData,
        username: 'instagram_user'
      };
      onLoginSuccess(updatedSessionData);
      onClose();
    }
  };

  const handleDisconnect = async () => {
    console.log('User chose to disconnect, clearing session');
    try {
      // Instagram 세션 삭제
      await window.electronAPI?.clearInstagramSession?.();
    } catch (e) {
      console.warn('Failed to clear Instagram session:', e);
    }
    setShowManualUsernameModal(false);
    onClose();
  };

  // Instagram login detection hook
  const { webviewRef } = useInstagramLoginDetector({
    onLoginSuccess: handleLoginSuccess,
    onLoginError: (error) => {
      console.error('Instagram login error:', error);
    },
    onUsernameFound: handleUsernameFound
  });

  return (
    <>
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <FullScreenWebView
          url="https://www.instagram.com/accounts/login/"
          onClose={handleWebViewClose}
          webviewRef={webviewRef}
          partition={partition}
        />
        
        {/* Instructions Card */}
        {showInstructions && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <Card className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  Instagram Login
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Sign in to your Instagram account to connect it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-300 space-y-2">
                  <div>• Enter your account credentials on the Instagram login page</div>
                  <div>• Account information will be automatically detected after login</div>
                  <div>• Confirm the connection to enable automation features</div>
                </div>
                <Button
                  onClick={() => setShowInstructions(false)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Username Confirmation Modal */}
      <InstagramUsernameConfirmModal
        open={showUsernameModal}
        username={detectedUsername}
        sessionData={sessionData}
        onConfirm={handleUsernameConfirm}
        onCancel={handleUsernameCancel}
      />

      {/* Manual Username Input Modal */}
      <InstagramManualUsernameModal
        open={showManualUsernameModal}
        sessionData={sessionData}
        onConfirm={handleManualUsernameConfirm}
        onCancel={handleManualUsernameCancel}
        onDisconnect={handleDisconnect}
      />
    </>
  );
};
