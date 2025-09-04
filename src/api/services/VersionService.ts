/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VersionResponse } from '../models/VersionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VersionService {
    /**
     * Get Version Info
     * Get FlowSonat version information.
     *
     * Fetches version data from the external CDN with 10-minute caching.
     * Returns cached data if available and not expired.
     * @returns VersionResponse Successful Response
     * @throws ApiError
     */
    public static getVersionInfoApiV1VersionVersionGet(): CancelablePromise<VersionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/version/version',
        });
    }
    /**
     * Clear Version Cache
     * Clear the version cache (for testing or manual cache invalidation).
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clearVersionCacheApiV1VersionVersionClearCachePost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/version/version/clear-cache',
        });
    }
}
