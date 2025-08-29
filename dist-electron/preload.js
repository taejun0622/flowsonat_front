import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
contextBridge.exposeInMainWorld("electronAPI", {
  openInstagramLogin: (url) => ipcRenderer.invoke("open-instagram-login", url),
  closeInstagramLogin: () => ipcRenderer.invoke("close-instagram-login"),
  onInstagramLoginSuccess: (callback) => {
    ipcRenderer.on("instagram-login-success", (event, data) => callback(data));
  },
  onInstagramLoginError: (callback) => {
    ipcRenderer.on("instagram-login-error", (event, error) => callback(error));
  },
  getInstagramCookies: () => ipcRenderer.invoke("get-instagram-cookies"),
  clearInstagramSession: () => ipcRenderer.invoke("clear-instagram-session")
});
