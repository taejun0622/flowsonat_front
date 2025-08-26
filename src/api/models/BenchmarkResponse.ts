/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthEnum } from './HealthEnum';
import type { IGResponse } from './IGResponse';
import type { StatusEnum } from './StatusEnum';
export type BenchmarkResponse = {
    health?: HealthEnum;
    id: string;
    user_id: string;
    ig_id: string;
    status: StatusEnum;
    created_at: string;
    updated_at?: (string | null);
    ig: IGResponse;
};

