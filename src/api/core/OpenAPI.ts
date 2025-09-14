/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';
import { getApiBaseUrl, isProduction, isDevelopment } from '@/config/env';
import { electronApiService } from '@/services/electronApiService';
import { getSafeApiBaseUrl, assertAbsoluteUrl, assertNotFileProtocol } from '@/utils/urlValidator';

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;
type Headers = Record<string, string>;

export type OpenAPIConfig = {
    BASE: string;
    VERSION: string;
    WITH_CREDENTIALS: boolean;
    CREDENTIALS: 'include' | 'omit' | 'same-origin';
    TOKEN?: string | Resolver<string> | undefined;
    USERNAME?: string | Resolver<string> | undefined;
    PASSWORD?: string | Resolver<string> | undefined;
    HEADERS?: Headers | Resolver<Headers> | undefined;
    ENCODE_PATH?: ((path: string) => string) | undefined;
};

// API Base URL 설정 - 안전한 검증과 함께
// 프로덕션에서는 환경 변수가 없을 경우 기본값 사용
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const fallbackUrl = 'https://api.flowsonat.com';
const apiBaseUrl = getSafeApiBaseUrl(envApiUrl, fallbackUrl);

// 항상 로깅 (production에서도 API 호출 문제 디버깅용)
console.log('🔧 API Configuration Debug:', {
    rawEnvVar: envApiUrl,
    fallbackUrl: fallbackUrl,
    finalApiBaseUrl: apiBaseUrl,
    usedFallback: !envApiUrl,
    isProd: isProduction(),
    isDev: isDevelopment(),
    mode: import.meta.env.MODE,
    location: window.location?.href || 'unknown',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    allEnvVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
});

// OpenAPI BASE 설정 확인
console.log('📡 OpenAPI BASE will be set to:', apiBaseUrl);

export const OpenAPI: OpenAPIConfig = {
    BASE: apiBaseUrl,
    VERSION: '1.0.0',
    WITH_CREDENTIALS: true,
    CREDENTIALS: 'include',
    TOKEN: async () => {
        const token = localStorage.getItem('access_token');
        return token || '';
    },
    USERNAME: undefined,
    PASSWORD: undefined,
    HEADERS: undefined,
    ENCODE_PATH: undefined,
};

// 런타임에서 OpenAPI.BASE 검증
console.log('✅ OpenAPI Configuration Final Check:', {
    BASE: OpenAPI.BASE,
    isAbsoluteURL: OpenAPI.BASE.startsWith('http'),
    hasCorrectProtocol: OpenAPI.BASE.startsWith('https://') || OpenAPI.BASE.startsWith('http://'),
    expectedURL: 'https://api.flowsonat.com',
    matches: OpenAPI.BASE === 'https://api.flowsonat.com'
});

// 최종 검증 - 절대 URL 및 파일 프로토콜 방지
try {
    assertAbsoluteUrl(OpenAPI.BASE);
    assertNotFileProtocol(OpenAPI.BASE);
    console.log('✅ OpenAPI.BASE validation passed:', OpenAPI.BASE);
} catch (error) {
    console.error('🚨 CRITICAL: OpenAPI.BASE validation failed!', {
        current: OpenAPI.BASE,
        expected: 'https://api.flowsonat.com',
        error: error,
        willCauseFileProtocolIssue: true
    });
    throw error;
}

// 토큰을 동적으로 업데이트하는 함수
export const updateToken = (newToken: string | null) => {
    if (newToken) {
        OpenAPI.TOKEN = newToken;
    } else {
        // 토큰이 null일 경우, 다시 localStorage에서 토큰을 가져오도록 설정
        OpenAPI.TOKEN = async () => {
            const token = localStorage.getItem('access_token');
            return token || '';
        };
    }
};
