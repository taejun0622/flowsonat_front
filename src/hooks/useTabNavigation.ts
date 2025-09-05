import { useState, useCallback } from 'react';

export const useTabNavigation = (defaultTab: string = 'benchmark') => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const switchToTab = useCallback((tabName: string) => {
    setActiveTab(tabName);
  }, []);

  const switchToBilling = useCallback(() => {
    setActiveTab('billing');
  }, []);

  return {
    activeTab,
    switchToTab,
    switchToBilling,
  };
};
