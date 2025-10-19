"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subHours, subDays, subMinutes } from "date-fns";

// ============================================================================
// Type Definitions
// ============================================================================

export type SystemStatus = "healthy" | "degraded" | "down";

export interface SystemHealthData {
  status: SystemStatus;
  database: {
    status: "online" | "offline" | "slow";
    responseTime: number;
    connectionCount: number;
  };
  api: {
    avgResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  resources: {
    memoryUsage: number;
    diskUsage: number;
  };
  uptime: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  activeUsers: number;
  lastUpdated: string;
}

export interface PerformanceMetrics {
  endpoints: EndpointMetrics[];
  slowQueries: SlowQuery[];
  responseTimeChart: ResponseTimeDataPoint[];
  errorRateChart: ErrorRateDataPoint[];
}

export interface EndpointMetrics {
  path: string;
  requestCount: number;
  p50: number;
  p95: number;
  p99: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface SlowQuery {
  query: string;
  avgDuration: number;
  count: number;
  lastOccurrence: Date;
}

export interface ResponseTimeDataPoint {
  timestamp: string;
  avgResponseTime: number;
  p95ResponseTime: number;
}

export interface ErrorRateDataPoint {
  timestamp: string;
  errorCount: number;
  totalRequests: number;
  errorRate: number;
}

export interface SystemErrorData {
  id: string;
  timestamp: Date;
  errorType: string;
  message: string;
  stackTrace: string | null;
  context: any;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
}

// ============================================================================
// System Health Functions
// ============================================================================

export async function getSystemHealth() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Database health check
    const dbHealth = await checkDatabaseHealth();

    // API health from metrics
    const apiHealth = await calculateAPIHealth();

    // Resource usage (simulated - in production, use actual system metrics)
    const resources = await getResourceUsage();

    // Uptime calculation
    const uptime = await calculateUptime();

    // Active users (last 15 minutes)
    const activeUsers = await getActiveUserCount();

    // Determine overall status
    let status: SystemStatus = "healthy";
    if (dbHealth.status === "offline" || apiHealth.errorRate > 10) {
      status = "down";
    } else if (dbHealth.status === "slow" || apiHealth.errorRate > 5 || apiHealth.avgResponseTime > 2000) {
      status = "degraded";
    }

    const healthData: SystemHealthData = {
      status,
      database: dbHealth,
      api: apiHealth,
      resources,
      uptime,
      activeUsers,
      lastUpdated: new Date().toISOString(),
    };

    return { success: true, data: healthData };
  } catch (error) {
    console.error("Error getting system health:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get system health",
    };
  }
}

async function checkDatabaseHealth() {
  const startTime = Date.now();

  try {
    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    // Check connection pool (simulated - actual implementation depends on deployment)
    const connectionCount = 0; // Placeholder

    let status: "online" | "offline" | "slow" = "online";
    if (responseTime > 1000) {
      status = "slow";
    }

    return {
      status,
      responseTime,
      connectionCount,
    };
  } catch (error) {
    return {
      status: "offline" as const,
      responseTime: Date.now() - startTime,
      connectionCount: 0,
    };
  }
}

async function calculateAPIHealth() {
  const since = subMinutes(new Date(), 15);

  // Get request metrics from last 15 minutes
  const metrics = await prisma.systemMetric.findMany({
    where: {
      metricType: "request",
      timestamp: { gte: since },
    },
  });

  if (metrics.length === 0) {
    return {
      avgResponseTime: 0,
      errorRate: 0,
      requestsPerMinute: 0,
    };
  }

  // Calculate average response time
  const responseTimes = metrics
    .filter(m => m.metricName === "api.response_time")
    .map(m => m.value);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  // Calculate error rate
  const errorMetrics = metrics.filter(m => m.metricName === "api.error");
  const errorRate = (errorMetrics.length / metrics.length) * 100;

  // Calculate requests per minute
  const requestsPerMinute = metrics.length / 15;

  return {
    avgResponseTime: Math.round(avgResponseTime),
    errorRate: Math.round(errorRate * 100) / 100,
    requestsPerMinute: Math.round(requestsPerMinute),
  };
}

async function getResourceUsage() {
  // In production, these would come from actual system monitoring
  // For now, return simulated values
  return {
    memoryUsage: 45, // Percentage
    diskUsage: 62,   // Percentage
  };
}

async function calculateUptime() {
  // Calculate uptime based on error metrics
  const now = new Date();

  const calculatePeriodUptime = async (hours: number) => {
    const since = subHours(now, hours);

    const totalMinutes = hours * 60;
    const errorMinutes = await prisma.systemError.count({
      where: {
        timestamp: { gte: since },
        errorType: { contains: "Critical" },
      },
    });

    // Simple uptime calculation (minutes without critical errors / total minutes)
    const uptime = ((totalMinutes - errorMinutes) / totalMinutes) * 100;
    return Math.min(100, Math.max(0, uptime));
  };

  return {
    last24h: await calculatePeriodUptime(24),
    last7d: await calculatePeriodUptime(24 * 7),
    last30d: await calculatePeriodUptime(24 * 30),
  };
}

async function getActiveUserCount() {
  const since = subMinutes(new Date(), 15);

  // Count users with recent activity (login or action)
  const activeUsers = await prisma.user.count({
    where: {
      lastLoginAt: { gte: since },
    },
  });

  return activeUsers;
}

// ============================================================================
// Performance Metrics
// ============================================================================

export async function getPerformanceMetrics(hoursBack: number = 24) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const since = subHours(new Date(), hoursBack);

    // Endpoint metrics
    const endpoints = await calculateEndpointMetrics(since);

    // Slow queries
    const slowQueries = await getSlowQueries(since);

    // Response time chart data
    const responseTimeChart = await getResponseTimeChart(since, hoursBack);

    // Error rate chart data
    const errorRateChart = await getErrorRateChart(since, hoursBack);

    const metrics: PerformanceMetrics = {
      endpoints,
      slowQueries,
      responseTimeChart,
      errorRateChart,
    };

    return { success: true, data: metrics };
  } catch (error) {
    console.error("Error getting performance metrics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get performance metrics",
    };
  }
}

async function calculateEndpointMetrics(since: Date): Promise<EndpointMetrics[]> {
  const metrics = await prisma.systemMetric.findMany({
    where: {
      metricType: "request",
      metricName: "api.response_time",
      timestamp: { gte: since },
    },
  });

  // Group by endpoint (from metadata)
  const byEndpoint = new Map<string, number[]>();

  for (const metric of metrics) {
    const endpoint = (metric.metadata as any)?.endpoint || "unknown";
    if (!byEndpoint.has(endpoint)) {
      byEndpoint.set(endpoint, []);
    }
    byEndpoint.get(endpoint)!.push(metric.value);
  }

  // Calculate percentiles for each endpoint
  const endpointMetrics: EndpointMetrics[] = [];

  for (const [path, times] of byEndpoint) {
    times.sort((a, b) => a - b);

    const p50 = calculatePercentile(times, 50);
    const p95 = calculatePercentile(times, 95);
    const p99 = calculatePercentile(times, 99);
    const avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;

    // Calculate error rate for this endpoint
    const errorCount = await prisma.systemMetric.count({
      where: {
        metricType: "request",
        metricName: "api.error",
        timestamp: { gte: since },
        metadata: { path: ["endpoint"], equals: path },
      },
    });

    const errorRate = (errorCount / times.length) * 100;

    endpointMetrics.push({
      path,
      requestCount: times.length,
      p50,
      p95,
      p99,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
    });
  }

  // Sort by slowest p95
  endpointMetrics.sort((a, b) => b.p95 - a.p95);

  return endpointMetrics.slice(0, 10); // Top 10 slowest
}

function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return Math.round(sortedArray[index] || 0);
}

async function getSlowQueries(since: Date): Promise<SlowQuery[]> {
  const metrics = await prisma.systemMetric.findMany({
    where: {
      metricType: "database",
      metricName: "db.query_duration",
      value: { gt: 1000 }, // Queries > 1 second
      timestamp: { gte: since },
    },
    orderBy: { value: "desc" },
    take: 20,
  });

  // Group by query (from metadata)
  const byQuery = new Map<string, { times: number[]; lastOccurrence: Date }>();

  for (const metric of metrics) {
    const query = ((metric.metadata as any)?.query || "Unknown query").substring(0, 100);
    if (!byQuery.has(query)) {
      byQuery.set(query, { times: [], lastOccurrence: metric.timestamp });
    }
    const data = byQuery.get(query)!;
    data.times.push(metric.value);
    if (metric.timestamp > data.lastOccurrence) {
      data.lastOccurrence = metric.timestamp;
    }
  }

  const slowQueries: SlowQuery[] = [];

  for (const [query, data] of byQuery) {
    const avgDuration = data.times.reduce((a, b) => a + b, 0) / data.times.length;

    slowQueries.push({
      query,
      avgDuration: Math.round(avgDuration),
      count: data.times.length,
      lastOccurrence: data.lastOccurrence,
    });
  }

  // Sort by average duration
  slowQueries.sort((a, b) => b.avgDuration - a.avgDuration);

  return slowQueries.slice(0, 10);
}

async function getResponseTimeChart(since: Date, hoursBack: number): Promise<ResponseTimeDataPoint[]> {
  const bucketSize = hoursBack <= 6 ? 15 : hoursBack <= 24 ? 60 : 360; // minutes

  const metrics = await prisma.systemMetric.findMany({
    where: {
      metricType: "request",
      metricName: "api.response_time",
      timestamp: { gte: since },
    },
    orderBy: { timestamp: "asc" },
  });

  // Group by time buckets
  const buckets = new Map<string, number[]>();

  for (const metric of metrics) {
    const bucketKey = getBucketKey(metric.timestamp, bucketSize);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(metric.value);
  }

  const chartData: ResponseTimeDataPoint[] = [];

  for (const [timestamp, times] of buckets) {
    times.sort((a, b) => a - b);

    chartData.push({
      timestamp,
      avgResponseTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      p95ResponseTime: calculatePercentile(times, 95),
    });
  }

  return chartData;
}

async function getErrorRateChart(since: Date, hoursBack: number): Promise<ErrorRateDataPoint[]> {
  const bucketSize = hoursBack <= 6 ? 15 : hoursBack <= 24 ? 60 : 360; // minutes

  const allMetrics = await prisma.systemMetric.findMany({
    where: {
      metricType: "request",
      timestamp: { gte: since },
    },
    orderBy: { timestamp: "asc" },
  });

  // Group by time buckets
  const buckets = new Map<string, { total: number; errors: number }>();

  for (const metric of allMetrics) {
    const bucketKey = getBucketKey(metric.timestamp, bucketSize);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, { total: 0, errors: 0 });
    }

    const bucket = buckets.get(bucketKey)!;
    bucket.total++;

    if (metric.metricName === "api.error") {
      bucket.errors++;
    }
  }

  const chartData: ErrorRateDataPoint[] = [];

  for (const [timestamp, data] of buckets) {
    chartData.push({
      timestamp,
      errorCount: data.errors,
      totalRequests: data.total,
      errorRate: data.total > 0 ? (data.errors / data.total) * 100 : 0,
    });
  }

  return chartData;
}

function getBucketKey(timestamp: Date, bucketSizeMinutes: number): string {
  const minutes = Math.floor(timestamp.getTime() / (1000 * 60));
  const bucketMinutes = Math.floor(minutes / bucketSizeMinutes) * bucketSizeMinutes;
  return new Date(bucketMinutes * 60 * 1000).toISOString();
}

// ============================================================================
// Error Management
// ============================================================================

export async function getRecentErrors(limit: number = 100, resolved?: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const errors = await prisma.systemError.findMany({
      where: resolved !== undefined ? { resolved } : undefined,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return { success: true, data: errors };
  } catch (error) {
    console.error("Error getting recent errors:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get recent errors",
    };
  }
}

export async function resolveError(errorId: string, resolutionNotes: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.systemError.update({
      where: { id: errorId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        resolutionNotes,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resolving error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resolve error",
    };
  }
}

// ============================================================================
// Utility Functions for Recording Metrics
// ============================================================================

export async function recordMetric(
  metricType: string,
  metricName: string,
  value: number,
  metadata?: any
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

    return { success: true };
  } catch (error) {
    console.error("Error recording metric:", error);
    return { success: false };
  }
}

export async function recordError(
  errorType: string,
  message: string,
  stackTrace?: string,
  context?: any
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

    return { success: true };
  } catch (error) {
    console.error("Error recording error:", error);
    return { success: false };
  }
}
