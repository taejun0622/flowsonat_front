// Instagram WebView에서 사용하는 JavaScript 로직들
export const InstagramWebViewScripts = {
  // 주기적 로그인 상태 확인 스크립트
  getPeriodicCheckScript: () => `
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
          // DOM 기반 username 추출만 사용 (쿠키 기반 임시 username 제거)
          var username = null;
          
          // DOM에서 username 추출 시도 (가장 마지막 프로필 이미지 선택)
          var profileImages = document.querySelectorAll('img[alt*="profile picture"]');
          if (profileImages.length > 0) {
            // 가장 마지막 프로필 이미지 선택
            var lastProfileImage = profileImages[profileImages.length - 1];
            var alt = lastProfileImage.getAttribute('alt');
            
            if (alt && alt.includes("'s profile picture")) {
              var extractedUsername = alt.replace("'s profile picture", "");
              // username 유효성 검사
              if (extractedUsername && 
                  !/^\\d+$/.test(extractedUsername) && 
                  extractedUsername.length > 1 && 
                  extractedUsername.length < 31 &&
                  /^[a-zA-Z0-9._]+$/.test(extractedUsername)) {
                username = extractedUsername;
              }
            }
          }
          
          var sessionData = {
            username: username || null, // DOM 추출 실패시 null로 설정
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
  `,

  // 상세한 로그인 상태 확인 및 username 추출 스크립트
  getDetailedLoginCheckScript: () => `
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
            
            // 최종 로그인 상태 판단: 쿠키 기반만 사용
            var isLoggedIn = isLoggedInByCookies;
            
            console.log('Final result:', {
              isLoggedInByCookies: isLoggedInByCookies,
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
              
              // 가장 마지막 프로필 이미지에서 username 추출 (간단한 방법)
              console.log('Extracting username from last profile image...');
              
              var allProfileImages = document.querySelectorAll('img[alt*="profile picture"]');
              console.log('Found', allProfileImages.length, 'total profile images on page');
              
              if (allProfileImages.length > 0) {
                // 가장 마지막 프로필 이미지 선택
                var lastProfileImage = allProfileImages[allProfileImages.length - 1];
                var alt = lastProfileImage.getAttribute('alt');
                console.log('Selected last profile image:', alt);
                
                if (alt && alt.includes("'s profile picture")) {
                  var extractedUsername = alt.replace("'s profile picture", "");
                  // username 유효성 검사
                  if (extractedUsername && 
                      !/^\\d+$/.test(extractedUsername) && 
                      extractedUsername.length > 1 && 
                      extractedUsername.length < 31 &&
                      /^[a-zA-Z0-9._]+$/.test(extractedUsername)) {
                    username = extractedUsername;
                    console.log('Extracted username from last profile image:', username);
                  }
                }
              }
              
              // 세션 정보 수집
              var sessionData = {
                username: username || 'instagram_user',
                isLoggedIn: true,
                isLoggedInByCookies: isLoggedInByCookies,
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
          checkInstagramLogin();
        } else {
          window.addEventListener('load', checkInstagramLogin);
        }
        
        return 'Instagram login detection script injected successfully';
      } catch (error) {
        console.error('Error injecting Instagram script:', error);
        return 'Error: ' + error.message;
      }
    })();
  `,

  // Instagram 데이터 클리어 스크립트
  getClearDataScript: () => `
    (function() {
      try {
        try { localStorage.clear(); } catch(e){}
        try { sessionStorage.clear(); } catch(e){}
        // Best-effort cookie deletion for non-HttpOnly cookies
        function deleteCookie(name, domain, path) {
          var cookieBase = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ';
          var pathPart = 'path=' + (path || '/') + '; ';
          var domainPart = domain ? ('domain=' + domain + '; ') : '';
          document.cookie = cookieBase + pathPart + domainPart;
        }
        var host = window.location.hostname;
        var domains = [host, '.instagram.com', 'instagram.com'];
        var paths = ['/', '/accounts', '/accounts/login', '/accounts/logout'];
        var cookies = (document.cookie || '').split(';').filter(Boolean).map(function(c){return c.trim().split('=')[0];});
        var targets = cookies.length ? cookies : ['ds_user_id','sessionid','csrftoken','mid','ig_did','ig_nrcb','ps_n'];
        for (var i=0; i<targets.length; i++) {
          var name = targets[i];
          for (var d=0; d<domains.length; d++) {
            for (var p=0; p<paths.length; p++) {
              deleteCookie(name, domains[d], paths[p]);
            }
          }
          deleteCookie(name, null, '/');
        }
        return JSON.stringify({ ok: true, cleared: targets });
      } catch(e) { return JSON.stringify({ ok: false, error: e.message }); }
    })();
  `
};
