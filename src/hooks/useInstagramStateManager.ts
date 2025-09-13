// React hook for Instagram State Management

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useInstagram } from '@/contexts/InstagramContext';
import { InstagramStateManager, InstagramStateContext } from '@/services/InstagramStateManager';
import { InstagramLoginDetector } from '@/services/InstagramLoginDetector';
import { InstagramWebViewController } from '@/services/InstagramWebViewController';
import { InstagramDisconnectService } from '@/services/InstagramDisconnectService';
import { 
  InstagramStateAction, 
  InstagramWebViewUIConfig,
  InstagramLoginState 
} from '@/types/instagram';

interface UseInstagramStateManagerReturn {
  // State
  state: InstagramLoginState;
  context: InstagramStateContext;
  uiConfig: InstagramWebViewUIConfig;
  
  // Status checks
  isAutomationEnabled: boolean;
  shouldShowModal: 'username_confirm' | 'manual_username' | null;
  shouldRedirectToDashboard: boolean;
  
  // Actions
  dispatch: (action: InstagramStateAction) => Promise<void>;
  handleUserAction: (action: string, payload?: any) => Promise<string | null>;
  handleLoginDetected: (sessionData: any) => Promise<void>;
  handleLogoutDetected: () => Promise<void>;
  handleDisconnect: () => Promise<void>;
  
  // WebView integration
  getRedirectUrl: () => string | null;
  injectServerCookies: (cookies: Record<string, any>) => Promise<boolean>;
  clearWebViewData: () => Promise<void>;
}

export const useInstagramStateManager = (): UseInstagramStateManagerReturn => {
  const { isConnected, saveInstagramSession, restoreInstagramSession } = useInstagram();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Initialize state manager
  const [stateManager] = useState(() => {
    return new InstagramStateManager({
      hasServerStorage: isConnected,
      isWebViewLoggedIn: false
    });
  });
  
  const [context, setContext] = useState<InstagramStateContext>(stateManager.getContext());
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newContext) => {
      setContext(newContext);
    });
    
    return unsubscribe;
  }, [stateManager]);
  
  // Update server storage status when connection changes
  useEffect(() => {
    if (isConnected) {
      stateManager.dispatch({
        type: 'SERVER_STORAGE_CONFIRMED',
        payload: { username: 'server_user' }
      });
    } else {
      stateManager.dispatch({
        type: 'SERVER_STORAGE_CLEARED',
        payload: {}
      });
    }
  }, [isConnected, stateManager]);
  
  // Dispatch action
  const dispatch = useCallback(async (action: InstagramStateAction) => {
    await stateManager.dispatch(action);
  }, [stateManager]);
  
  // Handle user actions
  const handleUserAction = useCallback(async (action: string, payload?: any): Promise<string | null> => {
    console.log('[StateManager] Handling user action:', action, payload);
    
    try {
      const result = await stateManager.handleUserAction(action, payload);
      
      // Handle special actions that need additional processing
      switch (action) {
        case 'disconnect_instagram':
          await handleDisconnect();
          break;
          
        case 'confirm_connection':
          if (context.data.pendingSessionData) {
            await saveInstagramSession(context.data.pendingSessionData);
            toast({
              title: "Instagram Connected!",
              description: `Successfully connected to Instagram account.`,
              variant: "default"
            });
            navigate('/dashboard');
          }
          break;
          
        case 'manual_username':
          // Manual username flow is handled by UI components
          break;
      }
      
      return result;
    } catch (error) {
      console.error('[StateManager] User action failed:', error);
      toast({
        title: "Action Failed",
        description: "Failed to perform the requested action.",
        variant: "destructive"
      });
      return null;
    }
  }, [stateManager, context.data.pendingSessionData, saveInstagramSession, toast, navigate]);
  
  // Handle login detected from WebView
  const handleLoginDetected = useCallback(async (sessionData: any) => {
    console.log('[StateManager] Login detected:', sessionData);
    
    try {
      await dispatch({
        type: 'LOGIN_DETECTED',
        payload: {
          username: sessionData.username,
          dsUserId: sessionData.dsUserId || sessionData.ds_user_id,
          cookies: sessionData.cookies || {},
          sessionData: sessionData
        }
      });
      
      // If server storage is available, auto-save session
      if (context.data.hasServerStorage) {
        console.log('[StateManager] Auto-saving session due to server storage');
        await saveInstagramSession(sessionData);
        
        toast({
          title: "Instagram Connected!",
          description: "Your Instagram session has been restored.",
          variant: "default"
        });
        
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('[StateManager] Login detection failed:', error);
      toast({
        title: "Login Detection Failed",
        description: "Failed to process Instagram login.",
        variant: "destructive"
      });
    }
  }, [dispatch, context.data.hasServerStorage, saveInstagramSession, toast, navigate]);
  
  // Handle logout detected from WebView
  const handleLogoutDetected = useCallback(async () => {
    console.log('[StateManager] Logout detected');
    
    await dispatch({
      type: 'LOGOUT_DETECTED',
      payload: {}
    });
  }, [dispatch]);
  
  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    console.log('[StateManager] Handling disconnect');
    
    try {
      // Use disconnect service
      await InstagramDisconnectService.disconnect({
        clearServerData: true,
        clearWebViewData: true,
        notifyWebView: true
      });
      
      // Update state
      await dispatch({
        type: 'USER_DISCONNECT',
        payload: {}
      });
      
      toast({
        title: "Instagram Disconnected",
        description: "Successfully disconnected from Instagram.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('[StateManager] Disconnect failed:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from Instagram.",
        variant: "destructive"
      });
    }
  }, [dispatch, toast]);
  
  // WebView integration methods
  const getRedirectUrl = useCallback(() => {
    return stateManager.getRedirectUrl();
  }, [stateManager]);
  
  const injectServerCookies = useCallback(async (cookies: Record<string, any>): Promise<boolean> => {
    console.log('[StateManager] Injecting server cookies');
    return await InstagramWebViewController.restoreServerSession(cookies);
  }, []);
  
  const clearWebViewData = useCallback(async () => {
    console.log('[StateManager] Clearing WebView data');
    await InstagramWebViewController.performCompleteDisconnect();
  }, []);
  
  // Computed properties
  const uiConfig = stateManager.getUIConfig();
  const isAutomationEnabled = stateManager.isAutomationEnabled();
  const shouldShowModal = stateManager.shouldShowModal();
  const shouldRedirectToDashboard = stateManager.shouldRedirectToDashboard();
  
  return {
    // State
    state: context.state,
    context,
    uiConfig,
    
    // Status checks
    isAutomationEnabled,
    shouldShowModal,
    shouldRedirectToDashboard,
    
    // Actions
    dispatch,
    handleUserAction,
    handleLoginDetected,
    handleLogoutDetected,
    handleDisconnect,
    
    // WebView integration
    getRedirectUrl,
    injectServerCookies,
    clearWebViewData
  };
};