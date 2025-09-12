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

// Track update state
let updateInfo: any = null;
let isUpdateAvailable = false;

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
      experimentalFeatures: false,
      // 메모리 최적화 설정
      v8CacheOptions: 'code',
      backgroundThrottling: false,
      // 메모리 제한 설정
      partition: 'persist:main',
      // 이미지 최적화
      imageAnimationPolicy: 'animateOnce',
      // 스크립트 최적화
      enableRemoteModule: false,
      // 메모리 누수 방지
      offscreen: false
    },
    // 개발 환경에서만 DevTools 자동 열기
    show: false, // 창을 먼저 숨김
  })

  // 창이 준비되면 표시
  win.once('ready-to-show', () => {
    win?.show()
  })

  // 메모리 모니터링 및 정리
  const memoryMonitor = setInterval(() => {
    if (win && !win.isDestroyed()) {
      const memInfo = process.memoryUsage()
      console.log('Memory Usage:', {
        rss: Math.round(memInfo.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memInfo.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memInfo.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memInfo.external / 1024 / 1024) + ' MB'
      })
      
      // 메모리 사용량이 500MB를 초과하면 가비지 컬렉션 강제 실행
      if (memInfo.heapUsed > 500 * 1024 * 1024) {
        console.warn('High memory usage detected, forcing garbage collection')
        if (global.gc) {
          global.gc()
        }
        // WebView 메모리 정리
        win.webContents.executeJavaScript(`
          if (window.gc) {
            window.gc();
          }
        `).catch(() => {})
      }
    }
  }, 30000) // 30초마다 체크

  // 창이 닫힐 때 메모리 모니터링 정리
  win.on('closed', () => {
    clearInterval(memoryMonitor)
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
        
        // WebView 메모리 최적화 설정
        webContents.on('did-finish-load', () => {
          // WebView에서 불필요한 기능 비활성화
          webContents.executeJavaScript(`
            // 이미지 지연 로딩 비활성화
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              if (img.loading === 'lazy') {
                img.loading = 'eager';
              }
            });
            
            // 불필요한 이벤트 리스너 정리
            window.addEventListener('beforeunload', () => {
              // 메모리 정리
              if (window.gc) {
                window.gc();
              }
            });
          `).catch(() => {})
        })
        
        // WebView 메모리 누수 방지
        webContents.on('crashed', () => {
          console.warn('WebView crashed, attempting to recover')
        })
        webContents.on('unresponsive', () => {
          console.warn('WebView became unresponsive')
        })
        webContents.on('render-process-gone', (_e, details) => {
          console.error('WebView render-process-gone:', details)
          win?.webContents.send('ig:webview-gone', details)
        })
        webContents.on('child-process-gone', (_e, details) => {
          console.error('WebView child-process-gone:', details)
        })
        
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
  updateInfo = info;
  isUpdateAvailable = true;
  
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
  updateInfo = null;
  isUpdateAvailable = false;
  
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
  
  // Handle specific error types
  let errorMessage = `Update error: ${err.message}`;
  if (err.message.includes('403') || err.message.includes('Access Denied')) {
    errorMessage = 'Update server access denied. Please check your internet connection or try again later.';
  } else if (err.message.includes('404') || err.message.includes('Not Found')) {
    errorMessage = 'Update information not found. This may be a new release.';
  } else if (err.message.includes('network') || err.message.includes('timeout')) {
    errorMessage = 'Network error while checking for updates. Please check your internet connection.';
  }
  
  win?.webContents.send('update-status', { 
    status: 'error', 
    message: errorMessage,
    error: err.message 
  });
  // GA4 에러 추적
  ga4Service.trackError(`AutoUpdater: ${err.message}`, false).catch(console.error)
});

// IPC handlers - Handle update requests from renderer process
ipcMain.handle('check-for-updates', async () => {
  try {
    console.log('Checking for updates...');
    const result = await autoUpdater.checkForUpdates();
    console.log('Update check completed:', result);
    return result;
  } catch (error) {
    console.error('Error checking for updates:', error);
    
    // Provide more detailed error information
    const errorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code || 'UNKNOWN',
      statusCode: (error as any)?.statusCode || null,
      url: (error as any)?.url || null
    };
    
    console.error('Detailed error info:', errorInfo);
    throw error;
  }
});

ipcMain.handle('download-update', async () => {
  try {
    // Check if an update is available before attempting to download
    if (!isUpdateAvailable || !updateInfo) {
      // Try to check for updates first as a fallback
      console.log('No update available, checking for updates first...');
      try {
        await autoUpdater.checkForUpdates();
        // Wait a moment for the update-available event to fire
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isUpdateAvailable || !updateInfo) {
          throw new Error('No update available after checking');
        }
      } catch (checkError) {
        console.error('Failed to check for updates:', checkError);
        throw new Error('Please check update first');
      }
    }
    
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

// Get current update status
ipcMain.handle('get-update-status', async () => {
  return {
    isUpdateAvailable,
    updateInfo,
    currentVersion: app.getVersion()
  };
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

// 메모리 관리 IPC 핸들러
ipcMain.handle('cleanup-webview-memory', async () => {
  try {
    console.log('🧹 Cleaning up WebView memory...');
    
    // 모든 WebView의 메모리 정리
    if (win && win.webContents) {
      await win.webContents.executeJavaScript(`
        // WebView 내부 메모리 정리
        if (window.gc) {
          window.gc();
        }
        
        // 이미지 캐시 정리
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (img.src && img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
          }
        });
        
        // 불필요한 이벤트 리스너 정리
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el._eventListeners) {
            el._eventListeners.forEach(({ event, handler }) => {
              el.removeEventListener(event, handler);
            });
            delete el._eventListeners;
          }
        });
        
        return 'Memory cleanup completed';
      `);
    }
    
    // 메인 프로세스 가비지 컬렉션
    if (global.gc) {
      global.gc();
    }
    
    return { success: true, message: 'Memory cleanup completed' };
  } catch (error) {
    console.error('Memory cleanup failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-memory-usage', async () => {
  try {
    const memInfo = process.memoryUsage();
    return {
      rss: Math.round(memInfo.rss / 1024 / 1024),
      heapUsed: Math.round(memInfo.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memInfo.heapTotal / 1024 / 1024),
      external: Math.round(memInfo.external / 1024 / 1024),
      arrayBuffers: Math.round(memInfo.arrayBuffers / 1024 / 1024),
    };
  } catch (error) {
    console.error('Failed to get memory usage:', error);
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
  // 메모리 제한 설정 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    // V8 메모리 제한 설정 (기본값: 1.4GB, 개발용으로 1GB로 제한)
    process.env.NODE_OPTIONS = '--max-old-space-size=1024'
    console.log('Development mode: Memory limit set to 1GB')
  }
  
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

  // Log main window render process issues
  win?.webContents.on('render-process-gone', (_e, details) => {
    console.error('Renderer render-process-gone:', details)
  })
  win?.webContents.on('child-process-gone', (_e, details) => {
    console.error('Renderer child-process-gone:', details)
  })

  /** Clear Instagram domain-specific data - COMPLETE NUCLEAR OPTION */
  async function clearInstagramData(partition = 'persist:ig') {
    console.log(`🧹 Starting complete Instagram data cleanup for partition: ${partition}`)
    const sess = session.fromPartition(partition)

    try {
      // Helper to normalize cookie removal URL
      const buildCookieRemovalUrl = (cookie: Electron.Cookie) => {
        const secure = cookie.secure ? 'https://' : 'http://'
        const domain = (cookie.domain || '').replace(/^\./, '') || 'instagram.com'
        const path = cookie.path || '/'
        return `${secure}${domain}${path}`
      }

      const igOrigins = [
        'https://www.instagram.com',
        'https://instagram.com',
        'https://i.instagram.com',
        'https://static.cdninstagram.com',
        'https://edge-chat.instagram.com',
      ]

      // 1) Delete origin-based storage/cache (Instagram specific)
      console.log('🗑️ Clearing Instagram-specific storage data...')
      for (const origin of igOrigins) {
        try {
          await sess.clearStorageData({
            origin,
            storages: [
              'cookies',
              'localstorage',
              'indexdb',
              'serviceworkers',
              'cachestorage',
              'websql',
              'filesystem',
            ],
            quotas: ['temporary', 'persistent'],
          })
          console.log(`  ✅ Cleared storage for ${origin}`)
        } catch (e) {
          console.warn(`  ⚠️ Failed clearing storage for ${origin}:`, e)
        }
      }

      // 2) Clear ALL cookies (not just Instagram)
      console.log('🍪 Clearing ALL cookies...')
      try {
        const cookies = await sess.cookies.get({})
        console.log(`Found ${cookies.length} cookies to clear`)
        
        for (const cookie of cookies) {
          try {
            const url = buildCookieRemovalUrl(cookie)
            await sess.cookies.remove(url, cookie.name)
            console.log(`Removed cookie: ${cookie.name} (${url})`)
          } catch (cookieError) {
            console.warn(`Failed to remove cookie ${cookie.name}:`, cookieError)
          }
        }
        console.log('✅ All cookies cleared')
      } catch (error) {
        console.error('❌ Failed to clear cookies:', error)
      }

      // 3) Clear auth cache (HTTP auth)
      console.log('🔐 Clearing auth cache...')
      await sess.clearAuthCache()

      // 4) Clear ALL storage data (nuclear option)
      console.log('💥 Clearing ALL storage data (nuclear option)...')
      await sess.clearStorageData({
        storages: [
          'cookies',
          'localstorage',
          'indexdb',
          'serviceworkers',
          'cachestorage',
          'websql',
          'filesystem',
        ],
        quotas: ['temporary', 'persistent'],
      })

      // 5) Clear cache
      console.log('🗂️ Clearing cache...')
      await sess.clearCache()

      // 6) Force changes to be written to disk
      console.log('💾 Flushing changes to disk...')
      await sess.cookies.flushStore()

      // 6.5) Try clearing host resolver cache (just in case)
      try { await (sess as any).clearHostResolverCache?.() } catch {}

      // 7) Clear all partitions (if partition is default)
      if (partition === 'persist:ig') {
        console.log('🌐 Clearing all Instagram-related partitions...')
        try {
          // Clear default partition too
          const defaultSess = session.defaultSession
          for (const origin of igOrigins) {
            try {
              await defaultSess.clearStorageData({
                origin,
                storages: [
                  'cookies',
                  'localstorage',
                  'indexdb',
                  'serviceworkers',
                  'cachestorage',
                  'websql',
                  'filesystem',
                ],
                quotas: ['temporary', 'persistent'],
              })
              console.log(`  ✅ Cleared default storage for ${origin}`)
            } catch (e) {
              console.warn(`  ⚠️ Failed default storage clear for ${origin}:`, e)
            }
          }
          await defaultSess.clearCache()
          await defaultSess.clearAuthCache()
          console.log('✅ Default partition cleared')
        } catch (defaultError) {
          console.warn('⚠️ Failed to clear default partition:', defaultError)
        }
      }

      console.log('🎉 Complete Instagram data cleanup finished!')
    } catch (error) {
      console.error('❌ Error during Instagram data cleanup:', error)
    }
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

  /** Renderer request: NUCLEAR Instagram cleanup - clear everything */
  ipcMain.handle('ig:nuclear-cleanup', async () => {
    console.log('💥 NUCLEAR Instagram cleanup requested')
    
    try {
      // Clear all known Instagram partitions
      const partitions = ['persist:ig', 'persist:instagram', 'persist:ig_session']
      
      for (const partition of partitions) {
        try {
          await clearInstagramData(partition)
          console.log(`✅ Cleared partition: ${partition}`)
        } catch (error) {
          console.warn(`⚠️ Failed to clear partition ${partition}:`, error)
        }
      }
      
      // Clear default session too
      await clearInstagramData('default')
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
        console.log('🗑️ Forced garbage collection')
      }
      
      console.log('🎉 NUCLEAR Instagram cleanup completed!')
      return true
    } catch (error) {
      console.error('❌ NUCLEAR cleanup failed:', error)
      return false
    }
  })

  /** Renderer request: Inject cookies to Instagram WebView */
  ipcMain.handle('ig:inject-cookies', async (event, cookies: Record<string, any>) => {
    try {
      console.log('Injecting cookies to Instagram WebView:', cookies)
      
      // Instagram 세션에 쿠키 설정
      const igSession = session.fromPartition('persist:ig')
      
      // 각 쿠키를 Instagram 도메인에 설정
      for (const [name, value] of Object.entries(cookies)) {
        if (name && value) {
          try {
            await igSession.cookies.set({
              url: 'https://www.instagram.com',
              name: name,
              value: String(value),
              domain: '.instagram.com',
              path: '/',
              secure: true,
              httpOnly: false,
              sameSite: 'no-restriction'
            })
            console.log(`Cookie set: ${name}=${value}`)
          } catch (cookieError) {
            console.warn(`Failed to set cookie ${name}:`, cookieError)
          }
        }
      }
      
      // 쿠키 저장소 플러시
      await igSession.cookies.flushStore()
      console.log('Cookies injected successfully')
      
      return true
    } catch (error) {
      console.error('Failed to inject cookies:', error)
      return false
    }
  })

  /** Renderer request: Clear Instagram data for specific web contents */
  ipcMain.handle('ig:clear-instagram-data', async (event, webContentsId?: number) => {
    try {
      console.log('Clearing Instagram data for web contents:', webContentsId)
      
      // 기본 Instagram 파티션 정리
      await clearInstagramData('persist:ig')
      
      // 특정 WebContents ID가 제공된 경우 해당 WebContents의 세션도 정리
      if (webContentsId) {
        const webContents = win?.webContents
        if (webContents && webContents.id === webContentsId) {
          // WebView 내부 데이터 정리
          await webContents.executeJavaScript(`
            // 모든 WebView 요소 찾기
            const webviews = document.querySelectorAll('webview');
            webviews.forEach(webview => {
              try {
                webview.executeJavaScript(\`
                  localStorage.clear();
                  sessionStorage.clear();
                  document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                  });
                \`);
              } catch (e) {
                console.warn('Failed to clear WebView data:', e);
              }
            });
          `)
        }
      }
      
      console.log('Instagram data cleared successfully')
      return true
    } catch (error) {
      console.error('Failed to clear Instagram data:', error)
      return false
    }
  })

  // Check for updates on app start (only when not in development mode)
  if (!VITE_DEV_SERVER_URL) {
    // Wait a bit after app is ready before checking for updates
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
})
