"use server";

import { prisma } from "@/lib/db";
import { ensureSuperAdmin } from "./index";
import type {
  ProductionOrderStatusData,
  InventoryHealthData,
  RevenueData,
  QualityMetricsData,
  TopProductsData,
  MaterialConsumptionData,
} from "./index";

/**
 * Get production orders by status
 */
export async function getProductionOrdersAnalytics(): Promise<ProductionOrderStatusData[]> {
  try {
    await ensureSuperAdmin();

    const productionOrders = await prisma.productionOrder.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { actualMaterialCost: true, plannedMaterialCost: true },
    });

    return productionOrders.map(order => ({
      status: order.status,
      count: order._count.id,
      value: Number(order._sum.actualMaterialCost || order._sum.plannedMaterialCost || 0),
    }));
  } catch (error) {
    console.error("Error fetching production orders analytics:", error);
    return [];
  }
}

/**
 * Get inventory health by category/type
 */
export async function getInventoryHealthAnalytics(): Promise<InventoryHealthData[]> {
  try {
    await ensureSuperAdmin();

    const materialsByType = await prisma.material.groupBy({
      by: ['typeId'],
      _count: { id: true },
      where: { status: 'ACTIVE' },
    });

    const materialTypes = await prisma.materialType.findMany({
      where: { id: { in: materialsByType.map(m => m.typeId) } },
      select: { id: true, name: true },
    });

    const materialTypeMap = Object.fromEntries(materialTypes.map(t => [t.id, t.name]));

    const productsByCategory = await prisma.product.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      where: { status: 'ACTIVE', archivedAt: null },
    });

    const categories = await prisma.productCategory.findMany({
      where: { id: { in: productsByCategory.map(p => p.categoryId) } },
      select: { id: true, name: true },
    });

    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

    return [
      ...materialsByType.map(m => ({
        category: materialTypeMap[m.typeId] || 'Unknown',
        materials: m._count.id,
        products: 0,
      })),
      ...productsByCategory.map(p => ({
        category: categoryMap[p.categoryId] || 'Unknown',
        materials: 0,
        products: p._count.id,
      })),
    ];
  } catch (error) {
    console.error("Error fetching inventory health analytics:", error);
    return [];
  }
}

/**
 * Get revenue trends for last 6 months
 */
export async function getRevenueAnalytics(): Promise<RevenueData[]> {
  try {
    await ensureSuperAdmin();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const billingStatements = await prisma.billingStatement.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        status: { in: ['PAID', 'PARTIAL'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    const revenueByMonth: { [key: string]: { revenue: number; orders: number } } = {};
    billingStatements.forEach(statement => {
      const monthKey = new Date(statement.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = { revenue: 0, orders: 0 };
      }
      revenueByMonth[monthKey].revenue += Number(statement.totalAmount);
      revenueByMonth[monthKey].orders += 1;
    });

    return Object.entries(revenueByMonth).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders,
    }));
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return [];
  }
}

/**
 * Get quality metrics
 */
export async function getQualityMetricsAnalytics(): Promise<QualityMetricsData> {
  try {
    await ensureSuperAdmin();

    const qualityChecks = await prisma.qualityCheck.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const totalChecks = qualityChecks.reduce((sum, q) => sum + q._count.id, 0);
    const passed = qualityChecks.find(q => q.status === 'APPROVED')?._count.id || 0;
    const failed = qualityChecks.find(q => q.status === 'REJECTED')?._count.id || 0;
    const pending = qualityChecks.find(q => q.status === 'PENDING')?._count.id || 0;

    return {
      totalChecks,
      passed,
      failed,
      pending,
      passRate: totalChecks > 0 ? (passed / totalChecks) * 100 : 0,
    };
  } catch (error) {
    console.error("Error fetching quality metrics:", error);
    return { totalChecks: 0, passed: 0, failed: 0, pending: 0, passRate: 0 };
  }
}

/**
 * Get top 5 products by orders
 */
export async function getTopProductsAnalytics(): Promise<TopProductsData[]> {
  try {
    await ensureSuperAdmin();

    const topProductsRaw = await prisma.orderLine.groupBy({
      by: ['productId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const productIds = topProductsRaw.map(p => p.productId).filter(Boolean) as string[];

    if (productIds.length === 0) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productRevenue: { [key: string]: number } = {};
    for (const productId of productIds) {
      const orderLines = await prisma.orderLine.findMany({
        where: { productId },
        select: { quantity: true, unitPrice: true },
      });
      productRevenue[productId] = orderLines.reduce(
        (sum, line) => sum + Number(line.unitPrice) * line.quantity,
        0
      );
    }

    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

    return topProductsRaw
      .filter(p => p.productId)
      .map(p => ({
        name: productMap[p.productId!] || 'Unknown',
        orders: p._count.id,
        revenue: productRevenue[p.productId!] || 0,
      }));
  } catch (error) {
    console.error("Error fetching top products analytics:", error);
    return [];
  }
}

/**
 * Get material consumption
 */
export async function getMaterialConsumptionAnalytics(): Promise<MaterialConsumptionData[]> {
  try {
    await ensureSuperAdmin();

    const materialConsumptionRaw = await prisma.productionMaterialConsumption.groupBy({
      by: ['materialId'],
      _sum: { actualQuantity: true },
      orderBy: { _sum: { actualQuantity: 'desc' } },
      take: 5,
    });

    const materialIds = materialConsumptionRaw.map(m => m.materialId);

    if (materialIds.length === 0) {
      return [];
    }

    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true, committedStock: true },
    });

    const materialMap = Object.fromEntries(materials.map(m => [m.id, { name: m.name, reserved: m.committedStock }]));

    return materialConsumptionRaw.map(m => ({
      name: materialMap[m.materialId]?.name || 'Unknown',
      consumed: Number(m._sum.actualQuantity || 0),
      reserved: materialMap[m.materialId]?.reserved || 0,
    }));
  } catch (error) {
    console.error("Error fetching material consumption analytics:", error);
    return [];
  }
}

/**
 * Get low stock alerts
 */
export async function getLowStockAlerts(): Promise<{ materials: number; products: number }> {
  try {
    await ensureSuperAdmin();

    const lowStockMaterials = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM "Material"
      WHERE "status" = 'ACTIVE'
      AND "currentStock" <= "minimumStockLevel"
    `;

    const lowStockProducts = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM "Product"
      WHERE "status" = 'ACTIVE'
      AND "archivedAt" IS NULL
      AND "currentStock" <= "minimumStockLevel"
    `;

    return {
      materials: Number(lowStockMaterials[0]?.count || 0),
      products: Number(lowStockProducts[0]?.count || 0),
    };
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    return { materials: 0, products: 0 };
  }
}

/**
 * Get production efficiency
 */
export async function getProductionEfficiency(): Promise<{ onTime: number; delayed: number; total: number }> {
  try {
    await ensureSuperAdmin();

    const completedOrders = await prisma.productionOrder.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        dueDate: true,
        completedAt: true,
      },
    });

    let onTime = 0;
    let delayed = 0;

    completedOrders.forEach(order => {
      if (order.completedAt && order.dueDate) {
        if (order.completedAt <= order.dueDate) {
          onTime++;
        } else {
          delayed++;
        }
      }
    });

    return {
      onTime,
      delayed,
      total: completedOrders.length,
    };
  } catch (error) {
    console.error("Error fetching production efficiency:", error);
    return { onTime: 0, delayed: 0, total: 0 };
  }
}
