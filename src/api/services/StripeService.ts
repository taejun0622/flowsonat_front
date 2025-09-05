/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomerPortalResponse } from '../models/CustomerPortalResponse';
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
     * Create Customer Portal Session
     * Create Stripe Customer Portal session for subscription management
     * @returns CustomerPortalResponse Successful Response
     * @throws ApiError
     */
    public static createCustomerPortalSessionApiV1StripeCustomerPortalPost(): CancelablePromise<CustomerPortalResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/customer-portal',
        });
    }
    /**
     * Sync Subscriptions
     * Sync all subscriptions from Stripe API to local database
     * @param limit
     * @returns any Successful Response
     * @throws ApiError
     */
    public static syncSubscriptionsApiV1StripeSyncSubscriptionsPost(
        limit: number = 100,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/sync/subscriptions',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync Specific Subscription
     * Sync a specific subscription from Stripe API
     * @param subscriptionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static syncSpecificSubscriptionApiV1StripeSyncSubscriptionSubscriptionIdPost(
        subscriptionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stripe/sync/subscription/{subscription_id}',
            path: {
                'subscription_id': subscriptionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Sync Status
     * Get sync status comparing local and Stripe data
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSyncStatusApiV1StripeSyncStatusGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/stripe/sync/status',
        });
    }
}
