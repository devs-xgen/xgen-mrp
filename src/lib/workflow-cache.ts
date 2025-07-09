"use server";

import { prisma } from "@/lib/db";

/**
 * Workflow Performance Cache
 * Implements caching for frequently accessed phase status calculations
 * and workflow validation queries to improve system performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface WorkflowCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  enableCompression?: boolean;
}

class WorkflowCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default
  private readonly maxSize = 1000; // Maximum 1000 entries
  private hitCount = 0;
  private missCount = 0;

  constructor(private options: WorkflowCacheOptions = {}) {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get cached data by key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.data as T;
  }

  /**
   * Set cached data with key
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.options.ttl || this.defaultTTL;

    // Enforce max size limit
    if (this.cache.size >= (this.options.maxSize || this.maxSize)) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
      key,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete cached data by key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache by pattern
   */
  deletePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Invalidate cache for specific production order
   */
  invalidateProductionOrder(productionOrderId: string): void {
    this.deletePattern(`^prod:${productionOrderId}:`);
    this.deletePattern(`^phase:${productionOrderId}:`);
    this.deletePattern(`^deps:${productionOrderId}:`);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      totalRequests,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Global cache instance
const workflowCache = new WorkflowCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 2000,
  enableCompression: false,
});

/**
 * Cached work center completion check
 */
export async function getCachedWorkCenterCompletion(productionOrderId: string) {
  const cacheKey = `work-center:${productionOrderId}`;

  // Try cache first
  let result = workflowCache.get(cacheKey);
  if (result) {
    return result;
  }

  // If not in cache, compute and cache
  try {
    // Optimized query with minimal data selection
    const operations = await prisma.operation.findMany({
      where: { productionOrderId },
      select: {
        id: true,
        status: true,
        workCenter: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalOperations = operations.length;
    const completedOperations = operations.filter(
      (op) => op.status === "COMPLETED"
    );
    const completedCount = completedOperations.length;
    const completionPercentage =
      totalOperations > 0
        ? Math.round((completedCount / totalOperations) * 100)
        : 0;

    const remainingOperations = operations
      .filter((op) => op.status !== "COMPLETED")
      .map((op) => ({
        id: op.id,
        workCenterName: op.workCenter.name,
        status: op.status,
      }));

    result = {
      allCompleted: completedCount === totalOperations && totalOperations > 0,
      completionPercentage,
      completedCount,
      totalOperations,
      remainingOperations,
    };

    // Cache for 2 minutes (shorter TTL for frequently changing data)
    workflowCache.set(cacheKey, result, 2 * 60 * 1000);

    return result;
  } catch (error) {
    console.error("Error in cached work center completion check:", error);
    throw new Error("Failed to check work center completion");
  }
}

/**
 * Cached inspection completion check
 */
export async function getCachedInspectionCompletion(productionOrderId: string) {
  const cacheKey = `inspection:${productionOrderId}`;

  let result = workflowCache.get(cacheKey);
  if (result) {
    return result;
  }

  try {
    // Optimized query
    const qualityChecks = await prisma.qualityCheck.findMany({
      where: { productionOrderId },
      select: {
        id: true,
        status: true,
        inspector: {
          select: {
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalChecks = qualityChecks.length;
    const completedChecks = qualityChecks.filter(
      (qc) => qc.status === "COMPLETED"
    );
    const completedCount = completedChecks.length;
    const completionPercentage =
      totalChecks > 0 ? Math.round((completedCount / totalChecks) * 100) : 0;

    const remainingChecks = qualityChecks
      .filter((qc) => qc.status !== "COMPLETED")
      .map((qc) => ({
        id: qc.id,
        status: qc.status,
        inspectorName: qc.inspector?.user?.profile
          ? `${qc.inspector.user.profile.firstName} ${qc.inspector.user.profile.lastName}`
          : "Unknown Inspector",
      }));

    result = {
      allCompleted: completedCount === totalChecks && totalChecks > 0,
      completionPercentage,
      completedCount,
      totalChecks,
      remainingChecks,
    };

    // Cache for 2 minutes
    workflowCache.set(cacheKey, result, 2 * 60 * 1000);

    return result;
  } catch (error) {
    console.error("Error in cached inspection completion check:", error);
    throw new Error("Failed to check inspection completion");
  }
}

/**
 * Cached production phase status
 */
export async function getCachedProductionPhaseStatus(
  productionOrderId: string
) {
  const cacheKey = `phase-status:${productionOrderId}`;

  let result = workflowCache.get(cacheKey);
  if (result) {
    return result;
  }

  try {
    // Get both statuses in parallel for better performance
    const [workCenterStatus, inspectionStatus] = await Promise.all([
      getCachedWorkCenterCompletion(productionOrderId),
      getCachedInspectionCompletion(productionOrderId),
    ]);

    // Type assertion for cached results
    const wcStatus = workCenterStatus as any;
    const inspStatus = inspectionStatus as any;

    // Determine current phase and capabilities
    let currentPhase: string;
    let canStartInspection = false;
    let canStartDelivery = false;

    if (!wcStatus.allCompleted) {
      currentPhase = "work_centers";
      canStartInspection = false;
      canStartDelivery = false;
    } else if (!inspStatus.allCompleted) {
      currentPhase = "inspection";
      canStartInspection = true;
      canStartDelivery = false;
    } else {
      currentPhase = "delivery";
      canStartInspection = true;
      canStartDelivery = true;
    }

    result = {
      productionOrderId,
      currentPhase,
      canStartInspection,
      canStartDelivery,
      workCenterStatus: wcStatus,
      inspectionStatus: inspStatus,
      overallProgress: {
        workCentersComplete: wcStatus.allCompleted,
        inspectionsComplete: inspStatus.allCompleted,
        deliveryReady: canStartDelivery,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 3 minutes
    workflowCache.set(cacheKey, result, 3 * 60 * 1000);

    return result;
  } catch (error) {
    console.error("Error in cached production phase status:", error);
    throw new Error("Failed to get production phase status");
  }
}

/**
 * Cached dependency validation
 */
export async function getCachedDependencyValidation(
  productionOrderId: string,
  phaseType: "WORK_CENTER" | "INSPECTION" | "DELIVERY"
) {
  const cacheKey = `deps:${productionOrderId}:${phaseType}`;

  let result = workflowCache.get(cacheKey);
  if (result) {
    return result;
  }

  try {
    const phaseStatus = await getCachedProductionPhaseStatus(productionOrderId);
    const status = phaseStatus as any;

    let isBlocked = false;
    const blockingReasons: string[] = [];
    const requirements: any = {};

    switch (phaseType) {
      case "INSPECTION":
        isBlocked = !status.canStartInspection;
        if (isBlocked) {
          blockingReasons.push(
            "Work center operations must be completed first"
          );
          requirements.workCenterCompletion =
            status.workCenterStatus?.completionPercentage || 0;
          requirements.workCenterRequired = 100;
        }
        break;

      case "DELIVERY":
        isBlocked = !status.canStartDelivery;
        if (isBlocked) {
          if (!status.workCenterStatus?.allCompleted) {
            blockingReasons.push("Work center operations must be completed");
          }
          if (!status.inspectionStatus?.allCompleted) {
            blockingReasons.push("Quality inspections must be completed");
          }
          requirements.workCenterCompletion =
            status.workCenterStatus?.completionPercentage || 0;
          requirements.inspectionCompletion =
            status.inspectionStatus?.completionPercentage || 0;
          requirements.required = 100;
        }
        break;

      case "WORK_CENTER":
        // Work center operations can always start
        isBlocked = false;
        break;
    }

    result = {
      productionOrderId,
      phaseType,
      isBlocked,
      blockingReasons,
      requirements,
      canProceed: !isBlocked,
      checkedAt: new Date().toISOString(),
    };

    // Cache dependency validation for 1 minute (very frequent changes)
    workflowCache.set(cacheKey, result, 1 * 60 * 1000);

    return result;
  } catch (error) {
    console.error("Error in cached dependency validation:", error);
    throw new Error("Failed to validate dependencies");
  }
}

/**
 * Batch fetch multiple production order statuses
 */
export async function getBatchProductionPhaseStatus(
  productionOrderIds: string[]
) {
  const results = await Promise.all(
    productionOrderIds.map((id) => getCachedProductionPhaseStatus(id))
  );

  return productionOrderIds.reduce(
    (acc, id, index) => {
      acc[id] = results[index];
      return acc;
    },
    {} as Record<string, any>
  );
}

/**
 * Prefetch and warm cache for active production orders
 */
export async function warmWorkflowCache(): Promise<void> {
  try {
    // Get active production orders
    const activeOrders = await prisma.productionOrder.findMany({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      select: {
        id: true,
      },
      take: 50, // Limit to prevent overwhelming the system
    });

    // Warm cache for these orders
    const warmupPromises = activeOrders.map(async (order) => {
      try {
        await Promise.all([
          getCachedWorkCenterCompletion(order.id),
          getCachedInspectionCompletion(order.id),
          getCachedProductionPhaseStatus(order.id),
        ]);
      } catch (error) {
        console.warn(`Failed to warm cache for order ${order.id}:`, error);
      }
    });

    await Promise.all(warmupPromises);
    console.log(
      `Warmed workflow cache for ${activeOrders.length} production orders`
    );
  } catch (error) {
    console.error("Error warming workflow cache:", error);
  }
}

/**
 * Invalidate cache when production order data changes
 */
export function invalidateWorkflowCache(productionOrderId: string): void {
  workflowCache.invalidateProductionOrder(productionOrderId);
  console.log(
    `Invalidated workflow cache for production order: ${productionOrderId}`
  );
}

/**
 * Get workflow cache statistics
 */
export function getWorkflowCacheStats() {
  return workflowCache.getStats();
}

/**
 * Clear workflow cache
 */
export function clearWorkflowCache(): void {
  workflowCache.clear();
  console.log("Workflow cache cleared");
}

// Initialize cache warming on module load (in production)
if (process.env.NODE_ENV === "production") {
  // Warm cache every 10 minutes
  setInterval(warmWorkflowCache, 10 * 60 * 1000);
  // Initial warmup after 30 seconds
  setTimeout(warmWorkflowCache, 30 * 1000);
}

export { workflowCache };
