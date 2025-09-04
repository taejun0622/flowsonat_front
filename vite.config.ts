import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
              external: Object.keys(require('./package.json').devDependencies),
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
              external: Object.keys(require('./package.json').devDependencies),
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
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://api.flowsonat.com' : 'http://localhost:8000')
    ),
  },
})
