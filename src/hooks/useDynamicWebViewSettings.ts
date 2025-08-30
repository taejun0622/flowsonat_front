import { useState, useEffect, useCallback } from 'react';
import { WEBVIEW_SETTINGS } from '@/constants/session';

interface InstagramLoginStatus {
  isLoggedIn: boolean;
  username: string | null;
  sessionId: string | null;
  dsUserId: string | null;
  csrfToken: string | null;
}

interface UseDynamicWebViewSettingsProps {
  loginStatus: InstagramLoginStatus;
  onModeChange?: (mode: 'login' | 'automation') => void;
}

export const useDynamicWebViewSettings = ({ 
  loginStatus, 
  onModeChange 
}: UseDynamicWebViewSettingsProps) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'automation'>('login');
  const [settings, setSettings] = useState(WEBVIEW_SETTINGS.login);

  // 로그인 상태에 따라 모드와 설정 업데이트
  const updateSettingsBasedOnLoginStatus = useCallback(() => {
    const newMode = loginStatus.isLoggedIn ? 'automation' : 'login';
    const newSettings = WEBVIEW_SETTINGS[newMode];

    if (newMode !== currentMode) {
      console.log(`WebView mode changed from ${currentMode} to ${newMode}`);
      setCurrentMode(newMode);
      setSettings(newSettings);
      onModeChange?.(newMode);
    }
  }, [loginStatus.isLoggedIn, currentMode, onModeChange]);

  // 로그인 상태 변경 시 설정 업데이트
  useEffect(() => {
    updateSettingsBasedOnLoginStatus();
  }, [updateSettingsBasedOnLoginStatus]);

  // 수동으로 모드 변경
  const setMode = useCallback((mode: 'login' | 'automation') => {
    console.log(`Manually setting WebView mode to ${mode}`);
    setCurrentMode(mode);
    setSettings(WEBVIEW_SETTINGS[mode]);
    onModeChange?.(mode);
  }, [onModeChange]);

  return {
    currentMode,
    settings,
    setMode,
    updateSettingsBasedOnLoginStatus
  };
};
