declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;
  }
}

interface HTMLWebViewElement extends HTMLElement {
  src: string;
  webpreferences?: string;
  allowpopups?: string | boolean;
  reload(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  goBack(): void;
  goForward(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  sendInputEvent(event: {
    type: 'mouseDown' | 'mouseUp' | 'scrollWheel';
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
