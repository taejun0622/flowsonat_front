/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DownloadInfo } from './DownloadInfo';
export type VersionInfo = {
    productName: string;
    currentVersion: string;
    buildTime: string;
    gitCommit: string;
    gitBranch: string;
    downloads: Array<DownloadInfo>;
    updateNotes: string;
    minSupportedVersion: string;
    forceUpdate: boolean;
};

