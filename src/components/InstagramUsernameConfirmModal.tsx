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

interface InstagramUsernameConfirmModalProps {
  open: boolean;
  username: string;
  sessionData: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export const InstagramUsernameConfirmModal = ({
  open,
  username,
  sessionData,
  onConfirm,
  onCancel
}: InstagramUsernameConfirmModalProps) => {
  const loginTime = sessionData?.timestamp
    ? new Date(sessionData.timestamp).toLocaleString('en-US')
    : 'Unknown';
  const sessionIdStatus = sessionData?.sessionid ? 'Verified' : 'None';
  const userId = sessionData?.ds_user_id || 'None';

  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl max-w-md pointer-events-auto relative z-50">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Connect Instagram Account
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            You wanna connect @{username} to flowsonat?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="bg-black/20 border-black/30 pointer-events-auto">
            <CardContent className="p-4 pointer-events-auto">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-white">@{username}</div>
                  <div className="text-sm text-gray-400">Instagram Account</div>
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
              console.log('=== InstagramUsernameConfirmModal OK button clicked ===');
              console.log('onConfirm function:', onConfirm);
              onConfirm();
              console.log('=== OK button click completed ===');
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 sm:flex-none pointer-events-auto relative z-50"
          >
            <Check className="h-4 w-4 mr-2" />
            OK
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log('=== InstagramUsernameConfirmModal Cancel button clicked ===');
              console.log('onCancel function:', onCancel);
              onCancel();
              console.log('=== Cancel button click completed ===');
            }}
            className="border-black/30 text-white hover:bg-black/20 flex-1 sm:flex-none pointer-events-auto relative z-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
