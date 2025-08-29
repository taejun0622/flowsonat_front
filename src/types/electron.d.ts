declare global {
  interface Window {
    electronAPI?: {
      openInstagramLogin: (url: string) => void;
      onInstagramLoginSuccess: (callback: (sessionData: any) => void) => void;
      onInstagramLoginError: (callback: (error: string) => void) => void;
      closeInstagramLogin: () => void;
      getInstagramCookies: () => Promise<any>;
      clearInstagramSession: () => Promise<any>;
      executeInstagramJavaScript: (script: string) => Promise<any>;
    };
  }
}

export {};
