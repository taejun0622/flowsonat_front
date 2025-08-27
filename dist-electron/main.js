import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let instagramAuthWindow;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      webviewTag: true,
      // Enable webview tag
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("open-instagram-login", async (event, url) => {
  if (instagramAuthWindow) {
    instagramAuthWindow.focus();
    return;
  }
  instagramAuthWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    parent: win,
    modal: true,
    show: false
  });
  instagramAuthWindow.once("ready-to-show", () => {
    instagramAuthWindow?.show();
  });
  instagramAuthWindow.on("closed", () => {
    instagramAuthWindow = null;
  });
  instagramAuthWindow.webContents.on("did-navigate", (event2, navigationUrl) => {
    if (navigationUrl.includes("instagram.com") && !navigationUrl.includes("login")) {
      win?.webContents.send("instagram-login-success", {
        url: navigationUrl,
        cookies: instagramAuthWindow?.webContents.session.cookies.get({})
      });
      instagramAuthWindow?.close();
    }
  });
  await instagramAuthWindow.loadURL(url);
});
ipcMain.handle("close-instagram-login", () => {
  if (instagramAuthWindow) {
    instagramAuthWindow.close();
    instagramAuthWindow = null;
  }
});
ipcMain.handle("get-instagram-cookies", async () => {
  if (!instagramAuthWindow) {
    throw new Error("Instagram window not found");
  }
  try {
    const cookies = await instagramAuthWindow.webContents.session.cookies.get({
      domain: ".instagram.com"
    });
    const cookieObject = {};
    cookies.forEach((cookie) => {
      cookieObject[cookie.name] = cookie.value;
    });
    return cookieObject;
  } catch (error) {
    console.error("Error getting Instagram cookies:", error);
    throw error;
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
