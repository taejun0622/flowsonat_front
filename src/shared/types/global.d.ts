declare global {
  interface Window {
    ipcRenderer?: {
      on: (...args: any[]) => any;
      off: (...args: any[]) => any;
      send: (...args: any[]) => any;
      invoke: (...args: any[]) => any;
    };
    electronAPI?: {
      openInstagramLogin: (url: string) => Promise<any>;
      closeInstagramLogin: () => Promise<any>;
      onInstagramLoginSuccess: (callback: (data: any) => void) => void;
      onInstagramLoginError: (callback: (error: string) => void) => void;
      getInstagramCookies: () => Promise<any>;
      clearInstagramSession: () => Promise<any>;
      executeInstagramJavaScript: (script: string) => Promise<any>;
    };
    showToast?: (opts: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
  }
}

export {};

