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
import { Card, CardContent } from '@/components/ui/card';

interface InstagramManualUsernameModalProps {
  open: boolean;
  sessionData: any;
  onConfirm: (username: string) => void;
  onSecondary: () => void;
  secondaryLabel?: string; // e.g., "Cancel" or "Disconnect"
}

export const InstagramManualUsernameModal = ({
  open,
  sessionData,
  onConfirm,
  onSecondary,
  secondaryLabel = 'Cancel'
}: InstagramManualUsernameModalProps) => {
  const [username, setUsername] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);
  const loginTime = sessionData?.timestamp
    ? new Date(sessionData.timestamp).toLocaleString('en-US')
    : 'Unknown';
  const sessionIdStatus = sessionData?.sessionid ? 'Verified' : 'None';
  const userId = sessionData?.ds_user_id || 'None';

  React.useEffect(() => {
    const valid = username.length >= 3 && /^[a-zA-Z0-9._]+$/.test(username);
    setIsValid(valid);
  }, [username]);

  const handleConfirm = () => {
    console.log('=== handleConfirm function called ===');
    console.log('isValid:', isValid);
    console.log('username:', username);
    console.log('onConfirm function:', onConfirm);
    
    if (isValid) {
      console.log('Calling onConfirm with username:', username);
      onConfirm(username);
      console.log('onConfirm call completed');
    } else {
      console.log('Not calling onConfirm because isValid is false');
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && isValid) handleConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onSecondary(); }}>
      <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl max-w-md pointer-events-auto relative z-50">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Connect Your Instagram Account Manually
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Please enter your Instagram username to connect. Or {secondaryLabel.toLowerCase()} to abort and return to dashboard.
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
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e: any) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-black/20 border border-black/30 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-pink-500 pointer-events-auto relative z-10"
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
        
        <DialogFooter className="flex-col sm:flex-row gap-2 pointer-events-auto relative z-50">
          <Button
            onClick={() => {
              console.log('=== InstagramManualUsernameModal Connect button clicked ===');
              console.log('handleConfirm function:', handleConfirm);
              console.log('isValid:', isValid);
              handleConfirm();
              console.log('=== Connect button click completed ===');
            }}
            disabled={!isValid}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 sm:flex-none disabled:opacity-50 pointer-events-auto relative z-50"
          >
            <Check className="h-4 w-4 mr-2" />
            Connect
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log('=== InstagramManualUsernameModal Secondary button clicked ===');
              console.log('onSecondary function:', onSecondary);
              console.log('secondaryLabel:', secondaryLabel);
              onSecondary();
              console.log('=== Secondary button click completed ===');
            }}
            className={`flex-1 sm:flex-none pointer-events-auto relative z-50 ${secondaryLabel.toLowerCase() === 'disconnect' ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-black/30 text-white hover:bg-black/20'}`}
          >
            <X className="h-4 w-4 mr-2" />
            {secondaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
