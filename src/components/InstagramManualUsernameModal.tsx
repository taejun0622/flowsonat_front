import React from 'react';
import { Instagram, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface InstagramManualUsernameModalProps {
  open: boolean;
  sessionData: any;
  onConfirm: (username: string) => void;
  onCancel: () => void;
  onDisconnect: () => void;
}

export const InstagramManualUsernameModal = ({
  open,
  sessionData,
  onConfirm,
  onCancel,
  onDisconnect
}: InstagramManualUsernameModalProps) => {
  const [username, setUsername] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);

  const loginTime = sessionData?.timestamp
    ? new Date(sessionData.timestamp).toLocaleString('en-US')
    : 'Unknown';
  const sessionIdStatus = sessionData?.sessionid ? 'Verified' : 'None';
  const userId = sessionData?.ds_user_id || 'None';

  React.useEffect(() => {
    // username 유효성 검사
    const valid = username.length >= 3 && /^[a-zA-Z0-9._]+$/.test(username);
    setIsValid(valid);
  }, [username]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(username);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && isValid) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Connect Your Instagram Account Manually
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Please enter your Instagram username manually to complete the connection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="bg-black/20 border-black/30 pointer-events-auto">
            <CardContent className="p-4 pointer-events-auto">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-white">Manual Input</div>
                    <div className="text-sm text-gray-400">Instagram Username</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e: any) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-black/20 border-black/30 text-white placeholder-gray-400 focus:border-pink-500 pointer-events-auto relative z-10"
                    autoFocus
                  />
                  {username && !isValid && (
                    <p className="text-sm text-red-400">
                      Username must be at least 3 characters and contain only letters, numbers, dots, and underscores.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-sm text-gray-400 bg-black/10 p-3 rounded-lg">
            <div className="font-medium text-white mb-1">Connection Info:</div>
            <div>• Login Time: {loginTime}</div>
            <div>• Session ID: {sessionIdStatus}</div>
            <div>• User ID: {userId}</div>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 sm:flex-none disabled:opacity-50"
          >
            <Check className="h-4 w-4 mr-2" />
            Connect
          </Button>
          <Button
            variant="outline"
            onClick={onDisconnect}
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-black/30 text-white hover:bg-black/20 flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
