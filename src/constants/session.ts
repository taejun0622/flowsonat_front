// Instagram 세션 관리 상수
export const INSTAGRAM_SESSION_PARTITION = 'instagram-main-session';

// 웹뷰 모드별 설정
export const WEBVIEW_SETTINGS = {
  login: {
    enableExtension: false,
    blockPhysicalMouse: true,
    showHeader: false,
    mode: 'login' as const
  },
  automation: {
    enableExtension: true,
    blockPhysicalMouse: true,
    showHeader: true,
    mode: 'automation' as const
  }
} as const;

// Instagram 쿠키 키
export const INSTAGRAM_COOKIE_KEYS = {
  C_USER: 'c_user',
  SESSION_ID: 'sessionid',
  DS_USER_ID: 'ds_user_id',
  CSRF_TOKEN: 'csrftoken'
} as const;
