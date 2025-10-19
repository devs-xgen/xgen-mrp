/**
 * Metrics Collection Utilities
 * Lightweight utilities for recording system metrics and errors
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// Metrics Recording
// ============================================================================

/**
 * Record a metric to the database
 * @param metricType - Category of the metric (request, database, memory, etc.)
 * @param metricName - Specific identifier for the metric
 * @param value - Numeric value of the metric
 * @param metadata - Additional context data
 */
export async function recordMetric(
  metricType: string,
  metricName: string,
  value: number,
  metadata?: Record<string, any>
) {
  try {
    await prisma.systemMetric.create({
      data: {
        metricType,
        metricName,
        value,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    // Fail silently to avoid breaking the main application
    console.error("Failed to record metric:", error);
  }
}

/**
 * Record an API request metric
 * @param endpoint - API endpoint path
 * @param duration - Request duration in milliseconds
 * @param statusCode - HTTP status code
 */
export async function recordAPIRequest(
  endpoint: string,
  duration: number,
  statusCode: number
) {
  try {
    await recordMetric("request", "api.response_time", duration, {
      endpoint,
      statusCode,
    });

    // Record error if status code indicates failure
    if (statusCode >= 400) {
      await recordMetric("request", "api.error", 1, {
        endpoint,
        statusCode,
      });
    }
  } catch (error) {
    console.error("Failed to record API request:", error);
  }
}

/**
 * Record a database query metric
 * @param query - SQL query or operation name
 * @param duration - Query duration in milliseconds
 */
export async function recordDatabaseQuery(query: string, duration: number) {
  try {
    await recordMetric("database", "db.query_duration", duration, {
      query: query.substring(0, 500), // Limit query length
    });
  } catch (error) {
    console.error("Failed to record database query:", error);
  }
}

/**
 * Record memory usage metric
 * @param usagePercent - Memory usage percentage
 */
export async function recordMemoryUsage(usagePercent: number) {
  try {
    await recordMetric("memory", "system.memory_usage", usagePercent);
  } catch (error) {
    console.error("Failed to record memory usage:", error);
  }
}

/**
 * Record disk usage metric
 * @param usagePercent - Disk usage percentage
 */
export async function recordDiskUsage(usagePercent: number) {
  try {
    await recordMetric("disk", "system.disk_usage", usagePercent);
  } catch (error) {
    console.error("Failed to record disk usage:", error);
  }
}

// ============================================================================
// Error Recording
// ============================================================================

/**
 * Record a system error to the database
 * @param errorType - Type/class of the error
 * @param message - Error message
 * @param stackTrace - Full stack trace
 * @param context - Additional context (request, user, etc.)
 */
export async function recordError(
  errorType: string,
  message: string,
  stackTrace?: string,
  context?: Record<string, any>
) {
  try {
    await prisma.systemError.create({
      data: {
        errorType,
        message,
        stackTrace: stackTrace || null,
        context: context || null,
      },
    });
  } catch (error) {
    // Fail silently to avoid breaking the main application
    console.error("Failed to record error:", error);
  }
}

/**
 * Record an error from a caught exception
 * @param error - The caught error object
 * @param context - Additional context
 */
export async function recordException(error: Error, context?: Record<string, any>) {
  await recordError(
    error.constructor.name,
    error.message,
    error.stack,
    context
  );
}

// ============================================================================
// Performance Monitoring Wrapper
// ============================================================================

/**
 * Wrap an async function to automatically record its performance
 * @param fn - The async function to wrap
 * @param metricName - Name for the metric
 * @returns Wrapped function that records performance
 */
export function withPerformanceMetric<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      await recordMetric("performance", metricName, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await recordMetric("performance", `${metricName}.error`, duration);
      await recordException(error as Error, { function: metricName });

      throw error;
    }
  }) as T;
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Delete old metrics to prevent database bloat
 * @param daysToKeep - Number of days of metrics to retain
 */
export async function cleanupOldMetrics(daysToKeep: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.systemMetric.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Deleted ${result.count} old metrics`);
    return result.count;
  } catch (error) {
    console.error("Failed to cleanup old metrics:", error);
    return 0;
  }
}

/**
 * Delete old resolved errors
 * @param daysToKeep - Number of days of resolved errors to retain
 */
export async function cleanupOldErrors(daysToKeep: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.systemError.deleteMany({
      where: {
        resolved: true,
        resolvedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Deleted ${result.count} old resolved errors`);
    return result.count;
  } catch (error) {
    console.error("Failed to cleanup old errors:", error);
    return 0;
  }
}
