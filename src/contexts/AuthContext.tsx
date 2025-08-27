import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '@/api/services/AuthService';
import { User, Token, UserLogin, UserCreate } from '@/api/models';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const userInfo = await AuthService.getCurrentUserInfoApiV1AuthMeGet();
          setUser(userInfo);
        } catch (error) {
          console.error('Failed to get user info:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setToken(null);
        }
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
      toast({
        title: "Login failed",
        description: error.message || "Failed to sign in.",
        variant: "destructive",
      });
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
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    
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
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
