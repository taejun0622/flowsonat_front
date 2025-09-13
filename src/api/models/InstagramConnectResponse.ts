/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusEnum } from './StatusEnum';
export type InstagramConnectResponse = {
    id: string;
    username: string;
    ig_user_id?: (string | null);
    cookies?: (Record<string, any> | null);
    status: StatusEnum;
    created_at: string;
    updated_at?: (string | null);
};

