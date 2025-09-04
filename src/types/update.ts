export interface UpdateInfo {
  productName: string;
  currentVersion: string;
  buildTime: string;
  gitCommit: string;
  gitBranch: string;
  downloads: DownloadInfo[];
  updateNotes: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
}

export interface DownloadInfo {
  platform: string;
  arch: string;
  version: string;
  filename: string;
  url: string;
  size: number;
  checksum: string;
  buildTime: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  updateNotes: string;
  forceUpdate: boolean;
  downloadUrl?: string;
  isSupported: boolean;
}

export interface UpdateProgress {
  progress: number;
  speed: number;
  eta: number;
  status: 'checking' | 'downloading' | 'installing' | 'complete' | 'error' | 'downloaded';
  message: string;
}
