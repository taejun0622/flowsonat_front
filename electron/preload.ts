import { ipcRenderer, contextBridge, shell } from 'electron'

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
  }
})
