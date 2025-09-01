import React from 'react';
import { User, Settings, BarChart3, CreditCard, Bot, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BenchmarkTab, BillingTab, SettingsTab } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useInstagram } from '@/contexts/InstagramContext';
import { useWebView } from '@/hooks/useWebView';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { isConnected, checkConnection, saveInstagramSession } = useInstagram();
  const { openWebView } = useWebView();
  const [showAutomationOverlay, setShowAutomationOverlay] = React.useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = React.useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = React.useState(false);

  // Check Instagram connection status when entering dashboard (run only once)
  React.useEffect(() => {
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

  const handleStartAutomation = () => {
    setShowAutomationOverlay(true);
  };

  const handleRefresh = () => {
    // Refresh Instagram connection status
    checkConnection();
  };

  const handleConnectInstagram = () => {
    // Open Instagram login page in webview
    openWebView('https://www.instagram.com/accounts/login/');
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
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleStartAutomation}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={!isConnected}
              >
                <Bot className="h-4 w-4 mr-2" />
                Execute
              </Button>
              <Button 
                onClick={handleRefresh}
                variant="outline" 
                className="border-black/20 text-white hover:bg-black/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-300" />
              <span className="text-sm text-gray-300">{user?.email}</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="benchmark" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/10 backdrop-blur-sm border border-black/20">
              <TabsTrigger value="benchmark" className="flex items-center text-white data-[state=active]:bg-black/20 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Benchmark
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center text-white data-[state=active]:bg-black/20 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center text-white data-[state=active]:bg-black/20 data-[state=active]:text-white">
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

      {/* Instagram Automation Overlay */}
      {showAutomationOverlay && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Instagram Automation</h2>
            <p className="mb-4">Automation features have been removed.</p>
            <Button onClick={() => setShowAutomationOverlay(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
