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
import LoginWebViewPage from '@/pages/LoginWebViewPage';
import AutomationWebViewPage from '@/pages/AutomationWebViewPage';
import { InstagramConnectionFlowPage } from '@/pages/InstagramConnectionFlowPage';

import { useInstagram } from '@/contexts/InstagramContext';
import { useNavigate } from 'react-router-dom';

// Route debugging component
const RouteDebugger = () => {
  const location = useLocation();
  console.log('📍 Current route:', location.pathname);
  return null;
};

// Redirect helper to preserve query params under HashRouter
const WebViewRedirect: React.FC = () => {
  const location = useLocation();
  // Preserve the current search (query string) when redirecting
  const to = `/webview/automation${location.search || ''}`;
  return <Navigate to={to} replace />;
};

const NavigationHandler = () => {
  const navigate = useNavigate();
  const { setNavigate } = useInstagram();
  React.useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);
  return null;
}

function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InstagramProvider>
          <Router>
            <NavigationHandler />
            <AnalyticsProvider>
            <DynamicBackground
              type="blur-dot"
              colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
              loop={true}
              seed={1000}
            >
              <div className="relative w-full h-full min-h-0 overflow-auto">
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
                
                {/* WebView Routes - split for login and automation */}
                <Route
                  path="/webview/login"
                  element={
                    <ProtectedRoute>
                      <LoginWebViewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/webview/automation"
                  element={
                    <ProtectedRoute>
                      <AutomationWebViewPage />
                    </ProtectedRoute>
                  }
                />
                {/* Backward compatibility: redirect /webview to /webview/automation with query params (HashRouter-safe) */}
                <Route path="/webview" element={<WebViewRedirect />} />

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
