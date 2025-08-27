import React from 'react';
import { Settings, Target, User, Bell, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsTabProps {
  isConnected: boolean;
  onConnectInstagram: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  isConnected, 
  onConnectInstagram 
}) => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
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
                {!isConnected && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onConnectInstagram} 
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Connect Instagram
                  </Button>
                )}
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
                    <div className="text-sm text-gray-300">Change name, email, password</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Edit
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Notification Settings</div>
                    <div className="text-sm text-gray-300">Manage email and push notifications</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Settings
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3 text-gray-300" />
                  <div>
                    <div className="font-medium text-white">Security</div>
                    <div className="text-sm text-gray-300">Two-factor authentication, login history</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Manage
                </Button>
              </div>
            </div>
          </div>

          {/* Service Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Service Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                <div>
                  <div className="font-medium text-white">API Key Management</div>
                  <div className="text-sm text-gray-300">Generate and manage API keys</div>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Manage
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                <div>
                  <div className="font-medium text-white">Data Export</div>
                  <div className="text-sm text-gray-300">Download account data</div>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
