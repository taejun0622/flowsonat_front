import { ipcRenderer, contextBridge } from 'electron'

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

// Instagram API
contextBridge.exposeInMainWorld('electronAPI', {
  openInstagramLogin: (url: string) => ipcRenderer.invoke('open-instagram-login', url),
  closeInstagramLogin: () => ipcRenderer.invoke('close-instagram-login'),
  onInstagramLoginSuccess: (callback: (data: any) => void) => {
    ipcRenderer.on('instagram-login-success', (event, data) => callback(data))
  },
  onInstagramLoginError: (callback: (error: string) => void) => {
    ipcRenderer.on('instagram-login-error', (event, error) => callback(error))
  },
  getInstagramCookies: () => ipcRenderer.invoke('get-instagram-cookies')
})
