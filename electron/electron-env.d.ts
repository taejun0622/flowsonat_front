/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  IG: {
    clearSession: () => Promise<boolean>
    disconnectAndReload: () => Promise<boolean>
    onReloadRequest: (cb: () => void) => void
  }
  analytics: {
    trackEvent: (name: string, params?: Record<string, any>) => Promise<{ success: boolean }>
    trackScreen: (screenName: string, screenClass?: string) => Promise<{ success: boolean }>
    trackError: (error: string, fatal?: boolean) => Promise<{ success: boolean }>
    trackUserAction: (action: string, category?: string, label?: string, value?: number) => Promise<{ success: boolean }>
  }
  electronAPI: {
    checkForUpdates: () => Promise<any>
    downloadUpdate: () => Promise<any>
    installUpdate: () => Promise<{ success: boolean }>
    onUpdateStatus: (callback: (data: any) => void) => void
    onUpdateProgress: (callback: (data: any) => void) => void
    updateAvailable: (updateResult: any) => void
    apiRequest: (method: string, url: string, data?: any, headers?: Record<string, string>) => Promise<any>
    openExternal: (url: string) => Promise<{ success: boolean }>
  }
}
