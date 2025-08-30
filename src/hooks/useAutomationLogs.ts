import { useState, useCallback } from 'react';

export const useAutomationLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);

  // Add log
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev: string[]) => [...prev.slice(-99), `[${timestamp}] ${message}`]); // 최대 100개 로그 유지
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs
  };
};
