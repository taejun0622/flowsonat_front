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
  onConfirm: (username: string, sessionData: any) => void;
  onCancel: () => void;
}

export const InstagramUsernameConfirmModal = ({
  open,
  username,
  sessionData,
  onConfirm,
  onCancel
}: InstagramUsernameConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram Account Confirmation
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            You have successfully logged into Instagram. Please confirm the account information below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="bg-black/20 border-black/30">
            <CardContent className="p-4">
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
            <div>• Login Time: {new Date(sessionData.timestamp).toLocaleString('en-US')}</div>
            <div>• Session ID: {sessionData.sessionid ? 'Verified' : 'None'}</div>
            <div>• User ID: {sessionData.ds_user_id || 'None'}</div>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-black/30 text-white hover:bg-black/20 flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(username, sessionData)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 sm:flex-none"
          >
            <Check className="h-4 w-4 mr-2" />
            Connect Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
