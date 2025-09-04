/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiError } from './ApiError';
import type { ApiRequestOptions } from './ApiRequestOptions';
import type { ApiResult } from './ApiResult';
import { CancelablePromise } from './CancelablePromise';
import type { OnCancel } from './CancelablePromise';
import type { OpenAPIConfig } from './OpenAPI';
import { apiInterceptor } from './apiInterceptor';
import { electronApiService } from '@/services/electronApiService';

export const isDefined = <T>(value: T | null | undefined): value is Exclude<T, null | undefined> => {
    return value !== undefined && value !== null;
};

export const isString = (value: any): value is string => {
    return typeof value === 'string';
};

export const isStringWithValue = (value: any): value is string => {
    return isString(value) && value !== '';
};

export const isBlob = (value: any): value is Blob => {
    return (
        typeof value === 'object' &&
        typeof value.type === 'string' &&
        typeof value.stream === 'function' &&
        typeof value.arrayBuffer === 'function' &&
        typeof value.constructor === 'function' &&
        typeof value.constructor.name === 'string' &&
        /^(Blob|File)$/.test(value.constructor.name) &&
        /^(Blob|File)$/.test(value[Symbol.toStringTag])
    );
};

export const isFormData = (value: any): value is FormData => {
    return value instanceof FormData;
};

export const base64 = (str: string): string => {
    try {
        return btoa(str);
    } catch (err) {
        // @ts-ignore
        return Buffer.from(str).toString('base64');
    }
};

export const getQueryString = (params: Record<string, any>): string => {
    const qs: string[] = [];

    const append = (key: string, value: any) => {
        qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    };

    const process = (key: string, value: any) => {
        if (isDefined(value)) {
            if (Array.isArray(value)) {
                value.forEach(v => {
                    process(key, v);
                });
            } else if (typeof value === 'object') {
                Object.entries(value).forEach(([k, v]) => {
                    process(`${key}[${k}]`, v);
                });
            } else {
                append(key, value);
            }
        }
    };

    Object.entries(params).forEach(([key, value]) => {
        process(key, value);
    });

    if (qs.length > 0) {
        return `?${qs.join('&')}`;
    }

    return '';
};

const getUrl = (config: OpenAPIConfig, options: ApiRequestOptions): string => {
    const encoder = config.ENCODE_PATH || encodeURI;

    const path = options.url
        .replace('{api-version}', config.VERSION)
        .replace(/{(.*?)}/g, (substring: string, group: string) => {
            if (options.path?.hasOwnProperty(group)) {
                return encoder(String(options.path[group]));
            }
            return substring;
        });

    const url = `${config.BASE}${path}`;
    if (options.query) {
        return `${url}${getQueryString(options.query)}`;
    }
    return url;
};

export const getFormData = (options: ApiRequestOptions): FormData | undefined => {
    if (options.formData) {
        const formData = new FormData();

        const process = (key: string, value: any) => {
            if (isString(value) || isBlob(value)) {
                formData.append(key, value);
            } else {
                formData.append(key, JSON.stringify(value));
            }
        };

        Object.entries(options.formData)
            .filter(([_, value]) => isDefined(value))
            .forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => process(key, v));
                } else {
                    process(key, value);
                }
            });

        return formData;
    }
    return undefined;
};

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;

export const resolve = async <T>(options: ApiRequestOptions, resolver?: T | Resolver<T>): Promise<T | undefined> => {
    if (typeof resolver === 'function') {
        return (resolver as Resolver<T>)(options);
    }
    return resolver;
};

export const getHeaders = async (config: OpenAPIConfig, options: ApiRequestOptions): Promise<Headers> => {
    const [token, username, password, additionalHeaders] = await Promise.all([
        resolve(options, config.TOKEN),
        resolve(options, config.USERNAME),
        resolve(options, config.PASSWORD),
        resolve(options, config.HEADERS),
    ]);

    const headers = Object.entries({
        Accept: 'application/json',
        ...additionalHeaders,
        ...options.headers,
    })
        .filter(([_, value]) => isDefined(value))
        .reduce((headers, [key, value]) => ({
            ...headers,
            [key]: String(value),
        }), {} as Record<string, string>);

    if (isStringWithValue(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (isStringWithValue(username) && isStringWithValue(password)) {
        const credentials = base64(`${username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    if (options.body !== undefined) {
        if (options.mediaType) {
            headers['Content-Type'] = options.mediaType;
        } else if (isBlob(options.body)) {
            headers['Content-Type'] = options.body.type || 'application/octet-stream';
        } else if (isString(options.body)) {
            headers['Content-Type'] = 'text/plain';
        } else if (!isFormData(options.body)) {
            headers['Content-Type'] = 'application/json';
        }
    }

    return new Headers(headers);
};

export const getRequestBody = (options: ApiRequestOptions): any => {
    if (options.body !== undefined) {
        if (options.mediaType?.includes('/json')) {
            return JSON.stringify(options.body)
        } else if (isString(options.body) || isBlob(options.body) || isFormData(options.body)) {
            return options.body;
        } else {
            return JSON.stringify(options.body);
        }
    }
    return undefined;
};

export const sendRequest = async (
    config: OpenAPIConfig,
    options: ApiRequestOptions,
    url: string,
    body: any,
    formData: FormData | undefined,
    headers: Headers,
    onCancel: OnCancel
): Promise<Response> => {
    // Electron 환경인지 확인
    const isElectron = typeof window !== 'undefined' && 
                      window.electronAPI && 
                      typeof window.electronAPI.apiRequest === 'function';
    
    
    if (isElectron) {
        // Electron 환경: Main Process를 통해 요청
        const controller = new AbortController();
        onCancel(() => controller.abort());

        try {
            // URL에서 base URL 제거 (Electron API 서비스에서 자동으로 추가됨)
            const apiUrl = url.replace(config.BASE, '');
            
            // Headers를 일반 객체로 변환
            const headersObj: Record<string, string> = {};
            headers.forEach((value, key) => {
                headersObj[key] = value;
            });

            const response = await electronApiService.request({
                method: options.method as any,
                url: apiUrl,
                data: body,
                headers: headersObj
            });

            // Response 객체와 유사한 구조로 변환
            return {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                statusText: response.statusText,
                headers: new Headers(),
                json: async () => response.data,
                text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
                blob: async () => new Blob([JSON.stringify(response.data)]),
                arrayBuffer: async () => new ArrayBuffer(0),
                formData: async () => new FormData(),
                clone: () => ({ ...response } as any),
                body: null,
                bodyUsed: false,
                url: url,
                type: 'basic' as ResponseType,
                redirected: false,
                signal: controller.signal
            } as Response;
        } catch (error: any) {
            // 에러를 Response 형태로 변환
            const status = error.status || 500;
            const statusText = error.statusText || 'Internal Server Error';
            
            return {
                ok: false,
                status,
                statusText,
                headers: new Headers(),
                json: async () => error.data || error.message,
                text: async () => typeof error.data === 'string' ? error.data : JSON.stringify(error.data || error.message),
                blob: async () => new Blob([JSON.stringify(error.data || error.message)]),
                arrayBuffer: async () => new ArrayBuffer(0),
                formData: async () => new FormData(),
                clone: () => ({ ...error } as any),
                body: null,
                bodyUsed: false,
                url: url,
                type: 'basic' as ResponseType,
                redirected: false,
                signal: controller.signal
            } as Response;
        }
    } else {
        // 웹 환경: 기존 fetch 사용
        const controller = new AbortController();

        const request: RequestInit = {
            headers,
            body: body ?? formData,
            method: options.method,
            signal: controller.signal,
        };

        if (config.WITH_CREDENTIALS) {
            request.credentials = config.CREDENTIALS;
        }

        onCancel(() => controller.abort());

        return await fetch(url, request);
    }
};

export const getResponseHeader = (response: Response, responseHeader?: string): string | undefined => {
    if (responseHeader) {
        const content = response.headers.get(responseHeader);
        if (isString(content)) {
            return content;
        }
    }
    return undefined;
};

export const getResponseBody = async (response: Response): Promise<any> => {
    if (response.status !== 204) {
        try {
            const contentType = response.headers.get('Content-Type');
            if (contentType) {
                const jsonTypes = ['application/json', 'application/problem+json']
                const isJSON = jsonTypes.some(type => contentType.toLowerCase().startsWith(type));
                if (isJSON) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    return undefined;
};

export const catchErrorCodes = (options: ApiRequestOptions, result: ApiResult): void => {
    const errors: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        ...options.errors,
    }

    const error = errors[result.status];
    if (error) {
        throw new ApiError(options, result, error);
    }

    if (!result.ok) {
        const errorStatus = result.status ?? 'unknown';
        const errorStatusText = result.statusText ?? 'unknown';
        const errorBody = (() => {
            try {
                return JSON.stringify(result.body, null, 2);
            } catch (e) {
                return undefined;
            }
        })();

        throw new ApiError(options, result,
            `Generic Error: status: ${errorStatus}; status text: ${errorStatusText}; body: ${errorBody}`
        );
    }
};

/**
 * Request method
 * @param config The OpenAPI configuration object
 * @param options The request options from the service
 * @returns CancelablePromise<T>
 * @throws ApiError
 */
export const request = <T>(config: OpenAPIConfig, options: ApiRequestOptions): CancelablePromise<T> => {
    return new CancelablePromise(async (resolve, reject, onCancel) => {
        try {
            const url = getUrl(config, options);
            const formData = getFormData(options);
            const body = getRequestBody(options);
            const headers = await getHeaders(config, options);

            if (!onCancel.isCancelled) {
                const response = await sendRequest(config, options, url, body, formData, headers, onCancel);
                const responseBody = await getResponseBody(response);
                const responseHeader = getResponseHeader(response, options.responseHeader);

                const result: ApiResult = {
                    url,
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    body: responseHeader ?? responseBody,
                };

                try {
                    catchErrorCodes(options, result);
                    resolve(result.body);
                } catch (error) {
                    // Check if this is an auth endpoint
                    const isAuthEndpoint = [
                        '/api/v1/auth/login',
                        '/api/v1/auth/register',
                        '/api/v1/auth/refresh',
                        '/api/v1/auth/password-reset',
                        '/api/v1/auth/password-reset/confirm',
                        '/api/v1/auth/email-verification',
                        '/api/v1/auth/resend-verification',
                        '/api/v1/auth/resend-password-reset'
                    ].some(endpoint => url.includes(endpoint));

                    // For auth endpoints, don't try to refresh tokens
                    if (isAuthEndpoint) {
                        reject(error);
                        return;
                    }

                    // 401 에러 처리 및 자동 토큰 갱신 (non-auth endpoints only)
                    if (error instanceof ApiError && error.status === 401) {
                        try {
                            const retryRequest = async () => {
                                const retryHeaders = await getHeaders(config, options);
                                const retryResponse = await sendRequest(config, options, url, body, formData, retryHeaders, onCancel);
                                const retryResponseBody = await getResponseBody(retryResponse);
                                const retryResponseHeader = getResponseHeader(retryResponse, options.responseHeader);

                                const retryResult: ApiResult = {
                                    url,
                                    ok: retryResponse.ok,
                                    status: retryResponse.status,
                                    statusText: retryResponse.statusText,
                                    body: retryResponseHeader ?? retryResponseBody,
                                };

                                catchErrorCodes(options, retryResult);
                                return retryResult.body;
                            };

                            const result = await apiInterceptor.handleApiError(error, retryRequest);
                            resolve(result);
                        } catch (interceptorError) {
                            reject(interceptorError);
                        }
                    } else {
                        reject(error);
                    }
                }
            }
        } catch (error) {
            reject(error);
        }
    });
};
