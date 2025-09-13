import React from 'react';
import { Instagram, Check, X } from 'lucide-react';
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
  console.log('InstagramUsernameConfirmModal render:', { open, username, sessionData: !!sessionData });
  
  const loginTime = sessionData?.timestamp
    ? new Date(sessionData.timestamp).toLocaleString('en-US')
    : 'Unknown';
  const sessionIdStatus = sessionData?.sessionid ? 'Verified' : 'None';
  const userId = sessionData?.ds_user_id || 'None';

  if (!open) {
    console.log('Modal not open, not rendering');
    return null;
  }
  
  console.log('Modal is open, rendering modal');
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
      <div className="bg-black/90 border border-white/30 text-white shadow-2xl max-w-md w-full mx-4 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white flex items-center gap-2 text-lg font-semibold">
            <Instagram className="h-5 w-5 text-pink-500" />
            Connect Instagram Account
          </h2>
          <button 
            onClick={onCancel}
            className="text-white hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-gray-300 mb-4">
          You wanna connect @{username} to flowsonat?
        </p>
        
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
        
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            onClick={() => {
              console.log('=== InstagramUsernameConfirmModal OK button clicked ===');
              console.log('onConfirm function:', onConfirm);
              onConfirm();
              console.log('=== OK button click completed ===');
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 sm:flex-none"
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
            className="border-white/30 text-white hover:bg-white/10 flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
