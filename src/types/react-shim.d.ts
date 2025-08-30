import React from 'react'

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Add any custom attributes here
  }
}

// WebView element type definition
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;
    }
  }
}

// Extend Window interface globally
declare global {
  interface Window {
    electronAPI: {
      openExternal: (url: string) => void;
      getVersion: () => string;
      getPlatform: () => string;
      isElectron: boolean;
    };
  }
}

interface HTMLWebViewElement extends HTMLElement {
  src: string;
  reload(): void;
  goBack(): void;
  goForward(): void;
  stop(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
  src?: string;
  webpreferences?: string;
  allowpopups?: boolean;
  websecurity?: string;
  nodeintegration?: string;
  contextisolation?: string;
  security?: string;
}

