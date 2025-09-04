/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API 타입 정의
declare global {
  interface Window {
    electronAPI: {
      checkForUpdates: () => Promise<any>
      downloadUpdate: () => Promise<any>
      installUpdate: () => Promise<any>
      onUpdateStatus: (callback: (data: any) => void) => void
      onUpdateProgress: (callback: (data: any) => void) => void
      updateAvailable: (updateResult: any) => void
    }
    ipcRenderer: {
      on(channel: string, func: (...args: any[]) => void): void
      off(channel: string, func: (...args: any[]) => void): void
      send(channel: string, ...args: any[]): void
      invoke(channel: string, ...args: any[]): Promise<any>
    }
    IG: {
      clearSession: () => Promise<void>
      disconnectAndReload: () => Promise<void>
      onReloadRequest: (cb: () => void) => void
    }
  }
}
