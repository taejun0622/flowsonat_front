export {};

declare global {
  interface Window {
    IG: {
      clearSession: () => Promise<boolean>;
      disconnectAndReload: () => Promise<boolean>;
      onReloadRequest: (cb: () => void) => void;
      injectCookies: (cookies: Record<string, any>) => Promise<boolean>;
    };
    electronAPI?: {
      injectCookies: (cookies: Record<string, any>) => Promise<boolean>;
    };
  }
}
