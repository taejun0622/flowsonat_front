/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TestService {
    /**
     * Test Error
     * Test endpoint to trigger a 500 error for testing Slack notifications
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testErrorApiV1TestTestErrorGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test/test-error',
        });
    }
    /**
     * Test Exception
     * Test endpoint to trigger an unhandled exception for testing Slack notifications
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testExceptionApiV1TestTestExceptionGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test/test-exception',
        });
    }
    /**
     * Test Validation Error
     * Test endpoint to trigger validation errors
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testValidationErrorApiV1TestTestValidationErrorPost(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/test/test-validation-error',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Test Success
     * Test endpoint that always succeeds
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testSuccessApiV1TestTestSuccessGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/test/test-success',
        });
    }
}
