/**
 * 性能监控和分析工具
 * 用于监控和优化微信发布器的性能
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  totalDuration: number;
  metrics: PerformanceMetric[];
  slowestOperations: PerformanceMetric[];
  averageOperationTime: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * 开始监控一个操作
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(name, metric);
  }

  /**
   * 结束监控一个操作
   */
  end(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.completedMetrics.push(metric);
    this.metrics.delete(name);

    return metric.duration;
  }

  /**
   * 测量一个函数的执行时间
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return await fn();
    }

    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * 获取性能报告
   */
  getReport(): PerformanceReport {
    const totalDuration = this.completedMetrics.reduce(
      (sum, metric) => sum + (metric.duration || 0),
      0
    );

    const averageOperationTime = this.completedMetrics.length > 0
      ? totalDuration / this.completedMetrics.length
      : 0;

    const slowestOperations = [...this.completedMetrics]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5);

    return {
      totalDuration,
      metrics: [...this.completedMetrics],
      slowestOperations,
      averageOperationTime,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }

  /**
   * 生成性能报告的可读格式
   */
  generateReadableReport(): string {
    const report = this.getReport();
    const lines: string[] = [];

    lines.push('# 性能监控报告');
    lines.push('');
    lines.push(`总执行时间: ${report.totalDuration.toFixed(2)}ms`);
    lines.push(`平均操作时间: ${report.averageOperationTime.toFixed(2)}ms`);
    lines.push(`总操作数: ${report.metrics.length}`);
    lines.push('');

    if (report.memoryUsage) {
      lines.push('## 内存使用情况');
      lines.push(`RSS: ${(report.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`Heap Used: ${(report.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`Heap Total: ${(report.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`External: ${(report.memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
      lines.push('');
    }

    if (report.slowestOperations.length > 0) {
      lines.push('## 最慢的操作');
      report.slowestOperations.forEach((metric, index) => {
        lines.push(`${index + 1}. ${metric.name}: ${metric.duration?.toFixed(2)}ms`);
        if (metric.metadata) {
          Object.entries(metric.metadata).forEach(([key, value]) => {
            lines.push(`   ${key}: ${value}`);
          });
        }
      });
      lines.push('');
    }

    lines.push('## 所有操作详情');
    report.metrics.forEach(metric => {
      lines.push(`- ${metric.name}: ${metric.duration?.toFixed(2)}ms`);
    });

    return lines.join('\n');
  }

  /**
   * 检查是否有性能问题
   */
  analyzePerformance(): {
    issues: string[];
    recommendations: string[];
  } {
    const report = this.getReport();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查慢操作
    const slowOperations = report.metrics.filter(m => (m.duration || 0) > 1000);
    if (slowOperations.length > 0) {
      issues.push(`发现 ${slowOperations.length} 个慢操作 (>1s)`);
      recommendations.push('考虑优化慢操作或添加缓存机制');
    }

    // 检查内存使用
    if (report.memoryUsage) {
      const heapUsedMB = report.memoryUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 100) {
        issues.push(`内存使用较高: ${heapUsedMB.toFixed(2)} MB`);
        recommendations.push('检查是否存在内存泄漏或优化内存使用');
      }
    }

    // 检查操作频率
    const operationCounts = new Map<string, number>();
    report.metrics.forEach(metric => {
      const baseName = metric.name.split(':')[0];
      operationCounts.set(baseName, (operationCounts.get(baseName) || 0) + 1);
    });

    operationCounts.forEach((count, operation) => {
      if (count > 10) {
        issues.push(`操作 '${operation}' 执行次数过多: ${count} 次`);
        recommendations.push(`考虑缓存 '${operation}' 的结果`);
      }
    });

    return { issues, recommendations };
  }
}

// 全局性能监控实例
export const globalPerformanceMonitor = new PerformanceMonitor(
  process.env.NODE_ENV !== 'production'
);

/**
 * 性能装饰器 - 自动监控方法执行时间
 */
export function performanceMonitor(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return await globalPerformanceMonitor.measure(
        methodName,
        () => originalMethod.apply(this, args),
        { args: args.length }
      );
    };

    return descriptor;
  };
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private snapshots: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];
  private interval?: NodeJS.Timeout;

  start(intervalMs: number = 5000): void {
    this.interval = setInterval(() => {
      this.snapshots.push({
        timestamp: Date.now(),
        usage: process.memoryUsage()
      });

      // 保留最近100个快照
      if (this.snapshots.length > 100) {
        this.snapshots.shift();
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  getMemoryTrend(): {
    trend: 'increasing' | 'decreasing' | 'stable';
    averageHeapUsed: number;
    peakHeapUsed: number;
  } {
    if (this.snapshots.length < 2) {
      return {
        trend: 'stable',
        averageHeapUsed: 0,
        peakHeapUsed: 0
      };
    }

    const heapUsages = this.snapshots.map(s => s.usage.heapUsed);
    const averageHeapUsed = heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length;
    const peakHeapUsed = Math.max(...heapUsages);

    const firstHalf = heapUsages.slice(0, Math.floor(heapUsages.length / 2));
    const secondHalf = heapUsages.slice(Math.floor(heapUsages.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const threshold = averageHeapUsed * 0.1; // 10% 阈值
    let trend: 'increasing' | 'decreasing' | 'stable';

    if (secondAvg - firstAvg > threshold) {
      trend = 'increasing';
    } else if (firstAvg - secondAvg > threshold) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      averageHeapUsed: averageHeapUsed / 1024 / 1024, // MB
      peakHeapUsed: peakHeapUsed / 1024 / 1024 // MB
    };
  }
}

// 导出便捷函数
export const perf = {
  start: (name: string, metadata?: Record<string, any>) => 
    globalPerformanceMonitor.start(name, metadata),
  end: (name: string) => 
    globalPerformanceMonitor.end(name),
  measure: <T>(name: string, fn: () => Promise<T> | T, metadata?: Record<string, any>) => 
    globalPerformanceMonitor.measure(name, fn, metadata),
  report: () => 
    globalPerformanceMonitor.generateReadableReport(),
  analyze: () => 
    globalPerformanceMonitor.analyzePerformance()
};