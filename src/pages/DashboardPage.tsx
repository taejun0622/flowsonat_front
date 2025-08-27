import React, { useEffect, useState } from 'react';
import { LogOut, User, Settings, BarChart3, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BenchmarkTab, BillingTab, SettingsTab } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useInstagram } from '@/contexts/InstagramContext';
import { InstagramLoginOverlay } from '@/components/InstagramLoginOverlay';
import { InstagramService } from '@/api/services/InstagramService';
import { useToast } from '@/hooks/use-toast';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { isConnected, checkConnection } = useInstagram();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  // Check Instagram connection status when entering dashboard (run only once)
  useEffect(() => {
    const checkInstagramConnection = async () => {
      if (!user || hasCheckedConnection || isCheckingConnection) return;
      
      try {
        setIsCheckingConnection(true);
        await checkConnection();
        setHasCheckedConnection(true);
      } catch (error) {
        console.error('Failed to check Instagram connection:', error);
        setHasCheckedConnection(true);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    // Only check Instagram connection when user is logged in
    if (user && !hasCheckedConnection && !isCheckingConnection) {
      checkInstagramConnection();
    }
  }, [user, checkConnection, hasCheckedConnection, isCheckingConnection]); // Prevent duplicate execution

  // Automatically show login overlay when Instagram is not connected
  useEffect(() => {
    if (!isCheckingConnection && !isConnected && user && hasCheckedConnection) {
      console.log('Instagram not connected, showing login overlay');
      setShowLoginOverlay(true);
    }
  }, [isCheckingConnection, isConnected, user, hasCheckedConnection]);

  const handleLoginSuccess = async (sessionData: any) => {
    try {
      // Save Instagram session information to server
      const response = await InstagramService.connectInstagramAccountApiV1InstagramMePost({
        username: 'instagram_user' // temporary username
      });
      
      // Update connection status
      await checkConnection();
      
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

  const handleCloseLoginOverlay = () => {
    setShowLoginOverlay(false);
  };

  const handleConnectInstagram = () => {
    setShowLoginOverlay(true);
  };

  // Show loading when checking connection status
  if (isCheckingConnection) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Checking Instagram connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
              <p className="text-gray-300">Service management and monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-300" />
                <span className="text-sm text-gray-300">{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="text-white border-white hover:bg-white hover:text-gray-900">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="benchmark" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20">
              <TabsTrigger value="benchmark" className="flex items-center text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Benchmark
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Benchmark Tab */}
            <TabsContent value="benchmark" className="mt-6">
              <BenchmarkTab />
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="mt-6">
              <BillingTab />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <SettingsTab 
                isConnected={isConnected}
                onConnectInstagram={handleConnectInstagram}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Instagram Login Overlay */}
      {showLoginOverlay && (
        <InstagramLoginOverlay
          onClose={handleCloseLoginOverlay}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};
