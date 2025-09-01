import { app, BrowserWindow, ipcMain, webContents, session } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true, // Enable webview tag
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 임시로 CORS 우회
      allowRunningInsecureContent: true // 임시로 허용
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Auto-open DevTools in development
    win.webContents.openDevTools({ mode: 'undocked' })
    // If a <webview> is attached, open its DevTools as well
    win.webContents.on('did-attach-webview', (_event, webContents) => {
      try {
        webContents.openDevTools({ mode: 'detach' })
      } catch {/* no-op */}
    })
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// When installing the app, create a shortcut on the desktop.
// Only run on Windows where electron-squirrel-startup is available
if (process.platform === 'win32') {
  try {
    if (require('electron-squirrel-startup')) {
      app.quit()
    }
  } catch (error) {
    // electron-squirrel-startup not available, continue normally
  }
}

app.whenReady().then(() => {
  createWindow()

  /** 인스타 도메인 한정 전체 정리 */
  async function clearInstagramData(partition = 'persist:ig') {
    const sess = session.fromPartition(partition)

    // 1) origin 기반 스토리지/캐시류 삭제 (확장된 목록)
    await sess.clearStorageData({
      origins: [
        'https://www.instagram.com',
        'https://instagram.com',
        'https://m.instagram.com',
        'https://i.instagram.com',
        'https://static.cdninstagram.com',
      ],
      storages: [
        'cookies',
        'localstorage',
        'indexdb',
        'serviceworkers',
        'cachestorage',
        'websql',
        'filesystem',
      ],
      quotas: ['temporary', 'syncable'],
    })

    // 2) 도메인 기반 쿠키 완전 삭제 (.instagram.com 하위 모두)
    const cookies = await sess.cookies.get({ domain: '.instagram.com' })
    const removalPromises = cookies
      .filter(c => !!c.domain && !!c.path)
      .map(c => {
        const protocol = c.secure ? 'https' : 'http'
        const domain = (c.domain as string).replace(/^\./, '')
        const path = c.path as string
        return sess.cookies.remove(`${protocol}://${domain}${path}`, c.name)
      })
    await Promise.all(removalPromises)

    // 3) 인증 캐시(HTTP auth)도 정리
    await sess.clearAuthCache()

    // 4) 변경사항이 디스크에 기록되도록 강제
    await sess.cookies.flushStore()
    await sess.clearCache()
  }

  /** Renderer 요청: 인스타 세션 삭제 */
  ipcMain.handle('ig:clear-session', async () => {
    await clearInstagramData('persist:ig')
    return true
  })

  /** Renderer 요청: 인스타 세션 삭제 및 리로드 */
  ipcMain.handle('ig:disconnect-and-reload', async () => {
    await clearInstagramData('persist:ig')
    if (win) {
      win.webContents.send('ig:reload-webview')
    }
    return true
  })
})
