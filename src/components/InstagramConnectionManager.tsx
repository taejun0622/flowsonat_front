import React from 'react';
import { useInstagram } from '@/contexts/InstagramContext';
import { useAuth } from '@/contexts/AuthContext';
import { InstagramService } from '@/api/services/InstagramService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Instagram, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InstagramLoginOverlay } from './InstagramLoginOverlay';

interface InstagramConnectionManagerProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const InstagramConnectionManager = ({
  onConnectionChange
}: InstagramConnectionManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLoginOverlay, setShowLoginOverlay] = React.useState(false);
  const { 
    instagramAccount, 
    isConnected, 
    isLoading, 
    checkConnection, 
    connectAccount, 
    disconnectAccount 
  } = useInstagram();

  React.useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  const handleLoginSuccess = async (sessionData: any) => {
    console.log('Instagram login successful:', sessionData);
    try {
      // Instagram 세션 정보를 서버에 저장
      // TODO: 실제 Instagram API에서 username을 추출하거나 별도 API 사용
      const response = await InstagramService.connectInstagramAccountApiV1InstagramMePost({
        username: 'instagram_user' // 임시 username
      });
      
      // 연결 상태 업데이트
      checkConnection();
      
      toast({
        title: "Instagram connected",
        description: "Successfully connected to Instagram.",
      });
    } catch (error: any) {
      console.error('Failed to save Instagram session:', error);
      toast({
        title: "Connection failed",
        description: "Failed to save Instagram session.",
        variant: "destructive",
      });
    }
  };

  const handleConnectClick = () => {
    setShowLoginOverlay(true);
  };

  const handleCloseLoginOverlay = () => {
    setShowLoginOverlay(false);
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Checking Instagram connection...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          Instagram Connection
        </CardTitle>
        <CardDescription>
          Connect your Instagram account to enable automated features
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Connected</span>
            </div>
            {instagramAccount && (
              <div className="text-sm text-gray-600">
                <p>Username: {instagramAccount.username}</p>
                <p>Account ID: {instagramAccount.ig_user_id || 'N/A'}</p>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={disconnectAccount}
              className="w-full"
            >
              Disconnect Instagram
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Not Connected</span>
            </div>
            <p className="text-sm text-gray-600">
              Connect your Instagram account to get started with automated features.
            </p>
            <Button 
              onClick={handleConnectClick}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Instagram className="h-4 w-4 mr-2" />
              Connect Instagram Account
            </Button>
          </div>
        )}
              </CardContent>
      </Card>

      {/* Instagram Login Overlay */}
      {showLoginOverlay && (
        <InstagramLoginOverlay
          onClose={handleCloseLoginOverlay}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
};
