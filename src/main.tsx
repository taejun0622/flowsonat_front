import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize environment debugging
import { envDebugger, logEnvironmentDebug, validateEnvironment } from './utils/envDebugger'

// Log environment configuration at startup
logEnvironmentDebug()

// Validate environment (will throw if critical issues)
try {
  validateEnvironment()
} catch (error) {
  console.error('🚨 Environment validation failed:', error)
  // Don't block the app, just warn
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge if available
window.ipcRenderer?.on('main-process-message', (_event: any, message: any) => {
  console.log(message)
})
