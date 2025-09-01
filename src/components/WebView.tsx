import React, { useRef, useEffect, useState } from 'react';

interface WebViewProps {
  src: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onInstagramLogin?: (sessionData: any) => void;
  onLoginStatusCheck?: (isLoggedIn: boolean) => void;
  className?: string;
}

export const WebView: React.FC<WebViewProps> = ({ 
  src, 
  onLoad, 
  onError, 
  onInstagramLogin,
  onLoginStatusCheck,
  className = "" 
}) => {
  const webviewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (event: any) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(event);
    };

    const handleDomReady = () => {
      setIsLoading(false);
      
      // Instagram 페이지인지 확인
      const isInstagram = src.includes('instagram.com');
      
      if (isInstagram && (onInstagramLogin || onLoginStatusCheck)) {
        // Instagram 로그인 상태 감지 스크립트 주입
        webview.executeJavaScript(`
          (function() {
            // Instagram 로그인 상태 감지 함수
            function checkInstagramLogin() {
              try {
                console.log('=== Instagram Login Check Debug ===');
                console.log('Document cookie:', document.cookie);
                console.log('Document cookie length:', document.cookie.length);
                
                // 쿠키에서 로그인 상태 확인 (가장 정확한 방법)
                function getCookie(name) {
                  const value = \` \${document.cookie}\`;
                  const parts = value.split(\` \${name}=\`);
                  if (parts.length === 2) return parts.pop().split(';').shift();
                  return null;
                }
                
                // 모든 쿠키를 배열로 가져오기
                function getAllCookies() {
                  const cookies = document.cookie.split(';').map(cookie => {
                    const [name, value] = cookie.trim().split('=');
                    return { name, value };
                  });
                  console.log('All cookies:', cookies);
                  return cookies;
                }
                
                // 핵심 로그인 쿠키 확인
                const dsUserId = getCookie('ds_user_id');
                const sessionId = getCookie('sessionid');
                
                console.log('ds_user_id:', dsUserId);
                console.log('sessionid:', sessionId ? 'EXISTS' : 'NOT FOUND');
                
                // ps_n 쿠키들 확인
                const allCookies = getAllCookies();
                const psnCookies = allCookies.filter(cookie => cookie.name === 'ps_n');
                const hasPsnZero = psnCookies.some(cookie => cookie.value === '0');
                const hasPsnOne = psnCookies.some(cookie => cookie.value === '1');
                
                console.log('ps_n cookies:', psnCookies);
                console.log('hasPsnZero:', hasPsnZero);
                console.log('hasPsnOne:', hasPsnOne);
                
                // 로그인 상태 판단 (쿠키 기반)
                // ds_user_id가 있으면 로그인 상태로 판단 (sessionid는 선택사항)
                // Facebook의 ps_n=0이 있으면 로그아웃 상태
                const isLoggedInByCookies = !!(dsUserId && !hasPsnZero);
                
                // DOM 기반 로그인 상태 확인 (보조 방법)
                const isLoggedInByDOM = (
                  // 로그인 버튼이 없거나
                  !document.querySelector('button[type="submit"]') ||
                  // 프로필 링크가 있거나
                  document.querySelector('a[href*="/accounts/activity/"]') ||
                  // 설정 링크가 있거나
                  document.querySelector('a[href*="/accounts/edit/"]') ||
                  // 알림 아이콘이 있거나
                  document.querySelector('a[href*="/accounts/activity/"]') ||
                  // 메시지 아이콘이 있거나
                  document.querySelector('a[href*="/direct/"]') ||
                  // 홈 피드가 로드되었거나
                  document.querySelector('main[role="main"]') ||
                  // 스토리 섹션이 있거나
                  document.querySelector('div[role="button"][tabindex="0"]') ||
                  // 로그인 폼이 없거나
                  !document.querySelector('form[method="post"]')
                );
                
                // DOM 요소 확인
                console.log('DOM elements check:');
                console.log('- Login button:', !!document.querySelector('button[type="submit"]'));
                console.log('- Profile link:', !!document.querySelector('a[href*="/accounts/activity/"]'));
                console.log('- Settings link:', !!document.querySelector('a[href*="/accounts/edit/"]'));
                console.log('- Main content:', !!document.querySelector('main[role="main"]'));
                console.log('- Login form:', !!document.querySelector('form[method="post"]'));
                
                // 최종 로그인 상태 판단 (쿠키 우선, DOM 보조)
                const isLoggedIn = isLoggedInByCookies || isLoggedInByDOM;
                
                console.log('Final result:', {
                  isLoggedInByCookies,
                  isLoggedInByDOM,
                  isLoggedIn,
                  dsUserId,
                  hasSessionId: !!sessionId,
                  psnCookies: psnCookies.map(c => \`\${c.name}=\${c.value}\`),
                  hasPsnZero,
                  hasPsnOne
                });
                console.log('=== End Debug ===');
                
                // 로그인 상태 체크 콜백 호출
                window.parent.postMessage({
                  type: 'INSTAGRAM_LOGIN_STATUS_CHECK',
                  data: { 
                    isLoggedIn: isLoggedIn,
                    isLoggedInByCookies: isLoggedInByCookies,
                    isLoggedInByDOM: isLoggedInByDOM,
                    dsUserId: dsUserId,
                    hasSessionId: !!sessionId,
                    psnCookies: psnCookies.map(c => \`\${c.name}=\${c.value}\`),
                    hasPsnZero,
                    hasPsnOne,
                    debugInfo: {
                      documentCookie: document.cookie,
                      cookieLength: document.cookie.length,
                      allCookies: allCookies.map(c => \`\${c.name}=\${c.value}\`)
                    }
                  }
                }, '*');
                
                if (isLoggedIn) {
                  // 사용자 정보 추출
                  let username = null;
                  
                  // 1. 쿠키에서 사용자 ID 추출
                  if (dsUserId) {
                    username = dsUserId; // 실제로는 API 호출로 username을 가져와야 함
                  }
                  
                  // 2. DOM에서 username 추출 (보조 방법)
                  if (!username) {
                    username = (
                      // 프로필 링크에서 username 추출
                      (() => {
                        const profileLink = document.querySelector('a[href*="/' + window.location.pathname.split('/')[1] + '/"]');
                        if (profileLink) {
                          const href = profileLink.getAttribute('href');
                          const match = href.match(/\\/([^\\/]+)\\//);
                          return match ? match[1] : null;
                        }
                        return null;
                      })() ||
                      // 또는 다른 방법으로 username 찾기
                      (() => {
                        const metaTags = document.querySelectorAll('meta[property="og:url"]');
                        for (let meta of metaTags) {
                          const content = meta.getAttribute('content');
                          if (content && content.includes('instagram.com/')) {
                            const match = content.match(/instagram\\.com\\/([^\\/]+)/);
                            return match ? match[1] : null;
                          }
                        }
                        return null;
                      })()
                    );
                  }
                  
                  // 세션 정보 수집
                  const sessionData = {
                    username: username || 'instagram_user',
                    isLoggedIn: true,
                    isLoggedInByCookies: isLoggedInByCookies,
                    isLoggedInByDOM: isLoggedInByDOM,
                    dsUserId: dsUserId,
                    hasSessionId: !!sessionId,
                    psnCookies: psnCookies.map(c => \`\${c.name}=\${c.value}\`),
                    hasPsnZero,
                    hasPsnOne,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    cookies: document.cookie,
                    userAgent: navigator.userAgent
                  };
                  
                  // 부모 창에 메시지 전송
                  window.parent.postMessage({
                    type: 'INSTAGRAM_LOGIN_SUCCESS',
                    data: sessionData
                  }, '*');
                  
                  return true;
                }
                
                return false;
              } catch (error) {
                console.error('Instagram login check error:', error);
                return false;
              }
            }
            
            // 초기 체크
            const initialResult = checkInstagramLogin();
            
            // URL 변경 감지
            let lastUrl = window.location.href;
            const observer = new MutationObserver(() => {
              if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                setTimeout(checkInstagramLogin, 1000); // URL 변경 후 1초 대기
              }
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            
            // 주기적으로 체크 (5초마다)
            setInterval(checkInstagramLogin, 5000);
            
            // 페이지 로드 완료 후 체크
            if (document.readyState === 'complete') {
              setTimeout(checkInstagramLogin, 2000);
            } else {
              window.addEventListener('load', () => {
                setTimeout(checkInstagramLogin, 2000);
              });
            }
          })();
        `);
      }
    };

    const handleMessage = (event: any) => {
      if (event.data && event.data.type === 'INSTAGRAM_LOGIN_SUCCESS') {
        console.log('Instagram login detected:', event.data.data);
        onInstagramLogin?.(event.data.data);
      } else if (event.data && event.data.type === 'INSTAGRAM_LOGIN_STATUS_CHECK') {
        console.log('Instagram login status check:', event.data.data);
        onLoginStatusCheck?.(event.data.data.isLoggedIn);
      }
    };

    webview.addEventListener('did-finish-load', handleLoad);
    webview.addEventListener('did-fail-load', handleError);
    webview.addEventListener('dom-ready', handleDomReady);
    window.addEventListener('message', handleMessage);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      webview.removeEventListener('did-fail-load', handleError);
      webview.removeEventListener('dom-ready', handleDomReady);
      window.removeEventListener('message', handleMessage);
    };
  }, [onLoad, onError, onInstagramLogin, onLoginStatusCheck, src]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">Failed to load content</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <webview
        ref={webviewRef}
        src={src}
        className="w-full h-full"
        webpreferences="contextIsolation=yes, nodeIntegration=no"
        allowpopups={true}
        security="true"
      />
    </div>
  );
};
