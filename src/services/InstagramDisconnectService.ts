// Instagram Disconnect Service - Handle complex disconnect logic

import { InstagramService } from '@/api/services/InstagramService';

export interface DisconnectOptions {
  clearServerData?: boolean;
  clearWebViewData?: boolean;
  notifyWebView?: boolean;
}

export class InstagramDisconnectService {
  
  /**
   * Disconnect Instagram account from server
   */
  static async disconnectFromServer(): Promise<boolean> {
    console.log('🌐 Disconnecting from server...');
    
    try {
      await InstagramService.disconnectInstagramAccountApiV1InstagramMeDelete();
      console.log('✅ Server disconnect successful');
      return true;
    } catch (error: any) {
      console.warn('⚠️ Server disconnect failed:', error);
      
      // 404 means already disconnected - treat as success
      if (error.status === 404) {
        console.log('📝 Account already disconnected (404) - treating as success');
        return true;
      }
      
      // For other errors, log but don't fail the disconnect process
      console.warn('⚠️ Server error, but continuing with local cleanup');
      return false;
    }
  }

  /**
   * Clear WebView session data via Electron APIs
   */
  static async clearWebViewSession(): Promise<void> {
    console.log('🧹 Clearing WebView session...');
    
    try {
      // Clear known Instagram data via Electron API
      if ((window as any).electronAPI?.clearInstagramDataForWebContents) {
        console.log('🧹 Clearing Instagram data via Electron API');
        await (window as any).electronAPI.clearInstagramDataForWebContents(undefined);
        console.log('✅ Electron API cleanup complete');
      }
    } catch (error) {
      console.warn('⚠️ Electron API cleanup failed:', error);
    }
  }

  /**
   * Clear IndexedDB data
   */
  static async clearIndexedDB(): Promise<void> {
    console.log('🗄️ Clearing IndexedDB...');
    
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      console.log('⚠️ IndexedDB not available');
      return;
    }

    try {
      const databases = await window.indexedDB.databases();
      console.log(`📋 Found ${databases.length} databases`);
      
      const instagramDBs = databases.filter(db => 
        db.name && (
          db.name.toLowerCase().includes('instagram') ||
          db.name.toLowerCase().includes('ig_') ||
          db.name.toLowerCase().includes('session')
        )
      );
      
      console.log(`🔍 Found ${instagramDBs.length} Instagram-related databases`);
      
      for (const db of instagramDBs) {
        if (db.name) {
          try {
            await window.indexedDB.deleteDatabase(db.name);
            console.log(`🗑️ Deleted IndexedDB: ${db.name}`);
          } catch (error) {
            console.warn(`⚠️ Failed to delete IndexedDB ${db.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ IndexedDB cleanup failed:', error);
    }
  }

  /**
   * Clear browser storage (localStorage, sessionStorage)
   */
  static clearBrowserStorage(): void {
    console.log('🗂️ Clearing browser storage...');
    
    // Note: Current implementation doesn't use local storage for Instagram data
    // This is a placeholder for future use or cleanup of any residual data
    
    try {
      // Clear any Instagram-related keys from localStorage
      const instagramKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('instagram') || key.includes('ig_'))) {
          instagramKeys.push(key);
        }
      }
      
      instagramKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed localStorage key: ${key}`);
      });
      
      // Clear any Instagram-related keys from sessionStorage
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('instagram') || key.includes('ig_'))) {
          sessionKeys.push(key);
        }
      }
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed sessionStorage key: ${key}`);
      });
      
    } catch (error) {
      console.warn('⚠️ Browser storage cleanup failed:', error);
    }
  }

  /**
   * Notify WebView to force reload with fresh partition
   */
  static notifyWebViewForceReload(): void {
    console.log('🔄 Notifying WebView for force reload...');
    
    try {
      // Set flag for fresh partition
      sessionStorage.setItem('ig_force_fresh_partition', '1');
      
      // Dispatch custom event for WebView reload
      window.dispatchEvent(new CustomEvent('instagram-webview-force-reload'));
      console.log('✅ WebView force reload notification sent');
    } catch (error) {
      console.warn('⚠️ WebView notification failed:', error);
    }
  }

  /**
   * Complete disconnect process
   */
  static async disconnect(options: DisconnectOptions = {}): Promise<void> {
    const {
      clearServerData = true,
      clearWebViewData = true,
      notifyWebView = true
    } = options;

    console.log('🔍 Starting Instagram disconnect process...');
    console.log('📋 Options:', options);

    let serverSuccess = true;
    
    try {
      // 1. Disconnect from server
      if (clearServerData) {
        serverSuccess = await this.disconnectFromServer();
      }

      // 2. Clear WebView session (regardless of server result)
      if (clearWebViewData) {
        await this.clearWebViewSession();
        await this.clearIndexedDB();
        this.clearBrowserStorage();
      }

      // 3. Notify WebView for fresh reload
      if (notifyWebView) {
        this.notifyWebViewForceReload();
      }

      console.log('✅ Instagram disconnect process complete');
      console.log(`📊 Server disconnect: ${serverSuccess ? 'Success' : 'Failed (but continued)'}`);
      
    } catch (error) {
      console.error('❌ Instagram disconnect process failed:', error);
      throw error;
    }
  }
}