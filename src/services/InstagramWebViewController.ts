// Instagram WebView Controller - Partition and cookie management

import { clearInstagramCookies, generateFreshPartitionName } from '@/utils/instagramUtils';

export interface WebViewControllerOptions {
  enableCookieInjection?: boolean;
  useServerCookies?: boolean;
  prohibitLocalCookies?: boolean;
}

export interface CookieInjectionResult {
  success: boolean;
  method: string;
  error?: string;
}

export class InstagramWebViewController {
  
  /**
   * Create fresh WebView partition for Instagram
   */
  static createFreshPartition(): string {
    const partitionName = generateFreshPartitionName();
    
    console.log('[WebViewController] Creating fresh partition:', partitionName);
    
    // Set flag for WebView to use fresh partition
    try {
      sessionStorage.setItem('ig_force_fresh_partition', '1');
      sessionStorage.setItem('ig_partition_name', partitionName);
    } catch (error) {
      console.warn('[WebViewController] Failed to set partition flags:', error);
    }
    
    return partitionName;
  }

  /**
   * Clear current WebView partition and create new one
   */
  static async recreatePartition(): Promise<string> {
    console.log('[WebViewController] Recreating WebView partition...');
    
    try {
      // Method 1: Clear current partition via Electron
      if ((window as any).electronAPI?.clearInstagramDataForWebContents) {
        console.log('[WebViewController] Clearing current partition via Electron API');
        await (window as any).electronAPI.clearInstagramDataForWebContents(undefined);
      }
      
      // Method 2: Clear via IPC
      if (window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function') {
        console.log('[WebViewController] Clearing current partition via IPC');
        await window.ipcRenderer.invoke('ig:clear-session');
      }
    } catch (error) {
      console.warn('[WebViewController] Partition clearing failed (non-critical):', error);
    }
    
    // Create fresh partition
    const newPartition = this.createFreshPartition();
    
    // Trigger WebView recreation
    this.triggerWebViewReload();
    
    return newPartition;
  }

  /**
   * Inject cookies into WebView
   */
  static async injectCookies(cookies: Record<string, any>): Promise<CookieInjectionResult> {
    console.log('[WebViewController] Injecting cookies:', Object.keys(cookies));
    
    // Method 1: Electron API
    if ((window as any).electronAPI?.injectCookiesToWebView) {
      try {
        console.log('[WebViewController] Using Electron API for injection');
        const result = await (window as any).electronAPI.injectCookiesToWebView(cookies);
        
        return {
          success: result,
          method: 'electron-api',
          error: result ? undefined : 'Electron API returned false'
        };
      } catch (error) {
        console.warn('[WebViewController] Electron API injection failed:', error);
      }
    }
    
    // Method 2: IPC Renderer
    if (window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function') {
      try {
        console.log('[WebViewController] Using IPC Renderer for injection');
        const result = await window.ipcRenderer.invoke('inject-cookies-to-webview', cookies);
        
        return {
          success: result,
          method: 'ipc-renderer',
          error: result ? undefined : 'IPC Renderer returned false'
        };
      } catch (error) {
        console.warn('[WebViewController] IPC Renderer injection failed:', error);
      }
    }
    
    // Method 3: Direct DOM cookie injection (fallback, limited effectiveness)
    try {
      console.log('[WebViewController] Using DOM cookie injection as fallback');
      
      Object.entries(cookies).forEach(([name, value]) => {
        if (name && value) {
          document.cookie = `${name}=${value}; path=/; domain=.instagram.com`;
        }
      });
      
      return {
        success: true,
        method: 'dom-fallback',
        error: undefined
      };
    } catch (error) {
      console.error('[WebViewController] All injection methods failed:', error);
      
      return {
        success: false,
        method: 'none',
        error: `All injection methods failed: ${error}`
      };
    }
  }

  /**
   * Clear all Instagram cookies from current context
   */
  static clearInstagramCookies(): void {
    console.log('[WebViewController] Clearing Instagram cookies');
    clearInstagramCookies();
  }

  /**
   * Prohibit local cookie storage (for server-only cookie mode)
   */
  static prohibitLocalCookieStorage(): void {
    console.log('[WebViewController] Prohibiting local cookie storage');
    
    // Override document.cookie setter to prevent local storage
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', {
        get: function() {
          // Allow reading cookies
          return originalCookieDescriptor.get?.call(this) || '';
        },
        set: function(value: string) {
          // Check if it's an Instagram cookie
          if (value && (value.includes('ds_user_id=') || 
                       value.includes('sessionid=') ||
                       value.includes('ig_'))) {
            console.warn('[WebViewController] Blocked local Instagram cookie storage:', value.substring(0, 50));
            return; // Block the cookie setting
          }
          
          // Allow non-Instagram cookies
          return originalCookieDescriptor.set?.call(this, value);
        },
        enumerable: true,
        configurable: true
      });
      
      console.log('[WebViewController] Local cookie storage prohibition active');
    } else {
      console.warn('[WebViewController] Could not override cookie descriptor');
    }
  }

  /**
   * Restore server-stored Instagram session
   */
  static async restoreServerSession(cookies: Record<string, any>): Promise<boolean> {
    console.log('[WebViewController] Restoring server session...');
    
    if (!cookies || Object.keys(cookies).length === 0) {
      console.log('[WebViewController] No cookies to restore');
      return false;
    }
    
    // Clear any existing local cookies first
    this.clearInstagramCookies();
    
    // Wait a moment for clearing to take effect
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Inject server cookies
    const injectionResult = await this.injectCookies(cookies);
    
    if (injectionResult.success) {
      console.log(`[WebViewController] Session restored via ${injectionResult.method}`);
      return true;
    } else {
      console.error('[WebViewController] Session restoration failed:', injectionResult.error);
      return false;
    }
  }

  /**
   * Configure WebView for server-only cookie mode
   */
  static configureServerOnlyMode(): void {
    console.log('[WebViewController] Configuring server-only cookie mode');
    
    // Clear any existing local cookies
    this.clearInstagramCookies();
    
    // Prohibit local cookie storage
    this.prohibitLocalCookieStorage();
    
    console.log('[WebViewController] Server-only mode configured');
  }

  /**
   * Trigger WebView force reload
   */
  static triggerWebViewReload(): void {
    console.log('[WebViewController] Triggering WebView force reload');
    
    try {
      // Set fresh partition flag
      sessionStorage.setItem('ig_force_fresh_partition', '1');
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('instagram-webview-force-reload'));
      
      console.log('[WebViewController] Force reload triggered');
    } catch (error) {
      console.warn('[WebViewController] Force reload trigger failed:', error);
    }
  }

  /**
   * Get current partition status
   */
  static getPartitionStatus(): {
    hasFreshPartitionFlag: boolean;
    partitionName?: string;
    currentUrl: string;
  } {
    const hasFreshPartitionFlag = sessionStorage.getItem('ig_force_fresh_partition') === '1';
    const partitionName = sessionStorage.getItem('ig_partition_name') || undefined;
    const currentUrl = window.location.href;
    
    return {
      hasFreshPartitionFlag,
      partitionName,
      currentUrl
    };
  }

  /**
   * Reset partition flags
   */
  static resetPartitionFlags(): void {
    try {
      sessionStorage.removeItem('ig_force_fresh_partition');
      sessionStorage.removeItem('ig_partition_name');
      console.log('[WebViewController] Partition flags reset');
    } catch (error) {
      console.warn('[WebViewController] Failed to reset partition flags:', error);
    }
  }

  /**
   * Complete disconnect and cleanup
   */
  static async performCompleteDisconnect(): Promise<void> {
    console.log('[WebViewController] Performing complete disconnect...');
    
    // 1. Clear local cookies
    this.clearInstagramCookies();
    
    // 2. Clear browser storage
    try {
      const instagramKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('instagram') || key.includes('ig_'))) {
          instagramKeys.push(key);
        }
      }
      
      instagramKeys.forEach(key => localStorage.removeItem(key));
      console.log('[WebViewController] Cleared local storage items:', instagramKeys.length);
    } catch (error) {
      console.warn('[WebViewController] Local storage cleanup failed:', error);
    }
    
    // 3. Recreate partition
    await this.recreatePartition();
    
    console.log('[WebViewController] Complete disconnect finished');
  }
}