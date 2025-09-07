import React, { Component, ReactNode } from 'react'
import { ga4 } from '@/services/ga4'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo)
    
    // Track error to GA4
    ga4.trackError(`React Error: ${error.name}`, error.message, true)
    
    // Also track to Electron if available
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackError(`React Error: ${error.message}`, true).catch(console.error)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              The application encountered an unexpected error. 
              This issue has been automatically reported.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}