declare global {
  interface Window {
    electronAPI?: {
      openInstagramLogin: (url: string) => void;
      onInstagramLoginSuccess: (callback: (sessionData: any) => void) => void;
      onInstagramLoginError: (callback: (error: string) => void) => void;
      closeInstagramLogin: () => void;
    };
  }
}

export {};
