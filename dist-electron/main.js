import { app as i, BrowserWindow as l, ipcMain as d } from "electron";
import { createRequire as g } from "node:module";
import { fileURLToPath as p } from "node:url";
import o from "node:path";
g(import.meta.url);
const w = o.dirname(p(import.meta.url));
process.env.APP_ROOT = o.join(w, "..");
const c = process.env.VITE_DEV_SERVER_URL, E = o.join(process.env.APP_ROOT, "dist-electron"), m = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = c ? o.join(process.env.APP_ROOT, "public") : m;
let n, e;
function u() {
  n = new l({
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(w, "preload.mjs"),
      webviewTag: !0,
      // Enable webview tag
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !0,
      allowRunningInsecureContent: !1
    }
  }), n.webContents.on("did-finish-load", () => {
    n?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), c ? n.loadURL(c) : n.loadFile(o.join(m, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), n = null);
});
i.on("activate", () => {
  l.getAllWindows().length === 0 && u();
});
d.handle("open-instagram-login", async (t, s) => {
  if (e) {
    e.focus();
    return;
  }
  e = new l({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !0,
      allowRunningInsecureContent: !1
    },
    parent: n,
    modal: !0,
    show: !1
  }), e.once("ready-to-show", () => {
    e?.show();
  }), e.on("closed", () => {
    e = null;
  }), e.webContents.on("did-navigate", (r, a) => {
    a.includes("instagram.com") && !a.includes("login") && (n?.webContents.send("instagram-login-success", {
      url: a,
      cookies: e?.webContents.session.cookies.get({})
    }), e?.close());
  }), await e.loadURL(s);
});
d.handle("close-instagram-login", () => {
  e && (e.close(), e = null);
});
d.handle("get-instagram-cookies", async () => {
  if (!e)
    throw new Error("Instagram window not found");
  try {
    const t = await e.webContents.session.cookies.get({
      domain: ".instagram.com"
    }), s = {};
    return t.forEach((r) => {
      s[r.name] = r.value;
    }), s;
  } catch (t) {
    throw console.error("Error getting Instagram cookies:", t), t;
  }
});
i.whenReady().then(u);
export {
  E as MAIN_DIST,
  m as RENDERER_DIST,
  c as VITE_DEV_SERVER_URL
};
