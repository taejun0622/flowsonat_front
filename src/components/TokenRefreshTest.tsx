import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useAuth } from '@/contexts/AuthContext';

export const TokenRefreshTest: React.FC = () => {
  const { isRefreshing, handleTokenRefresh } = useTokenRefresh();
  const { token, user } = useAuth();

  const handleTest401Error = async () => {
    try {
      // 만료된 토큰으로 API 호출을 시뮬레이션
      const response = await fetch('/api/test-401', {
        headers: {
          'Authorization': `Bearer expired_token_here`,
        },
      });
      
      if (response.status === 401) {
        console.log('401 error detected, token refresh should be triggered');
      }
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Token Refresh Test</CardTitle>
        <CardDescription>
          Test automatic token refresh functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Current Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}
          </p>
          <p className="text-sm text-gray-600">
            <strong>User:</strong> {user?.email || 'Not logged in'}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Refresh Status:</strong> {isRefreshing ? 'Refreshing...' : 'Idle'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={handleTokenRefresh}
            disabled={isRefreshing}
            variant="outline"
          >
            {isRefreshing ? 'Refreshing...' : 'Manual Refresh'}
          </Button>
          
          <Button 
            onClick={handleTest401Error}
            variant="secondary"
          >
            Test 401 Error
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>• Manual Refresh: Manually refresh the token</p>
          <p>• Test 401 Error: Simulate a 401 error to test auto-refresh</p>
          <p>• Auto-refresh happens automatically on 401 errors</p>
        </div>
      </CardContent>
    </Card>
  );
};
