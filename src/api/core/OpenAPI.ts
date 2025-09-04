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

// 개발 환경에서만 로깅
if (isDevelopment()) {
    console.log('🔧 API Base URL:', {
        env: import.meta.env.VITE_API_BASE_URL,
        isProd: isProduction(),
        final: apiBaseUrl
    });
}

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

// 토큰을 동적으로 업데이트하는 함수
export const updateToken = (newToken: string) => {
    OpenAPI.TOKEN = newToken;
};
