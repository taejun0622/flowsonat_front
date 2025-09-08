import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext';
import { InstagramProvider } from '@/contexts/InstagramContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { DynamicBackground } from '@/components/ui/background';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { EmailVerificationPage } from '@/pages/auth/EmailVerificationPage';

// Dashboard
import { DashboardPage } from '@/pages/DashboardPage';

// WebView
import WebViewPage from '@/pages/WebViewPage';
import { InstagramConnectionFlowPage } from '@/pages/InstagramConnectionFlowPage';

// Route debugging component
const RouteDebugger = () => {
  const location = useLocation();
  console.log('📍 Current route:', location.pathname);
  return null;
};

function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InstagramProvider>
          <Router>
            <AnalyticsProvider>
            <DynamicBackground
              type="blur-dot"
              colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
              loop={true}
              seed={1000}
            >
              <div className="relative w-full h-full overflow-auto">
                <RouteDebugger />
                <Routes>
                {/* Test Route */}
                <Route path="/test" element={<div style={{color: 'white', padding: '20px'}}>Test Route Working!</div>} />
                
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/email-verification" element={<EmailVerificationPage />} />
                
                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* WebView Route - Full screen webview */}
                <Route
                  path="/webview"
                  element={
                    <ProtectedRoute>
                      <WebViewPage />
                    </ProtectedRoute>
                  }
                />

                {/* Instagram Connection Flow Route */}
                <Route
                  path="/instagram-connection-flow"
                  element={
                    <ProtectedRoute>
                      <InstagramConnectionFlowPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              
                <Toaster />
              </div>
            </DynamicBackground>
            </AnalyticsProvider>
          </Router>
        </InstagramProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
