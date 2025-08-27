import React, { createContext, useContext, useEffect, useState } from 'react';
import { InstagramService } from '@/api/services/InstagramService';
import { InstagramConnectResponse } from '@/api/models';
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
  children: React.ReactNode;
}

export const InstagramProvider: React.FC<InstagramProviderProps> = ({ children }) => {
  const [instagramAccount, setInstagramAccount] = useState<InstagramConnectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();
  const { toast } = useToast();

  const checkConnection = async () => {
    if (!token || !user) {
      setInstagramAccount(null);
      return;
    }

    try {
      setIsLoading(true);
      const account = await InstagramService.getMyInstagramAccountApiV1InstagramMeGet();
      setInstagramAccount(account);
    } catch (error: any) {
      console.error('Failed to check Instagram connection:', error);
      setInstagramAccount(null);
      
      // 404 에러는 연결된 계정이 없다는 의미이므로 에러 토스트를 표시하지 않음
      if (error.status !== 404) {
        toast({
          title: "Connection check failed",
          description: "Failed to check Instagram connection status.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const connectAccount = () => {
    // Instagram 로그인은 InstagramConnectionManager에서 처리
    console.log('Instagram connection requested');
  };

  const saveInstagramSession = async (sessionData: any) => {
    try {
      // Instagram 세션 정보를 서버에 저장
      const response = await InstagramService.connectInstagramAccountApiV1InstagramMePost({
        session_data: sessionData
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

  const refreshConnection = async () => {
    await checkConnection();
  };

  // 사용자가 로그인하면 Instagram 연결 상태를 확인
  useEffect(() => {
    if (user && token) {
      checkConnection();
    } else {
      setInstagramAccount(null);
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
