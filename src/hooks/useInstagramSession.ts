import { useState, useEffect, useCallback } from 'react';
import { INSTAGRAM_COOKIE_KEYS } from '@/constants/session';

interface InstagramLoginStatus {
  isLoggedIn: boolean;
  username: string | null;
  sessionId: string | null;
  dsUserId: string | null;
  csrfToken: string | null;
}

interface UseInstagramSessionProps {
  webviewRef: React.RefObject<HTMLWebViewElement>;
  onLoginStatusChange?: (status: InstagramLoginStatus) => void;
}

export const useInstagramSession = ({ 
  webviewRef, 
  onLoginStatusChange 
}: UseInstagramSessionProps) => {
  const [loginStatus, setLoginStatus] = useState<InstagramLoginStatus>({
    isLoggedIn: false,
    username: null,
    sessionId: null,
    dsUserId: null,
    csrfToken: null
  });

  // 쿠키 기반 로그인 상태 확인
  const checkLoginStatus = useCallback(async (): Promise<InstagramLoginStatus> => {
    try {
      if (!window.electronAPI) {
        console.warn('Electron API not available');
        return {
          isLoggedIn: false,
          username: null,
          sessionId: null,
          dsUserId: null,
          csrfToken: null
        };
      }

      const cookies = await window.electronAPI.getInstagramCookies();
      
      const cUser = cookies[INSTAGRAM_COOKIE_KEYS.C_USER];
      const sessionId = cookies[INSTAGRAM_COOKIE_KEYS.SESSION_ID];
      const dsUserId = cookies[INSTAGRAM_COOKIE_KEYS.DS_USER_ID];
      const csrfToken = cookies[INSTAGRAM_COOKIE_KEYS.CSRF_TOKEN];

      const isLoggedIn = !!(cUser && cUser !== 'deleted' && sessionId);

      const status: InstagramLoginStatus = {
        isLoggedIn,
        username: isLoggedIn ? cUser : null,
        sessionId: isLoggedIn ? sessionId : null,
        dsUserId: isLoggedIn ? dsUserId : null,
        csrfToken: isLoggedIn ? csrfToken : null
      };

      console.log('Instagram login status checked:', status);
      return status;
    } catch (error) {
      console.error('Failed to check Instagram login status:', error);
      return {
        isLoggedIn: false,
        username: null,
        sessionId: null,
        dsUserId: null,
        csrfToken: null
      };
    }
  }, []);

  // 웹뷰 로드 시 로그인 상태 확인
  const handleWebViewLoad = useCallback(async () => {
    const status = await checkLoginStatus();
    setLoginStatus(status);
    onLoginStatusChange?.(status);
  }, [checkLoginStatus, onLoginStatusChange]);

  // 웹뷰 네비게이션 시 로그인 상태 확인
  const handleNavigation = useCallback(async (event: any) => {
    const { url } = event;
    
    // Instagram 메인 페이지로 이동했을 때 로그인 상태 확인
    if (url.includes('instagram.com') && !url.includes('login')) {
      // 페이지 로드 완료 후 상태 확인
      setTimeout(async () => {
        const status = await checkLoginStatus();
        setLoginStatus(status);
        onLoginStatusChange?.(status);
      }, 2000);
    }
  }, [checkLoginStatus, onLoginStatusChange]);

  // 웹뷰 이벤트 리스너 등록
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    webview.addEventListener('did-finish-load', handleWebViewLoad);
    webview.addEventListener('did-navigate', handleNavigation);
    webview.addEventListener('did-navigate-in-page', handleNavigation);

    return () => {
      webview.removeEventListener('did-finish-load', handleWebViewLoad);
      webview.removeEventListener('did-navigate', handleNavigation);
      webview.removeEventListener('did-navigate-in-page', handleNavigation);
    };
  }, [webviewRef, handleWebViewLoad, handleNavigation]);

  // 수동으로 로그인 상태 확인
  const refreshLoginStatus = useCallback(async () => {
    const status = await checkLoginStatus();
    setLoginStatus(status);
    onLoginStatusChange?.(status);
    return status;
  }, [checkLoginStatus, onLoginStatusChange]);

  return {
    loginStatus,
    checkLoginStatus,
    refreshLoginStatus
  };
};
