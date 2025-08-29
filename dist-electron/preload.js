import { contextBridge as s, ipcRenderer as o } from "electron";
s.exposeInMainWorld("ipcRenderer", {
  on(...n) {
    const [r, e] = n;
    return o.on(r, (i, ...a) => e(i, ...a));
  },
  off(...n) {
    const [r, ...e] = n;
    return o.off(r, ...e);
  },
  send(...n) {
    const [r, ...e] = n;
    return o.send(r, ...e);
  },
  invoke(...n) {
    const [r, ...e] = n;
    return o.invoke(r, ...e);
  }
  // You can expose other APTs you need here.
  // ...
});
s.exposeInMainWorld("electronAPI", {
  openInstagramLogin: (n) => o.invoke("open-instagram-login", n),
  closeInstagramLogin: () => o.invoke("close-instagram-login"),
  onInstagramLoginSuccess: (n) => {
    o.on("instagram-login-success", (r, e) => n(e));
  },
  onInstagramLoginError: (n) => {
    o.on("instagram-login-error", (r, e) => n(e));
  },
  getInstagramCookies: () => o.invoke("get-instagram-cookies"),
  clearInstagramSession: () => o.invoke("clear-instagram-session")
});
