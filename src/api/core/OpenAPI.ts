/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';
import { getApiBaseUrl, isProduction, isDevelopment } from '@/config/env';
import { electronApiService } from '@/services/electronApiService';

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

// API Base URL 설정
const apiBaseUrl = getApiBaseUrl();

// 항상 로깅 (production에서도 API 호출 문제 디버깅용)
console.log('🔧 API Configuration Debug:', {
    rawEnvVar: import.meta.env.VITE_API_BASE_URL,
    isProd: isProduction(),
    isDev: isDevelopment(),
    mode: import.meta.env.MODE,
    finalApiBaseUrl: apiBaseUrl,
    location: window.location?.href || 'unknown',
    timestamp: new Date().toISOString()
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

// 절대 URL이 아니면 경고
if (!OpenAPI.BASE.startsWith('http')) {
    console.error('🚨 CRITICAL: OpenAPI.BASE is not an absolute URL!', {
        current: OpenAPI.BASE,
        expected: 'https://api.flowsonat.com',
        willCauseFileProtocolIssue: true
    });
}

// 토큰을 동적으로 업데이트하는 함수
export const updateToken = (newToken: string) => {
    OpenAPI.TOKEN = newToken;
};
