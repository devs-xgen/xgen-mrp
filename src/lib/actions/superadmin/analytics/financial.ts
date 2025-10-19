"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns";

/**
 * SuperAdmin Financial Analytics Server Actions
 * Revenue, costs, profitability, billing, and cash flow analytics
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
export interface FinancialAnalyticsFilters {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
}

export interface RevenueAnalytics {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number; // % growth month over month
  avgOrderValue: number;
  trend: Array<{ date: string; amount: number; count: number }>;
  byTenant: Array<{ tenantId: string; tenantName: string; revenue: number; orderCount: number }>;
  byProductCategory: Array<{ category: string; revenue: number; orderCount: number }>;
}

export interface CostAnalytics {
  totalMaterial: number;
  totalLabor: number;
  totalOverhead: number;
  total: number;
  variance: number;
  variancePercentage: number;
  byCategory: Array<{ category: string; planned: number; actual: number; variance: number }>;
}

export interface ProfitabilityAnalytics {
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  byProduct: Array<{
    productId: string;
    productName: string;
    productSKU: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    orderCount: number;
  }>;
  byTenant: Array<{
    tenantId: string;
    tenantName: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
}

export interface BillingAnalytics {
  totalOutstanding: number;
  overdueAmount: number;
  paidThisMonth: number;
  collectionRate: number; // % of invoices paid
  avgDaysToPayment: number;
  invoicesByStatus: Array<{ status: string; count: number; amount: number }>;
  agingReport: {
    current: number; // Not yet due
    days30: number; // 1-30 days overdue
    days60: number; // 31-60 days overdue
    days90: number; // 61-90 days overdue
    days90Plus: number; // 90+ days overdue
  };
}

export interface CashFlowForecast {
  projectedRevenue30: number;
  projectedRevenue60: number;
  projectedRevenue90: number;
  projectedCosts30: number;
  projectedCosts60: number;
  projectedCosts90: number;
  netCashFlow30: number;
  netCashFlow60: number;
  netCashFlow90: number;
}

export interface FinancialAnalyticsData {
  revenue: RevenueAnalytics;
  costs: CostAnalytics;
  profitability: ProfitabilityAnalytics;
  billing: BillingAnalytics;
  cashFlow: CashFlowForecast;
}

/**
 * Get comprehensive financial analytics
 */
export async function getFinancialAnalytics(
  filters: FinancialAnalyticsFilters
): Promise<{ success: boolean; data?: FinancialAnalyticsData; error?: string }> {
  try {
    await ensureSuperAdmin();

    const { startDate, endDate, tenantId } = filters;

    // Calculate all analytics in parallel
    const [revenue, costs, profitability, billing, cashFlow] = await Promise.all([
      calculateRevenueAnalytics(startDate, endDate, tenantId),
      calculateCostAnalytics(startDate, endDate, tenantId),
      calculateProfitabilityAnalytics(startDate, endDate, tenantId),
      calculateBillingAnalytics(startDate, endDate, tenantId),
      calculateCashFlowForecast(tenantId),
    ]);

    const analyticsData: FinancialAnalyticsData = {
      revenue,
      costs,
      profitability,
      billing,
      cashFlow,
    };

    return {
      success: true,
      data: serializeDecimals(analyticsData),
    };
  } catch (error: any) {
    console.error("Error fetching financial analytics:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch financial analytics",
    };
  }
}

/**
 * Calculate revenue analytics
 */
async function calculateRevenueAnalytics(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<RevenueAnalytics> {
  const whereClause = {
    createdAt: { gte: startDate, lte: endDate },
    ...(tenantId && { tenantId }),
  };

  // Total revenue from billing statements
  const billingStatements = await prisma.billingStatement.findMany({
    where: whereClause,
    select: {
      totalAmount: true,
      paidAmount: true,
      createdAt: true,
      tenant: { select: { id: true, name: true } },
      customerOrder: {
        select: {
          orderLines: {
            select: {
              product: {
                select: {
                  productCategory: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const total = billingStatements.reduce(
    (sum, bs) => sum + Number(bs.totalAmount || 0),
    0
  );

  // This month revenue
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const thisMonthBilling = await prisma.billingStatement.aggregate({
    where: {
      createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
    _count: true,
  });
  const thisMonth = Number(thisMonthBilling._sum.totalAmount || 0);

  // Last month revenue
  const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
  const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1));
  const lastMonthBilling = await prisma.billingStatement.aggregate({
    where: {
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
  });
  const lastMonth = Number(lastMonthBilling._sum.totalAmount || 0);

  // Growth calculation
  const growth =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  // Average order value
  const avgOrderValue =
    billingStatements.length > 0 ? Math.round(total / billingStatements.length) : 0;

  // Revenue trend over time (daily)
  const trendMap = new Map<string, { amount: number; count: number }>();
  billingStatements.forEach((bs) => {
    const dateKey = format(bs.createdAt, "yyyy-MM-dd");
    const existing = trendMap.get(dateKey) || { amount: 0, count: 0 };
    trendMap.set(dateKey, {
      amount: existing.amount + Number(bs.totalAmount || 0),
      count: existing.count + 1,
    });
  });
  const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
    date,
    amount: Math.round(data.amount),
    count: data.count,
  }));

  // Revenue by tenant
  const tenantMap = new Map<string, { name: string; revenue: number; count: number }>();
  billingStatements.forEach((bs) => {
    if (bs.tenant) {
      const existing = tenantMap.get(bs.tenant.id) || {
        name: bs.tenant.name,
        revenue: 0,
        count: 0,
      };
      tenantMap.set(bs.tenant.id, {
        name: bs.tenant.name,
        revenue: existing.revenue + Number(bs.totalAmount || 0),
        count: existing.count + 1,
      });
    }
  });
  const byTenant = Array.from(tenantMap.entries()).map(([tenantId, data]) => ({
    tenantId,
    tenantName: data.name,
    revenue: Math.round(data.revenue),
    orderCount: data.count,
  }));

  // Revenue by product category
  const categoryMap = new Map<string, { revenue: number; count: number }>();
  billingStatements.forEach((bs) => {
    if (bs.customerOrder?.orderLines) {
      bs.customerOrder.orderLines.forEach((line) => {
        const category = line.product?.productCategory?.name || "Uncategorized";
        const existing = categoryMap.get(category) || { revenue: 0, count: 0 };
        // Distribute total amount proportionally (simplified - equal split)
        const lineRevenue = Number(bs.totalAmount || 0) / bs.customerOrder.orderLines.length;
        categoryMap.set(category, {
          revenue: existing.revenue + lineRevenue,
          count: existing.count + 1,
        });
      });
    }
  });
  const byProductCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    revenue: Math.round(data.revenue),
    orderCount: data.count,
  }));

  return {
    total: Math.round(total),
    thisMonth: Math.round(thisMonth),
    lastMonth: Math.round(lastMonth),
    growth,
    avgOrderValue,
    trend,
    byTenant,
    byProductCategory,
  };
}

/**
 * Calculate cost analytics
 */
async function calculateCostAnalytics(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<CostAnalytics> {
  const whereClause = {
    createdAt: { gte: startDate, lte: endDate },
    ...(tenantId && { tenantId }),
  };

  const productionOrders = await prisma.productionOrder.findMany({
    where: whereClause,
    select: {
      plannedMaterialCost: true,
      actualMaterialCost: true,
      plannedLaborCost: true,
      actualLaborCost: true,
      product: {
        select: {
          productCategory: { select: { name: true } },
        },
      },
    },
  });

  const totalMaterial = productionOrders.reduce(
    (sum, po) => sum + Number(po.actualMaterialCost || 0),
    0
  );
  const totalLabor = productionOrders.reduce(
    (sum, po) => sum + Number(po.actualLaborCost || 0),
    0
  );
  const totalOverhead = 0; // Placeholder - can be calculated based on business logic
  const total = totalMaterial + totalLabor + totalOverhead;

  const plannedMaterial = productionOrders.reduce(
    (sum, po) => sum + Number(po.plannedMaterialCost || 0),
    0
  );
  const plannedLabor = productionOrders.reduce(
    (sum, po) => sum + Number(po.plannedLaborCost || 0),
    0
  );
  const plannedTotal = plannedMaterial + plannedLabor;

  const variance = total - plannedTotal;
  const variancePercentage =
    plannedTotal > 0 ? Math.round((variance / plannedTotal) * 100) : 0;

  // Cost by category
  const categoryMap = new Map<
    string,
    { planned: number; actual: number }
  >();
  productionOrders.forEach((po) => {
    const category = po.product?.productCategory?.name || "Uncategorized";
    const existing = categoryMap.get(category) || { planned: 0, actual: 0 };
    categoryMap.set(category, {
      planned:
        existing.planned +
        Number(po.plannedMaterialCost || 0) +
        Number(po.plannedLaborCost || 0),
      actual:
        existing.actual +
        Number(po.actualMaterialCost || 0) +
        Number(po.actualLaborCost || 0),
    });
  });

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    planned: Math.round(data.planned),
    actual: Math.round(data.actual),
    variance: Math.round(data.actual - data.planned),
  }));

  return {
    totalMaterial: Math.round(totalMaterial),
    totalLabor: Math.round(totalLabor),
    totalOverhead: Math.round(totalOverhead),
    total: Math.round(total),
    variance: Math.round(variance),
    variancePercentage,
    byCategory,
  };
}

/**
 * Calculate profitability analytics
 */
async function calculateProfitabilityAnalytics(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<ProfitabilityAnalytics> {
  const whereClause = {
    createdAt: { gte: startDate, lte: endDate },
    ...(tenantId && { tenantId }),
  };

  // Get billing statements with linked production orders
  const billingStatements = await prisma.billingStatement.findMany({
    where: whereClause,
    select: {
      totalAmount: true,
      productionOrder: {
        select: {
          actualMaterialCost: true,
          actualLaborCost: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  let totalRevenue = 0;
  let totalCost = 0;

  // By product
  const productMap = new Map<
    string,
    {
      name: string;
      sku: string;
      revenue: number;
      cost: number;
      count: number;
    }
  >();

  // By tenant
  const tenantMap = new Map<
    string,
    {
      name: string;
      revenue: number;
      cost: number;
    }
  >();

  billingStatements.forEach((bs) => {
    const revenue = Number(bs.totalAmount || 0);
    const cost = bs.productionOrder
      ? Number(bs.productionOrder.actualMaterialCost || 0) +
        Number(bs.productionOrder.actualLaborCost || 0)
      : 0;

    totalRevenue += revenue;
    totalCost += cost;

    // By product
    if (bs.productionOrder?.product) {
      const product = bs.productionOrder.product;
      const existing = productMap.get(product.id) || {
        name: product.name,
        sku: product.sku,
        revenue: 0,
        cost: 0,
        count: 0,
      };
      productMap.set(product.id, {
        name: product.name,
        sku: product.sku,
        revenue: existing.revenue + revenue,
        cost: existing.cost + cost,
        count: existing.count + 1,
      });
    }

    // By tenant
    if (bs.tenant) {
      const existing = tenantMap.get(bs.tenant.id) || {
        name: bs.tenant.name,
        revenue: 0,
        cost: 0,
      };
      tenantMap.set(bs.tenant.id, {
        name: bs.tenant.name,
        revenue: existing.revenue + revenue,
        cost: existing.cost + cost,
      });
    }
  });

  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netProfit = grossProfit; // Simplified - same as gross for now
  const netMargin = grossMargin;

  const byProduct = Array.from(productMap.entries()).map(([productId, data]) => {
    const profit = data.revenue - data.cost;
    const margin = data.revenue > 0 ? Math.round((profit / data.revenue) * 100) : 0;
    return {
      productId,
      productName: data.name,
      productSKU: data.sku,
      revenue: Math.round(data.revenue),
      cost: Math.round(data.cost),
      profit: Math.round(profit),
      margin,
      orderCount: data.count,
    };
  });

  const byTenant = Array.from(tenantMap.entries()).map(([tenantId, data]) => {
    const profit = data.revenue - data.cost;
    const margin = data.revenue > 0 ? Math.round((profit / data.revenue) * 100) : 0;
    return {
      tenantId,
      tenantName: data.name,
      revenue: Math.round(data.revenue),
      cost: Math.round(data.cost),
      profit: Math.round(profit),
      margin,
    };
  });

  return {
    grossProfit: Math.round(grossProfit),
    grossMargin,
    netProfit: Math.round(netProfit),
    netMargin,
    byProduct: byProduct.sort((a, b) => b.margin - a.margin),
    byTenant: byTenant.sort((a, b) => b.margin - a.margin),
  };
}

/**
 * Calculate billing analytics
 */
async function calculateBillingAnalytics(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<BillingAnalytics> {
  const now = new Date();

  // Outstanding invoices (not paid)
  const outstanding = await prisma.salesInvoice.aggregate({
    where: {
      status: { in: ["DRAFT", "SENT", "OVERDUE"] },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
  });
  const totalOutstanding = Number(outstanding._sum.totalAmount || 0);

  // Overdue invoices
  const overdue = await prisma.salesInvoice.aggregate({
    where: {
      status: { in: ["SENT", "OVERDUE"] },
      dueDate: { lt: now },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
  });
  const overdueAmount = Number(overdue._sum.totalAmount || 0);

  // Paid this month
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const paidThisMonthAgg = await prisma.salesInvoice.aggregate({
    where: {
      status: "PAID",
      updatedAt: { gte: thisMonthStart, lte: thisMonthEnd },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
  });
  const paidThisMonth = Number(paidThisMonthAgg._sum.totalAmount || 0);

  // Collection rate
  const allInvoices = await prisma.salesInvoice.count({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(tenantId && { tenantId }),
    },
  });
  const paidInvoices = await prisma.salesInvoice.count({
    where: {
      status: "PAID",
      createdAt: { gte: startDate, lte: endDate },
      ...(tenantId && { tenantId }),
    },
  });
  const collectionRate = allInvoices > 0 ? Math.round((paidInvoices / allInvoices) * 100) : 0;

  // Average days to payment
  const paidInvoicesList = await prisma.salesInvoice.findMany({
    where: {
      status: "PAID",
      createdAt: { gte: startDate, lte: endDate },
      ...(tenantId && { tenantId }),
    },
    select: {
      issueDate: true,
      updatedAt: true, // Using updatedAt as payment date
    },
  });
  let avgDaysToPayment = 0;
  if (paidInvoicesList.length > 0) {
    const totalDays = paidInvoicesList.reduce((sum, inv) => {
      return sum + differenceInDays(inv.updatedAt, inv.issueDate);
    }, 0);
    avgDaysToPayment = Math.round(totalDays / paidInvoicesList.length);
  }

  // Invoices by status
  const statusGroups = await prisma.salesInvoice.groupBy({
    by: ["status"],
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(tenantId && { tenantId }),
    },
    _count: { status: true },
    _sum: { totalAmount: true },
  });
  const invoicesByStatus = statusGroups.map((group) => ({
    status: group.status,
    count: group._count.status,
    amount: Math.round(Number(group._sum.totalAmount || 0)),
  }));

  // Aging report
  const agingReport = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days90Plus: 0,
  };

  const unpaidInvoices = await prisma.salesInvoice.findMany({
    where: {
      status: { in: ["SENT", "OVERDUE"] },
      ...(tenantId && { tenantId }),
    },
    select: {
      totalAmount: true,
      dueDate: true,
    },
  });

  unpaidInvoices.forEach((inv) => {
    const amount = Number(inv.totalAmount || 0);
    if (!inv.dueDate || inv.dueDate >= now) {
      agingReport.current += amount;
    } else {
      const daysOverdue = differenceInDays(now, inv.dueDate);
      if (daysOverdue <= 30) {
        agingReport.days30 += amount;
      } else if (daysOverdue <= 60) {
        agingReport.days60 += amount;
      } else if (daysOverdue <= 90) {
        agingReport.days90 += amount;
      } else {
        agingReport.days90Plus += amount;
      }
    }
  });

  // Round all aging values
  Object.keys(agingReport).forEach((key) => {
    agingReport[key as keyof typeof agingReport] = Math.round(
      agingReport[key as keyof typeof agingReport]
    );
  });

  return {
    totalOutstanding: Math.round(totalOutstanding),
    overdueAmount: Math.round(overdueAmount),
    paidThisMonth: Math.round(paidThisMonth),
    collectionRate,
    avgDaysToPayment,
    invoicesByStatus,
    agingReport,
  };
}

/**
 * Calculate cash flow forecast
 */
async function calculateCashFlowForecast(
  tenantId?: string
): Promise<CashFlowForecast> {
  const now = new Date();
  const days30 = subDays(now, -30);
  const days60 = subDays(now, -60);
  const days90 = subDays(now, -90);

  // Projected revenue from pending customer orders
  const projectedRevenue30Agg = await prisma.customerOrder.aggregate({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      deliveryDate: { lte: days30 },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
  });
  const projectedRevenue30 = Number(projectedRevenue30Agg._sum.totalAmount || 0);

  const projectedRevenue60Agg = await prisma.customerOrder.aggregate({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      deliveryDate: { lte: days60 },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
  });
  const projectedRevenue60 = Number(projectedRevenue60Agg._sum.totalAmount || 0);

  const projectedRevenue90Agg = await prisma.customerOrder.aggregate({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      deliveryDate: { lte: days90 },
      ...(tenantId && { tenantId }),
    },
    _sum: { totalAmount: true },
  });
  const projectedRevenue90 = Number(projectedRevenue90Agg._sum.totalAmount || 0);

  // Projected costs from active production orders
  const projectedCosts30Agg = await prisma.productionOrder.aggregate({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { lte: days30 },
      ...(tenantId && { tenantId }),
    },
    _sum: { plannedMaterialCost: true, plannedLaborCost: true },
  });
  const projectedCosts30 =
    Number(projectedCosts30Agg._sum.plannedMaterialCost || 0) +
    Number(projectedCosts30Agg._sum.plannedLaborCost || 0);

  const projectedCosts60Agg = await prisma.productionOrder.aggregate({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { lte: days60 },
      ...(tenantId && { tenantId }),
    },
    _sum: { plannedMaterialCost: true, plannedLaborCost: true },
  });
  const projectedCosts60 =
    Number(projectedCosts60Agg._sum.plannedMaterialCost || 0) +
    Number(projectedCosts60Agg._sum.plannedLaborCost || 0);

  const projectedCosts90Agg = await prisma.productionOrder.aggregate({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { lte: days90 },
      ...(tenantId && { tenantId }),
    },
    _sum: { plannedMaterialCost: true, plannedLaborCost: true },
  });
  const projectedCosts90 =
    Number(projectedCosts90Agg._sum.plannedMaterialCost || 0) +
    Number(projectedCosts90Agg._sum.plannedLaborCost || 0);

  return {
    projectedRevenue30: Math.round(projectedRevenue30),
    projectedRevenue60: Math.round(projectedRevenue60),
    projectedRevenue90: Math.round(projectedRevenue90),
    projectedCosts30: Math.round(projectedCosts30),
    projectedCosts60: Math.round(projectedCosts60),
    projectedCosts90: Math.round(projectedCosts90),
    netCashFlow30: Math.round(projectedRevenue30 - projectedCosts30),
    netCashFlow60: Math.round(projectedRevenue60 - projectedCosts60),
    netCashFlow90: Math.round(projectedRevenue90 - projectedCosts90),
  };
}
