import { ipcRenderer, contextBridge } from 'electron'

console.log('🚀 Preload script loaded successfully!')

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('IG', {
  clearSession: () => ipcRenderer.invoke('ig:clear-session'),
  disconnectAndReload: () => ipcRenderer.invoke('ig:disconnect-and-reload'),
  onReloadRequest: (cb: () => void) => {
    ipcRenderer.on('ig:reload-webview', cb)
  },
})

// Google Analytics 4 API
contextBridge.exposeInMainWorld('analytics', {
  // 일반 이벤트 추적
  trackEvent: (name: string, params?: Record<string, any>) => 
    ipcRenderer.invoke('ga4:track-event', { name, params }),
  
  // 화면 조회 추적
  trackScreen: (screenName: string, screenClass?: string) => 
    ipcRenderer.invoke('ga4:track-screen', { screenName, screenClass }),
  
  // 에러/예외 추적
  trackError: (error: string, fatal?: boolean) => 
    ipcRenderer.invoke('ga4:track-error', { error, fatal }),
  
  // 사용자 액션 추적
  trackUserAction: (action: string, category?: string, label?: string, value?: number) => 
    ipcRenderer.invoke('ga4:track-user-action', { action, category, label, value })
})

// 자동 업데이트 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 업데이트 체크
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // 업데이트 다운로드
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  
  // 업데이트 설치
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // 업데이트 상태 변경 이벤트 리스너
  onUpdateStatus: (callback: (data: any) => void) => {
    ipcRenderer.on('update-status', (_event, data) => callback(data))
  },
  
  // 업데이트 진행률 이벤트 리스너
  onUpdateProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('update-progress', (_event, data) => callback(data))
  },
  
  // 업데이트 가능 알림
  updateAvailable: (updateResult: any) => {
    ipcRenderer.send('update-available', updateResult)
  },
  
  // API 요청 (Main Process를 통해)
  apiRequest: (method: string, url: string, data?: any, headers?: Record<string, string>) => 
    ipcRenderer.invoke('api-request', { method, url, data, headers }),
  
  // 외부 브라우저로 URL 열기
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
})

console.log('✅ electronAPI exposed to window object')
