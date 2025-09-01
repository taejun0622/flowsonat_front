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
  const [lastCheckTime, setLastCheckTime] = useState(0);

  // 주기적으로 Instagram 로그인 상태 확인
  useEffect(() => {
    if (!webviewRef.current || !src.includes('instagram.com')) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCheckTime < 3000) return; // 3초마다 체크
      
      setLastCheckTime(now);
      
      webviewRef.current.executeJavaScript(`
        (function() {
          try {
            function getCookie(name) {
              var value = ' ' + document.cookie;
              var parts = value.split(' ' + name + '=');
              if (parts.length === 2) return parts.pop().split(';').shift();
              return null;
            }
            
            var dsUserId = getCookie('ds_user_id');
            var sessionId = getCookie('sessionid');
            
            var isLoggedIn = !!dsUserId;
            
            if (isLoggedIn) {
              var username = 'user_' + dsUserId;
              
              var sessionData = {
                username: username,
                isLoggedIn: true,
                dsUserId: dsUserId,
                hasSessionId: !!sessionId,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                cookies: document.cookie
              };
              
              return JSON.stringify({
                type: 'INSTAGRAM_LOGIN_SUCCESS',
                data: sessionData
              });
            }
            
            return JSON.stringify({
              type: 'INSTAGRAM_LOGIN_STATUS_CHECK',
              data: { isLoggedIn: false }
            });
          } catch (error) {
            return JSON.stringify({
              type: 'ERROR',
              error: error.message
            });
          }
        })();
      `).then((result: string) => {
        try {
          const data = JSON.parse(result);
          console.log('Periodic check result:', data);
          
          if (data.type === 'INSTAGRAM_LOGIN_SUCCESS') {
            console.log('Instagram login detected via periodic check:', data.data);
            onInstagramLogin?.(data.data);
          } else if (data.type === 'INSTAGRAM_LOGIN_STATUS_CHECK') {
            console.log('Instagram login status check via periodic check:', data.data);
            onLoginStatusCheck?.(data.data.isLoggedIn);
          }
        } catch (error) {
          console.error('Error parsing periodic check result:', error);
        }
      }).catch((error: any) => {
        console.error('Error in periodic check:', error);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [src, lastCheckTime, onInstagramLogin, onLoginStatusCheck]);

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
            try {
              // Instagram 로그인 상태 감지 함수
              function checkInstagramLogin() {
                try {
                  console.log('=== Instagram Login Check Debug ===');
                  
                  // 쿠키에서 로그인 상태 확인
                  function getCookie(name) {
                    var value = ' ' + document.cookie;
                    var parts = value.split(' ' + name + '=');
                    if (parts.length === 2) return parts.pop().split(';').shift();
                    return null;
                  }
                  
                  // 모든 쿠키를 배열로 가져오기
                  function getAllCookies() {
                    var cookies = document.cookie.split(';').map(function(cookie) {
                      var parts = cookie.trim().split('=');
                      return { name: parts[0], value: parts[1] || '' };
                    });
                    return cookies;
                  }
                  
                  // 핵심 로그인 쿠키 확인
                  var dsUserId = getCookie('ds_user_id');
                  var sessionId = getCookie('sessionid');
                  
                  console.log('ds_user_id:', dsUserId);
                  console.log('sessionid:', sessionId ? 'EXISTS' : 'NOT FOUND');
                  
                  // ps_n 쿠키들 확인
                  var allCookies = getAllCookies();
                  var psnCookies = allCookies.filter(function(cookie) {
                    return cookie.name === 'ps_n';
                  });
                  var hasPsnZero = psnCookies.some(function(cookie) {
                    return cookie.value === '0';
                  });
                  var hasPsnOne = psnCookies.some(function(cookie) {
                    return cookie.value === '1';
                  });
                  
                  console.log('ps_n cookies:', psnCookies);
                  console.log('hasPsnZero:', hasPsnZero);
                  console.log('hasPsnOne:', hasPsnOne);
                  
                  // 로그인 상태 판단 (쿠키 기반)
                  var isLoggedInByCookies = !!(dsUserId && !hasPsnZero);
                  
                  // DOM 기반 로그인 상태 확인 (보조 방법)
                  var isLoggedInByDOM = (
                    !document.querySelector('button[type="submit"]') ||
                    document.querySelector('a[href*="/accounts/activity/"]') ||
                    document.querySelector('a[href*="/accounts/edit/"]') ||
                    document.querySelector('a[href*="/direct/"]') ||
                    document.querySelector('main[role="main"]') ||
                    document.querySelector('div[role="button"][tabindex="0"]') ||
                    !document.querySelector('form[method="post"]')
                  );
                  
                  // DOM 요소 확인
                  console.log('DOM elements check:');
                  console.log('- Login button:', !!document.querySelector('button[type="submit"]'));
                  console.log('- Profile link:', !!document.querySelector('a[href*="/accounts/activity/"]'));
                  console.log('- Settings link:', !!document.querySelector('a[href*="/accounts/edit/"]'));
                  console.log('- Main content:', !!document.querySelector('main[role="main"]'));
                  console.log('- Login form:', !!document.querySelector('form[method="post"]'));
                  
                  // 최종 로그인 상태 판단
                  var isLoggedIn = isLoggedInByCookies || isLoggedInByDOM;
                  
                  console.log('Final result:', {
                    isLoggedInByCookies: isLoggedInByCookies,
                    isLoggedInByDOM: isLoggedInByDOM,
                    isLoggedIn: isLoggedIn,
                    dsUserId: dsUserId,
                    hasSessionId: !!sessionId,
                    hasPsnZero: hasPsnZero,
                    hasPsnOne: hasPsnOne
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
                      psnCookies: psnCookies.map(function(c) {
                        return c.name + '=' + c.value;
                      }),
                      hasPsnZero: hasPsnZero,
                      hasPsnOne: hasPsnOne
                    }
                  }, '*');
                  
                  console.log('About to check isLoggedIn condition:', isLoggedIn);
                  
                  if (isLoggedIn) {
                    console.log('isLoggedIn is true, proceeding with username extraction...');
                    
                    // 사용자 정보 추출
                    var username = null;
                    
                    // 1. 쿠키에서 사용자 ID 추출 (fallback)
                    if (dsUserId) {
                      username = 'user_' + dsUserId;
                      console.log('Username from dsUserId:', username);
                    }
                    
                    // 2. DOM에서 username 추출 시도
                    if (!username) {
                      console.log('Trying to extract username from DOM...');
                      var profileLinks = document.querySelectorAll('a[href*="/"]');
                      for (var i = 0; i < profileLinks.length; i++) {
                        var link = profileLinks[i];
                        var href = link.getAttribute('href');
                        if (href && href.includes('/')) {
                          var pathParts = href.split('/').filter(function(part) {
                            return part.length > 0;
                          });
                          if (pathParts.length > 0) {
                            var potentialUsername = pathParts[0];
                            // username 유효성 검사 (숫자가 아닌 문자열)
                            if (potentialUsername && !/^\\d+$/.test(potentialUsername) && potentialUsername.length > 1) {
                              username = potentialUsername;
                              console.log('Username found from DOM:', username);
                              break;
                            }
                          }
                        }
                      }
                    }
                    
                    // 세션 정보 수집
                    var sessionData = {
                      username: username || 'instagram_user',
                      isLoggedIn: true,
                      isLoggedInByCookies: isLoggedInByCookies,
                      isLoggedInByDOM: isLoggedInByDOM,
                      dsUserId: dsUserId,
                      hasSessionId: !!sessionId,
                      psnCookies: psnCookies.map(function(c) {
                        return c.name + '=' + c.value;
                      }),
                      hasPsnZero: hasPsnZero,
                      hasPsnOne: hasPsnOne,
                      timestamp: new Date().toISOString(),
                      url: window.location.href,
                      cookies: document.cookie,
                      userAgent: navigator.userAgent
                    };
                    
                    console.log('Extracted username:', username);
                    console.log('Session data:', sessionData);
                    console.log('About to send postMessage...');
                    
                    // 부모 창에 메시지 전송
                    window.parent.postMessage({
                      type: 'INSTAGRAM_LOGIN_SUCCESS',
                      data: sessionData
                    }, '*');
                    
                    console.log('postMessage sent successfully!');
                  } else {
                    console.log('isLoggedIn is false, not sending postMessage');
                  }
                } catch (error) {
                  console.error('Error in checkInstagramLogin:', error);
                }
              }
              
              // 초기 체크
              checkInstagramLogin();
              
              // 주기적으로 체크 (5초마다)
              setInterval(checkInstagramLogin, 5000);
              
              // 페이지 로드 완료 후 체크
              if (document.readyState === 'complete') {
                setTimeout(checkInstagramLogin, 2000);
              } else {
                window.addEventListener('load', function() {
                  setTimeout(checkInstagramLogin, 2000);
                });
              }
            } catch (error) {
              console.error('Error in Instagram login detection script:', error);
            }
          })();
        `);
      }
    };

    const handleMessage = (event: any) => {
      console.log('WebView message received:', event);
      
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
