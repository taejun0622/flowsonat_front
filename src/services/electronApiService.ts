/**
 * Electron Main Process를 통한 API 요청 서비스
 * CORS 문제를 해결하기 위해 Main Process에서 API 요청을 처리합니다.
 */

export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export class ElectronApiService {
  private static instance: ElectronApiService;
  
  private constructor() {}
  
  public static getInstance(): ElectronApiService {
    if (!ElectronApiService.instance) {
      ElectronApiService.instance = new ElectronApiService();
    }
    return ElectronApiService.instance;
  }

  /**
   * Electron 환경인지 확인
   */
  private isElectron(): boolean {
    return typeof window !== 'undefined' && 
           !!window.electronAPI && 
           typeof (window.electronAPI as any)?.apiRequest === 'function';
  }

  /**
   * API 요청 실행
   */
  public async request<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
    if (this.isElectron()) {
      // Electron 환경: Main Process를 통해 요청
      return this.electronRequest<T>(options);
    } else {
      // 웹 환경: 직접 요청 (프록시 사용)
      return this.webRequest<T>(options);
    }
  }

  /**
   * Electron Main Process를 통한 API 요청
   */
  private async electronRequest<T>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const { method, url, data, headers } = options;
      
      console.log(`[Electron API] ${method} ${url}`, data ? { data } : '');
      
      const response = await (window.electronAPI as any)?.apiRequest(method, url, data, headers);
      
      console.log(`[Electron API Response] ${method} ${url}`, response);
      
      return {
        data: response,
        status: 200,
        statusText: 'OK'
      };
    } catch (error: any) {
      console.error(`[Electron API Error] ${options.method} ${options.url}:`, error);
      
      // 에러 응답 구조화
      const status = error.status || 500;
      const statusText = error.message || 'Internal Server Error';
      
      throw {
        data: error.data || error.message,
        status,
        statusText
      };
    }
  }

  /**
   * 웹 환경에서의 API 요청 (프록시 사용)
   */
  private async webRequest<T>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
    try {
      const { method, url, data, headers = {} } = options;
      
      // 프록시를 통해 요청 (Vite 개발 서버의 프록시 사용)
      const proxyUrl = `/api${url}`;
      
      console.log(`[Web API] ${method} ${proxyUrl}`, data ? { data } : '');
      
      const response = await fetch(proxyUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      if (!response.ok) {
        throw {
          data: parsedData,
          status: response.status,
          statusText: response.statusText
        };
      }

      console.log(`[Web API Response] ${method} ${proxyUrl}`, parsedData);
      
      return {
        data: parsedData,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error: any) {
      console.error(`[Web API Error] ${options.method} ${options.url}:`, error);
      throw error;
    }
  }

  /**
   * GET 요청
   */
  public async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, headers });
  }

  /**
   * POST 요청
   */
  public async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  /**
   * PUT 요청
   */
  public async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  /**
   * DELETE 요청
   */
  public async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }

  /**
   * PATCH 요청
   */
  public async patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }
}

// 싱글톤 인스턴스 export
export const electronApiService = ElectronApiService.getInstance();
