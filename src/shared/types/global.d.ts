declare global {
  interface Window {
    ipcRenderer?: {
      on: (...args: any[]) => any;
      off: (...args: any[]) => any;
      send: (...args: any[]) => any;
      invoke: (...args: any[]) => any;
    };
    electronAPI?: {
      // Add any remaining Electron APIs here if needed
    };
    showToast?: (opts: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
  }
}

export {};

