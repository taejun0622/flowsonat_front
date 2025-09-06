/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BenchmarkCreate } from '../models/BenchmarkCreate';
import type { BenchmarkListResponse } from '../models/BenchmarkListResponse';
import type { BenchmarkResponse } from '../models/BenchmarkResponse';
import type { BenchmarkUpdate } from '../models/BenchmarkUpdate';
import type { BulkFollowRequest1 } from '../models/BulkFollowRequest1';
import type { BulkFollowRequest2 } from '../models/BulkFollowRequest2';
import type { BulkTargetCreate } from '../models/BulkTargetCreate';
import type { BulkTargetUpdateResponse } from '../models/BulkTargetUpdateResponse';
import type { FollowRequest } from '../models/FollowRequest';
import type { FollowResponse } from '../models/FollowResponse';
import type { HealthEnum } from '../models/HealthEnum';
import type { IGHistoryCreate } from '../models/IGHistoryCreate';
import type { IGHistoryListResponse } from '../models/IGHistoryListResponse';
import type { IGHistoryResponse } from '../models/IGHistoryResponse';
import type { InstagramConnectRequest } from '../models/InstagramConnectRequest';
import type { InstagramConnectResponse } from '../models/InstagramConnectResponse';
import type { InstagramDisconnectResponse } from '../models/InstagramDisconnectResponse';
import type { StageEnum } from '../models/StageEnum';
import type { StatusEnum } from '../models/StatusEnum';
import type { SuggestionCreate } from '../models/SuggestionCreate';
import type { SuggestionListResponse } from '../models/SuggestionListResponse';
import type { SuggestionResponse } from '../models/SuggestionResponse';
import type { TargetCreate } from '../models/TargetCreate';
import type { TargetListResponse } from '../models/TargetListResponse';
import type { TargetResponse } from '../models/TargetResponse';
import type { TargetUpdate } from '../models/TargetUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InstagramService {
    /**
     * Create Follow Relationship
     * Create a follow relationship between two Instagram accounts
     * @param requestBody
     * @returns FollowResponse Successful Response
     * @throws ApiError
     */
    public static createFollowRelationshipApiV1InstagramFollowPost(
        requestBody: FollowRequest,
    ): CancelablePromise<FollowResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/follow',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Follow Relationship
     * Delete a follow relationship between two Instagram accounts
     * @param followerUsername Username of the follower
     * @param followingUsername Username being followed
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteFollowRelationshipApiV1InstagramFollowDelete(
        followerUsername: string,
        followingUsername: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/instagram/follow',
            query: {
                'follower_username': followerUsername,
                'following_username': followingUsername,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Bulk Target Stages Followers
     * Update target stages when multiple followers follow one account
     * @param requestBody
     * @returns BulkTargetUpdateResponse Successful Response
     * @throws ApiError
     */
    public static updateBulkTargetStagesFollowersApiV1InstagramFollowBulkFollowersPost(
        requestBody: BulkFollowRequest1,
    ): CancelablePromise<BulkTargetUpdateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/follow/bulk/followers',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Bulk Target Stages Following
     * Update target stages when one follower follows multiple accounts
     * @param requestBody
     * @returns BulkTargetUpdateResponse Successful Response
     * @throws ApiError
     */
    public static updateBulkTargetStagesFollowingApiV1InstagramFollowBulkFollowingPost(
        requestBody: BulkFollowRequest2,
    ): CancelablePromise<BulkTargetUpdateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/follow/bulk/following',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Followers
     * Get all followers of a specific Instagram account
     * @param username
     * @returns FollowResponse Successful Response
     * @throws ApiError
     */
    public static getFollowersApiV1InstagramFollowersUsernameGet(
        username: string,
    ): CancelablePromise<Array<FollowResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/followers/{username}',
            path: {
                'username': username,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Following
     * Get all accounts that a specific Instagram account is following
     * @param username
     * @returns FollowResponse Successful Response
     * @throws ApiError
     */
    public static getFollowingApiV1InstagramFollowingUsernameGet(
        username: string,
    ): CancelablePromise<Array<FollowResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/following/{username}',
            path: {
                'username': username,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Check Follow Relationship
     * Check if a follow relationship exists between two Instagram accounts
     * @param followerUsername Username of the follower
     * @param followingUsername Username being followed
     * @returns any Successful Response
     * @throws ApiError
     */
    public static checkFollowRelationshipApiV1InstagramFollowCheckGet(
        followerUsername: string,
        followingUsername: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/follow/check',
            query: {
                'follower_username': followerUsername,
                'following_username': followingUsername,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Instagram Account
     * Get user's connected Instagram account
     * @returns InstagramConnectResponse Successful Response
     * @throws ApiError
     */
    public static getMyInstagramAccountApiV1InstagramMeGet(): CancelablePromise<InstagramConnectResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/me',
        });
    }
    /**
     * Update Instagram Account
     * Update user's Instagram account connection
     * @param requestBody
     * @returns InstagramConnectResponse Successful Response
     * @throws ApiError
     */
    public static updateInstagramAccountApiV1InstagramMePut(
        requestBody: InstagramConnectRequest,
    ): CancelablePromise<InstagramConnectResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/instagram/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Connect Instagram Account
     * Connect user's Instagram account
     * @param requestBody
     * @returns InstagramConnectResponse Successful Response
     * @throws ApiError
     */
    public static connectInstagramAccountApiV1InstagramMePost(
        requestBody: InstagramConnectRequest,
    ): CancelablePromise<InstagramConnectResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Disconnect Instagram Account
     * Disconnect user's Instagram account
     * @returns InstagramDisconnectResponse Successful Response
     * @throws ApiError
     */
    public static disconnectInstagramAccountApiV1InstagramMeDelete(): CancelablePromise<InstagramDisconnectResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/instagram/me',
        });
    }
    /**
     * Create Benchmark
     * Create a new benchmark
     * @param requestBody
     * @returns BenchmarkResponse Successful Response
     * @throws ApiError
     */
    public static createBenchmarkApiV1InstagramBenchmarksPost(
        requestBody: BenchmarkCreate,
    ): CancelablePromise<BenchmarkResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/benchmarks',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Benchmarks
     * Get benchmarks for the current user with optional filters
     * @param health Filter by health status
     * @param status Filter by status
     * @returns BenchmarkListResponse Successful Response
     * @throws ApiError
     */
    public static getBenchmarksApiV1InstagramBenchmarksGet(
        health?: (HealthEnum | null),
        status?: (StatusEnum | null),
    ): CancelablePromise<BenchmarkListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/benchmarks',
            query: {
                'health': health,
                'status': status,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Benchmark
     * Update a benchmark
     * @param benchmarkId
     * @param requestBody
     * @returns BenchmarkResponse Successful Response
     * @throws ApiError
     */
    public static updateBenchmarkApiV1InstagramBenchmarksBenchmarkIdPut(
        benchmarkId: string,
        requestBody: BenchmarkUpdate,
    ): CancelablePromise<BenchmarkResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/instagram/benchmarks/{benchmark_id}',
            path: {
                'benchmark_id': benchmarkId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Benchmark
     * Delete a benchmark (soft delete)
     * @param benchmarkId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBenchmarkApiV1InstagramBenchmarksBenchmarkIdDelete(
        benchmarkId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/instagram/benchmarks/{benchmark_id}',
            path: {
                'benchmark_id': benchmarkId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Target
     * Create a new target for a benchmark
     * @param benchmarkId
     * @param requestBody
     * @returns TargetResponse Successful Response
     * @throws ApiError
     */
    public static createTargetApiV1InstagramBenchmarksBenchmarkIdTargetsPost(
        benchmarkId: string,
        requestBody: TargetCreate,
    ): CancelablePromise<TargetResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/benchmarks/{benchmark_id}/targets',
            path: {
                'benchmark_id': benchmarkId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Targets
     * Get targets for a benchmark with optional filters
     * @param benchmarkId
     * @param stage Filter by stage
     * @param status Filter by status
     * @returns TargetListResponse Successful Response
     * @throws ApiError
     */
    public static getTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsGet(
        benchmarkId: string,
        stage?: (StageEnum | null),
        status?: (StatusEnum | null),
    ): CancelablePromise<TargetListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/benchmarks/{benchmark_id}/targets',
            path: {
                'benchmark_id': benchmarkId,
            },
            query: {
                'stage': stage,
                'status': status,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Bulk Targets
     * Create multiple targets for a benchmark in bulk
     * @param benchmarkId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createBulkTargetsApiV1InstagramBenchmarksBenchmarkIdTargetsBulkPost(
        benchmarkId: string,
        requestBody: BulkTargetCreate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/benchmarks/{benchmark_id}/targets/bulk',
            path: {
                'benchmark_id': benchmarkId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Target
     * Update a target
     * @param targetId
     * @param requestBody
     * @returns TargetResponse Successful Response
     * @throws ApiError
     */
    public static updateTargetApiV1InstagramTargetsTargetIdPut(
        targetId: string,
        requestBody: TargetUpdate,
    ): CancelablePromise<TargetResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/instagram/targets/{target_id}',
            path: {
                'target_id': targetId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Target
     * Delete a target (soft delete)
     * @param targetId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteTargetApiV1InstagramTargetsTargetIdDelete(
        targetId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/instagram/targets/{target_id}',
            path: {
                'target_id': targetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Targets By Username
     * Get targets for a benchmark by Instagram username with optional filters
     * @param igUsername
     * @param stage Filter by stage
     * @param status Filter by status
     * @returns TargetListResponse Successful Response
     * @throws ApiError
     */
    public static getTargetsByUsernameApiV1InstagramBenchmarksUsernameIgUsernameTargetsGet(
        igUsername: string,
        stage?: (StageEnum | null),
        status?: (StatusEnum | null),
    ): CancelablePromise<TargetListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/benchmarks/username/{ig_username}/targets',
            path: {
                'ig_username': igUsername,
            },
            query: {
                'stage': stage,
                'status': status,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Suggestions
     * Get suggestions for the current user
     * @returns SuggestionListResponse Successful Response
     * @throws ApiError
     */
    public static getSuggestionsApiV1InstagramSuggestionsGet(): CancelablePromise<SuggestionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/suggestions',
        });
    }
    /**
     * Create Suggestion
     * Create a new suggestion
     * @param requestBody
     * @returns SuggestionResponse Successful Response
     * @throws ApiError
     */
    public static createSuggestionApiV1InstagramSuggestionsPost(
        requestBody: SuggestionCreate,
    ): CancelablePromise<SuggestionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/suggestions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Suggestion
     * Delete a suggestion (soft delete)
     * @param suggestionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteSuggestionApiV1InstagramSuggestionsSuggestionIdDelete(
        suggestionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/instagram/suggestions/{suggestion_id}',
            path: {
                'suggestion_id': suggestionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create History
     * Create a new history record for an IG account
     * @param username
     * @param requestBody
     * @returns IGHistoryResponse Successful Response
     * @throws ApiError
     */
    public static createHistoryApiV1InstagramHistoryUsernamePost(
        username: string,
        requestBody: IGHistoryCreate,
    ): CancelablePromise<IGHistoryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/history/{username}',
            path: {
                'username': username,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get History By Username
     * Get history records for an IG account by username
     * @param username
     * @returns IGHistoryListResponse Successful Response
     * @throws ApiError
     */
    public static getHistoryByUsernameApiV1InstagramHistoryUsernameGet(
        username: string,
    ): CancelablePromise<IGHistoryListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instagram/history/{username}',
            path: {
                'username': username,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync Follow Table With Targets
     * Synchronize all targets for the current user with the Follow table
     * @returns any Successful Response
     * @throws ApiError
     */
    public static syncFollowTableWithTargetsApiV1InstagramSyncFollowTablePost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/instagram/sync-follow-table',
        });
    }
}
