import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Build-time environment debugging
  console.log('\n🏗️  BUILD-TIME ENVIRONMENT DEBUG')
  console.log('================================')
  console.log('Mode:', mode)
  console.log('Process CWD:', process.cwd())
  console.log('Node ENV:', process.env.NODE_ENV)
  console.log('Package Version:', process.env.npm_package_version)
  console.log('\nVite Environment Variables:')
  Object.keys(env)
    .filter(key => key.startsWith('VITE_'))
    .forEach(key => {
      const value = env[key]
      const displayValue = key.includes('STRIPE') || key.includes('KEY') ? '[REDACTED]' : value
      console.log(`  ${key}: ${displayValue}`)
    })
  console.log('\nEnvironment files that might be loaded:')
  console.log(`  .env.${mode}`)
  console.log(`  .env.${mode}.local`)
  console.log('  .env.local')
  console.log('  .env')
  console.log('================================\n')
  
  return {
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
        onstart(options) {
          if (process.env.VSCODE_DEBUG) {
            // Start Electron App when debugging in VSCode
            console.log('[startup] Electron App')
          } else {
            options.startup()
          }
        },
        vite: {
          build: {
            sourcemap: !process.env.ELECTRON_RENDERER_URL,
            minify: !process.env.ELECTRON_RENDERER_URL,
            outDir: 'dist-electron',
            rollupOptions: {
              external: Object.keys(packageJson.devDependencies),
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
          // instead of restarting the entire Electron App.
          console.log('[startup] Electron Preload')
          options.reload()
        },
        vite: {
          build: {
            sourcemap: 'inline',
            minify: !process.env.ELECTRON_RENDERER_URL,
            outDir: 'dist-electron',
            rollupOptions: {
              external: Object.keys(packageJson.devDependencies),
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '0.0.1'),
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // 프로덕션 환경에서 API 베이스 URL 강제 설정
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      env.VITE_API_BASE_URL || 'https://api.flowsonat.com'
    ),
  },
  server: {
    port: parseInt(process.env.VITE_DEV_PORT || '5174'), // 환경변수로 포트 설정 가능
    strictPort: false, // 포트가 사용 중이면 다음 포트로 자동 이동
    proxy: {
      '/api': {
        target: env.VITE_API_BASE_URL || 'https://test.api.flowsonat.com',
        changeOrigin: true,
        secure: true
      },
      // GA4 Measurement Protocol proxy for development
      '/ga4-mp': {
        target: 'https://www.google-analytics.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ga4-mp/, '')
      }
    }
  },
  // Vitest configuration for unit tests
  test: {
    environment: 'jsdom',
    globals: false,
    css: true,
    setupFiles: [],
  }
  }
})
