import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { InstagramService } from '@/api/services/InstagramService';
import { InstagramConnectResponse } from '@/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface InstagramContextType {
  instagramAccount: InstagramConnectResponse | null;
  isConnected: boolean;
  isLoading: boolean;
  checkConnection: () => Promise<void>;
  connectAccount: () => void;
  disconnectAccount: () => Promise<void>;
  refreshConnection: () => Promise<void>;
}

const InstagramContext = createContext<InstagramContextType | undefined>(undefined);

export const useInstagram = () => {
  const context = useContext(InstagramContext);
  if (context === undefined) {
    throw new Error('useInstagram must be used within an InstagramProvider');
  }
  return context;
};

interface InstagramProviderProps {
  children: ReactNode;
}

export const InstagramProvider = ({ children }: InstagramProviderProps) => {
  const [instagramAccount, setInstagramAccount] = useState<InstagramConnectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
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
      // Instagram 세션 정보를 서버에 저장
      const response = await InstagramService.connectInstagramAccountApiV1InstagramMePost({
        username: String(sessionData?.username || '')
      });
      
      setInstagramAccount(response);
      
      toast({
        title: "Instagram connected",
        description: "Successfully connected to Instagram.",
      });
    } catch (error: any) {
      console.error('Failed to save Instagram session:', error);
      toast({
        title: "Connection failed",
        description: "Failed to save Instagram session.",
        variant: "destructive",
      });
    }
  };

  const disconnectAccount = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      // Clear local Electron session/cookies for Instagram so next login is fresh
      try {
        // @ts-expect-error exposed via preload
        await window.electronAPI?.clearInstagramSession?.();
      } catch (e) {
        console.warn('Failed to clear local Instagram session (non-fatal):', e);
      }
      await InstagramService.disconnectInstagramAccountApiV1InstagramMeDelete();
      setInstagramAccount(null);
      
      toast({
        title: "Instagram disconnected",
        description: "Successfully disconnected from Instagram.",
      });
    } catch (error: any) {
      console.error('Failed to disconnect Instagram:', error);
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect from Instagram.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConnection = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  // 사용자가 로그인하면 Instagram 연결 상태를 확인
  useEffect(() => {
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
  };

  return (
    <InstagramContext.Provider value={value}>
      {children}
    </InstagramContext.Provider>
  );
};
