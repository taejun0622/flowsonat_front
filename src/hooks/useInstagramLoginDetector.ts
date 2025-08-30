import React from 'react';

interface UseInstagramLoginDetectorProps {
  onLoginSuccess: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  onUsernameFound?: (username: string, sessionData: any) => void;
}

export const useInstagramLoginDetector = ({
  onLoginSuccess,
  onLoginError,
  onUsernameFound
}: UseInstagramLoginDetectorProps) => {
  const webviewRef = React.useRef<HTMLWebViewElement>(null);

  // Instagram username을 찾는 함수 (프로필 이미지 alt 텍스트만 사용)
  const findInstagramUsername = async (webview: HTMLWebViewElement): Promise<string | null> => {
    try {
      // Electron API를 통해 JavaScript 실행
      if (window.electronAPI) {
        const electronAPI = window.electronAPI as any;
        const username = await electronAPI.executeInstagramJavaScript(`
          (() => {
            // 프로필 이미지의 alt 텍스트에서 username 추출
            const profileImages = document.querySelectorAll('img[alt*="profile picture"]');
            for (let i = 0; i < profileImages.length; i++) {
              const altText = profileImages[i].getAttribute('alt');
              if (altText) {
                const match = altText.match(/^([^']+)'s profile picture$/);
                if (match) {
                  const detectedUsername = match[1];
                  // 유효한 username인지 확인 (특수문자나 숫자만 있는 경우 제외)
                  if (detectedUsername && detectedUsername.length > 0 && 
                      /^[a-zA-Z0-9._]+$/.test(detectedUsername) && detectedUsername.length >= 3 &&
                      !detectedUsername.match(/^[0-9_]+$/)) {
                    return detectedUsername;
                  }
                }
              }
            }
            
            return null;
          })()
        `);
        
        return username;
      } else {
        // 브라우저 환경에서는 WebView의 executeJavaScript 사용
        const username = await (webview as any).executeJavaScript(`
          (() => {
            // 프로필 이미지의 alt 텍스트에서 username 추출
            const profileImages = document.querySelectorAll('img[alt*="profile picture"]');
            for (let i = 0; i < profileImages.length; i++) {
              const altText = profileImages[i].getAttribute('alt');
              if (altText) {
                const match = altText.match(/^([^']+)'s profile picture$/);
                if (match) {
                  const detectedUsername = match[1];
                  // 유효한 username인지 확인 (특수문자나 숫자만 있는 경우 제외)
                  if (detectedUsername && detectedUsername.length > 0 && 
                      /^[a-zA-Z0-9._]+$/.test(detectedUsername) && detectedUsername.length >= 3 &&
                      !detectedUsername.match(/^[0-9_]+$/)) {
                    return detectedUsername;
                  }
                }
              }
            }
            
            return null;
          })()
        `);
        
        return username;
      }
    } catch (error) {
      console.error('Error finding Instagram username:', error);
      return null;
    }
  };

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
            
            // 페이지가 완전히 로드될 때까지 기다린 후 username 찾기
            setTimeout(async () => {
              const username = await findInstagramUsername(webview);
              
              if (username) {
                console.log('Instagram username found:', username);
                // username을 찾았으면 확인 모달을 위한 콜백 호출
                onUsernameFound?.(username, sessionData);
              } else {
                console.log('Instagram username not found, showing manual input modal');
                // username을 찾지 못했으면 수동 입력 모달을 위한 콜백 호출
                onUsernameFound?.('', sessionData);
              }
            }, 3000); // 3초 대기
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
            
            // 브라우저 환경에서도 username 찾기 시도
            setTimeout(async () => {
              const username = await findInstagramUsername(webview);
              
              if (username) {
                console.log('Instagram username found (browser):', username);
                onUsernameFound?.(username, sessionData);
              } else {
                console.log('Instagram username not found (browser), showing manual input modal');
                onUsernameFound?.('', sessionData);
              }
            }, 3000);
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
  }, [onLoginSuccess, onLoginError, onUsernameFound]);

  return { webviewRef };
};
