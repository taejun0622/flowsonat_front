import React from 'react';
import { AuthService } from '@/api/services/AuthService';
import { User, Token, UserLogin, UserCreate } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { UserStatus } from '@/types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  userStatus: UserStatus | null;
  isTrialOver: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<User>;
  logout: () => void;
  refreshToken: () => Promise<Token>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  retryGetUserInfo: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  // Helper function to get user status
  const getUserStatus = (user: User | null): UserStatus | null => {
    if (!user?.status) return null;
    return user.status as UserStatus;
  };

  // Helper function to check if trial is over
  const isTrialOver = React.useMemo(() => {
    const status = getUserStatus(user);
    return status === 'TRIAL_OVER';
  }, [user]);

  React.useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          console.log('🔐 Initializing auth with token:', token ? 'present' : 'missing');
          console.log('🌐 API Base URL:', import.meta.env.VITE_API_BASE_URL);
          
          const userInfo = await AuthService.getCurrentUserInfoApiV1AuthMeGet();
          console.log('✅ User info retrieved successfully:', userInfo);
          setUser(userInfo);
        } catch (error: any) {
          console.error('❌ Failed to get user info:', error);
          console.error('Error details:', {
            message: error?.message || 'Unknown error',
            status: error?.status || 'Unknown status',
            url: error?.url || 'Unknown URL',
            apiBaseUrl: import.meta.env.VITE_API_BASE_URL
          });
          
          // 프로덕션 환경에서는 더 관대하게 처리
          if (import.meta.env.PROD) {
            console.warn('⚠️ Production mode: Keeping token despite API failure');
            console.warn('⚠️ This is expected behavior in production when API is unavailable');
            // 프로덕션에서는 API 실패해도 토큰을 유지하고 로그인 상태로 간주
            // 사용자 정보는 null로 유지하지만 인증은 유지
            // 실제 사용자 정보는 필요할 때 다시 시도
          } else {
            // 개발 환경에서는 기존 로직 유지
            console.warn('⚠️ Development mode: Clearing tokens due to API failure');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setToken(null);
          }
        }
      } else {
        console.log('🔐 No token found, user not authenticated');
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (credentials: UserLogin) => {
    try {
      setIsLoading(true);
      const tokenData: Token = await AuthService.loginApiV1AuthLoginPost(credentials);
      
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);
      
      setToken(tokenData.access_token);
      
      const userInfo = await AuthService.getCurrentUserInfoApiV1AuthMeGet();
      setUser(userInfo);
      
      toast({
        title: "Login successful",
        description: "Successfully signed in.",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      // Error handling is now done in the components
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserCreate) => {
    try {
      setIsLoading(true);
      const newUser = await AuthService.registerApiV1AuthRegisterPost(userData);
      
      toast({
        title: "Registration successful",
        description: "Account created successfully. Please check your email.",
      });
      
      return newUser;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Error handling is now done in the components
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);

    // OpenAPI 토큰 설정을 초기화
    const { updateToken } = await import('@/api/core/OpenAPI');
    updateToken(null);
    
    toast({
      title: "Logged out",
      description: "Successfully signed out.",
    });
  };

  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const tokenData: Token = await AuthService.refreshTokenApiV1AuthRefreshPost(refreshTokenValue);
      
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);
      
      setToken(tokenData.access_token);
      
      // OpenAPI 설정 업데이트
      const { updateToken } = await import('@/api/core/OpenAPI');
      updateToken(tokenData.access_token);
      
      return tokenData;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
      
      throw error;
    }
  };

  const setTokens = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    
    try {
      const userInfo = await AuthService.getCurrentUserInfoApiV1AuthMeGet();
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to get user info after setting tokens:', error);
    }
  };

  const retryGetUserInfo = async () => {
    if (!token) {
      console.warn('⚠️ Cannot retry getting user info: no token available');
      return;
    }

    try {
      console.log('🔄 Retrying to get user info...');
      const userInfo = await AuthService.getCurrentUserInfoApiV1AuthMeGet();
      console.log('✅ User info retrieved successfully on retry:', userInfo);
      setUser(userInfo);
    } catch (error: any) {
      console.error('❌ Failed to get user info on retry:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        status: error?.status || 'Unknown status',
        url: error?.url || 'Unknown URL',
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL
      });
      
      // 프로덕션에서는 재시도 실패해도 토큰을 유지
      if (import.meta.env.PROD) {
        console.warn('⚠️ Production mode: Keeping token despite retry failure');
      } else {
        // 개발 환경에서는 토큰 제거
        console.warn('⚠️ Development mode: Clearing tokens due to retry failure');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setToken(null);
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    userStatus: getUserStatus(user),
    isTrialOver,
    login,
    register,
    logout,
    refreshToken,
    setTokens,
    retryGetUserInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
