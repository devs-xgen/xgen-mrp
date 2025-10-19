"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma, Priority, Status } from "@prisma/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

/**
 * SuperAdmin Production Analytics Server Actions
 * Comprehensive analytics for production orders across all tenants
 */

// Helper to ensure SuperAdmin access
async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/superadmin/login");
  }
  return session;
}

// Helper to serialize Decimal fields
function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Decimal) return Number(obj);
  if (Array.isArray(obj)) return obj.map(serializeDecimals);
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeDecimals(value)])
    );
  }
  return obj;
}

// Types
export interface ProductionAnalyticsFilters {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
  status?: Status[];
  priority?: Priority[];
}

export interface KPIMetrics {
  totalOrders: number;
  activeOrders: number;
  completedThisMonth: number;
  avgCompletionTimeDays: number;
  totalValue: number;
  onTimeRate: number;
}

export interface VolumeDataPoint {
  date: string;
  count: number;
  value: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
}

export interface WorkCenterUtilization {
  workCenterId: string;
  name: string;
  description: string | null;
  capacity: number;
  activeOperations: number;
  utilizationRate: number;
  tenantName: string | null;
}

export interface CostAnalysis {
  totalPlannedCost: number;
  totalActualCost: number;
  variance: number;
  variancePercentage: number;
  byProduct: Array<{
    productId: string;
    productName: string;
    productSKU: string;
    avgCostPerUnit: number;
    totalProduced: number;
  }>;
}

export interface TenantComparison {
  tenantId: string;
  tenantName: string;
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  avgCycleTimeDays: number;
  onTimeRate: number;
  totalValue: number;
}

export interface ProductionAnalyticsData {
  kpis: KPIMetrics;
  volumeOverTime: VolumeDataPoint[];
  ordersByStatus: StatusDistribution[];
  ordersByPriority: PriorityDistribution[];
  workCenterUtilization: WorkCenterUtilization[];
  costAnalysis: CostAnalysis;
  tenantComparison: TenantComparison[];
}

/**
 * Get comprehensive production analytics
 */
export async function getProductionAnalytics(
  filters: ProductionAnalyticsFilters
): Promise<{ success: boolean; data?: ProductionAnalyticsData; error?: string }> {
  try {
    await ensureSuperAdmin();

    const { startDate, endDate, tenantId, status, priority } = filters;

    // Build where clause
    const whereClause: Prisma.ProductionOrderWhereInput = {
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
      ...(tenantId && { tenantId }),
      ...(status && status.length > 0 && { status: { in: status } }),
      ...(priority && priority.length > 0 && { priority: { in: priority } }),
    };

    // 1. Calculate KPIs
    const kpis = await calculateKPIs(whereClause, startDate, endDate);

    // 2. Volume over time
    const volumeOverTime = await calculateVolumeOverTime(whereClause, startDate, endDate);

    // 3. Orders by status
    const ordersByStatus = await calculateOrdersByStatus(whereClause);

    // 4. Orders by priority
    const ordersByPriority = await calculateOrdersByPriority(whereClause);

    // 5. Work center utilization
    const workCenterUtilization = await calculateWorkCenterUtilization(startDate, endDate, tenantId);

    // 6. Cost analysis
    const costAnalysis = await calculateCostAnalysis(whereClause);

    // 7. Tenant comparison (if no tenant filter)
    const tenantComparison = tenantId
      ? []
      : await calculateTenantComparison(startDate, endDate);

    const analyticsData: ProductionAnalyticsData = {
      kpis,
      volumeOverTime,
      ordersByStatus,
      ordersByPriority,
      workCenterUtilization,
      costAnalysis,
      tenantComparison,
    };

    return {
      success: true,
      data: serializeDecimals(analyticsData),
    };
  } catch (error: any) {
    console.error("Error fetching production analytics:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch production analytics",
    };
  }
}

/**
 * Calculate KPI metrics
 */
async function calculateKPIs(
  whereClause: Prisma.ProductionOrderWhereInput,
  startDate: Date,
  endDate: Date
): Promise<KPIMetrics> {
  // Total orders in date range
  const totalOrders = await prisma.productionOrder.count({ where: whereClause });

  // Active orders (in progress, pending)
  const activeOrders = await prisma.productionOrder.count({
    where: {
      ...whereClause,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  // Completed this month
  const completedThisMonth = await prisma.productionOrder.count({
    where: {
      ...whereClause,
      status: "COMPLETED",
    },
  });

  // Average completion time
  const completedOrders = await prisma.productionOrder.findMany({
    where: {
      ...whereClause,
      status: "COMPLETED",
      completedAt: { not: null },
      startDate: { not: null },
    },
    select: {
      startDate: true,
      completedAt: true,
    },
  });

  let avgCompletionTimeDays = 0;
  if (completedOrders.length > 0) {
    const totalDays = completedOrders.reduce((sum, order) => {
      if (order.startDate && order.completedAt) {
        const days = Math.floor(
          (order.completedAt.getTime() - order.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);
    avgCompletionTimeDays = Math.round(totalDays / completedOrders.length);
  }

  // Total production value
  const valueAgg = await prisma.productionOrder.aggregate({
    where: whereClause,
    _sum: {
      actualMaterialCost: true,
    },
  });

  const totalValue = Number(valueAgg._sum.actualMaterialCost || 0);

  // On-time delivery rate
  const ordersWithDueDate = await prisma.productionOrder.findMany({
    where: {
      ...whereClause,
      status: "COMPLETED",
      dueDate: { not: null },
      completedAt: { not: null },
    },
    select: {
      dueDate: true,
      completedAt: true,
    },
  });

  let onTimeRate = 0;
  if (ordersWithDueDate.length > 0) {
    const onTimeCount = ordersWithDueDate.filter(
      (order) => order.completedAt! <= order.dueDate!
    ).length;
    onTimeRate = Math.round((onTimeCount / ordersWithDueDate.length) * 100);
  }

  return {
    totalOrders,
    activeOrders,
    completedThisMonth,
    avgCompletionTimeDays,
    totalValue,
    onTimeRate,
  };
}

/**
 * Calculate volume over time (daily aggregation)
 */
async function calculateVolumeOverTime(
  whereClause: Prisma.ProductionOrderWhereInput,
  startDate: Date,
  endDate: Date
): Promise<VolumeDataPoint[]> {
  const orders = await prisma.productionOrder.findMany({
    where: whereClause,
    select: {
      createdAt: true,
      actualMaterialCost: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by date
  const dataByDate = new Map<string, { count: number; value: number }>();

  orders.forEach((order) => {
    const dateKey = format(order.createdAt, "yyyy-MM-dd");
    const existing = dataByDate.get(dateKey) || { count: 0, value: 0 };
    dataByDate.set(dateKey, {
      count: existing.count + 1,
      value: existing.value + Number(order.actualMaterialCost || 0),
    });
  });

  // Convert to array
  const result: VolumeDataPoint[] = Array.from(dataByDate.entries()).map(
    ([date, data]) => ({
      date,
      count: data.count,
      value: Math.round(data.value),
    })
  );

  return result;
}

/**
 * Calculate orders by status
 */
async function calculateOrdersByStatus(
  whereClause: Prisma.ProductionOrderWhereInput
): Promise<StatusDistribution[]> {
  const grouped = await prisma.productionOrder.groupBy({
    by: ["status"],
    where: whereClause,
    _count: {
      status: true,
    },
  });

  const total = grouped.reduce((sum, item) => sum + item._count.status, 0);

  return grouped.map((item) => ({
    status: item.status,
    count: item._count.status,
    percentage: total > 0 ? Math.round((item._count.status / total) * 100) : 0,
  }));
}

/**
 * Calculate orders by priority
 */
async function calculateOrdersByPriority(
  whereClause: Prisma.ProductionOrderWhereInput
): Promise<PriorityDistribution[]> {
  const grouped = await prisma.productionOrder.groupBy({
    by: ["priority"],
    where: whereClause,
    _count: {
      priority: true,
    },
  });

  const total = grouped.reduce((sum, item) => sum + item._count.priority, 0);

  return grouped.map((item) => ({
    priority: item.priority,
    count: item._count.priority,
    percentage: total > 0 ? Math.round((item._count.priority / total) * 100) : 0,
  }));
}

/**
 * Calculate work center utilization
 */
async function calculateWorkCenterUtilization(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<WorkCenterUtilization[]> {
  const workCenters = await prisma.workCenter.findMany({
    where: {
      ...(tenantId && { tenantId }),
    },
    include: {
      operations: {
        where: {
          status: { in: ["IN_PROGRESS", "PENDING"] },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      tenant: {
        select: {
          name: true,
        },
      },
    },
  });

  return workCenters.map((wc) => {
    const activeOperations = wc.operations.length;
    const capacity = wc.capacity || 10; // Default capacity
    const utilizationRate = Math.min(Math.round((activeOperations / capacity) * 100), 100);

    return {
      workCenterId: wc.id,
      name: wc.name,
      description: wc.description,
      capacity,
      activeOperations,
      utilizationRate,
      tenantName: wc.tenant?.name || null,
    };
  });
}

/**
 * Calculate cost analysis
 */
async function calculateCostAnalysis(
  whereClause: Prisma.ProductionOrderWhereInput
): Promise<CostAnalysis> {
  // Total costs
  const costAgg = await prisma.productionOrder.aggregate({
    where: whereClause,
    _sum: {
      plannedMaterialCost: true,
      actualMaterialCost: true,
      costVariance: true,
    },
  });

  const totalPlannedCost = Number(costAgg._sum.plannedMaterialCost || 0);
  const totalActualCost = Number(costAgg._sum.actualMaterialCost || 0);
  const variance = Number(costAgg._sum.costVariance || 0);
  const variancePercentage =
    totalPlannedCost > 0 ? Math.round((variance / totalPlannedCost) * 100) : 0;

  // Cost by product
  const ordersByProduct = await prisma.productionOrder.findMany({
    where: {
      ...whereClause,
      status: "COMPLETED",
    },
    select: {
      productId: true,
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
      orderQuantity: true,
      actualMaterialCost: true,
    },
  });

  // Group by product
  const productMap = new Map<
    string,
    { name: string; sku: string; totalCost: number; totalQty: number }
  >();

  ordersByProduct.forEach((order) => {
    const existing = productMap.get(order.productId) || {
      name: order.product.name,
      sku: order.product.sku,
      totalCost: 0,
      totalQty: 0,
    };
    productMap.set(order.productId, {
      ...existing,
      totalCost: existing.totalCost + Number(order.actualMaterialCost || 0),
      totalQty: existing.totalQty + order.orderQuantity,
    });
  });

  const byProduct = Array.from(productMap.entries()).map(([productId, data]) => ({
    productId,
    productName: data.name,
    productSKU: data.sku,
    avgCostPerUnit: data.totalQty > 0 ? Math.round(data.totalCost / data.totalQty) : 0,
    totalProduced: data.totalQty,
  }));

  return {
    totalPlannedCost: Math.round(totalPlannedCost),
    totalActualCost: Math.round(totalActualCost),
    variance: Math.round(variance),
    variancePercentage,
    byProduct,
  };
}

/**
 * Calculate tenant comparison
 */
async function calculateTenantComparison(
  startDate: Date,
  endDate: Date
): Promise<TenantComparison[]> {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const comparisons: TenantComparison[] = [];

  for (const tenant of tenants) {
    const orders = await prisma.productionOrder.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
        startDate: true,
        completedAt: true,
        dueDate: true,
        actualMaterialCost: true,
      },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // Avg cycle time
    const completedWithDates = orders.filter(
      (o) => o.status === "COMPLETED" && o.startDate && o.completedAt
    );
    let avgCycleTimeDays = 0;
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, o) => {
        const days = Math.floor(
          (o.completedAt!.getTime() - o.startDate!.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgCycleTimeDays = Math.round(totalDays / completedWithDates.length);
    }

    // On-time rate
    const ordersWithDueDate = orders.filter(
      (o) => o.status === "COMPLETED" && o.dueDate && o.completedAt
    );
    let onTimeRate = 0;
    if (ordersWithDueDate.length > 0) {
      const onTimeCount = ordersWithDueDate.filter((o) => o.completedAt! <= o.dueDate!).length;
      onTimeRate = Math.round((onTimeCount / ordersWithDueDate.length) * 100);
    }

    // Total value
    const totalValue = Math.round(
      orders.reduce((sum, o) => sum + Number(o.actualMaterialCost || 0), 0)
    );

    comparisons.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      totalOrders,
      completedOrders,
      completionRate,
      avgCycleTimeDays,
      onTimeRate,
      totalValue,
    });
  }

  // Sort by total orders descending
  return comparisons.sort((a, b) => b.totalOrders - a.totalOrders);
}

/**
 * Get available tenants for filter
 */
export async function getTenantsForAnalytics(): Promise<{
  success: boolean;
  data?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    await ensureSuperAdmin();

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: tenants,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch tenants",
    };
  }
}
