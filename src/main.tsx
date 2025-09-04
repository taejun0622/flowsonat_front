import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize environment debugging
import { envDebugger, logEnvironmentDebug, validateEnvironment } from './utils/envDebugger'
import { initializeProductionValidation } from './utils/productionValidator'

// Initialize analytics
import { analytics } from './services/analytics'

// Log environment configuration at startup
logEnvironmentDebug()

// Validate environment (will throw if critical issues)
try {
  validateEnvironment()
} catch (error) {
  console.error('🚨 Environment validation failed:', error)
  // Don't block the app, just warn
}

// Initialize production validation
try {
  initializeProductionValidation()
} catch (error) {
  console.error('🚨 Production validation failed:', error)
  // Don't block the app, just warn
}

// Initialize analytics and track app start
analytics.initialize().then(() => {
  analytics.trackAppStart()
}).catch(error => {
  console.error('Failed to initialize analytics:', error)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge if available
window.ipcRenderer?.on('main-process-message', (_event: any, message: any) => {
  console.log(message)
})

// Track app close when window is about to unload
window.addEventListener('beforeunload', () => {
  analytics.trackAppClose()
})
