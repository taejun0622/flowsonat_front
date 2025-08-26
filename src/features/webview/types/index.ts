export interface WebViewProps {
  url?: string;
  onClose?: () => void;
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
