import React, { useState } from 'react';
import FullScreenWebView from '@/features/webview/components/FullScreenWebView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram, X } from 'lucide-react';
import { useInstagramLoginDetector } from '@/hooks/useInstagramLoginDetector';

interface InstagramLoginOverlayProps {
  onClose: () => void;
  onLoginSuccess: (sessionData: any) => void;
}

export const InstagramLoginOverlay: React.FC<InstagramLoginOverlayProps> = ({
  onClose,
  onLoginSuccess
}) => {
  const [showInstructions, setShowInstructions] = useState(true);

  const handleWebViewClose = () => {
    onClose();
  };

  const handleLoginSuccess = (sessionData: any) => {
    onLoginSuccess(sessionData);
    onClose();
  };

  // Instagram 로그인 감지 훅 사용
  const { webviewRef } = useInstagramLoginDetector({
    onLoginSuccess: handleLoginSuccess,
    onLoginError: (error) => {
      console.error('Instagram login error:', error);
    }
  });

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <FullScreenWebView
        url="https://www.instagram.com/accounts/login/"
        onClose={handleWebViewClose}
        webviewRef={webviewRef}
      />
      
      {/* Instructions Card */}
      {showInstructions && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          zIndex: 10000,
          maxWidth: '350px'
        }}>
          <Card className="bg-black/95 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Instagram className="h-5 w-5 text-purple-600" />
                  Instagram 로그인
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Instagram 계정에 로그인하여 연결을 완료하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Instagram 로그인 페이지에서 계정 정보를 입력하세요</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>로그인이 완료되면 자동으로 연결됩니다</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>연결이 완료되면 이 창이 자동으로 닫힙니다</p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="w-full"
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
