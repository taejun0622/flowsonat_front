import React from 'react';
import { User, Settings, BarChart3, CreditCard, Bot, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BenchmarkTab, BillingTab, SettingsTab } from '@/components/dashboard';
import { UpdateNotification } from '@/components/UpdateNotification';
import { TrialOverBanner } from '@/components/TrialOverNotification';
import { useAuth } from '@/contexts/AuthContext';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useInstagram } from '@/contexts/InstagramContext';
import { useWebView } from '@/hooks/useWebView';
import { executeAutomation, AutomationResult } from '@/services/automationService';
import { useComponentAnalytics, useButtonAnalytics, useInstagramAnalytics } from '@/hooks/useAnalyticsTracking';
import { InstagramService } from '@/api/services/InstagramService';
import { BenchmarkResponse } from '@/api';

export const DashboardPage = () => {
  const { user, isTrialOver } = useAuth();
  const { isConnected, checkConnection, saveInstagramSession } = useInstagram();
  const { openWebView } = useWebView();
  const navigate = useNavigate();
  const [isCheckingConnection, setIsCheckingConnection] = React.useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = React.useState(false);
  const [showTrialOverBanner, setShowTrialOverBanner] = React.useState(true);
  const [benchmarks, setBenchmarks] = React.useState<BenchmarkResponse[]>([]);
  const [isLoadingBenchmarks, setIsLoadingBenchmarks] = React.useState(false);
  const { activeTab, switchToTab, switchToBilling } = useTabNavigation();

  // Analytics hooks
  useComponentAnalytics('DashboardPage');
  const createButtonTracker = useButtonAnalytics();
  const { trackAccountConnect, trackAutomationStart, trackAutomationComplete } = useInstagramAnalytics();

  // Check Instagram connection status when entering dashboard and handle auto-navigation
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
  }, [user, checkConnection, hasCheckedConnection, isCheckingConnection]);

  // Auto-navigate to Instagram WebView based on connection status
  React.useEffect(() => {
    if (!hasCheckedConnection || isCheckingConnection) return;

    // 로그아웃 상태면 바로 Instagram WebView로 이동
    if (!isConnected) {
      console.log('Instagram not connected, navigating to WebView...');
      navigate('/webview');
    }
  }, [isConnected, hasCheckedConnection, isCheckingConnection, navigate]);

  // Load benchmarks when Instagram is connected
  React.useEffect(() => {
    if (isConnected && hasCheckedConnection) {
      loadBenchmarks();
    }
  }, [isConnected, hasCheckedConnection]);

  const handleStartAutomation = () => {
    // Open full-screen WebView manager in minimal mode with auto-execution
    navigate('/webview?minimal=1&autoExecute=1');
  };

  const handleRefresh = () => {
    // Refresh Instagram connection status
    checkConnection();
    // Also refresh benchmarks if connected
    if (isConnected) {
      loadBenchmarks();
    }
  };

  const handleConnectInstagram = () => {
    // Open Instagram login page in webview
    openWebView('https://www.instagram.com/accounts/login/');
  };

  const handleGoToBilling = () => {
    switchToBilling();
  };

  const handleDismissTrialOverBanner = () => {
    setShowTrialOverBanner(false);
  };

  const loadBenchmarks = async () => {
    try {
      setIsLoadingBenchmarks(true);
      const response = await InstagramService.getBenchmarksApiV1InstagramBenchmarksGet();
      setBenchmarks(response.benchmarks);
    } catch (error) {
      console.error('Failed to load benchmarks:', error);
      setBenchmarks([]);
    } finally {
      setIsLoadingBenchmarks(false);
    }
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
          {/* Update notification */}
          <UpdateNotification className="mb-6" />
          
          {/* Trial Over Banner */}
          {isTrialOver && showTrialOverBanner && (
            <TrialOverBanner
              onGoToBilling={handleGoToBilling}
              onDismiss={handleDismissTrialOverBanner}
            />
          )}
          
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleStartAutomation}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={!isConnected || benchmarks.length === 0}
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
          <Tabs value={activeTab} onValueChange={switchToTab} className="w-full">
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

      {/* No overlay needed; Execute opens WebView */}
    </div>
  );
};
