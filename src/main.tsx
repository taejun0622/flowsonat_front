import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 개발 환경에서 메모리 모니터링 초기화
if (process.env.NODE_ENV === 'development') {
  import('./utils/memoryMonitor').then(({ memoryMonitor }) => {
    console.log('🔍 Memory monitoring initialized for development');
  });
}

// Initialize environment debugging
import { envDebugger, logEnvironmentDebug, validateEnvironment } from './utils/envDebugger'
import { initializeProductionValidation } from './utils/productionValidator'

// Initialize GA4 analytics
import { ga4 } from './services/ga4'

// Import types for global analytics
import './types/analytics'

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

// Initialize GA4 analytics and track app start
ga4.initialize().then(() => {
  ga4.trackAppStart()
}).catch(error => {
  console.error('Failed to initialize GA4:', error)
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
  ga4.trackAppClose()
})

// Global error handling with GA4
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  const errorName = `Global Error: ${event.error?.name || 'Unknown'}`
  const errorMessage = event.error?.message || event.message
  ga4.trackError(errorName, errorMessage, false)
  
  // Also track to Electron analytics
  if (window.analytics) {
    window.analytics.trackError(`${errorName}: ${errorMessage}`, false).catch(console.error)
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  const errorMessage = String(event.reason)
  ga4.trackError('Unhandled Promise Rejection', errorMessage, false)
  
  // Also track to Electron analytics
  if (window.analytics) {
    window.analytics.trackError(`Unhandled Rejection: ${errorMessage}`, false).catch(console.error)
  }
})
