/**
 * 프로덕션 환경에서의 파일 프로토콜 이슈 방지 및 검증
 * 프로덕션 빌드에서 발생할 수 있는 문제들을 사전에 방지
 */

import { getApiBaseUrl } from '@/config/env';

/**
 * 프로덕션 환경에서 API 설정 검증
 * 앱 시작 시 한 번만 실행되어야 함
 */
export function validateProductionApiConfig(): void {
  const apiBaseUrl = getApiBaseUrl();
  
  console.group('🔍 Production API Configuration Validation');
  
  // 1. 절대 URL 검증
  if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
    console.error('🚨 CRITICAL: API Base URL is not absolute!', {
      apiBaseUrl: apiBaseUrl,
      willCauseFileProtocolIssue: true,
      timestamp: new Date().toISOString()
    });
    throw new Error(`API Base URL is not absolute: ${apiBaseUrl}. This will cause file:// protocol issues in production.`);
  }
  
  // 2. 파일 프로토콜 검증
  if (apiBaseUrl.startsWith('file://')) {
    console.error('🚨 CRITICAL: API Base URL uses file protocol!', {
      apiBaseUrl: apiBaseUrl,
      willCauseFileProtocolIssue: true,
      timestamp: new Date().toISOString()
    });
    throw new Error(`API Base URL uses file protocol: ${apiBaseUrl}. This will cause file:// protocol issues.`);
  }
  
  // 3. 환경 변수 검증
  const envVar = import.meta.env.VITE_API_BASE_URL;
  if (!envVar) {
    console.warn('⚠️ Warning: VITE_API_BASE_URL environment variable is not set. Using fallback.', {
      fallback: apiBaseUrl,
      timestamp: new Date().toISOString()
    });
  }
  
  // 4. 프로덕션 환경 확인
  const isProduction = import.meta.env.PROD;
  if (isProduction) {
    console.log('✅ Production environment detected. API configuration validated.', {
      apiBaseUrl: apiBaseUrl,
      isAbsoluteUrl: apiBaseUrl.startsWith('http'),
      isFileProtocol: apiBaseUrl.startsWith('file://'),
      timestamp: new Date().toISOString()
    });
  }
  
  console.groupEnd();
}

/**
 * 프로덕션 환경에서 URL 생성 검증
 * @param url 생성된 URL
 * @param context 컨텍스트 정보
 */
export function validateProductionUrl(url: string, context: string = 'unknown'): void {
  console.log(`🔗 URL Validation [${context}]:`, {
    url: url,
    isAbsolute: url.startsWith('http'),
    isFileProtocol: url.startsWith('file://'),
    context: context,
    timestamp: new Date().toISOString()
  });
  
  // 파일 프로토콜 방지
  if (url.startsWith('file://')) {
    console.error('🚨 CRITICAL: File protocol URL detected in production!', {
      url: url,
      context: context,
      willCauseFileProtocolIssue: true,
      timestamp: new Date().toISOString()
    });
    throw new Error(`File protocol URL detected: ${url} (context: ${context}). This will cause file:// protocol issues.`);
  }
  
  // 절대 URL 검증
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('🚨 CRITICAL: Non-absolute URL detected in production!', {
      url: url,
      context: context,
      willCauseFileProtocolIssue: true,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Non-absolute URL detected: ${url} (context: ${context}). This will cause file:// protocol issues.`);
  }
}

/**
 * 프로덕션 환경에서 fetch 요청 전 검증
 * @param url 요청할 URL
 * @param method HTTP 메서드
 */
export function validateProductionFetch(url: string, method: string = 'GET'): void {
  console.log(`🌐 Production Fetch Validation [${method}]:`, {
    url: url,
    method: method,
    isAbsolute: url.startsWith('http'),
    isFileProtocol: url.startsWith('file://'),
    timestamp: new Date().toISOString()
  });
  
  validateProductionUrl(url, `fetch-${method}`);
}

/**
 * 프로덕션 환경에서 Electron API 요청 전 검증
 * @param url 요청할 URL (상대 경로여야 함)
 * @param method HTTP 메서드
 */
export function validateProductionElectronApi(url: string, method: string = 'GET'): void {
  console.log(`⚡ Production Electron API Validation [${method}]:`, {
    url: url,
    method: method,
    isRelative: !url.startsWith('http'),
    isAbsolute: url.startsWith('http'),
    timestamp: new Date().toISOString()
  });
  
  // Electron API에서는 상대 경로를 사용해야 함
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.warn('⚠️ Warning: Absolute URL passed to Electron API. This should be a relative path.', {
      url: url,
      method: method,
      timestamp: new Date().toISOString()
    });
  }
  
  // 파일 프로토콜은 절대 허용하지 않음
  if (url.startsWith('file://')) {
    console.error('🚨 CRITICAL: File protocol URL passed to Electron API!', {
      url: url,
      method: method,
      willCauseFileProtocolIssue: true,
      timestamp: new Date().toISOString()
    });
    throw new Error(`File protocol URL passed to Electron API: ${url} (method: ${method}). This will cause file:// protocol issues.`);
  }
}

/**
 * 프로덕션 환경 초기화 시 실행할 검증
 */
export function initializeProductionValidation(): void {
  console.log('🚀 Initializing Production Validation...', {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    location: typeof window !== 'undefined' ? window.location?.href : 'N/A'
  });
  
  try {
    validateProductionApiConfig();
    console.log('✅ Production validation completed successfully.');
  } catch (error) {
    console.error('❌ Production validation failed:', error);
    throw error;
  }
}
