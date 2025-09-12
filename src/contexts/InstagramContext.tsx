import React from 'react';
import { InstagramService } from '@/api/services/InstagramService';
import { InstagramConnectResponse } from '@/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { parseCookies } from '@/utils/instagramUtils';
import { InstagramDisconnectService } from '@/services/InstagramDisconnectService';
import { NavigateFunction } from 'react-router-dom';

interface InstagramContextType {
  instagramAccount: InstagramConnectResponse | null;
  isConnected: boolean;
  isLoading: boolean;
  checkConnection: () => Promise<void>;
  connectAccount: () => void;
  disconnectAccount: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  saveInstagramSession: (sessionData: any) => Promise<InstagramConnectResponse>;
  injectCookiesToWebView: (cookies: Record<string, any>) => Promise<boolean>;
  restoreInstagramSession: () => Promise<boolean>;
  clearWebViewCookies: () => Promise<boolean>;
  prepareWebViewForState: (serverRegistered: boolean) => Promise<boolean>;
  setNavigate: (navigate: NavigateFunction) => void;
}

const InstagramContext = React.createContext<InstagramContextType | undefined>(undefined);

export const useInstagram = () => {
  const context = React.useContext(InstagramContext);
  if (context === undefined) {
    throw new Error('useInstagram must be used within an InstagramProvider');
  }
  return context;
};

interface InstagramProviderProps {
  children: React.ReactNode;
}

export const InstagramProvider = ({ children }: InstagramProviderProps) => {
  const [instagramAccount, setInstagramAccount] = React.useState<InstagramConnectResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const navigateRef = React.useRef<NavigateFunction | null>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();

  const setNavigate = (navigate: NavigateFunction) => {
    navigateRef.current = navigate;
  };

  const checkConnection = React.useCallback(async () => {
    if (!token || !user) {
      setInstagramAccount(null);
      return;
    }

    try {
      setIsLoading(true);
      const account = await InstagramService.getMyInstagramAccountApiV1InstagramMeGet();
      setInstagramAccount(account);
    } catch (error: any) {
      // 404 means no connected account
      if (error.status === 404) {
        console.log('Instagram not connected (404), navigating to connection flow.');
        setInstagramAccount(null);
        if (navigateRef.current) {
          navigateRef.current('/instagram-connection-flow');
        }
      } else {
        console.error('Failed to check Instagram connection:', error);
        setInstagramAccount(null);
        
        // Only show error for non-500 status (server implementation issues)
        if (error.status !== 500) {
          toast({
            title: "Connection check failed",
            description: "Failed to check Instagram connection status.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, user, toast]);

  const connectAccount = () => {
    // Instagram connection is handled by InstagramConnectionManager
    console.log('Instagram connection requested');
  };

  const disconnectAccount = async () => {
    console.log('🔍 Instagram disconnect started');
    
    if (!token) {
      console.log('❌ No token available, aborting disconnect');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the clean disconnect service
      await InstagramDisconnectService.disconnect({
        clearServerData: true,
        clearWebViewData: true,
        notifyWebView: true
      });
      
      // Update local state
      setInstagramAccount(null);
      console.log('✅ Instagram account state cleared');
      
      toast({
        title: "Instagram disconnected",
        description: "Successfully disconnected from Instagram. All data has been cleared.",
      });
      
    } catch (error: any) {
      console.error('Failed to disconnect Instagram:', error);
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect from Instagram.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConnection = React.useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  const saveInstagramSession = async (sessionData: any) => {
    try {
      console.log('Saving Instagram session data:', sessionData);
      
      const username = sessionData?.username;
      if (!username) {
        throw new Error('Username not found in session data');
      }

      // Prepare request data
      const requestData = {
        username: username,
        cookies: sessionData.cookies || {}
      };

      console.log('Sending Instagram connect request:', requestData);
      const response = await InstagramService.connectInstagramAccountApiV1InstagramMePost(requestData);
      
      console.log('Instagram connect response received:', response);
      
      // Update local state
      setInstagramAccount(response);
      
      // Refresh connection to ensure consistency
      await refreshConnection();
      
      return response;
      
    } catch (error) {
      console.error('Failed to save Instagram session:', error);
      throw error;
    }
  };

  const injectCookiesToWebView = React.useCallback(async (cookies: Record<string, any>): Promise<boolean> => {
    try {
      console.log('Injecting cookies to WebView:', cookies);
      
      // Method 1: Electron API
      if ((window as any).electronAPI?.injectCookiesToWebView) {
        console.log('Using Electron API for cookie injection');
        const result = await (window as any).electronAPI.injectCookiesToWebView(cookies);
        console.log('Electron cookie injection result:', result);
        return result;
      }
      
      // Method 2: IPC Renderer
      if (window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function') {
        console.log('Using IPC Renderer for cookie injection');
        const result = await window.ipcRenderer.invoke('inject-cookies-to-webview', cookies);
        console.log('IPC cookie injection result:', result);
        return result;
      }
      
      console.warn('No available method for cookie injection');
      return false;
      
    } catch (error) {
      console.error('Failed to inject cookies to WebView:', error);
      return false;
    }
  }, []);

  const restoreInstagramSession = React.useCallback(async (): Promise<boolean> => {
    try {
      console.log('Restoring Instagram session...');
      
      if (!instagramAccount) {
        console.log('No Instagram account to restore');
        return false;
      }

      // Get stored cookies from server
      const cookies = instagramAccount.cookies;
      if (!cookies || Object.keys(cookies).length === 0) {
        console.log('No cookies available for restoration');
        return false;
      }

      console.log('Found cookies for restoration:', Object.keys(cookies));
      
      // Inject cookies to WebView
      const injected = await injectCookiesToWebView(cookies);
      
      if (injected) {
        console.log('✅ Instagram session restored successfully');
        return true;
      } else {
        console.warn('Failed to inject cookies to WebView');
        return false;
      }
      
    } catch (error) {
      console.error('Failed to restore Instagram session:', error);
      return false;
    }
  }, [instagramAccount, injectCookiesToWebView]);

  const clearWebViewCookies = React.useCallback(async (): Promise<boolean> => {
    try {
      console.log('🧹 Clearing WebView cookies for fresh start...');
      
      // Method 1: Electron API
      if ((window as any).electronAPI?.clearWebViewCookies) {
        console.log('Using Electron API for cookie clearing');
        const result = await (window as any).electronAPI.clearWebViewCookies();
        console.log('Electron cookie clearing result:', result);
        return result;
      }
      
      // Method 2: IPC Renderer
      if (window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function') {
        console.log('Using IPC Renderer for cookie clearing');
        const result = await window.ipcRenderer.invoke('clear-webview-cookies');
        console.log('IPC cookie clearing result:', result);
        return result;
      }
      
      console.warn('No available method for cookie clearing');
      return false;
      
    } catch (error) {
      console.error('Failed to clear WebView cookies:', error);
      return false;
    }
  }, []);

  const prepareWebViewForState = React.useCallback(async (serverRegistered: boolean): Promise<boolean> => {
    try {
      console.log('🔧 Preparing WebView for state:', serverRegistered ? 'server_registered' : 'server_unregistered');
      
      if (serverRegistered) {
        // 서버 등록 상태: 서버에서 받은 쿠키를 주입
        console.log('📥 Server registered - injecting server cookies');
        return await restoreInstagramSession();
      } else {
        // 서버 미등록 상태: 기존 쿠키를 모두 삭제
        console.log('🗑️ Server unregistered - clearing existing cookies');
        return await clearWebViewCookies();
      }
      
    } catch (error) {
      console.error('Failed to prepare WebView for state:', error);
      return false;
    }
  }, [restoreInstagramSession, clearWebViewCookies]);

  // Initialize connection check on mount
  React.useEffect(() => {
    if (token && user) {
      checkConnection();
    }
  }, [token, user, checkConnection]);

  const value: InstagramContextType = {
    instagramAccount,
    isConnected: !!instagramAccount,
    isLoading,
    checkConnection,
    connectAccount,
    disconnectAccount,
    refreshConnection,
    saveInstagramSession,
    injectCookiesToWebView,
    restoreInstagramSession,
    clearWebViewCookies,
    prepareWebViewForState,
    setNavigate: setNavigate,
  };

  return (
    <InstagramContext.Provider value={value}>
      {children}
    </InstagramContext.Provider>
  );
};