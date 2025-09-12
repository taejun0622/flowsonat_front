// Instagram WebView scripts - integrated with new detection system
import { InstagramLoginDetector } from '@/services/InstagramLoginDetector';

export const InstagramWebViewScripts = {
  // 주기적 로그인 상태 확인 스크립트 (new detection system)
  getPeriodicCheckScript: () => InstagramLoginDetector.getPeriodicDetectionScript(),

  // 상세한 로그인 상태 확인 및 username 추출 스크립트 (new detection system) 
  getDetailedLoginCheckScript: () => InstagramLoginDetector.getDetailedDetectionScript(),

  // Instagram 데이터 클리어 스크립트 (preserved for compatibility)
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
  `,

  // Instagram 자동 로그인 차단 스크립트 (preserved for compatibility)
  getBlockAutoLoginScript: () => `
    (function() {
      try {
        console.log('🚫 Instagram 자동 로그인 차단 스크립트 시작');
        
        // 1. Instagram 자동 로그인 관련 스크립트 차단
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);
          
          if (tagName.toLowerCase() === 'script') {
            const originalSrc = element.getAttribute ? element.getAttribute('src') : null;
            if (originalSrc && (
              originalSrc.includes('instagram.com') && 
              (originalSrc.includes('login') || originalSrc.includes('auth') || originalSrc.includes('session'))
            )) {
              console.log('🚫 Instagram 자동 로그인 스크립트 차단:', originalSrc);
              // 스크립트를 빈 함수로 대체
              element.textContent = '// Blocked Instagram auto-login script';
              return element;
            }
          }
          
          return element;
        };
        
        // 2. 자동 로그인 관련 이벤트 리스너 차단
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
          if (type === 'load' || type === 'DOMContentLoaded') {
            // 페이지 로드 시 자동 로그인 시도 차단
            const wrappedListener = function(event) {
              console.log('🚫 자동 로그인 이벤트 차단:', type);
              // 원본 리스너는 실행하지 않음
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
        
        console.log('✅ Instagram 자동 로그인 차단 스크립트 완료');
        return 'Instagram auto-login blocking script injected successfully';
        
      } catch (error) {
        console.error('❌ Instagram 자동 로그인 차단 스크립트 오류:', error);
        return 'Error: ' + error.message;
      }
    })();
  `,

  // Instagram 강제 로그아웃 스크립트 (preserved for compatibility)
  getForceLogoutScript: () => `
    (function() {
      try {
        console.log('🚪 Instagram 강제 로그아웃 스크립트 시작');
        
        // 1. 모든 Instagram 쿠키 즉시 삭제
        function deleteAllInstagramCookies() {
          const cookies = document.cookie.split(';');
          cookies.forEach(function(cookie) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name && (name.includes('ig_') || name.includes('ds_') || name.includes('session'))) {
              document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.instagram.com';
              document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=instagram.com';
              document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
              console.log('🗑️ 쿠키 삭제:', name);
            }
          });
        }
        
        // 2. 모든 스토리지 완전 삭제
        function clearAllStorage() {
          try { localStorage.clear(); } catch(e){}
          try { sessionStorage.clear(); } catch(e){}
          console.log('🗑️ 스토리지 완전 삭제 완료');
        }
        
        // 3. Instagram 로그아웃 API 호출
        function callInstagramLogout() {
          fetch('https://www.instagram.com/accounts/logout/', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
          }).catch(function(error) {
            console.log('Instagram 로그아웃 API 호출 실패 (정상):', error);
          });
        }
        
        // 4. 즉시 실행
        deleteAllInstagramCookies();
        clearAllStorage();
        callInstagramLogout();
        
        // 5. 로그아웃 페이지로 강제 이동
        setTimeout(function() {
          window.location.href = 'https://www.instagram.com/accounts/logout/';
        }, 100);
        
        console.log('✅ Instagram 강제 로그아웃 스크립트 완료');
        return 'Instagram force logout script executed successfully';
        
      } catch (error) {
        console.error('❌ Instagram 강제 로그아웃 스크립트 오류:', error);
        return 'Error: ' + error.message;
      }
    })();
  `
};