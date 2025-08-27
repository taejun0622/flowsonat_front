import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useTokenRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshToken } = useAuth();
  const { toast } = useToast();

  const handleTokenRefresh = useCallback(async () => {
    if (isRefreshing) {
      return; // 이미 갱신 중이면 중복 실행 방지
    }

    setIsRefreshing(true);
    
    try {
      await refreshToken();
      toast({
        title: "Token refreshed",
        description: "Your session has been renewed.",
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshToken, toast]);

  return {
    isRefreshing,
    handleTokenRefresh,
  };
};
