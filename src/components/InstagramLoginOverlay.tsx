import { useMemo, useState } from 'react';
import FullScreenWebView from '@/features/webview/components/FullScreenWebView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram, X } from 'lucide-react';
import { useInstagramLoginDetector } from '@/hooks/useInstagramLoginDetector';

interface InstagramLoginOverlayProps {
  onClose: () => void;
  onLoginSuccess: (sessionData: any) => void;
}

export const InstagramLoginOverlay = ({
  onClose,
  onLoginSuccess
}: InstagramLoginOverlayProps) => {
  const [showInstructions, setShowInstructions] = useState(true);
  // Use a fresh, ephemeral partition for each login overlay to avoid reusing cookies
  const partition = useMemo(() => `temp-instagram-${Date.now()}`, []);

  const handleWebViewClose = () => {
    onClose();
  };

  const handleLoginSuccess = (sessionData: any) => {
    onLoginSuccess(sessionData);
    onClose();
  };

  // Instagram login detection hook
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
        partition={partition}
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
                  Instagram Login
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
              <CardDescription>Sign in to your Instagram account to complete the connection</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Enter your account on the Instagram login page</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Once logged in, the connection will complete automatically</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>This window will close automatically after connection</p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
