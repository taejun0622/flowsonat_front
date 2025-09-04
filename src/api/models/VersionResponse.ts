/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VersionInfo } from './VersionInfo';
export type VersionResponse = {
    success: boolean;
    data?: (VersionInfo | null);
    error?: (string | null);
    cached?: boolean;
    cache_expires_at?: (string | null);
};

