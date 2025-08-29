declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;
  }
}

interface HTMLWebViewElement extends HTMLElement {
  src: string;
  webpreferences?: string;
  allowpopups?: string | boolean;
  /** Custom user agent string that can include Accept-Language headers for language preference */
  useragent?: string;
  // Electron-specific WebView APIs
  loadURL(url: string): void;
  executeJavaScript<T = any>(code: string, userGesture?: boolean): Promise<T>;
  getURL?: () => string;
  reload(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  goBack(): void;
  goForward(): void;
  addEventListener(type: string, listener: EventListener, options?: any): void;
  removeEventListener(type: string, listener: EventListener): void;
  sendInputEvent(event: {
    type: 'mouseDown' | 'mouseUp' | 'scrollWheel' | 'mouseMove';
    x: number;
    y: number;
    button?: 'left' | 'right';
    clickCount?: number;
    deltaX?: number;
    deltaY?: number;
  }): void;
}

declare var HTMLWebViewElement: {
  prototype: HTMLWebViewElement;
  new(): HTMLWebViewElement;
};
