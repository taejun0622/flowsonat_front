/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';

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

// 환경변수 디버깅 및 프로덕션 URL 설정
const getApiBaseUrl = () => {
    // 환경 변수가 설정되어 있으면 사용
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    
    // 프로덕션 환경에서는 https://api.flowsonat.com 사용
    if (import.meta.env.PROD) {
        return 'https://api.flowsonat.com';
    }
    
    // 개발 환경에서는 localhost 사용
    return 'http://localhost:8000';
};

const apiBaseUrl = getApiBaseUrl();
console.log('🔧 API Base URL:', {
    env: import.meta.env.VITE_API_BASE_URL,
    isProd: import.meta.env.PROD,
    final: apiBaseUrl
});

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
