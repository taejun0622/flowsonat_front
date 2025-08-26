/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IGResponse } from './IGResponse';
import type { StatusEnum } from './StatusEnum';
export type SuggestionResponse = {
    id: string;
    user_id: string;
    ig_id: string;
    status: StatusEnum;
    created_at: string;
    updated_at?: (string | null);
    ig: IGResponse;
};

