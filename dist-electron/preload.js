import { contextBridge as i, ipcRenderer as r } from "electron";
i.exposeInMainWorld("ipcRenderer", {
  on(...n) {
    const [o, e] = n;
    return r.on(o, (t, ...s) => e(t, ...s));
  },
  off(...n) {
    const [o, ...e] = n;
    return r.off(o, ...e);
  },
  send(...n) {
    const [o, ...e] = n;
    return r.send(o, ...e);
  },
  invoke(...n) {
    const [o, ...e] = n;
    return r.invoke(o, ...e);
  }
  // You can expose other APTs you need here.
  // ...
});
i.exposeInMainWorld("electronAPI", {
  openInstagramLogin: (n) => r.invoke("open-instagram-login", n),
  closeInstagramLogin: () => r.invoke("close-instagram-login"),
  onInstagramLoginSuccess: (n) => {
    r.on("instagram-login-success", (o, e) => n(e));
  },
  onInstagramLoginError: (n) => {
    r.on("instagram-login-error", (o, e) => n(e));
  },
  getInstagramCookies: () => r.invoke("get-instagram-cookies")
});
