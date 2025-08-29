import React from 'react';

interface UseInstagramLoginDetectorProps {
  onLoginSuccess: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
}

export const useInstagramLoginDetector = ({
  onLoginSuccess,
  onLoginError
}: UseInstagramLoginDetectorProps) => {
  const webviewRef = React.useRef<HTMLWebViewElement>(null);

  React.useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const checkLoginStatus = async () => {
      try {
        // Electron IPC를 통해 쿠키 확인 요청
        if (window.electronAPI) {
          const cookies = await window.electronAPI.getInstagramCookies();
          console.log('Instagram cookies:', cookies);
          
          // c_user 쿠키 확인 - 로그인 상태 판단
          const cUser = cookies['c_user'];
          if (cUser && cUser !== 'deleted') {
            console.log('Instagram login successful - c_user found:', cUser);
            
            // 세션 데이터 수집
            const sessionData = {
              url: webview.src,
              timestamp: new Date().toISOString(),
              cookies: cookies,
              c_user: cUser,
              // 추가 Instagram 관련 쿠키들
              sessionid: cookies['sessionid'],
              ds_user_id: cookies['ds_user_id'],
              csrftoken: cookies['csrftoken'],
              status: 'logged_in'
            };
            
            onLoginSuccess(sessionData);
          } else {
            console.log('Instagram not logged in - c_user is deleted or not found');
          }
        } else {
          // 브라우저 환경에서는 URL 기반으로 추정
          const currentUrl = webview.src;
          if (currentUrl.includes('instagram.com') && 
              !currentUrl.includes('login') && 
              !currentUrl.includes('accounts/login')) {
            
            const sessionData = {
              url: currentUrl,
              timestamp: new Date().toISOString(),
              status: 'logged_in_estimated'
            };
            
            onLoginSuccess(sessionData);
          }
        }
      } catch (error: any) {
        console.error('Error checking Instagram login status:', error);
        onLoginError?.(String(error?.message || error?.toString?.() || 'Unknown error'));
      }
    };

    const handleNavigation = (event: any) => {
      const currentUrl = event.url;
      console.log('WebView navigation:', currentUrl);
      
      // Instagram 메인 페이지나 피드 페이지로 이동했을 때 로그인 상태 확인
      if (currentUrl.includes('instagram.com') && 
          !currentUrl.includes('login') && 
          !currentUrl.includes('accounts/login')) {
        
        // 페이지 로드 완료 후 상태 확인
        setTimeout(checkLoginStatus, 2000);
      }
    };

    const handleLoadStop = () => {
      // 페이지 로딩이 완료되면 로그인 상태 확인
      setTimeout(checkLoginStatus, 1000);
    };

    webview.addEventListener('did-navigate', handleNavigation);
    webview.addEventListener('did-navigate-in-page', handleNavigation);
    webview.addEventListener('did-stop-loading', handleLoadStop);

    return () => {
      webview.removeEventListener('did-navigate', handleNavigation);
      webview.removeEventListener('did-navigate-in-page', handleNavigation);
      webview.removeEventListener('did-stop-loading', handleLoadStop);
    };
  }, [onLoginSuccess, onLoginError]);

  return { webviewRef };
};
