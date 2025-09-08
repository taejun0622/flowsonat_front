import { app, BrowserWindow, ipcMain, session, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { ga4Service } from './ga-service'

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

// Auto-update configuration
autoUpdater.autoDownload = false; // Disable auto-download (require user confirmation)
autoUpdater.autoInstallOnAppQuit = true; // Auto-install on app quit

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, // Enable webview tag
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false, // Disable insecure content
      experimentalFeatures: false
    },
    // 개발 환경에서만 DevTools 자동 열기
    show: false, // 창을 먼저 숨김
  })

  // 창이 준비되면 표시
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // 개발 환경에서만 DevTools 열기 (에러 로그 줄이기 위해)
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools({ mode: 'undocked' })
    }
    // If a <webview> is attached, open its DevTools as well
    win.webContents.on('did-attach-webview', (_event, webContents) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          webContents.openDevTools({ mode: 'detach' })
        }
      } catch {/* no-op */}
    })
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Auto-update event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
  win?.webContents.send('update-status', { status: 'checking', message: 'Checking for updates...' });
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  win?.webContents.send('update-status', { 
    status: 'available', 
    message: 'A new update is available.',
    info 
  });
  
  // Ask user to confirm update download
  dialog.showMessageBox(win!, {
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. Would you like to download it?',
    detail: `Current version: ${app.getVersion()}\nLatest version: ${info.version}`,
    buttons: ['Download', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('Update not available');
  win?.webContents.send('update-status', { 
    status: 'not-available', 
    message: 'You are using the latest version.' 
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress:', progressObj);
  win?.webContents.send('update-progress', {
    status: 'downloading',
    progress: progressObj.percent,
    speed: progressObj.bytesPerSecond,
    eta: 0, // ProgressInfo doesn't have eta property
    message: `Downloading... ${Math.round(progressObj.percent)}%`
  });
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  win?.webContents.send('update-status', { 
    status: 'downloaded', 
    message: 'Update downloaded. Will be installed on restart.',
    info 
  });
  
  // Ask user to restart now
  dialog.showMessageBox(win!, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update has been downloaded. Would you like to restart now?',
    detail: 'If you don\'t restart now, the update will be installed automatically on next app launch.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('AutoUpdater error:', err);
  win?.webContents.send('update-status', { 
    status: 'error', 
    message: `Update error: ${err.message}` 
  });
  // GA4 에러 추적
  ga4Service.trackError(`AutoUpdater: ${err.message}`, false).catch(console.error)
});

// IPC handlers - Handle update requests from renderer process
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    console.error('Error checking for updates:', error);
    throw error;
  }
});

ipcMain.handle('download-update', async () => {
  try {
    const result = await autoUpdater.downloadUpdate();
    return result;
  } catch (error) {
    console.error('Error downloading update:', error);
    throw error;
  }
});

ipcMain.handle('install-update', async () => {
  try {
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error) {
    console.error('Error installing update:', error);
    throw error;
  }
});

// GA4 Analytics handlers
ipcMain.handle('ga4:track-event', async (event, { name, params = {} }) => {
  try {
    await ga4Service.trackEvent(name, params)
    return { success: true }
  } catch (error) {
    console.error('GA4 track event error:', error)
    throw error
  }
})

ipcMain.handle('ga4:track-screen', async (event, { screenName, screenClass }) => {
  try {
    await ga4Service.trackScreenView(screenName, screenClass)
    return { success: true }
  } catch (error) {
    console.error('GA4 track screen error:', error)
    throw error
  }
})

ipcMain.handle('ga4:track-error', async (event, { error, fatal = false }) => {
  try {
    await ga4Service.trackError(error, fatal)
    return { success: true }
  } catch (error) {
    console.error('GA4 track error failed:', error)
    throw error
  }
})

ipcMain.handle('ga4:track-user-action', async (event, { action, category, label, value }) => {
  try {
    await ga4Service.trackUserAction(action, category, label, value)
    return { success: true }
  } catch (error) {
    console.error('GA4 track user action error:', error)
    throw error
  }
})

// API request handler - Handle API requests from renderer process
ipcMain.handle('api-request', async (event, { method, url, data, headers = {} }) => {
  try {
    // 프로덕션 환경에서 안전한 API 베이스 URL 설정
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? (process.env.VITE_API_BASE_URL || 'https://test.api.flowsonat.com')
      : 'https://api.flowsonat.com';
    
    // URL 정리 및 검증
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanUrl = url.replace(/^\//, '');
    const fullUrl = `${cleanBaseUrl}/${cleanUrl}`;
    
    // URL 검증 - 절대 URL이 아니면 에러
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      console.error('🚨 CRITICAL: Generated URL is not absolute!', {
        baseUrl: cleanBaseUrl,
        url: url,
        fullUrl: fullUrl,
        willCauseFileProtocolIssue: true
      });
      throw new Error(`Generated URL is not absolute: ${fullUrl}. This will cause file:// protocol issues.`);
    }
    
    // 윈도우에서 fetch API의 인코딩 문제를 해결하기 위해 Node.js https 모듈 사용
    const https = require('https');
    const { URL } = require('url');
    
    const urlObj = new URL(fullUrl);
    const requestBody = data && (method === 'POST' || method === 'PUT' || method === 'PATCH') 
      ? (typeof data === 'string' ? data : JSON.stringify(data))
      : undefined;

    console.log(`[API Request] ${method} ${fullUrl}`, {
      data: data ? { 
        data, 
        dataType: typeof data,
        isString: typeof data === 'string',
        stringified: typeof data === 'string' ? data : JSON.stringify(data),
        requestBody: requestBody
      } : '',
      headers: headers,
      timestamp: new Date().toISOString()
    });

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
    };

    if (requestBody) {
      options.headers['Content-Length'] = Buffer.byteLength(requestBody, 'utf8');
    }

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          let parsedData;
          
          try {
            parsedData = JSON.parse(responseData);
          } catch {
            parsedData = responseData;
          }

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[API Response] ${method} ${fullUrl}`, {
              status: res.statusCode,
              data: parsedData,
              timestamp: new Date().toISOString()
            });
            
            resolve({
              data: parsedData,
              status: res.statusCode,
              statusText: res.statusMessage || 'OK'
            });
          } else {
            const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage || 'Unknown Error'}`);
            (error as any).status = res.statusCode;
            (error as any).data = parsedData;
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`[API Error] ${method} ${url}:`, {
          error: error,
          timestamp: new Date().toISOString()
        });
        reject(error);
      });

      if (requestBody) {
        req.write(requestBody, 'utf8');
      }
      
      req.end();
    });
  } catch (error) {
    console.error(`[API Error] ${method} ${url}:`, {
      error: error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
});


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

// Global error handlers for main process
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception in main process:', error)
  try {
    await ga4Service.trackError(error, true)
  } catch (trackError) {
    console.error('Failed to track uncaught exception:', trackError)
  }
  // 치명적 에러이므로 앱을 종료해야 할 수도 있음
  // process.exit(1)
})

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection in main process:', reason, 'from', promise)
  try {
    const errorMessage = typeof reason === 'string' ? reason : 
                        reason instanceof Error ? reason.message : 
                        String(reason)
    await ga4Service.trackError(`Unhandled Rejection: ${errorMessage}`, false)
  } catch (trackError) {
    console.error('Failed to track unhandled rejection:', trackError)
  }
})

app.whenReady().then(() => {
  // GA4 서비스 초기화
  const measurementId = process.env.VITE_GA4_MEASUREMENT_ID
  const apiSecret = process.env.VITE_GA4_API_SECRET
  const isDev = process.env.NODE_ENV === 'development'
  
  if (measurementId && apiSecret) {
    ga4Service.initialize(measurementId, apiSecret, isDev)
    // 앱 시작 이벤트 추적
    ga4Service.trackAppStart().catch(console.error)
  } else {
    console.warn('GA4 environment variables not found')
  }

  // CORS 헤더 설정
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'Access-Control-Allow-Headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
        'Access-Control-Allow-Credentials': ['true']
      }
    })
  })

  createWindow()

  /** Clear Instagram domain-specific data */
  async function clearInstagramData(partition = 'persist:ig') {
    const sess = session.fromPartition(partition)

    // 1) Delete origin-based storage/cache
    await sess.clearStorageData({
      origin: 'https://www.instagram.com',
      storages: [
        'cookies',
        'localstorage',
        'indexdb',
        'serviceworkers',
        'cachestorage',
        'websql',
        'filesystem',
      ],
      quotas: ['temporary'],
    })

    // 2) Clear all cookies
    try {
      const cookies = await sess.cookies.get({})
      for (const cookie of cookies) {
        const cookieUrl = `https://${cookie.domain}${cookie.path}`
        await sess.cookies.remove(cookieUrl, cookie.name)
      }
      console.log('Cleared all cookies')
    } catch (error) {
      console.error('Failed to clear cookies:', error)
    }

    // 3) Clear auth cache (HTTP auth)
    await sess.clearAuthCache()

    // 4) Force changes to be written to disk
    await sess.cookies.flushStore()
    await sess.clearCache()
  }

  /** Renderer request: Clear Instagram session */
  ipcMain.handle('ig:clear-session', async () => {
    await clearInstagramData('persist:ig')
    return true
  })

  /** Renderer request: Clear Instagram session and reload */
  ipcMain.handle('ig:disconnect-and-reload', async () => {
    await clearInstagramData('persist:ig')
    if (win) {
      win.webContents.send('ig:reload-webview')
    }
    return true
  })

  // Check for updates on app start (only when not in development mode)
  if (!VITE_DEV_SERVER_URL) {
    // Wait a bit after app is ready before checking for updates
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
})
