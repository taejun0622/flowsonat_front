import { UpdateInfo, UpdateCheckResult, UpdateProgress } from '@/types/update';
import { getAppVersion, getApiBaseUrl } from '@/config/env';
import { VersionService } from '@/api/services/VersionService';
import { VersionResponse } from '@/api/models/VersionResponse';
import { VersionInfo } from '@/api/models/VersionInfo';

const VERSION_CHECK_INTERVAL = 1000 * 60 * 60; // 1시간마다 체크

class UpdateService {
  private currentVersion: string;
  private updateCheckInterval?: NodeJS.Timeout;
  private isChecking = false;

  constructor() {
    // package.json에서 현재 버전 가져오기
    this.currentVersion = getAppVersion();
  }

  /**
   * 서버에서 최신 버전 정보를 가져옵니다
   */
  async fetchLatestVersionInfo(): Promise<UpdateInfo | null> {
    try {
      const response: VersionResponse = await VersionService.getVersionInfoApiV1VersionVersionGet();
      
      if (!response.success || !response.data) {
        const errorMessage = response.error || 'Unknown error';
        console.error('API returned error:', errorMessage);
        throw new Error(`Failed to fetch version info: ${errorMessage}`);
      }
      
      // 캐시 정보 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        if (response.cached) {
          console.log('✅ Version info loaded from cache, expires at:', response.cache_expires_at);
        } else {
          console.log('🔄 Version info fetched fresh from server, cache expires at:', response.cache_expires_at);
        }
        console.log('📦 Latest version:', response.data?.currentVersion, '| Current version:', this.currentVersion);
      }
      
      // API 응답을 UpdateInfo 형식으로 변환
      const versionInfo: VersionInfo = response.data;
      const updateInfo: UpdateInfo = {
        productName: versionInfo.productName,
        currentVersion: versionInfo.currentVersion,
        buildTime: versionInfo.buildTime,
        gitCommit: versionInfo.gitCommit,
        gitBranch: versionInfo.gitBranch,
        downloads: versionInfo.downloads.map(download => ({
          platform: download.platform,
          arch: download.arch,
          version: download.version,
          filename: download.filename,
          url: download.url,
          size: download.size,
          checksum: download.checksum,
          buildTime: download.buildTime
        })),
        updateNotes: versionInfo.updateNotes,
        minSupportedVersion: versionInfo.minSupportedVersion,
        forceUpdate: versionInfo.forceUpdate
      };
      
      return updateInfo;
    } catch (error) {
      console.error('Failed to fetch latest version info:', error);
      
      // 네트워크 에러인지 API 에러인지 구분하여 로깅
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          console.error('Network error while fetching version info');
        } else {
          console.error('API error while fetching version info:', error.message);
        }
      }
      
      return null;
    }
  }

  /**
   * 현재 플랫폼과 아키텍처에 맞는 다운로드 정보를 찾습니다
   */
  private getDownloadInfoForCurrentPlatform(updateInfo: UpdateInfo) {
    const platform = this.getCurrentPlatform();
    const arch = this.getCurrentArchitecture();
    
    return updateInfo.downloads.find(download => 
      download.platform === platform && download.arch === arch
    );
  }

  /**
   * 현재 플랫폼을 반환합니다
   */
  private getCurrentPlatform(): string {
    // Electron 환경에서만 process.platform 사용
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Electron 환경
      if (typeof process !== 'undefined' && process.platform) {
        if (process.platform === 'darwin') return 'Mac';
        if (process.platform === 'win32') return 'Windows';
        if (process.platform === 'linux') return 'Linux';
      }
    }
    
    // 브라우저 환경에서는 userAgent로 판단
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) return 'Mac';
    if (userAgent.includes('win')) return 'Windows';
    if (userAgent.includes('linux')) return 'Linux';
    
    return 'Unknown';
  }

  /**
   * 현재 아키텍처를 반환합니다
   */
  private getCurrentArchitecture(): string {
    // Electron 환경에서만 process.arch 사용
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (typeof process !== 'undefined' && process.arch) {
        if (process.arch === 'x64') return 'x64';
        if (process.arch === 'arm64') return 'arm64';
        if (process.arch === 'ia32') return 'ia32';
      }
    }
    
    // 브라우저 환경에서는 기본값 사용
    return 'x64';
  }

  /**
   * 버전 비교를 수행합니다
   */
  private compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }
    
    return 0;
  }

  /**
   * 업데이트가 필요한지 확인합니다
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    if (this.isChecking) {
      return {
        hasUpdate: false,
        latestVersion: this.currentVersion,
        currentVersion: this.currentVersion,
        updateNotes: '',
        forceUpdate: false,
        isSupported: true
      };
    }

    this.isChecking = true;
    
    try {
      const latestInfo = await this.fetchLatestVersionInfo();
      if (!latestInfo) {
        return {
          hasUpdate: false,
          latestVersion: this.currentVersion,
          currentVersion: this.currentVersion,
          updateNotes: '',
          forceUpdate: false,
          isSupported: true
        };
      }

      const downloadInfo = this.getDownloadInfoForCurrentPlatform(latestInfo);
      const hasUpdate = this.compareVersions(this.currentVersion, latestInfo.currentVersion) < 0;
      const isSupported = this.compareVersions(this.currentVersion, latestInfo.minSupportedVersion) >= 0;

      return {
        hasUpdate,
        latestVersion: latestInfo.currentVersion,
        currentVersion: this.currentVersion,
        updateNotes: latestInfo.updateNotes,
        forceUpdate: latestInfo.forceUpdate,
        downloadUrl: downloadInfo?.url,
        isSupported
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        hasUpdate: false,
        latestVersion: this.currentVersion,
        currentVersion: this.currentVersion,
        updateNotes: '',
        forceUpdate: false,
        isSupported: true
      };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * 자동 업데이트 체크를 시작합니다
   */
  startAutoUpdateCheck(): void {
    // Electron 환경에서만 자동 업데이트 체크 실행
    if (typeof window === 'undefined' || !window.electronAPI) {
      console.log('Auto update check disabled in browser environment');
      return;
    }

    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = setInterval(async () => {
      const updateResult = await this.checkForUpdates();
      
      if (updateResult.hasUpdate || updateResult.forceUpdate || !updateResult.isSupported) {
        // 메인 프로세스에 업데이트 알림 전송
        this.notifyUpdateAvailable(updateResult);
      }
    }, VERSION_CHECK_INTERVAL);

    // 즉시 한 번 체크
    this.checkForUpdates().then(updateResult => {
      if (updateResult.hasUpdate || updateResult.forceUpdate || !updateResult.isSupported) {
        this.notifyUpdateAvailable(updateResult);
      }
    });
  }

  /**
   * 자동 업데이트 체크를 중지합니다
   */
  stopAutoUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = undefined;
    }
  }

  /**
   * 업데이트가 필요할 때 메인 프로세스에 알림을 보냅니다
   */
  private notifyUpdateAvailable(updateResult: UpdateCheckResult): void {
    // Electron의 ipcRenderer를 통해 메인 프로세스에 알림
    if (window.electronAPI && 'updateAvailable' in window.electronAPI) {
      (window.electronAPI as any).updateAvailable(updateResult);
    }
  }

  /**
   * 수동으로 업데이트를 체크합니다
   */
  async manualUpdateCheck(): Promise<UpdateCheckResult> {
    return await this.checkForUpdates();
  }
}

export const updateService = new UpdateService();
export default updateService;
