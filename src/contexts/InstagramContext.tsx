import React from 'react';
import { InstagramService } from '@/api/services/InstagramService';
import { InstagramConnectResponse } from '@/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

// 쿠키 문자열을 객체로 변환하는 유틸리티 함수
const parseCookies = (cookieString: string): Record<string, any> => {
  if (!cookieString) return {};
  
  const cookies: Record<string, any> = {};
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
};

interface InstagramContextType {
  instagramAccount: InstagramConnectResponse | null;
  isConnected: boolean;
  isLoading: boolean;
  checkConnection: () => Promise<void>;
  connectAccount: () => void;
  disconnectAccount: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  saveInstagramSession: (sessionData: any) => Promise<InstagramConnectResponse>;
  injectCookiesToWebView: (cookies: Record<string, any>) => Promise<boolean>;
  restoreInstagramSession: () => Promise<boolean>;
}

const InstagramContext = React.createContext<InstagramContextType | undefined>(undefined);

export const useInstagram = () => {
  const context = React.useContext(InstagramContext);
  if (context === undefined) {
    throw new Error('useInstagram must be used within an InstagramProvider');
  }
  return context;
};

interface InstagramProviderProps {
  children: React.ReactNode;
}

export const InstagramProvider = ({ children }: InstagramProviderProps) => {
  const [instagramAccount, setInstagramAccount] = React.useState<InstagramConnectResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { user, token } = useAuth();
  const { toast } = useToast();

  const checkConnection = React.useCallback(async () => {
    if (!token || !user) {
      setInstagramAccount(null);
      return;
    }

    try {
      setIsLoading(true);
      const account = await InstagramService.getMyInstagramAccountApiV1InstagramMeGet();
      setInstagramAccount(account);
    } catch (error: any) {
      // 404 에러는 연결된 계정이 없다는 의미이므로 조용히 처리
      if (error.status === 404) {
        console.log('Instagram not connected (404)');
        setInstagramAccount(null);
      } else {
        console.error('Failed to check Instagram connection:', error);
        setInstagramAccount(null);
        
        // API 엔드포인트가 아직 구현되지 않았을 수도 있음
        if (error.status !== 500) {
          toast({
            title: "Connection check failed",
            description: "Failed to check Instagram connection status.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, user, toast]);

  const connectAccount = () => {
    // Instagram 로그인은 InstagramConnectionManager에서 처리
    console.log('Instagram connection requested');
  };

  const saveInstagramSession = async (sessionData: any) => {
    try {
      console.log('Saving Instagram session data:', sessionData);
      
      // 세션 데이터에서 username 추출
      const username = sessionData?.username;
      
      if (!username) {
        throw new Error('Username not found in session data');
      }
      
      // 쿠키 정보를 구조화된 형태로 변환
      const cookies = sessionData?.cookies ? parseCookies(sessionData.cookies) : null;
      
      // Instagram 세션 정보를 서버에 저장 (쿠키 정보 포함)
      const response = await InstagramService.connectInstagramAccountApiV1InstagramMePost({
        username: String(username),
        cookies: cookies
      });
      
      setInstagramAccount(response);
      
      // 추가 세션 정보를 로컬에 저장 (선택사항)
      const extendedSessionData = {
        ...sessionData,
        connectedAt: new Date().toISOString(),
        accountId: response.id,
        cookies: cookies,
        serverResponse: {
          id: response.id,
          username: response.username,
          ig_user_id: response.ig_user_id,
          status: response.status,
          created_at: response.created_at,
          updated_at: response.updated_at
        }
      };
      
      // 로컬 스토리지에 세션 정보 저장 (개발용)
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('instagram_session_data', JSON.stringify(extendedSessionData));
        console.log('Instagram session data saved to localStorage:', extendedSessionData);
      }
      
      // 쿠키 정보만 별도로 저장 (디버깅용)
      if (cookies) {
        localStorage.setItem('instagram_cookies', JSON.stringify(cookies));
        console.log('Instagram cookies saved to localStorage:', cookies);
      }
      
      toast({
        title: "Instagram connected",
        description: `Successfully connected to Instagram account @${username}.`,
      });
      
      return response;
    } catch (error: any) {
      console.error('Failed to save Instagram session:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to save Instagram session.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const disconnectAccount = async () => {
    console.log('🔍 disconnectAccount 함수 시작');
    console.log('🔍 token 존재 여부:', !!token);
    
    if (!token) {
      console.log('❌ token이 없어서 함수 종료');
      return;
    }

    try {
      console.log('🔄 로딩 상태 설정');
      setIsLoading(true);
      
      // 1. 서버에서 Instagram 계정 연결 해제 (선택적)
      console.log('🌐 서버 API 호출 시작');
      try {
        await InstagramService.disconnectInstagramAccountApiV1InstagramMeDelete();
        console.log('✅ 서버 API 호출 완료');
      } catch (apiError) {
        console.warn('⚠️ 서버 API 호출 실패 (계속 진행):', apiError);
        // API 실패는 무시하고 계속 진행
      }
      setInstagramAccount(null);
      console.log('✅ Instagram 계정 상태 초기화');

      // 2. 로컬 스토리지에서 모든 Instagram 관련 데이터 정리
      console.log('🗂️ 로컬 스토리지 정리 시작');
      
      // 먼저 모든 localStorage 키를 확인
      console.log('📋 현재 localStorage 전체 내용:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
        }
      }
      console.log(`📊 localStorage 총 ${localStorage.length}개 항목`);
      
      // sessionStorage도 확인
      console.log('📋 현재 sessionStorage 전체 내용:');
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          console.log(`  - ${key}: ${sessionStorage.getItem(key)?.substring(0, 50)}...`);
        }
      }
      console.log(`📊 sessionStorage 총 ${sessionStorage.length}개 항목`);
      
      try {
        // 개발 환경 세션 데이터
        console.log('🗂️ instagram_session_data 삭제 시도');
        localStorage.removeItem('instagram_session_data');
        console.log('✅ instagram_session_data 삭제 완료');
        
        // 쿠키 정보도 삭제
        console.log('🗂️ instagram_cookies 삭제 시도');
        localStorage.removeItem('instagram_cookies');
        console.log('✅ instagram_cookies 삭제 완료');
        
        // Instagram 관련 모든 로컬 스토리지 키 정리
        console.log('🔍 localStorage 키 검색 시작');
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.toLowerCase().includes('instagram') ||
            key.toLowerCase().includes('ig_') ||
            key.toLowerCase().includes('ds_') ||
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('auth')
          )) {
            keysToRemove.push(key);
            console.log(`🔍 발견된 키: ${key}`);
          }
        }
        console.log(`📊 총 ${keysToRemove.length}개의 키 발견`);
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log(`Removed localStorage key: ${key}`);
          } catch (e) {
            console.warn(`Failed to remove localStorage key ${key}:`, e);
          }
        });

        // SessionStorage도 정리
        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.toLowerCase().includes('instagram') ||
            key.toLowerCase().includes('ig_') ||
            key.toLowerCase().includes('ds_') ||
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('auth')
          )) {
            sessionKeysToRemove.push(key);
          }
        }
        
        sessionKeysToRemove.forEach(key => {
          try {
            sessionStorage.removeItem(key);
            console.log(`Removed sessionStorage key: ${key}`);
          } catch (e) {
            console.warn(`Failed to remove sessionStorage key ${key}:`, e);
          }
        });

        console.log('All local Instagram data cleared');
      } catch (e) {
        console.warn('Failed to clear some local data:', e);
      }

            // 3. WebView 완전 파괴 및 재생성 (무식한 방법)
      console.log('💥 WebView 완전 파괴 시작');
      try {
        // 방법 1: Electron API 사용
        if (window.IG && typeof window.IG.disconnectAndReload === 'function') {
          console.log('🔧 Electron IG API 사용하여 WebView 정리');
          await window.IG.disconnectAndReload();
          console.log('✅ Electron WebView 세션 정리 완료');
        } else {
          console.log('⚠️ Electron IG API 사용 불가');
        }
        
        // 방법 1.5: Electron 세션 직접 정리
        try {
          if (window.ipcRenderer) {
            console.log('🔧 Electron 세션 직접 정리 시도');
            await window.ipcRenderer.invoke('ig:clear-session');
            console.log('✅ Electron 세션 직접 정리 완료');
          }
        } catch (e) {
          console.warn('⚠️ Electron 세션 직접 정리 실패:', e);
        }
        
        // 방법 2: WebView 완전 파괴 (무식한 방법)
        try {
          // 모든 WebView 요소 찾기
          const webviews = document.querySelectorAll('webview');
          console.log(`🔍 발견된 WebView 개수: ${webviews.length}`);
          
          webviews.forEach((webviewElement, index) => {
            const webview = webviewElement as any;
            try {
              console.log(`💥 WebView ${index + 1} 완전 파괴 중...`);
              
              // 1. WebView 내부 데이터 완전 정리
              const nukeScript = `
                (function() {
                  try {
                    console.log('💥 WebView 내부 핵폭탄 시작');
                    
                    // 모든 스토리지 완전 삭제
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // 모든 쿠키 삭제
                    document.cookie.split(";").forEach(function(c) { 
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    });
                    
                    // IndexedDB 완전 삭제
                    if ('indexedDB' in window) {
                      indexedDB.databases().then(databases => {
                        databases.forEach(db => {
                          if (db.name) indexedDB.deleteDatabase(db.name);
                        });
                      });
                    }
                    
                    // Cache 완전 삭제
                    if ('caches' in window) {
                      caches.keys().then(cacheNames => {
                        cacheNames.forEach(cacheName => caches.delete(cacheName));
                      });
                    }
                    
                    // Service Workers 완전 삭제
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(registrations => {
                        registrations.forEach(registration => registration.unregister());
                      });
                    }
                    
                    console.log('💥 WebView 내부 핵폭탄 완료');
                    return 'NUKED';
                  } catch (e) {
                    return 'NUKED_WITH_ERROR: ' + e.message;
                  }
                })();
              `;
              
              // 스크립트 실행
              if (webview.executeJavaScript) {
                webview.executeJavaScript(nukeScript).then((result: any) => {
                  console.log(`💥 WebView ${index + 1} 내부 핵폭탄 결과:`, result);
                });
              }
              
              // 2. WebView 완전 파괴
              setTimeout(() => {
                try {
                  // WebView를 DOM에서 완전히 제거
                  if (webviewElement.parentNode) {
                    webviewElement.parentNode.removeChild(webviewElement);
                    console.log(`💥 WebView ${index + 1} DOM에서 완전 제거`);
                  }
                  
                                     // 새로운 WebView 생성 (완전히 새로운 파티션으로)
                   setTimeout(() => {
                     try {
                       const newWebView = document.createElement('webview') as any;
                       
                       // 완전히 새로운 파티션으로 생성 (세션 격리)
                       const timestamp = Date.now();
                       newWebView.partition = `persist:ig_${timestamp}`;
                       newWebView.src = 'https://www.instagram.com/accounts/login/';
                       newWebView.style.width = '100%';
                       newWebView.style.height = '100%';
                       
                       // 추가 속성으로 완전 격리
                       newWebView.setAttribute('webpreferences', 'contextIsolation=true, nodeIntegration=false');
                       
                       // 원래 WebView가 있던 위치에 삽입
                       const container = document.querySelector('.webview-container') || document.body;
                       container.appendChild(newWebView);
                       console.log(`🔄 WebView ${index + 1} 새 파티션(${timestamp})으로 생성 완료`);
                     } catch (e) {
                       console.warn(`WebView ${index + 1} 재생성 실패:`, e);
                     }
                   }, 1000);
                  
                } catch (e) {
                  console.warn(`WebView ${index + 1} 파괴 실패:`, e);
                }
              }, 2000);
              
            } catch (webviewError) {
              console.warn(`WebView ${index + 1} 파괴 중 에러:`, webviewError);
            }
          });
          
        } catch (directError) {
          console.warn('WebView 파괴 실패:', directError);
        }
        
        console.log('💥 WebView 완전 파괴 완료');
        
      } catch (webviewError) {
        console.warn('WebView 파괴 중 전체 에러:', webviewError);
      }

              // 4. IndexedDB 정리 (선택적)
        console.log('🗄️ IndexedDB 정리 시작');
        try {
          if ('indexedDB' in window) {
            console.log('📋 IndexedDB 데이터베이스 목록 확인 중...');
            const databases = await window.indexedDB.databases();
            console.log('📋 모든 IndexedDB 데이터베이스:');
            databases.forEach(db => {
              console.log(`  - ${db.name} (version: ${db.version})`);
            });
            console.log(`📊 총 ${databases.length}개의 데이터베이스`);
            
            const instagramDBs = databases.filter(db => 
              db.name && (
                db.name.toLowerCase().includes('instagram') ||
                db.name.toLowerCase().includes('ig_') ||
                db.name.toLowerCase().includes('session')
              )
            );
            console.log(`🔍 Instagram 관련 데이터베이스: ${instagramDBs.length}개`);
            
            for (const db of instagramDBs) {
              try {
                if (db.name) {
                  await window.indexedDB.deleteDatabase(db.name);
                  console.log(`Deleted IndexedDB: ${db.name}`);
                }
              } catch (e) {
                console.warn(`Failed to delete IndexedDB ${db.name}:`, e);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to clear IndexedDB:', e);
        }

      // 5. 쿠키 정리 (도메인 제한으로 인해 제한적)
      console.log('🍪 쿠키 정리 시작');
      
      // 먼저 현재 쿠키 확인
      console.log('📋 현재 쿠키 전체 내용:');
      const allCookies = document.cookie.split(';').map(c => c.trim());
      allCookies.forEach(cookie => {
        console.log(`  - ${cookie}`);
      });
      console.log(`📊 총 ${allCookies.length}개의 쿠키`);
      
      try {
        // 현재 도메인에서 접근 가능한 Instagram 관련 쿠키만 정리
        const cookiesToRemove = [
          'ds_user_id',
          'sessionid', 
          'csrftoken',
          'mid',
          'ig_did',
          'ig_nrcb',
          'ps_n',
          'rur',
          'urlgen'
        ];
        
        cookiesToRemove.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.instagram.com`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=instagram.com`;
        });
        
        console.log('Instagram cookies cleared');
      } catch (e) {
        console.warn('Failed to clear cookies:', e);
      }

      console.log('🎉 disconnectAccount 함수 완료!');
      
      // WebView 강제 리렌더링을 위한 이벤트 발생
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('instagram-webview-force-reload'));
          console.log('🔄 WebView 강제 리렌더링 이벤트 발생');
        } catch (e) {
          console.warn('WebView 강제 리렌더링 이벤트 발생 실패:', e);
        }
      }, 1000);
      
      toast({
        title: "Instagram disconnected",
        description: "Successfully disconnected from Instagram. All local data has been cleared.",
      });
    } catch (error: any) {
      console.error('Failed to disconnect Instagram:', error);
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect from Instagram.",
        variant: "destructive",
      });
      throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록 함
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConnection = React.useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  // 쿠키를 WebView에 주입하는 함수
  const injectCookiesToWebView = React.useCallback(async (cookies: Record<string, any>): Promise<boolean> => {
    try {
      console.log('Injecting cookies to WebView:', cookies);
      
      // Electron 환경에서 쿠키 주입
      if (window.electronAPI && typeof window.electronAPI.injectCookies === 'function') {
        await window.electronAPI.injectCookies(cookies);
        console.log('Cookies injected via Electron API');
        return true;
      }
      
      // WebView에 직접 쿠키 주입 (Electron WebView API 사용)
      if (window.IG && typeof window.IG.injectCookies === 'function') {
        await window.IG.injectCookies(cookies);
        console.log('Cookies injected via IG API');
        return true;
      }
      
      // 일반 웹 환경에서 쿠키 주입 (제한적)
      if (typeof document !== 'undefined') {
        Object.entries(cookies).forEach(([name, value]) => {
          if (name && value) {
            // Instagram 도메인에 대한 쿠키 설정
            document.cookie = `${name}=${value}; domain=.instagram.com; path=/; secure; samesite=none`;
            document.cookie = `${name}=${value}; domain=instagram.com; path=/; secure; samesite=none`;
          }
        });
        console.log('Cookies injected via document.cookie (limited)');
        return true;
      }
      
      console.warn('No cookie injection method available');
      return false;
    } catch (error) {
      console.error('Failed to inject cookies:', error);
      return false;
    }
  }, []);

  // Instagram 세션 복원 함수
  const restoreInstagramSession = React.useCallback(async (): Promise<boolean> => {
    try {
      console.log('Restoring Instagram session...');
      
      // 1. 서버에서 Instagram 계정 정보 가져오기
      const account = await InstagramService.getMyInstagramAccountApiV1InstagramMeGet();
      console.log('Retrieved account from server:', account);
      
      if (!account || !account.cookies) {
        console.log('No cookies found in account data');
        return false;
      }
      
      // 2. 쿠키를 WebView에 주입
      const injectionSuccess = await injectCookiesToWebView(account.cookies);
      if (!injectionSuccess) {
        console.warn('Failed to inject cookies');
        return false;
      }
      
      // 3. 로컬 상태 업데이트
      setInstagramAccount(account);
      
      // 4. 로컬 스토리지에 복원된 세션 정보 저장
      const restoredSessionData = {
        username: account.username,
        isLoggedIn: true,
        dsUserId: account.cookies.ds_user_id || null,
        hasSessionId: !!account.cookies.sessionid,
        timestamp: new Date().toISOString(),
        url: 'https://www.instagram.com/',
        cookies: account.cookies,
        restored: true,
        restoredAt: new Date().toISOString()
      };
      
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('instagram_session_data', JSON.stringify(restoredSessionData));
        localStorage.setItem('instagram_cookies', JSON.stringify(account.cookies));
        console.log('Restored session data saved to localStorage');
      }
      
      toast({
        title: "Instagram Session Restored",
        description: `Successfully restored Instagram session for @${account.username}.`,
      });
      
      console.log('Instagram session restored successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to restore Instagram session:', error);
      
      // 404 에러는 연결된 계정이 없다는 의미
      if (error.status === 404) {
        console.log('No Instagram account connected (404)');
        return false;
      }
      
      toast({
        title: "Session Restore Failed",
        description: "Failed to restore Instagram session. Please reconnect your account.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [injectCookiesToWebView, toast]);

  // 사용자가 로그인하면 Instagram 연결 상태를 확인
  React.useEffect(() => {
    if (user && token) {
      // 자동으로 연결 상태 확인하지 않음 - Dashboard에서 필요할 때만 확인
      console.log('User logged in, Instagram connection check ready');
    } else {
      setInstagramAccount(null);
      // 로그아웃 시 연결 상태 초기화
      setIsLoading(false);
    }
  }, [user, token]);

  const value: InstagramContextType = {
    instagramAccount,
    isConnected: !!instagramAccount,
    isLoading,
    checkConnection,
    connectAccount,
    disconnectAccount,
    refreshConnection,
    saveInstagramSession,
    injectCookiesToWebView,
    restoreInstagramSession,
  };

  return (
    <InstagramContext.Provider value={value}>
      {children}
    </InstagramContext.Provider>
  );
};
