import React, { useEffect, useState } from 'react';
import { LogOut, User, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useInstagram } from '@/contexts/InstagramContext';
import { InstagramLoginOverlay } from '@/components/InstagramLoginOverlay';
import { InstagramService } from '@/api/services/InstagramService';
import { useToast } from '@/hooks/use-toast';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { isConnected, checkConnection } = useInstagram();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  // Dashboard 진입 시 Instagram 연결 상태 확인 (한 번만 실행)
  useEffect(() => {
    const checkInstagramConnection = async () => {
      if (!user || hasCheckedConnection || isCheckingConnection) return;
      
      try {
        setIsCheckingConnection(true);
        await checkConnection();
        setHasCheckedConnection(true);
      } catch (error) {
        console.error('Failed to check Instagram connection:', error);
        setHasCheckedConnection(true);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    // 사용자가 로그인된 상태에서만 Instagram 연결 확인
    if (user && !hasCheckedConnection && !isCheckingConnection) {
      checkInstagramConnection();
    }
  }, [user, checkConnection, hasCheckedConnection, isCheckingConnection]); // 중복 실행 방지

  // Instagram 연결되지 않은 경우 자동으로 로그인 오버레이 표시
  useEffect(() => {
    if (!isCheckingConnection && !isConnected && user && hasCheckedConnection) {
      console.log('Instagram not connected, showing login overlay');
      setShowLoginOverlay(true);
    }
  }, [isCheckingConnection, isConnected, user, hasCheckedConnection]);

  const handleLoginSuccess = async (sessionData: any) => {
    try {
      // Instagram 세션 정보를 서버에 저장
      const response = await InstagramService.connectInstagramAccountApiV1InstagramMePost({
        username: 'instagram_user' // 임시 username
      });
      
      // 연결 상태 업데이트
      await checkConnection();
      
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

  const handleCloseLoginOverlay = () => {
    setShowLoginOverlay(false);
  };

  // 연결 상태 확인 중일 때 로딩 표시
  if (isCheckingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking Instagram connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Flowsonat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                설정
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
            <p className="text-gray-600">환영합니다! 서비스를 이용해보세요.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  사용자 정보
                </CardTitle>
                <CardDescription>현재 로그인된 사용자 정보</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">이메일:</span>
                    <p className="text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">가입일:</span>
                    <p className="text-sm text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
                <CardDescription>자주 사용하는 기능들</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    프로필 설정
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    계정 관리
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>서비스 사용 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">활성 상태</span>
                    <span className="text-sm font-medium text-green-600">활성</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">마지막 로그인</span>
                    <span className="text-sm text-gray-900">방금 전</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>환영합니다! 🎉</CardTitle>
              <CardDescription>
                Flowsonat 서비스에 오신 것을 환영합니다. 이제 모든 기능을 이용하실 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                서비스를 더 효과적으로 이용하기 위해 프로필을 완성하고 설정을 확인해보세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Instagram Login Overlay */}
      {showLoginOverlay && (
        <InstagramLoginOverlay
          onClose={handleCloseLoginOverlay}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};
