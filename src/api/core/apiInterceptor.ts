import { ApiError } from './ApiError';
import { AuthService } from '../services/AuthService';

// 토스트 알림을 위한 함수 (옵션)
const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  // 토스트 시스템이 있다면 사용, 없으면 console.log
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast({ title, description, variant });
  } else {
    console.log(`${title}: ${description}`);
  }
};

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: any;
}

class ApiInterceptor {
  private isRefreshing = false;
  private failedQueue: PendingRequest[] = [];

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        resolve(config);
      }
    });
    
    this.failedQueue = [];
  }

  async handleApiError(error: ApiError, retryRequest: () => Promise<any>): Promise<any> {
    const originalRequest = error.request;

    if (error.status === 401 && !originalRequest._retry) {
      if (this.isRefreshing) {
        // 이미 토큰 갱신 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          this.failedQueue.push({ resolve, reject, config: originalRequest });
        }).then(() => retryRequest());
      }

      originalRequest._retry = true;
      this.isRefreshing = true;

      try {
        // Refresh token으로 새로운 access token 발급
        const refreshToken = localStorage.getItem('refresh_token') || '';
        const tokenData = await AuthService.refreshTokenApiV1AuthRefreshPost(refreshToken);
        
        // 새로운 토큰을 localStorage에 저장
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);

        // OpenAPI 설정 업데이트
        const { updateToken } = await import('./OpenAPI');
        updateToken(tokenData.access_token);

        // 대기 중인 요청들 처리
        this.processQueue(null, tokenData.access_token);
        
        // 원래 요청 재시도
        return retryRequest();
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        this.processQueue(refreshError, null);
        
        // localStorage 정리
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // 토큰 갱신 실패 알림
        showToast('Session Expired', 'Your session has expired. Please log in again.', 'destructive');
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        
        throw refreshError;
      } finally {
        this.isRefreshing = false;
      }
    }

    // 401이 아닌 다른 에러는 그대로 throw
    throw error;
  }
}

export const apiInterceptor = new ApiInterceptor();
