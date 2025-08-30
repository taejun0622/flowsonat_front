import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Instagram } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInstagram } from '@/contexts/InstagramContext';

interface InstagramConnectionManagerProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const InstagramConnectionManager = ({
  onConnectionChange
}: InstagramConnectionManagerProps) => {
  const { user } = useAuth();
  const { 
    instagramAccount, 
    isConnected, 
    isLoading, 
    checkConnection, 
    connectAccount, 
    disconnectAccount,
    saveInstagramSession
  } = useInstagram();

  React.useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  const handleConnectClick = () => {
    // Instagram connection is now handled through the API only
    console.log('Instagram connection requested');
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
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Connected Account</p>
                  <p className="text-sm text-gray-600">
                    @{instagramAccount?.username || 'Unknown'}
                  </p>
                </div>
                <Button
                  onClick={disconnectAccount}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your Instagram account to enable automation features.
              </p>
              <Button
                onClick={handleConnectClick}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Connect Instagram
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
