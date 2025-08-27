/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailVerification } from '../models/EmailVerification';
import type { PasswordReset } from '../models/PasswordReset';
import type { PasswordResetConfirm } from '../models/PasswordResetConfirm';
import type { Token } from '../models/Token';
import type { User } from '../models/User';
import type { UserCreate } from '../models/UserCreate';
import type { UserLogin } from '../models/UserLogin';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Register
     * Register new user
     * @param requestBody
     * @returns User Successful Response
     * @throws ApiError
     */
    public static registerApiV1AuthRegisterPost(
        requestBody: UserCreate,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Login
     * Login user and get tokens
     * @param requestBody
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static loginApiV1AuthLoginPost(
        requestBody: UserLogin,
    ): CancelablePromise<Token> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Refresh Token
     * Refresh access token using refresh token
     * @param refreshToken
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static refreshTokenApiV1AuthRefreshPost(
        refreshToken: string,
    ): CancelablePromise<Token> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/refresh',
            query: {
                'refresh_token': refreshToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Request Password Reset
     * Request password reset
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static requestPasswordResetApiV1AuthPasswordResetPost(
        requestBody: PasswordReset,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/password-reset',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Confirm Password Reset
     * Confirm password reset with verification code
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static confirmPasswordResetApiV1AuthPasswordResetConfirmPost(
        requestBody: PasswordResetConfirm,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/password-reset/confirm',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Verify Email
     * Verify email with verification code
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static verifyEmailApiV1AuthEmailVerificationPost(
        requestBody: EmailVerification,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/email-verification',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Resend Verification Code
     * Resend email verification code
     * @param email
     * @returns any Successful Response
     * @throws ApiError
     */
    public static resendVerificationCodeApiV1AuthResendVerificationPost(
        email: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/resend-verification',
            query: {
                'email': email,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Resend Password Reset Code
     * Resend password reset code
     * @param email
     * @returns any Successful Response
     * @throws ApiError
     */
    public static resendPasswordResetCodeApiV1AuthResendPasswordResetPost(
        email: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/resend-password-reset',
            query: {
                'email': email,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Current User Info
     * Get current user information
     * @returns User Successful Response
     * @throws ApiError
     */
    public static getCurrentUserInfoApiV1AuthMeGet(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/me',
        });
    }
    /**
     * Logout
     * Logout user (client should discard tokens)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static logoutApiV1AuthLogoutPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/logout',
        });
    }
}
