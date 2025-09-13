/**
 * 메모리 모니터링 유틸리티
 * 개발 환경에서 메모리 사용량을 추적하고 경고를 제공합니다.
 */

interface MemoryInfo {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

interface MemoryStats {
  timestamp: number;
  memory: MemoryInfo;
  formatted: {
    rss: string;
    heapUsed: string;
    heapTotal: string;
    external: string;
    arrayBuffers: string;
  };
}

class MemoryMonitor {
  private static instance: MemoryMonitor;
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 100;
  private warningThreshold = 400 * 1024 * 1024; // 400MB
  private criticalThreshold = 600 * 1024 * 1024; // 600MB

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * 메모리 사용량을 MB 단위로 포맷팅
   */
  private formatMemory(bytes: number): string {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  }

  /**
   * 현재 메모리 사용량 정보를 가져옵니다
   */
  private getCurrentMemoryInfo(): MemoryStats {
    const hasNodeProcess = typeof process !== 'undefined' && typeof (process as any).memoryUsage === 'function';
    const timestamp = Date.now();
    
    if (!hasNodeProcess) {
      // Browser-safe fallback to avoid crashes in isolated renderer
      const zero = { rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 } as any;
      return {
        timestamp,
        memory: zero,
        formatted: {
          rss: this.formatMemory(0),
          heapUsed: this.formatMemory(0),
          heapTotal: this.formatMemory(0),
          external: this.formatMemory(0),
          arrayBuffers: this.formatMemory(0),
        },
      };
    }

    const memory = (process as any).memoryUsage();

    return {
      timestamp,
      memory,
      formatted: {
        rss: this.formatMemory(memory.rss),
        heapUsed: this.formatMemory(memory.heapUsed),
        heapTotal: this.formatMemory(memory.heapTotal),
        external: this.formatMemory(memory.external),
        arrayBuffers: this.formatMemory(memory.arrayBuffers),
      },
    };
  }

  /**
   * 메모리 사용량을 기록하고 경고를 확인합니다
   */
  private recordMemoryUsage(): void {
    const memoryStats = this.getCurrentMemoryInfo();
    
    // 히스토리에 추가
    this.memoryHistory.push(memoryStats);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // 메모리 사용량 로깅
    console.log('📊 Memory Usage:', {
      timestamp: new Date(memoryStats.timestamp).toISOString(),
      ...memoryStats.formatted,
    });

    // 경고 체크
    if (memoryStats.memory.heapUsed > this.criticalThreshold) {
      console.error('🚨 CRITICAL: High memory usage detected!', {
        heapUsed: memoryStats.formatted.heapUsed,
        threshold: this.formatMemory(this.criticalThreshold),
      });
      this.triggerMemoryCleanup();
    } else if (memoryStats.memory.heapUsed > this.warningThreshold) {
      console.warn('⚠️ WARNING: High memory usage detected', {
        heapUsed: memoryStats.formatted.heapUsed,
        threshold: this.formatMemory(this.warningThreshold),
      });
    }
  }

  /**
   * 메모리 정리를 트리거합니다
   */
  private triggerMemoryCleanup(): void {
    console.log('🧹 Triggering memory cleanup...');
    
    // 가비지 컬렉션 강제 실행 (가능한 경우)
    if (global.gc) {
      global.gc();
      console.log('✅ Garbage collection completed');
    } else {
      console.warn('⚠️ Garbage collection not available (run with --expose-gc)');
    }

    // WebView 메모리 정리 (Electron 환경에서)
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        (window as any).electronAPI.cleanupWebViewMemory?.();
      } catch (error) {
        console.warn('Failed to cleanup WebView memory:', error);
      }
    }
  }

  /**
   * 메모리 모니터링을 시작합니다
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('Memory monitoring is already running');
      return;
    }
    
    const hasNodeProcess = typeof process !== 'undefined' && typeof (process as any).memoryUsage === 'function';
    if (!hasNodeProcess) {
      // Skip in pure browser/isolated renderer without Node process
      console.log('ℹ️ Memory monitoring disabled (no Node process available)');
      return;
    }

    this.isMonitoring = true;
    console.log(`🔍 Starting memory monitoring (interval: ${intervalMs}ms)`);

    this.intervalId = setInterval(() => {
      this.recordMemoryUsage();
    }, intervalMs);

    // 초기 메모리 사용량 기록
    this.recordMemoryUsage();
  }

  /**
   * 메모리 모니터링을 중지합니다
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 Memory monitoring stopped');
  }

  /**
   * 현재 메모리 사용량을 반환합니다
   */
  getCurrentMemory(): MemoryStats {
    return this.getCurrentMemoryInfo();
  }

  /**
   * 메모리 사용량 히스토리를 반환합니다
   */
  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * 메모리 사용량 통계를 반환합니다
   */
  getMemoryStats(): {
    current: MemoryStats;
    average: {
      heapUsed: string;
      heapTotal: string;
    };
    peak: {
      heapUsed: string;
      timestamp: number;
    };
  } {
    const current = this.getCurrentMemoryInfo();
    
    if (this.memoryHistory.length === 0) {
      return {
        current,
        average: {
          heapUsed: current.formatted.heapUsed,
          heapTotal: current.formatted.heapTotal,
        },
        peak: {
          heapUsed: current.formatted.heapUsed,
          timestamp: current.timestamp,
        },
      };
    }

    const avgHeapUsed = this.memoryHistory.reduce(
      (sum, stat) => sum + stat.memory.heapUsed,
      0
    ) / this.memoryHistory.length;

    const avgHeapTotal = this.memoryHistory.reduce(
      (sum, stat) => sum + stat.memory.heapTotal,
      0
    ) / this.memoryHistory.length;

    const peakUsage = this.memoryHistory.reduce(
      (peak, stat) => stat.memory.heapUsed > peak.memory.heapUsed ? stat : peak,
      this.memoryHistory[0]
    );

    return {
      current,
      average: {
        heapUsed: this.formatMemory(avgHeapUsed),
        heapTotal: this.formatMemory(avgHeapTotal),
      },
      peak: {
        heapUsed: this.formatMemory(peakUsage.memory.heapUsed),
        timestamp: peakUsage.timestamp,
      },
    };
  }

  /**
   * 메모리 히스토리를 초기화합니다
   */
  clearHistory(): void {
    this.memoryHistory = [];
    console.log('🗑️ Memory history cleared');
  }
}

// 싱글톤 인스턴스 내보내기
export const memoryMonitor = MemoryMonitor.getInstance();

// 개발 환경에서 자동으로 모니터링 시작
try {
  // Only auto-start in dev and when Node process is available
  // eslint-disable-next-line no-undef
  if (process?.env?.NODE_ENV === 'development') {
    memoryMonitor.startMonitoring(30000);
  }
} catch {
  // Ignore when process/env is unavailable
}

// 전역 객체에 추가 (디버깅용)
if (typeof window !== 'undefined') {
  (window as any).memoryMonitor = memoryMonitor;
}
