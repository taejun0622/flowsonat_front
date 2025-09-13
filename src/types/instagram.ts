// Instagram login state - new clean version
export type InstagramLoginState = 
  | 'webview_login_server_storage'      // Logged in + server has data - Automation available
  | 'webview_logout_server_storage'     // Logged out + server has data - Redirect to login → Dashboard  
  | 'webview_login_no_server_storage'   // Logged in + no server data - Show username modal
  | 'webview_logout_no_server_storage'; // Logged out + no server data - Redirect to login → Follow no-server flow

// Legacy state types (for backward compatibility)
export type InstagramWebViewState = 
  | 'instagram_logged_in'
  | 'instagram_logged_out_server_registered'
  | 'instagram_logged_out_server_unregistered'
  | 'instagram_login_detected';

// Instagram state data
export interface InstagramStateData {
  // Login status
  isWebViewLoggedIn: boolean;
  hasServerStorage: boolean;
  
  // User session data
  username?: string;
  dsUserId?: string;
  sessionId?: string;
  cookies?: Record<string, any>;
  
  // Detection metadata
  detectedAt?: Date;
  lastChecked: Date;
  
  // Pending/modal data
  pendingSessionData?: any;
  suppressAutoConfirm?: boolean;
  suppressedForDsUserId?: string;
}

// Legacy format for backward compatibility
export interface InstagramWebViewStatusLegacy {
  state: InstagramWebViewState;
  isInstagramLoggedIn: boolean;
  isServerRegistered: boolean;
  username?: string;
  dsUserId?: string;
  lastChecked: Date;
  detectedSessionData?: any;
}

// Combined context for Instagram state (new format)
export interface InstagramWebViewStatus {
  state: InstagramWebViewState; // Keep legacy for now to avoid breaking changes
  data: InstagramStateData;
  // Legacy fields for backward compatibility
  isInstagramLoggedIn?: boolean;
  isServerRegistered?: boolean;
  username?: string;
  dsUserId?: string;
  lastChecked?: Date;
  detectedSessionData?: any;
}

// User actions that can be performed
export type InstagramUserAction = 
  | 'connect_instagram'
  | 'disconnect_instagram'
  | 'open_instagram'
  | 'login_instagram'
  | 'logout_instagram'
  | 'check_status'
  | 'confirm_connection'
  | 'manual_username'
  | 'cancel_connection';

// Legacy action type (for backward compatibility)
export type InstagramWebViewAction = InstagramUserAction;

// State change actions for internal state management
export type InstagramStateAction = 
  // Detection actions
  | { type: 'LOGIN_DETECTED'; payload: { username?: string; dsUserId: string; cookies: Record<string, any>; sessionData: any } }
  | { type: 'LOGOUT_DETECTED'; payload?: {} }
  | { type: 'SERVER_STORAGE_CONFIRMED'; payload: { username: string; cookies?: Record<string, any> } }
  | { type: 'SERVER_STORAGE_CLEARED'; payload?: {} }
  
  // User actions
  | { type: 'USER_CONFIRM_CONNECTION'; payload: { username: string; sessionData: any } }
  | { type: 'USER_DISCONNECT'; payload?: {} }
  | { type: 'USER_MANUAL_USERNAME'; payload: { username: string } }
  | { type: 'USER_CANCEL_CONNECTION'; payload?: {} }
  
  // System actions
  | { type: 'SUPPRESS_AUTO_CONFIRM'; payload: { dsUserId: string } }
  | { type: 'CLEAR_SUPPRESSION'; payload?: {} }
  | { type: 'RESET_STATE'; payload?: {} };

// UI configuration for each state
export interface InstagramWebViewUIConfig {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    action: InstagramUserAction;
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  };
  secondaryAction?: {
    label: string;
    action: InstagramUserAction;
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  };
  showStatusBar: boolean;
  statusBarType: 'info' | 'success' | 'warning' | 'error';
  automationEnabled?: boolean; // Make optional for backward compatibility
  redirectUrl?: string;
  showModal?: 'username_confirm' | 'manual_username' | null;
}

// Modal states for the logout flow
export interface InstagramModalState {
  showConfirmModal: boolean;
  showManualModal: boolean;
  detectedUsername?: string;
  detectedSessionData?: any;
}
