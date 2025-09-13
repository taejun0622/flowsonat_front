// Instagram State Manager - Core 4-state branching logic

import { 
  InstagramLoginState, 
  InstagramStateData, 
  InstagramStateAction, 
  InstagramWebViewUIConfig 
} from '@/types/instagram';

export interface InstagramStateContext {
  state: InstagramLoginState;
  data: InstagramStateData;
}

export class InstagramStateManager {
  private context: InstagramStateContext;
  private listeners: ((context: InstagramStateContext) => void)[] = [];
  
  constructor(initialData?: Partial<InstagramStateData>) {
    const data: InstagramStateData = {
      isWebViewLoggedIn: false,
      hasServerStorage: false,
      lastChecked: new Date(),
      ...initialData
    };
    
    this.context = {
      state: this.computeState(data),
      data
    };
  }

  // Compute state based on WebView login status and server storage
  private computeState(data: InstagramStateData): InstagramLoginState {
    const { isWebViewLoggedIn, hasServerStorage } = data;
    
    if (isWebViewLoggedIn && hasServerStorage) return 'webview_login_server_storage';
    if (!isWebViewLoggedIn && hasServerStorage) return 'webview_logout_server_storage';
    if (isWebViewLoggedIn && !hasServerStorage) return 'webview_login_no_server_storage';
    return 'webview_logout_no_server_storage';
  }

  // Get current context
  getContext(): InstagramStateContext {
    return { ...this.context };
  }

  // Subscribe to state changes
  subscribe(listener: (context: InstagramStateContext) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  // Dispatch action to update state
  async dispatch(action: InstagramStateAction): Promise<void> {
    console.log(`[InstagramState] Dispatching:`, action.type);
    console.log(`[InstagramState] Current state:`, this.context.state);
    
    const previousState = this.context.state;
    
    // Update data based on action
    this.updateData(action);
    
    // Recompute state
    const newState = this.computeState(this.context.data);
    this.context.state = newState;
    
    if (previousState !== newState) {
      console.log(`[InstagramState] State transition:`, previousState, '→', newState);
    }
    
    // Notify listeners
    this.notifyListeners();
  }

  // Update context data from action
  private updateData(action: InstagramStateAction): void {
    const { data } = this.context;
    
    switch (action.type) {
      case 'LOGIN_DETECTED':
        data.isWebViewLoggedIn = true;
        data.username = action.payload.username;
        data.dsUserId = action.payload.dsUserId;
        data.cookies = action.payload.cookies;
        data.pendingSessionData = action.payload.sessionData;
        data.detectedAt = new Date();
        break;
        
      case 'LOGOUT_DETECTED':
        data.isWebViewLoggedIn = false;
        data.username = undefined;
        data.dsUserId = undefined;
        data.cookies = undefined;
        data.pendingSessionData = undefined;
        break;
        
      case 'SERVER_STORAGE_CONFIRMED':
        data.hasServerStorage = true;
        data.username = action.payload.username;
        if (action.payload.cookies) {
          data.cookies = action.payload.cookies;
        }
        break;
        
      case 'SERVER_STORAGE_CLEARED':
        data.hasServerStorage = false;
        break;
        
      case 'USER_DISCONNECT':
        data.isWebViewLoggedIn = false;
        data.hasServerStorage = false;
        data.username = undefined;
        data.dsUserId = undefined;
        data.cookies = undefined;
        data.pendingSessionData = undefined;
        break;
        
      case 'SUPPRESS_AUTO_CONFIRM':
        data.suppressAutoConfirm = true;
        data.suppressedForDsUserId = action.payload.dsUserId;
        break;
        
      case 'CLEAR_SUPPRESSION':
        data.suppressAutoConfirm = false;
        data.suppressedForDsUserId = undefined;
        break;
        
      case 'RESET_STATE':
        Object.assign(data, {
          isWebViewLoggedIn: false,
          hasServerStorage: false,
          username: undefined,
          dsUserId: undefined,
          cookies: undefined,
          pendingSessionData: undefined,
          suppressAutoConfirm: false,
          suppressedForDsUserId: undefined
        });
        break;
    }
    
    data.lastChecked = new Date();
  }

  // Get UI configuration for current state
  getUIConfig(): InstagramWebViewUIConfig {
    switch (this.context.state) {
      case 'webview_login_server_storage':
        return {
          title: "Instagram Connected",
          description: "You are logged into Instagram and your account is connected to the service.",
          primaryAction: {
            label: "Open Instagram",
            action: 'open_instagram',
            variant: 'default'
          },
          secondaryAction: {
            label: "Disconnect",
            action: 'disconnect_instagram',
            variant: 'destructive'
          },
          showStatusBar: true,
          statusBarType: 'success',
          automationEnabled: true,
          redirectUrl: 'https://www.instagram.com/'
        };

      case 'webview_logout_server_storage':
        return {
          title: "Instagram Account Registered", 
          description: "Your Instagram account is registered but you need to log in again.",
          primaryAction: {
            label: "Login to Instagram",
            action: 'login_instagram',
            variant: 'default'
          },
          secondaryAction: {
            label: "Disconnect Account",
            action: 'disconnect_instagram',
            variant: 'outline'
          },
          showStatusBar: true,
          statusBarType: 'warning',
          automationEnabled: false,
          redirectUrl: 'https://www.instagram.com/accounts/login/'
        };

      case 'webview_login_no_server_storage':
        return {
          title: "Login Detected",
          description: "Instagram login detected. Please confirm your account connection.",
          primaryAction: {
            label: "Confirm Connection",
            action: 'confirm_connection',
            variant: 'default'
          },
          secondaryAction: {
            label: "Manual Username",
            action: 'manual_username',
            variant: 'outline'
          },
          showStatusBar: true,
          statusBarType: 'info',
          automationEnabled: false,
          showModal: this.shouldShowModal()
        };

      case 'webview_logout_no_server_storage':
      default:
        return {
          title: "Connect Instagram",
          description: "Connect your Instagram account to use the service features.",
          primaryAction: {
            label: "Connect Instagram", 
            action: 'connect_instagram',
            variant: 'default'
          },
          showStatusBar: false,
          statusBarType: 'info',
          automationEnabled: false,
          redirectUrl: 'https://www.instagram.com/accounts/login/'
        };
    }
  }

  // Helper methods
  isAutomationEnabled(): boolean {
    return this.context.state === 'webview_login_server_storage';
  }

  shouldRedirectToDashboard(): boolean {
    return this.context.state === 'webview_login_server_storage' && this.context.data.isWebViewLoggedIn;
  }

  shouldShowModal(): 'username_confirm' | 'manual_username' | null {
    if (this.context.state === 'webview_login_no_server_storage') {
      return this.context.data.suppressAutoConfirm ? null : 'username_confirm';
    }
    return null;
  }

  getRedirectUrl(): string | null {
    const config = this.getUIConfig();
    return config.redirectUrl || null;
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.context);
      } catch (error) {
        console.error('[InstagramState] Listener error:', error);
      }
    });
  }

  // State-based action handlers
  async handleUserAction(action: string, payload?: any): Promise<string | null> {
    switch (action) {
      case 'connect_instagram':
      case 'login_instagram':
        // Always redirect to login page - login detection will handle state transition
        return 'https://www.instagram.com/accounts/login/';
        
      case 'open_instagram':
        // Only available when automation is enabled
        if (this.isAutomationEnabled()) {
          return 'https://www.instagram.com/';
        }
        return null;
        
      case 'disconnect_instagram':
        await this.dispatch({ type: 'USER_DISCONNECT' });
        return null;
        
      case 'confirm_connection':
        if (this.context.data.pendingSessionData) {
          await this.dispatch({ 
            type: 'SERVER_STORAGE_CONFIRMED', 
            payload: { 
              username: this.context.data.username || 'unknown',
              cookies: this.context.data.cookies 
            } 
          });
        }
        return null;
        
      case 'manual_username':
        await this.dispatch({ 
          type: 'SUPPRESS_AUTO_CONFIRM', 
          payload: { dsUserId: this.context.data.dsUserId || '' } 
        });
        return null;
        
      case 'cancel_connection':
        await this.dispatch({ type: 'USER_DISCONNECT' });
        return null;
        
      default:
        return null;
    }
  }
}