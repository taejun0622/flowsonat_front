export interface WebViewProps {
  url?: string;
  onClose?: () => void;
  onLoginSuccess?: (sessionData: any) => void;
  webviewRef?: React.RefObject<HTMLWebViewElement>;
}

export interface WebViewManagerProps {
  defaultUrl?: string;
}

export interface QuickAccessItem {
  name: string;
  url: string;
  description?: string;
}

export interface WebViewSize {
  width: number;
  height: number;
}
