import { useState, useEffect, useCallback } from 'react';
import { useInstagram } from '@/contexts/InstagramContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  InstagramWebViewState, 
  InstagramWebViewStatus, 
  InstagramWebViewAction,
  InstagramWebViewUIConfig,
  InstagramModalState
} from '@/types/instagram';

export const useInstagramWebView = () => {
  const { isConnected, connectAccount, disconnectAccount, saveInstagramSession, restoreInstagramSession, injectCookiesToWebView } = useInstagram();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [webViewStatus, setWebViewStatus] = useState<InstagramWebViewStatus>({
    state: 'instagram_logged_out_server_unregistered',
    isInstagramLoggedIn: false,
    isServerRegistered: false,
    lastChecked: new Date()
  });

  const [modalState, setModalState] = useState<InstagramModalState>({
    showConfirmModal: false,
    showManualModal: false
  });

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  // While the user chooses manual input or dismisses confirm, suppress auto-confirm for this dsUserId
  const [suppressedForDsUserId, setSuppressedForDsUserId] = useState<string | null>(null);

  // Instagram 로그인 상태 감지 시 호출 (로그아웃 플로우용)
  const handleInstagramLoginDetected = useCallback(async (sessionData: any) => {
    try {
      console.log('=== Instagram Login Detection Flow ===');
      console.log('Session data received:', sessionData);
      console.log('Current isConnected state:', isConnected);
      console.log('Username from session:', sessionData?.username);
      console.log('Suppressed for dsUserId:', suppressedForDsUserId);
      
      // 로그아웃 플로우에서는 즉시 연결하지 않고 확인 모달을 띄움
      if (!isConnected) {
        // If user is already interacting with a modal, or explicitly suppressed for this dsUserId, don't re-open confirm
        if (modalState.showConfirmModal || modalState.showManualModal || (suppressedForDsUserId && suppressedForDsUserId === sessionData?.dsUserId)) {
          setWebViewStatus((prev: InstagramWebViewStatus) => ({
            ...prev,
            state: 'instagram_login_detected',
            isInstagramLoggedIn: true,
            isServerRegistered: false,
            username: sessionData.username,
            dsUserId: sessionData.dsUserId,
            detectedSessionData: sessionData,
            lastChecked: new Date()
          }));
          console.log('Auto-confirm suppressed; keeping current modal state.');
          return;
        }
        console.log('User not connected, showing confirmation modal...');
        
        setWebViewStatus((prev: InstagramWebViewStatus) => ({
          ...prev,
          state: 'instagram_login_detected',
          isInstagramLoggedIn: true,
          isServerRegistered: false,
          username: sessionData.username,
          dsUserId: sessionData.dsUserId,
          detectedSessionData: sessionData,
          lastChecked: new Date()
        }));

        // 확인 모달 띄우기
        setModalState({
          showConfirmModal: true,
          showManualModal: false,
          detectedUsername: sessionData.username,
          detectedSessionData: sessionData
        });
        
        console.log('Modal state set:', {
          showConfirmModal: true,
          detectedUsername: sessionData.username
        });
      } else {
        console.log('User already connected, saving session immediately...');
        // 기존 연결된 상태에서는 즉시 저장
        const response = await saveInstagramSession(sessionData);
        
        setWebViewStatus((prev: InstagramWebViewStatus) => ({
          ...prev,
          state: 'instagram_logged_in',
          isInstagramLoggedIn: true,
          isServerRegistered: true,
          username: sessionData.username,
          dsUserId: sessionData.dsUserId,
          lastChecked: new Date()
        }));

        toast({
          title: "Instagram Connected!",
          description: "Your Instagram account has been successfully connected.",
          variant: "default"
        });

        // 이미 서버에 연결된 상태에서 로그인 감지되면 바로 Dashboard로 돌아가기
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Failed to save Instagram session:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Instagram account. Please try again.",
        variant: "destructive"
      });
    }
  }, [isConnected, saveInstagramSession, toast, modalState.showConfirmModal, modalState.showManualModal, suppressedForDsUserId]);

  // Instagram 로그인 상태 체크 시 호출
  const handleInstagramStatusCheck = useCallback((isLoggedIn: boolean, sessionData?: any) => {
    console.log('Instagram status check:', { isLoggedIn, sessionData });
    
    if (isLoggedIn) {
      setWebViewStatus((prev: InstagramWebViewStatus) => ({
        ...prev,
        // If logged-in on Instagram but not server-registered yet, reflect 'login_detected'
        state: isConnected ? 'instagram_logged_in' : 'instagram_login_detected',
        isInstagramLoggedIn: true,
        isServerRegistered: isConnected,
        username: sessionData?.username,
        dsUserId: sessionData?.dsUserId,
        lastChecked: new Date()
      }));
    } else {
      setWebViewStatus((prev: InstagramWebViewStatus) => ({
        ...prev,
        state: isConnected ? 'instagram_logged_out_server_registered' : 'instagram_logged_out_server_unregistered',
        isInstagramLoggedIn: false,
        isServerRegistered: isConnected,
        username: undefined,
        dsUserId: undefined,
        lastChecked: new Date()
      }));
    }
  }, [isConnected]);

  // 연결 확인 핸들러
  const handleConfirmConnection = useCallback(async () => {
    if (!modalState.detectedSessionData) return;

    try {
      const response = await saveInstagramSession(modalState.detectedSessionData);
      
      setWebViewStatus((prev: InstagramWebViewStatus) => ({
        ...prev,
        state: 'instagram_logged_in',
        isInstagramLoggedIn: true,
        isServerRegistered: true,
        username: modalState.detectedUsername,
        dsUserId: modalState.detectedSessionData?.dsUserId,
        lastChecked: new Date()
      }));

      setModalState({
        showConfirmModal: false,
        showManualModal: false
      });
      setSuppressedForDsUserId(null);

      toast({
        title: "Instagram Connected!",
        description: `Successfully connected to Instagram account @${modalState.detectedUsername}.`,
        variant: "default"
      });

      // 대시보드로 돌아가기
      navigate('/dashboard');

    } catch (error) {
      console.error('Failed to save Instagram session:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Instagram account. Please try again.",
        variant: "destructive"
      });
    }
  }, [modalState, saveInstagramSession, toast, navigate]);

  // 수동 사용자명 입력 핸들러
  const handleManualUsername = useCallback(() => {
    console.log('=== handleManualUsername called ===');
    console.log('Current modal state before:', modalState);
    
    setModalState((prev: InstagramModalState) => {
      const newState = {
        ...prev,
        showConfirmModal: false,
        showManualModal: true
      };
      console.log('New modal state:', newState);
      return newState;
    });
    // Suppress auto confirm for the currently detected dsUserId so periodic checks don't reopen confirm
    const dsUserId = modalState.detectedSessionData?.dsUserId || webViewStatus.dsUserId;
    if (dsUserId) {
      setSuppressedForDsUserId(dsUserId);
    }
    
    console.log('=== handleManualUsername completed ===');
  }, [modalState, webViewStatus.dsUserId]);

  // 수동 사용자명 확인 핸들러
  const handleManualUsernameConfirm = useCallback(async (username: string) => {
    if (!modalState.detectedSessionData) return;

    try {
      const updatedSessionData = {
        ...modalState.detectedSessionData,
        username: username
      };

      const response = await saveInstagramSession(updatedSessionData);
      
      setWebViewStatus((prev: InstagramWebViewStatus) => ({
        ...prev,
        state: 'instagram_logged_in',
        isInstagramLoggedIn: true,
        isServerRegistered: true,
        username: username,
        dsUserId: modalState.detectedSessionData?.dsUserId,
        lastChecked: new Date()
      }));

      setModalState({
        showConfirmModal: false,
        showManualModal: false
      });
      setSuppressedForDsUserId(null);

      toast({
        title: "Instagram Connected!",
        description: `Successfully connected to Instagram account @${username}.`,
        variant: "default"
      });

      // 대시보드로 돌아가기
      navigate('/dashboard');

    } catch (error) {
      console.error('Failed to save Instagram session:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Instagram account. Please try again.",
        variant: "destructive"
      });
    }
  }, [modalState, saveInstagramSession, toast, navigate]);

  // 연결 취소 핸들러
  const handleCancelConnection = useCallback(() => {
    setModalState({
      showConfirmModal: false,
      showManualModal: false
    });

    setWebViewStatus((prev: InstagramWebViewStatus) => ({
      ...prev,
      state: 'instagram_logged_out_server_unregistered',
      isInstagramLoggedIn: false,
      isServerRegistered: false,
      username: undefined,
      dsUserId: undefined,
      detectedSessionData: undefined,
      lastChecked: new Date()
    }));
    // Keep suppression for the last detected user to prevent immediate re-open of confirm modal
    const dsUserId = modalState.detectedSessionData?.dsUserId;
    if (dsUserId) {
      setSuppressedForDsUserId(dsUserId);
    }
  }, [modalState.detectedSessionData]);

  // 상태별 UI 설정 반환
  const getUIConfig = useCallback((): InstagramWebViewUIConfig => {
    switch (webViewStatus.state) {
      case 'instagram_logged_in':
        return {
          title: "Instagram Connected",
          description: "You are logged into Instagram and your account is connected to the service.",
          primaryAction: {
            label: "Open Instagram",
            action: 'open_instagram',
            variant: 'default'
          },
          secondaryAction: {
            label: "Disconnect",
            action: 'disconnect_instagram',
            variant: 'destructive'
          },
          showStatusBar: true,
          statusBarType: 'success'
        };

      case 'instagram_logged_out_server_registered':
        return {
          title: "Instagram Account Registered",
          description: "Your Instagram account is registered but you need to log in again.",
          primaryAction: {
            label: "Login to Instagram",
            action: 'login_instagram',
            variant: 'default'
          },
          secondaryAction: {
            label: "Disconnect Account",
            action: 'disconnect_instagram',
            variant: 'outline'
          },
          showStatusBar: true,
          statusBarType: 'warning'
        };

      case 'instagram_logged_out_server_unregistered':
        return {
          title: "Connect Instagram",
          description: "Connect your Instagram account to use the service features.",
          primaryAction: {
            label: "Connect Instagram",
            action: 'connect_instagram',
            variant: 'default'
          },
          showStatusBar: false,
          statusBarType: 'info'
        };

      case 'instagram_login_detected':
        return {
          title: "Login Detected",
          description: "Instagram login detected. Please confirm your account connection.",
          primaryAction: {
            label: "Confirm Connection",
            action: 'confirm_connection',
            variant: 'default'
          },
          secondaryAction: {
            label: "Manual Username",
            action: 'manual_username',
            variant: 'outline'
          },
          showStatusBar: true,
          statusBarType: 'info'
        };

      default:
        return {
          title: "Instagram Status Unknown",
          description: "Unable to determine Instagram connection status.",
          primaryAction: {
            label: "Check Status",
            action: 'check_status',
            variant: 'outline'
          },
          showStatusBar: true,
          statusBarType: 'error'
        };
    }
  }, [webViewStatus.state]);

  // 액션 핸들러
  const handleAction = useCallback(async (action: InstagramWebViewAction) => {
    switch (action) {
      case 'connect_instagram':
        // 먼저 기존 세션 복원 시도
        try {
          console.log('Attempting to restore existing Instagram session...');
          const restored = await restoreInstagramSession();
          if (restored) {
            console.log('Instagram session restored successfully');
            setWebViewStatus((prev: InstagramWebViewStatus) => ({
              ...prev,
              state: 'instagram_logged_in',
              isInstagramLoggedIn: true,
              isServerRegistered: true,
              lastChecked: new Date()
            }));
            toast({
              title: "Instagram Session Restored",
              description: "Your Instagram session has been restored successfully.",
              variant: "default"
            });
            navigate('/dashboard');
            return null;
          }
        } catch (error) {
          console.log('Failed to restore session, proceeding with new login:', error);
        }
        
        // 세션 복원 실패 시 새로운 로그인 진행
        try {
          // If running in Electron, clear known Instagram sessions (default + persisted partitions)
          // Passing undefined lets main clear default + known partitions even without a webview id
          // @ts-ignore
          if ((window as any).electronAPI?.clearInstagramDataForWebContents) {
            // @ts-ignore
            await (window as any).electronAPI.clearInstagramDataForWebContents(undefined)
          }
        } catch {/* non-blocking */}
        // Instagram 로그인 페이지로 이동
        return 'https://www.instagram.com/accounts/login/';
        
      case 'disconnect_instagram':
        try {
          await disconnectAccount();
          setWebViewStatus((prev: InstagramWebViewStatus) => ({
            ...prev,
            state: 'instagram_logged_out_server_unregistered',
            isServerRegistered: false,
            lastChecked: new Date()
          }));
          toast({
            title: "Instagram Disconnected",
            description: "Your Instagram account has been disconnected.",
            variant: "default"
          });
        } catch (error) {
          toast({
            title: "Disconnect Failed",
            description: "Failed to disconnect Instagram account.",
            variant: "destructive"
          });
        }
        return null;
        
      case 'open_instagram':
        // Instagram 메인 페이지로 이동
        return 'https://www.instagram.com/';
        
      case 'login_instagram':
        // 먼저 기존 세션 복원 시도
        try {
          console.log('Attempting to restore existing Instagram session for login...');
          const restored = await restoreInstagramSession();
          if (restored) {
            console.log('Instagram session restored successfully for login');
            setWebViewStatus((prev: InstagramWebViewStatus) => ({
              ...prev,
              state: 'instagram_logged_in',
              isInstagramLoggedIn: true,
              isServerRegistered: true,
              lastChecked: new Date()
            }));
            toast({
              title: "Instagram Session Restored",
              description: "Your Instagram session has been restored successfully.",
              variant: "default"
            });
            navigate('/dashboard');
            return null;
          }
        } catch (error) {
          console.log('Failed to restore session for login, proceeding with new login:', error);
        }
        
        // 세션 복원 실패 시 새로운 로그인 진행
        return 'https://www.instagram.com/accounts/login/';
        
      case 'logout_instagram':
        // Instagram 로그아웃 (실제로는 Instagram에서 로그아웃 처리)
        setWebViewStatus((prev: InstagramWebViewStatus) => ({
          ...prev,
          state: 'instagram_logged_out_server_registered',
          isInstagramLoggedIn: false,
          lastChecked: new Date()
        }));
        return 'https://www.instagram.com/accounts/logout/';
        
      case 'check_status':
        setIsCheckingStatus(true);
        // 상태 체크 로직 (WebView에서 자동으로 처리됨)
        setTimeout(() => setIsCheckingStatus(false), 2000);
        return null;

      case 'confirm_connection':
        await handleConfirmConnection();
        return null;

      case 'manual_username':
        handleManualUsername();
        return null;
        
      default:
        return null;
    }
  }, [disconnectAccount, toast, handleConfirmConnection, handleManualUsername, restoreInstagramSession, navigate]);

  // 초기 상태 설정
  useEffect(() => {
    setWebViewStatus((prev: InstagramWebViewStatus) => ({
      ...prev,
      isServerRegistered: isConnected,
      state: isConnected ? 'instagram_logged_out_server_registered' : 'instagram_logged_out_server_unregistered'
    }));
  }, [isConnected]);

  return {
    webViewStatus,
    modalState,
    isCheckingStatus,
    uiConfig: getUIConfig(),
    handleInstagramLoginDetected,
    handleInstagramStatusCheck,
    handleAction,
    handleConfirmConnection,
    handleManualUsername,
    handleManualUsernameConfirm,
    handleCancelConnection
  };
};
