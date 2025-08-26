/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentLinkResponse } from '../models/PaymentLinkResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StripeService {
    /**
     * Create Payment Link
     * Create payment link for subscription
     * @param priceId
     * @returns PaymentLinkResponse Successful Response
     * @throws ApiError
     */
    public static createPaymentLinkApiV1StripePaymentLinkPost(
        priceId: string,
    ): CancelablePromise<PaymentLinkResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/payment-link',
            query: {
                'price_id': priceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stripe Webhook
     * Handle Stripe webhook events
     * @returns any Successful Response
     * @throws ApiError
     */
    public static stripeWebhookApiV1StripeWebhookPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/webhook',
        });
    }
    /**
     * Get User Subscription
     * Get current user's subscription
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getUserSubscriptionApiV1StripeSubscriptionGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/stripe/subscription',
        });
    }
    /**
     * Cancel Subscription
     * Cancel current user's subscription
     * @returns any Successful Response
     * @throws ApiError
     */
    public static cancelSubscriptionApiV1StripeSubscriptionCancelPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/subscription/cancel',
        });
    }
}
