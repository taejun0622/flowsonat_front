/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TargetResponse } from './TargetResponse';
export type TargetBulkUpdateResponse = {
    updated_targets: Array<TargetResponse>;
    failed_updates: Array<Record<string, any>>;
    total_updated: number;
    total_failed: number;
};

