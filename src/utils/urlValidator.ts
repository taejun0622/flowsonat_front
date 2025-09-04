/**
 * URL 검증 및 파일 프로토콜 방지 유틸리티
 * 파일 프로토콜 이슈를 사전에 방지하고 디버깅을 돕는 함수들
 */

/**
 * HTTP(S) URL인지 검증
 * @param url 검증할 URL
 * @throws Error URL이 HTTP(S)가 아닌 경우
 */
export function assertHttpUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error(`Non-HTTP(S) protocol: ${parsed.protocol}`);
    }
  } catch (error) {
    throw new Error(`Invalid absolute URL: ${url}. Error: ${error}`);
  }
}

/**
 * 파일 프로토콜 URL인지 검증하고 에러 발생
 * @param url 검증할 URL
 * @throws Error 파일 프로토콜 URL인 경우
 */
export function assertNotFileProtocol(url: string): void {
  if (url.startsWith('file://')) {
    console.error('🚨 CRITICAL: File protocol URL detected!', {
      url: url,
      timestamp: new Date().toISOString(),
      willCauseFileProtocolIssue: true
    });
    throw new Error(`Refusing to use file:// URL: ${url}. This will cause file:// protocol issues.`);
  }
}

/**
 * 절대 URL인지 검증
 * @param url 검증할 URL
 * @throws Error 절대 URL이 아닌 경우
 */
export function assertAbsoluteUrl(url: string): void {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('🚨 CRITICAL: Non-absolute URL detected!', {
      url: url,
      timestamp: new Date().toISOString(),
      willCauseFileProtocolIssue: true
    });
    throw new Error(`URL is not absolute: ${url}. This will cause file:// protocol issues.`);
  }
}

/**
 * API URL을 안전하게 생성
 * @param baseUrl 기본 URL (예: https://api.flowsonat.com)
 * @param path 경로 (예: /api/v1/auth/login)
 * @returns 안전한 절대 URL
 */
export function createSafeApiUrl(baseUrl: string, path: string): string {
  // baseUrl 정리
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // path 정리
  const cleanPath = path.replace(/^\//, '');
  
  // URL 조합
  const fullUrl = `${cleanBaseUrl}/${cleanPath}`;
  
  // 검증
  assertAbsoluteUrl(fullUrl);
  assertNotFileProtocol(fullUrl);
  assertHttpUrl(fullUrl);
  
  return fullUrl;
}

/**
 * URL 생성 및 검증을 위한 디버그 정보 출력
 * @param baseUrl 기본 URL
 * @param path 경로
 * @param generatedUrl 생성된 URL
 */
export function logUrlGeneration(baseUrl: string, path: string, generatedUrl: string): void {
  console.log('🔗 URL Generation Debug:', {
    baseUrl: baseUrl,
    path: path,
    generatedUrl: generatedUrl,
    isAbsolute: generatedUrl.startsWith('http'),
    isFileProtocol: generatedUrl.startsWith('file://'),
    timestamp: new Date().toISOString()
  });
}

/**
 * 환경 변수에서 API 베이스 URL을 안전하게 가져오기
 * @param envVar 환경 변수 값
 * @param fallback 기본값
 * @returns 안전한 API 베이스 URL
 */
export function getSafeApiBaseUrl(envVar: string | undefined, fallback: string = 'https://api.flowsonat.com'): string {
  const baseUrl = envVar || fallback;
  
  // 검증
  assertAbsoluteUrl(baseUrl);
  assertNotFileProtocol(baseUrl);
  assertHttpUrl(baseUrl);
  
  console.log('✅ Safe API Base URL:', {
    envVar: envVar,
    fallback: fallback,
    finalBaseUrl: baseUrl,
    timestamp: new Date().toISOString()
  });
  
  return baseUrl;
}
