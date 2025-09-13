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
  debugCurrentCookies: () => Promise<void>;
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

      // Get current full cookie set from Electron API instead of using sessionData.cookies
      let cookiesToSave = sessionData.cookies || {};
      
      try {
        console.log('🔍 Getting current full cookies from Electron API for saving...');
        
        if ((window as any).electronAPI?.getInstagramCookies) {
          const fullCookieResponse = await (window as any).electronAPI.getInstagramCookies();
          if (fullCookieResponse && fullCookieResponse.cookies && Object.keys(fullCookieResponse.cookies).length > 0) {
            console.log('✅ Using full cookie set from Electron API for saving');
            console.log('📊 Cookie comparison - Original:', Object.keys(cookiesToSave).length, 'vs Full:', Object.keys(fullCookieResponse.cookies).length);
            cookiesToSave = fullCookieResponse.cookies;
          } else {
            console.log('⚠️ Electron API returned empty cookies, using session data cookies');
          }
        } else if (window.ipcRenderer) {
          const ipcCookies = await window.ipcRenderer.invoke('ig:get-instagram-cookies');
          if (ipcCookies && ipcCookies.cookies && Object.keys(ipcCookies.cookies).length > 0) {
            console.log('✅ Using full cookie set from IPC for saving');
            console.log('📊 Cookie comparison - Original:', Object.keys(cookiesToSave).length, 'vs IPC:', Object.keys(ipcCookies.cookies).length);
            cookiesToSave = ipcCookies.cookies;
          } else {
            console.log('⚠️ IPC returned empty cookies, using session data cookies');
          }
        } else {
          console.log('⚠️ No Electron API available, using session data cookies');
        }
      } catch (error) {
        console.warn('⚠️ Failed to get full cookies, using session data cookies:', error);
      }

      console.log('🍪 Final cookies to save:', Object.keys(cookiesToSave));
      console.log('📄 Cookie details for saving:', cookiesToSave);

      // Prepare request data with full cookie set
      const requestData = {
        username: username,
        cookies: cookiesToSave
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

  // Prevent multiple cookie tests running simultaneously
  const cookieTestRunning = React.useRef(false);
  
  // Test cookie validity by creating a temporary webview and checking redirect
  const testCookieValidity = React.useCallback(async (cookies: Record<string, any>): Promise<void> => {
    // Prevent multiple tests running
    if (cookieTestRunning.current) {
      console.log('🔄 Cookie test already running, skipping...');
      return;
    }

    try {
      cookieTestRunning.current = true;
      console.log('🧪 Testing cookie validity with temporary webview...');

      // Check if required cookies are present
      const requiredCookies = ['sessionid', 'ds_user_id'];
      const missingCookies = requiredCookies.filter(key => !cookies[key]);

      if (missingCookies.length > 0) {
        console.warn('⚠️ Missing required cookies for validation:', missingCookies);
        console.log('Available cookies:', Object.keys(cookies));
        cookieTestRunning.current = false;
        return;
      }

      // Create a temporary webview element (use same partition as main to see injected cookies)
      const tempWebview = document.createElement('webview');
      // Keep it off-screen but attached
      tempWebview.style.position = 'absolute';
      tempWebview.style.left = '-99999px';
      tempWebview.style.top = '0';
      tempWebview.style.width = '1px';
      tempWebview.style.height = '1px';
      tempWebview.setAttribute('partition', 'persist:ig');
      tempWebview.setAttribute('webpreferences', 'contextIsolation=yes, nodeIntegration=no');
      tempWebview.setAttribute('allowpopups', 'true');
      document.body.appendChild(tempWebview);

      let urlCheckTimeout: NodeJS.Timeout | null = null;
      let cleanupDone = false;
      let navigated = false;
      let lastNavigatedUrl: string = '';
      let retryCount = 0;
      const maxRetries = 2;

      const cleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;

        if (urlCheckTimeout) { clearTimeout(urlCheckTimeout); urlCheckTimeout = null; }
        try {
          tempWebview.removeEventListener('did-navigate', handleDidNavigate as any);
          tempWebview.removeEventListener('did-navigate-in-page', handleDidNavigate as any);
          tempWebview.removeEventListener('dom-ready', handleDomReady as any);
          tempWebview.removeEventListener('did-fail-load', handleDidFailLoad as any);
        } catch {}
        try {
          if (tempWebview && tempWebview.parentNode) {
            document.body.removeChild(tempWebview);
          }
        } catch {}
        cookieTestRunning.current = false;
      };

      // Enhanced error handling with retry logic
      const handleDidFailLoad = (event: any) => {
        if (cleanupDone) return;
        console.warn(`🚫 Webview failed to load (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
          errorCode: event.errorCode,
          errorDescription: event.errorDescription,
          url: event.validatedURL || 'unknown'
        });

        // If we have retries left and it's a network error, try again
        if (retryCount < maxRetries && (event.errorCode === -2 || event.errorCode === -106 || event.errorCode === -118)) {
          retryCount++;
          console.log(`🔄 Retrying navigation (${retryCount}/${maxRetries})...`);

          // Wait before retry
          setTimeout(() => {
            if (!cleanupDone && tempWebview && tempWebview.parentNode) {
              try {
                (tempWebview as any).src = 'https://www.instagram.com/';
              } catch (error) {
                console.error('Error during retry:', error);
                cleanup();
              }
            }
          }, 1000 * retryCount); // Exponential backoff

          return;
        }

        // No more retries or non-recoverable error
        console.error('❌ Cookie validation failed due to navigation errors - assuming cookies are invalid');
        cleanup();
      };
      tempWebview.addEventListener('did-fail-load', handleDidFailLoad as any);

      // Set up URL monitoring
      const checkUrl = (navigatedUrl?: string) => {
        try {
          if (cleanupDone) return;
          // Prefer URL from event if provided; otherwise, use API only if still attached
          let currentUrl = navigatedUrl || '';
          if (!currentUrl) {
            const attached = (tempWebview as any).isConnected ?? document.body.contains(tempWebview);
            if (!attached) return;
            if (typeof (tempWebview as any).getURL === 'function') {
              currentUrl = (tempWebview as any).getURL();
            } else {
              currentUrl = (tempWebview as any).src || '';
            }
          }
          if (!currentUrl || currentUrl === 'about:blank') {
            // Ignore initial blank navigation
            return;
          }
          console.log('📍 Final URL after navigation:', currentUrl);

          if (currentUrl.includes('/accounts/login') || currentUrl.includes('/login/')) {
            console.log('❌ Cookie validation failed: Redirected to login page');
            console.log('🔄 This indicates the cookies are expired or invalid');
          } else if (currentUrl === 'https://www.instagram.com/' || (currentUrl.includes('instagram.com') && !currentUrl.includes('login'))) {
            console.log('✅ Cookie validation passed: Stayed on main Instagram page');
            console.log('🎉 This indicates the cookies are valid and user is logged in');
          } else {
            console.log('🤔 Unexpected URL after navigation:', currentUrl);
          }
        } catch (error) {
          console.warn('Error checking URL:', error);
        }

        cleanup();
      };

      // After navigate completes, check URL and cleanup
      const handleDidNavigate = (e: any) => {
        if (cleanupDone) return;
        lastNavigatedUrl = e?.url || lastNavigatedUrl;
        // Defer slightly to allow redirects to settle
        setTimeout(() => checkUrl(lastNavigatedUrl), 500);
      };

      tempWebview.addEventListener('did-navigate', handleDidNavigate as any);
      tempWebview.addEventListener('did-navigate-in-page', handleDidNavigate as any);

      // Wait for webview to be ready and inject cookies
      const handleDomReady = async () => {
        try {
          if (cleanupDone) return;
          const attached = (tempWebview as any).isConnected ?? document.body.contains(tempWebview);
          if (!attached) {
            console.warn('Temp webview dom-ready fired after detach; ignoring');
            return;
          }
          console.log('🔧 Temporary webview DOM ready, injecting cookies...');

          // Wait a bit for webview to be fully ready
          await new Promise(resolve => setTimeout(resolve, 500));

          // Inject cookies via Electron API using test partition
          if ((window as any).electronAPI?.injectCookiesToWebView) {
            const injected = await (window as any).electronAPI.injectCookiesToWebView(cookies);

            if (injected) {
              console.log('✅ Cookies injected to test webview');

              // Wait before navigation
              await new Promise(resolve => setTimeout(resolve, 500));

              // Navigate to Instagram via src attribute with error handling
              console.log('🌐 Navigating to instagram.com...');
              if (!cleanupDone && !navigated) {
                navigated = true;
                // Guard again before mutating src
                const stillAttached = (tempWebview as any).isConnected ?? document.body.contains(tempWebview);
                if (stillAttached) {
                  try {
                    (tempWebview as any).src = 'https://www.instagram.com/';
                  } catch (error) {
                    console.error('❌ Error setting webview src:', error);
                    cleanup();
                  }
                } else {
                  console.warn('Temp webview detached before navigate; skipping');
                  cleanup();
                }
              }
            } else {
              console.error('❌ Failed to inject cookies to test webview');
              cleanup();
            }
          } else {
            console.error('❌ Electron API not available for test webview');
            cleanup();
          }
        } catch (error) {
          console.error('Error in temporary webview setup:', error);
          cleanup();
        }
      };
      tempWebview.addEventListener('dom-ready', handleDomReady as any);

      // Start with blank page
      console.log('🔄 Starting temporary webview with blank page...');
      try {
        (tempWebview as any).src = 'about:blank';
      } catch (error) {
        console.error('❌ Error setting initial webview src:', error);
        cleanup();
        return;
      }

      // Fallback cleanup after 15 seconds (increased timeout)
      setTimeout(() => {
        if (!cleanupDone) {
          console.log('⏰ Cookie validation timeout - cleaning up');
          cleanup();
        }
      }, 15000);

    } catch (error) {
      console.error('Error in cookie validity test:', error);
      cookieTestRunning.current = false;
    }
  }, [injectCookiesToWebView]);

  // Debug function to check current WebView cookies
  const debugCurrentCookies = React.useCallback(async () => {
    try {
      console.log('🔍 Checking current WebView cookies...');
      
      // Method 1: Check via Electron API
      if ((window as any).electronAPI?.getInstagramCookies) {
        const electronCookies = await (window as any).electronAPI.getInstagramCookies();
        console.log('📊 Electron API cookies:', {
          count: Object.keys(electronCookies.cookies || {}).length,
          cookies: electronCookies.cookies,
          raw: electronCookies.raw?.map((c: any) => ({ name: c.name, value: c.value?.substring(0, 20) + '...', httpOnly: c.httpOnly }))
        });
      }
      
      // Method 2: Check via IPC
      if (window.ipcRenderer) {
        const ipcCookies = await window.ipcRenderer.invoke('ig:get-instagram-cookies');
        console.log('📊 IPC cookies:', {
          count: Object.keys(ipcCookies.cookies || {}).length,
          cookies: ipcCookies.cookies
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to check current cookies:', error);
    }
  }, []);

  const restoreInstagramSession = React.useCallback(async (): Promise<boolean> => {
    try {
      console.log('Restoring Instagram session...');
      
      // Debug: Check current cookies before restoration
      await debugCurrentCookies();
      
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

      // Guard: Ensure required HttpOnly cookie exists (sessionid)
      if (!cookies['sessionid']) {
        console.warn('⚠️ Missing required session cookie (sessionid). Cannot restore authenticated session.');
        toast({
          title: 'Session refresh required',
          description: 'Stored cookies are incomplete. Please sign in to Instagram once to refresh your session.',
          variant: 'destructive'
        });
        return false;
      }

      console.log('Found cookies for restoration:', Object.keys(cookies));
      console.log('Cookie details:', cookies);
      
      // Inject cookies to WebView
      const injected = await injectCookiesToWebView(cookies);
      
      if (injected) {
        console.log('✅ Instagram session restored successfully');

        // Test cookie validity by checking redirect to login
        // This is optional - if it fails, we still consider the injection successful
        try {
          await testCookieValidity(cookies);
        } catch (error) {
          console.warn('⚠️ Cookie validation test failed, but cookies were injected:', error);
        }

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
    debugCurrentCookies,
    setNavigate: setNavigate,
  };

  // Expose debug function globally for console access
  React.useEffect(() => {
    (window as any).debugInstagramCookies = debugCurrentCookies;
    return () => {
      delete (window as any).debugInstagramCookies;
    };
  }, [debugCurrentCookies]);

  return (
    <InstagramContext.Provider value={value}>
      {children}
    </InstagramContext.Provider>
  );
};
