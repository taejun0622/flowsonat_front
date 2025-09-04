/**
 * Runtime Environment Debugger
 * Utilities for debugging environment variables during runtime
 */

interface EnvSnapshot {
  timestamp: string;
  vars: Record<string, string | undefined>;
  buildInfo: {
    version?: string;
    mode?: string;
    isDev?: boolean;
    isProd?: boolean;
  };
  location: {
    href: string;
    origin: string;
    pathname: string;
  };
}

class EnvironmentDebugger {
  private snapshots: EnvSnapshot[] = [];
  private watchInterval?: NodeJS.Timeout;

  /**
   * Take a snapshot of current environment state
   */
  takeSnapshot(): EnvSnapshot {
    const snapshot: EnvSnapshot = {
      timestamp: new Date().toISOString(),
      vars: {
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
        VITE_STRIPE_PRICE_ID: import.meta.env.VITE_STRIPE_PRICE_ID ? '[REDACTED]' : 'undefined',
        VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '[REDACTED]' : 'undefined',
        VITE_STRIPE_PRODUCT_ID: import.meta.env.VITE_STRIPE_PRODUCT_ID ? '[REDACTED]' : 'undefined',
        MODE: import.meta.env.MODE,
        PROD: import.meta.env.PROD?.toString(),
        DEV: import.meta.env.DEV?.toString(),
        NODE_ENV: import.meta.env.NODE_ENV,
      },
      buildInfo: {
        version: import.meta.env.VITE_APP_VERSION,
        mode: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
      },
      location: {
        href: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
      },
    };

    this.snapshots.push(snapshot);
    
    // Keep only last 10 snapshots
    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Start watching for environment changes
   */
  startWatching(intervalMs = 30000): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }

    // Take initial snapshot
    const initial = this.takeSnapshot();
    console.log('🔍 Environment watcher started:', initial);

    this.watchInterval = setInterval(() => {
      const current = this.takeSnapshot();
      const previous = this.snapshots[this.snapshots.length - 2];

      if (previous) {
        const changes = this.compareSnapshots(previous, current);
        if (changes.length > 0) {
          console.error('🚨 ENVIRONMENT VARIABLES CHANGED!');
          console.table(changes);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop watching for changes
   */
  stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = undefined;
    }
  }

  /**
   * Compare two snapshots and return differences
   */
  private compareSnapshots(prev: EnvSnapshot, current: EnvSnapshot): Array<{
    key: string;
    previous: string | undefined;
    current: string | undefined;
    changed: boolean;
  }> {
    const changes: Array<{
      key: string;
      previous: string | undefined;
      current: string | undefined;
      changed: boolean;
    }> = [];

    const allKeys = new Set([
      ...Object.keys(prev.vars),
      ...Object.keys(current.vars)
    ]);

    for (const key of allKeys) {
      const prevValue = prev.vars[key];
      const currentValue = current.vars[key];
      
      if (prevValue !== currentValue) {
        changes.push({
          key,
          previous: prevValue,
          current: currentValue,
          changed: true,
        });
      }
    }

    return changes;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): EnvSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(): EnvSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  /**
   * Export debug report
   */
  exportDebugReport(): string {
    const latest = this.getLatestSnapshot();
    const report = {
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      currentSnapshot: latest,
      allSnapshots: this.snapshots,
      environmentAnalysis: this.analyzeEnvironment(),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Analyze current environment for potential issues
   */
  private analyzeEnvironment(): Array<{
    issue: string;
    severity: 'warning' | 'error' | 'info';
    description: string;
  }> {
    const issues: Array<{
      issue: string;
      severity: 'warning' | 'error' | 'info';
      description: string;
    }> = [];

    const latest = this.getLatestSnapshot();
    if (!latest) return issues;

    // Check for missing API URL
    if (!latest.vars.VITE_API_BASE_URL) {
      issues.push({
        issue: 'Missing API Base URL',
        severity: 'error',
        description: 'VITE_API_BASE_URL is not defined. API calls may fail.',
      });
    }

    // Check for development/production mismatch
    if (latest.vars.MODE === 'production' && latest.vars.VITE_API_BASE_URL?.includes('test.')) {
      issues.push({
        issue: 'Test API in Production Mode',
        severity: 'warning',
        description: 'Production mode is using test API URL.',
      });
    }

    // Check for missing app version
    if (!latest.vars.VITE_APP_VERSION) {
      issues.push({
        issue: 'Missing App Version',
        severity: 'warning',
        description: 'VITE_APP_VERSION is not defined. Auto-updater may not work properly.',
      });
    }

    // Check if environment changed during runtime
    if (this.snapshots.length > 1) {
      const changes = this.compareSnapshots(this.snapshots[0], latest);
      if (changes.length > 0) {
        issues.push({
          issue: 'Environment Changed During Runtime',
          severity: 'error',
          description: `${changes.length} environment variable(s) changed during runtime.`,
        });
      }
    }

    return issues;
  }

  /**
   * Log comprehensive environment debug info
   */
  logDebugInfo(): void {
    const snapshot = this.takeSnapshot();
    const issues = this.analyzeEnvironment();

    console.group('🔍 Environment Debug Report');
    console.log('📊 Current Environment:', snapshot);
    
    if (issues.length > 0) {
      console.group('⚠️ Issues Detected:');
      issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${issue.issue}: ${issue.description}`);
      });
      console.groupEnd();
    } else {
      console.log('✅ No issues detected');
    }

    if (this.snapshots.length > 1) {
      console.log('📈 Change History:', this.snapshots.length, 'snapshots');
    }

    console.groupEnd();
  }

  /**
   * Force environment validation (throws if critical issues found)
   */
  validateEnvironment(): void {
    const issues = this.analyzeEnvironment();
    const errors = issues.filter(issue => issue.severity === 'error');
    
    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.issue}: ${e.description}`).join('\n');
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
  }
}

// Export singleton instance
export const envDebugger = new EnvironmentDebugger();

// Global access for debugging (only in development)
if (import.meta.env.DEV) {
  (window as any).__envDebugger = envDebugger;
}

// Export utilities
export const logEnvironmentDebug = () => envDebugger.logDebugInfo();
export const takeEnvironmentSnapshot = () => envDebugger.takeSnapshot();
export const validateEnvironment = () => envDebugger.validateEnvironment();
export const exportEnvironmentReport = () => envDebugger.exportDebugReport();

// Auto-start watching in development
if (import.meta.env.DEV) {
  envDebugger.startWatching();
}