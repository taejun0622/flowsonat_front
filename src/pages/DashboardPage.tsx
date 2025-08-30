import React from 'react';
import { User, Settings, BarChart3, CreditCard, Bot, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BenchmarkTab, BillingTab, SettingsTab } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useInstagram } from '@/contexts/InstagramContext';
import { InstagramWebView } from '@/components/InstagramWebView';
import { InstagramAutomationOverlay } from '@/components/InstagramAutomationOverlay';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { isConnected, checkConnection, saveInstagramSession } = useInstagram();
  const [showInstagramWebView, setShowInstagramWebView] = React.useState(false);
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

  // Automatically show Instagram WebView when Instagram is not connected
  React.useEffect(() => {
    if (!isCheckingConnection && !isConnected && user && hasCheckedConnection) {
      console.log('Instagram not connected, showing Instagram WebView');
      setShowInstagramWebView(true);
    }
  }, [isCheckingConnection, isConnected, user, hasCheckedConnection]);

  const handleLoginSuccess = async (sessionData: any) => {
    try {
      // Save Instagram session information to server (통합된 로직 사용)
      await saveInstagramSession(sessionData);
      
      // Update connection status
      await checkConnection();
    } catch (error: any) {
      console.error('Failed to save Instagram session:', error);
      // 에러 처리는 saveInstagramSession 내부에서 이미 처리됨
    }
  };

  const handleCloseInstagramWebView = () => {
    setShowInstagramWebView(false);
  };

  const handleConnectInstagram = () => {
    setShowInstagramWebView(true);
  };

  const handleStartAutomation = () => {
    setShowAutomationOverlay(true);
  };

  const handleRefresh = () => {
    // Refresh Instagram connection status
    checkConnection();
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

      {/* Instagram WebView */}
      {showInstagramWebView && (
        <InstagramWebView
          onClose={handleCloseInstagramWebView}
          onLoginSuccess={handleLoginSuccess}
          onAutomationReady={(username: string) => {
            console.log('Automation ready for username:', username);
          }}
          initialUrl="https://www.instagram.com/accounts/login/"
          showInstructions={true}
        />
      )}

      {/* Instagram Automation Overlay */}
      {showAutomationOverlay && (
        <InstagramAutomationOverlay
          onClose={() => setShowAutomationOverlay(false)}
        />
      )}
    </div>
  );
};
