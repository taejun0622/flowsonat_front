import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();
  
  console.log('🛡️ ProtectedRoute rendering:', {
    pathname: location.pathname,
    hasUser: !!user,
    hasToken: !!token,
    isLoading: isLoading
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 프로덕션 환경에서는 토큰이 있으면 사용자 정보가 없어도 통과
  // 개발 환경에서는 기존 로직 유지 (사용자 정보가 있어야 통과)
  const isAuthenticated = import.meta.env.PROD ? !!token : !!user;

  if (!isAuthenticated) {
    console.log('🚫 Access denied:', {
      hasUser: !!user,
      hasToken: !!token,
      isProduction: import.meta.env.PROD,
      isLoading: isLoading,
      redirectingTo: '/login',
      tokenValue: token ? `${token.substring(0, 10)}...` : 'null'
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ Access granted:', {
    hasUser: !!user,
    hasToken: !!token,
    isProduction: import.meta.env.PROD,
    isLoading: isLoading,
    tokenValue: token ? `${token.substring(0, 10)}...` : 'null',
    userEmail: user?.email || 'N/A'
  });

  return <>{children}</>;
};
