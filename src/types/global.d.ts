export {};

declare global {
  interface Window {
    IG: {
      clearSession: () => Promise<boolean>;
      disconnectAndReload: () => Promise<boolean>;
      onReloadRequest: (cb: () => void) => void;
    };
  }
}
