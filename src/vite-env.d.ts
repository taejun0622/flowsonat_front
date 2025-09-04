/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_STRIPE_PRICE_ID?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  readonly VITE_STRIPE_PRODUCT_ID?: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API 타입 정의
declare global {
  interface Window {
    electronAPI?: {
      checkForUpdates: () => Promise<any>
      downloadUpdate: () => Promise<any>
      installUpdate: () => Promise<any>
      onUpdateStatus: (callback: (data: any) => void) => void
      onUpdateProgress: (callback: (data: any) => void) => void
      updateAvailable: (updateResult: any) => void
      apiRequest: (method: string, url: string, data?: any, headers?: Record<string, string>) => Promise<any>
    }
    ipcRenderer?: {
      on(channel: string, func: (...args: any[]) => void): void
      off(channel: string, func: (...args: any[]) => void): void
      send(channel: string, ...args: any[]): void
      invoke(channel: string, ...args: any[]): Promise<any>
    }
    IG?: {
      clearSession: () => Promise<void>
      disconnectAndReload: () => Promise<void>
      onReloadRequest: (cb: () => void) => void
    }
  }
}
