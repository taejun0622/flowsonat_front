import { useState, useCallback } from 'react';
import { InstagramAutomationConfig } from '@/services/instagramAutomationService';

const defaultConfig: InstagramAutomationConfig = {
  maxTargets: 500,
  maxUnfollows: 250,
  unfollowDelayDays: 4,
  scrollDelay: 1000,
  clickDelay: 500
};

export const useAutomationConfig = (initialConfig?: Partial<InstagramAutomationConfig>) => {
  const [config, setConfig] = useState<InstagramAutomationConfig>({
    ...defaultConfig,
    ...initialConfig
  });

  // 설정 업데이트
  const updateConfig = useCallback((newConfig: Partial<InstagramAutomationConfig>) => {
    setConfig((prev: InstagramAutomationConfig) => ({ ...prev, ...newConfig }));
  }, []);

  // 설정 리셋
  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return {
    config,
    updateConfig,
    resetConfig
  };
};
