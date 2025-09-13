export interface WebViewController {
  loadURL(url: string): Promise<void>;
  execute<T>(script: string): Promise<T>;
  clearStorage(): Promise<void>;
  reset(): Promise<void>;
}

