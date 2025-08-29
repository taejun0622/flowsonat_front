import { app as c, BrowserWindow as m, ipcMain as l, session as p } from "electron";
import { createRequire as h } from "node:module";
import { fileURLToPath as f } from "node:url";
import t from "node:path";
h(import.meta.url);
const w = t.dirname(f(import.meta.url));
process.env.APP_ROOT = t.join(w, "..");
const d = process.env.VITE_DEV_SERVER_URL, _ = t.join(process.env.APP_ROOT, "dist-electron"), g = t.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = d ? t.join(process.env.APP_ROOT, "public") : g;
let s, e;
function u() {
  s = new m({
    icon: t.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: t.join(w, "preload.mjs"),
      webviewTag: !0,
      // Enable webview tag
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !0,
      allowRunningInsecureContent: !1
    }
  }), s.webContents.on("did-finish-load", () => {
    s?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), d ? s.loadURL(d) : s.loadFile(t.join(g, "index.html"));
}
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (c.quit(), s = null);
});
c.on("activate", () => {
  m.getAllWindows().length === 0 && u();
});
l.handle("open-instagram-login", async (o, a) => {
  if (e) {
    e.focus();
    return;
  }
  e = new m({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !0,
      allowRunningInsecureContent: !1
    },
    parent: s,
    modal: !0,
    show: !1
  }), e.once("ready-to-show", () => {
    e?.show();
  }), e.on("closed", () => {
    e = null;
  }), e.webContents.on("did-navigate", (i, r) => {
    r.includes("instagram.com") && !r.includes("login") && (s?.webContents.send("instagram-login-success", {
      url: r,
      cookies: e?.webContents.session.cookies.get({})
    }), e?.close());
  }), await e.loadURL(a);
});
l.handle("close-instagram-login", () => {
  e && (e.close(), e = null);
});
l.handle("get-instagram-cookies", async () => {
  if (!e)
    throw new Error("Instagram window not found");
  try {
    const o = await e.webContents.session.cookies.get({
      domain: ".instagram.com"
    }), a = {};
    return o.forEach((i) => {
      a[i.name] = i.value;
    }), a;
  } catch (o) {
    throw console.error("Error getting Instagram cookies:", o), o;
  }
});
l.handle("clear-instagram-session", async () => {
  try {
    const o = p.defaultSession, i = (await o.cookies.get({})).filter((n) => n.domain.includes("instagram.com"));
    await Promise.all(
      i.map(
        (n) => o.cookies.remove(
          `${n.secure ? "https" : "http"}://${n.domain.startsWith(".") ? n.domain.substring(1) : n.domain}${n.path}`,
          n.name
        )
      )
    );
    const r = async (n) => {
      await o.clearStorageData({
        origin: n,
        storages: [
          "cookies",
          "localstorage",
          "indexdb",
          "cachestorage",
          "serviceworkers",
          "websql",
          "filesystem",
          "shadercache",
          "appcache"
        ]
      });
    };
    return await Promise.all([
      r("https://www.instagram.com"),
      r("https://instagram.com")
    ]), { success: !0 };
  } catch (o) {
    return console.error("Failed to clear Instagram session:", o), { success: !1, error: String(o) };
  }
});
c.whenReady().then(u);
export {
  _ as MAIN_DIST,
  g as RENDERER_DIST,
  d as VITE_DEV_SERVER_URL
};
