import { app, BrowserWindow, ipcMain, session } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

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
let instagramAuthWindow: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true, // Enable webview tag
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
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

// Instagram OAuth IPC handlers
ipcMain.handle('open-instagram-login', async (event, url: string) => {
  if (instagramAuthWindow) {
    instagramAuthWindow.focus()
    return
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
  })

  instagramAuthWindow.once('ready-to-show', () => {
    instagramAuthWindow?.show()
  })

  instagramAuthWindow.on('closed', () => {
    instagramAuthWindow = null
  })

  // Instagram 로그인 성공을 감지하기 위한 URL 변경 리스너
  instagramAuthWindow.webContents.on('did-navigate', (event, navigationUrl) => {
    // Instagram 로그인 성공 후 리다이렉트되는 URL 패턴을 확인
    if (navigationUrl.includes('instagram.com') && !navigationUrl.includes('login')) {
      // 로그인 성공으로 간주
      win?.webContents.send('instagram-login-success', {
        url: navigationUrl,
        cookies: instagramAuthWindow?.webContents.session.cookies.get({})
      })
      instagramAuthWindow?.close()
    }
  })

  await instagramAuthWindow.loadURL(url)
})

ipcMain.handle('close-instagram-login', () => {
  if (instagramAuthWindow) {
    instagramAuthWindow.close()
    instagramAuthWindow = null
  }
})

ipcMain.handle('get-instagram-cookies', async () => {
  if (!instagramAuthWindow) {
    throw new Error('Instagram window not found')
  }

  try {
    // Instagram 창의 쿠키를 가져오기
    const cookies = await instagramAuthWindow.webContents.session.cookies.get({
      domain: '.instagram.com'
    })
    
    // 쿠키를 객체로 변환
    const cookieObject: { [key: string]: string } = {}
    cookies.forEach(cookie => {
      cookieObject[cookie.name] = cookie.value
    })
    
    return cookieObject
  } catch (error) {
    console.error('Error getting Instagram cookies:', error)
    throw error
  }
})

// Clear Instagram cookies and storage (used on disconnect)
ipcMain.handle('clear-instagram-session', async () => {
  try {
    const defaultSession = session.defaultSession

    // Clear cookies for instagram domains
    const cookies = await defaultSession.cookies.get({})
    const targets = cookies.filter(c => c.domain.includes('instagram.com'))
    await Promise.all(
      targets.map(c =>
        defaultSession.cookies.remove(
          `${c.secure ? 'https' : 'http'}://${c.domain.startsWith('.') ? c.domain.substring(1) : c.domain}${c.path}`,
          c.name
        )
      )
    )

    // Clear storage data scoped to Instagram origins
    const clearForOrigins = async (origin: string) => {
      await defaultSession.clearStorageData({
        origin,
        storages: [
          'cookies',
          'localstorage',
          'indexdb',
          'cachestorage',
          'serviceworkers',
          'websql',
          'filesystem',
          'shadercache',
          'appcache'
        ]
      })
    }

    await Promise.all([
      clearForOrigins('https://www.instagram.com'),
      clearForOrigins('https://instagram.com')
    ])

    return { success: true }
  } catch (error) {
    console.error('Failed to clear Instagram session:', error)
    return { success: false, error: String(error) }
  }
})

// Execute JavaScript in Instagram window
ipcMain.handle('execute-instagram-javascript', async (event, script: string) => {
  if (!instagramAuthWindow) {
    throw new Error('Instagram window not found')
  }

  try {
    const result = await instagramAuthWindow.webContents.executeJavaScript(script)
    return result
  } catch (error) {
    console.error('Error executing JavaScript in Instagram window:', error)
    throw error
  }
})

app.whenReady().then(createWindow)
