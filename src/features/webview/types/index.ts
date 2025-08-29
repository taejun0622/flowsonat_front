export interface WebViewProps {
  url?: string;
  onClose?: () => void;
  onLoginSuccess?: (sessionData: any) => void;
  webviewRef?: any;
  partition?: string; // optional custom session partition
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
// keep react types optional-free to avoid editor complaints in constrained TS setups
