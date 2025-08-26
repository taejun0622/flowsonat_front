/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailQuotaResponse } from '../models/EmailQuotaResponse';
import type { EmailResponse } from '../models/EmailResponse';
import type { EmailSend } from '../models/EmailSend';
import type { EmailTemplate } from '../models/EmailTemplate';
import type { EmailVerificationRequest } from '../models/EmailVerificationRequest';
import type { PasswordResetEmailRequest } from '../models/PasswordResetEmailRequest';
import type { WelcomeEmailRequest } from '../models/WelcomeEmailRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmailService {
    /**
     * Send Email
     * 일반 이메일 발송
     * @param requestBody
     * @returns EmailResponse Successful Response
     * @throws ApiError
     */
    public static sendEmailApiV1EmailSendPost(
        requestBody: EmailSend,
    ): CancelablePromise<EmailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/email/send',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Send Template Email
     * 템플릿을 사용한 이메일 발송
     * @param requestBody
     * @returns EmailResponse Successful Response
     * @throws ApiError
     */
    public static sendTemplateEmailApiV1EmailTemplatePost(
        requestBody: EmailTemplate,
    ): CancelablePromise<EmailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/email/template',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Send Welcome Email
     * 환영 이메일 발송
     * @param requestBody
     * @returns EmailResponse Successful Response
     * @throws ApiError
     */
    public static sendWelcomeEmailApiV1EmailWelcomePost(
        requestBody: WelcomeEmailRequest,
    ): CancelablePromise<EmailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/email/welcome',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Send Password Reset Email
     * 비밀번호 재설정 이메일 발송
     * @param requestBody
     * @returns EmailResponse Successful Response
     * @throws ApiError
     */
    public static sendPasswordResetEmailApiV1EmailPasswordResetPost(
        requestBody: PasswordResetEmailRequest,
    ): CancelablePromise<EmailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/email/password-reset',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Verify Email Identity
     * 이메일 주소 검증 (SES에서 사용하기 전에 필요)
     * @param requestBody
     * @returns EmailResponse Successful Response
     * @throws ApiError
     */
    public static verifyEmailIdentityApiV1EmailVerifyPost(
        requestBody: EmailVerificationRequest,
    ): CancelablePromise<EmailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/email/verify',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Email Quota
     * SES 발송 할당량 조회
     * @returns EmailQuotaResponse Successful Response
     * @throws ApiError
     */
    public static getEmailQuotaApiV1EmailQuotaGet(): CancelablePromise<EmailQuotaResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/email/quota',
        });
    }
    /**
     * Email Health Check
     * 이메일 서비스 상태 확인
     * @returns any Successful Response
     * @throws ApiError
     */
    public static emailHealthCheckApiV1EmailHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/email/health',
        });
    }
}
