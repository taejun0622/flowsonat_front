// Instagram 웹뷰 상태 타입 정의
export type InstagramWebViewState = 
  | 'instagram_logged_in'
  | 'instagram_logged_out_server_registered'
  | 'instagram_logged_out_server_unregistered'
  | 'instagram_login_detected'; // New state for when login is detected

// Instagram 웹뷰 상태 정보
export interface InstagramWebViewStatus {
  state: InstagramWebViewState;
  isInstagramLoggedIn: boolean;
  isServerRegistered: boolean;
  username?: string;
  dsUserId?: string;
  lastChecked: Date;
  detectedSessionData?: any; // Store detected session data
}

// 웹뷰 워크플로우 액션
export type InstagramWebViewAction = 
  | 'connect_instagram'
  | 'disconnect_instagram'
  | 'open_instagram'
  | 'login_instagram'
  | 'logout_instagram'
  | 'check_status'
  | 'confirm_connection' // New action for confirming connection
  | 'manual_username'; // New action for manual username input

// 웹뷰 상태별 UI 설정
export interface InstagramWebViewUIConfig {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    action: InstagramWebViewAction;
    variant?: 'default' | 'outline' | 'destructive';
  };
  secondaryAction?: {
    label: string;
    action: InstagramWebViewAction;
    variant?: 'default' | 'outline' | 'destructive';
  };
  showStatusBar: boolean;
  statusBarType: 'info' | 'success' | 'warning' | 'error';
}

// Modal states for the logout flow
export interface InstagramModalState {
  showConfirmModal: boolean;
  showManualModal: boolean;
  detectedUsername?: string;
  detectedSessionData?: any;
}
