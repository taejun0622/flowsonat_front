import React from 'react';
import { Settings, Target, User, Lock, Mail, Eye, EyeOff, LogOut, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useInstagram } from '@/contexts/InstagramContext';
import { useToast } from '@/hooks/use-toast';
import { UsersService } from '@/api/services/UsersService';
import { WebViewLauncher } from '@/components/WebViewLauncher';

interface SettingsTabProps {
  isConnected: boolean;
  onConnectInstagram?: () => void;
}

export const SettingsTab = ({
  isConnected,
  onConnectInstagram
}: SettingsTabProps) => {
  const { user, logout } = useAuth();
  const { disconnectAccount, isLoading: instagramLoading } = useInstagram();
  const { toast } = useToast();
  
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [profileForm, setProfileForm] = React.useState({
    email: user?.email || ''
  });
  
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await UsersService.updateUserApiV1UsersUserIdPut(user?.id || '', {
        email: profileForm.email
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      setProfileDialogOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      await UsersService.updateUserApiV1UsersUserIdPut(user?.id || '', {
        password: passwordForm.newPassword
      });
      
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordDialogOpen(false);
    } catch (error) {
      console.error('Failed to update password:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      await disconnectAccount();
      setDisconnectDialogOpen(false);
      toast({
        title: "Instagram Disconnected",
        description: "Your Instagram account has been disconnected.",
      });
    } catch (error) {
      console.error('Failed to disconnect Instagram:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect Instagram account.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-black/10 backdrop-blur-sm border-black/20">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Settings className="h-5 w-5 mr-2" />
          Settings
        </CardTitle>
        <CardDescription className="text-gray-300">Account and service settings management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Instagram Connection Status */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Instagram Connection</h3>
            <div className="p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="h-5 w-5 mr-3 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Connection Status</div>
                    <div className="text-sm text-gray-300">
                      {isConnected ? 'Connected to Instagram' : 'Not connected to Instagram'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isConnected ? (
                    <div className="flex gap-2">
                      <WebViewLauncher 
                        url="https://www.instagram.com/accounts/login/"
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect Instagram
                      </WebViewLauncher>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <WebViewLauncher 
                        url="https://www.instagram.com"
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Instagram
                      </WebViewLauncher>
                      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            Disconnect
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Disconnect Instagram</DialogTitle>
                            <DialogDescription className="text-gray-300">
                              Are you sure you want to disconnect your Instagram account? 
                              This will remove all connection data.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setDisconnectDialogOpen(false)}
                              className="border-black/30 text-white hover:bg-black/20"
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDisconnectInstagram}
                              disabled={instagramLoading}
                            >
                              {instagramLoading ? 'Disconnecting...' : 'Disconnect'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Profile Information</div>
                    <div className="text-sm text-gray-300">Change email address</div>
                  </div>
                </div>
                <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Edit Profile</DialogTitle>
                      <DialogDescription className="text-gray-300">
                        Update your email address
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ email: e.target.value })}
                            className="pl-10 bg-black/20 border-black/30 text-white focus:border-white/30"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setProfileDialogOpen(false)}
                          className="border-black/30 text-white hover:bg-black/20"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Updating...' : 'Update Profile'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 mr-3 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Password</div>
                    <div className="text-sm text-gray-300">Change your password</div>
                  </div>
                </div>
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/20 backdrop-blur-md border-black/30 text-white shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Change Password</DialogTitle>
                      <DialogDescription className="text-gray-300">
                        Choose a new password
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div>
                        <Label htmlFor="newPassword" className="text-white">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="pl-10 pr-10 bg-black/20 border-black/30 text-white focus:border-white/30"
                            placeholder="Enter new password"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="pl-10 pr-10 bg-black/20 border-black/30 text-white focus:border-white/30"
                            placeholder="Confirm new password"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setPasswordDialogOpen(false)}
                          className="border-black/30 text-white hover:bg-black/20"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Changing...' : 'Change Password'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-3 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Logout</div>
                    <div className="text-sm text-gray-300">Sign out of your account</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
