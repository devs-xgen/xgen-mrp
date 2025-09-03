"use server";

import { prisma } from "@/lib/db";
import { Status, FulfillmentType, FulfillmentStatus } from "@prisma/client";

export interface OrderAnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  fulfillmentBreakdown: {
    fromStock: number;
    fromProduction: number;
    hybrid: number;
    pending: number;
    percentageFromStock: number;
    percentageFromProduction: number;
  };
  monthlyTrends: Array<{
    month: string;
    orders: number;
    revenue: number;
    avgFulfillmentTime: number;
    stockFulfillment: number;
    productionFulfillment: number;
  }>;
  performanceMetrics: {
    averageCompletionRate: number;
    ordersCompletedOnTime: number;
    ordersOverdue: number;
    averageProcessingTime: number; // days
    stockUtilizationRate: number;
    productionEfficiencyRate: number;
  };
  customerInsights: {
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      totalOrders: number;
      totalRevenue: number;
      avgOrderValue: number;
      preferredFulfillmentType: string;
    }>;
    newCustomers: number;
    returningCustomers: number;
  };
}

export interface FulfillmentAnalytics {
  totalOrderLines: number;
  stockFulfilledLines: number;
  productionFulfilledLines: number;
  hybridFulfilledLines: number;
  pendingLines: number;
  avgFulfillmentTime: {
    stock: number; // hours
    production: number; // days
    hybrid: number; // days
  };
  fulfillmentAccuracy: {
    stockAccuracy: number; // percentage
    productionAccuracy: number; // percentage
    overallAccuracy: number; // percentage
  };
  stockVsProductionTrend: Array<{
    period: string;
    stockPercentage: number;
    productionPercentage: number;
    hybridPercentage: number;
  }>;
}

export interface ProductionPlanningMetrics {
  totalProductionOrders: number;
  productionOrdersByStatus: Record<string, number>;
  averageLeadTime: number; // days
  onTimeDelivery: number; // percentage
  materialUtilization: number; // percentage
  productionEfficiency: number; // percentage
  topProducedProducts: Array<{
    productId: string;
    productName: string;
    totalQuantityProduced: number;
    averageLeadTime: number;
    successRate: number;
  }>;
  productionCapacityUtilization: Array<{
    month: string;
    plannedCapacity: number;
    actualOutput: number;
    utilizationRate: number;
  }>;
}

/**
 * Get comprehensive order analytics summary
 */
export async function getOrderAnalyticsSummary(dateRange?: {
  from: Date;
  to: Date;
}): Promise<OrderAnalyticsSummary> {
  try {
    const whereClause: any = {};

    if (dateRange) {
      whereClause.orderDate = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    // Fetch basic order metrics
    const [orders, orderStats] = await Promise.all([
      prisma.customerOrder.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          orderLines: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              fulfillmentType: true,
              fulfillmentStatus: true,
              stockAllocated: true,
              productionQuantity: true,
              allocatedAt: true,
              fulfilledAt: true,
            },
          },
          _count: {
            select: {
              productionOrders: true,
            },
          },
        },
        orderBy: {
          orderDate: "desc",
        },
      }),
      prisma.customerOrder.aggregate({
        where: whereClause,
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),
    ]);

    // Calculate fulfillment breakdown
    let stockFulfilled = 0;
    let productionFulfilled = 0;
    let hybridFulfilled = 0;
    let pendingFulfilled = 0;

    orders.forEach((order) => {
      order.orderLines.forEach((line) => {
        switch (line.fulfillmentType) {
          case FulfillmentType.STOCK:
            stockFulfilled++;
            break;
          case FulfillmentType.PRODUCTION:
            productionFulfilled++;
            break;
          case FulfillmentType.HYBRID:
            hybridFulfilled++;
            break;
          default:
            pendingFulfilled++;
        }
      });
    });

    const totalFulfillmentLines =
      stockFulfilled + productionFulfilled + hybridFulfilled + pendingFulfilled;

    // Calculate order status breakdown
    const ordersByStatus = orders.reduce(
      (acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {}
    );

    // Calculate monthly trends (last 12 months)
    const monthlyTrends = await calculateMonthlyTrends(whereClause);

    // Calculate performance metrics
    const performanceMetrics = await calculatePerformanceMetrics(orders);

    // Calculate customer insights
    const customerInsights = await calculateCustomerInsights(orders);

    return {
      totalOrders: orderStats._count.id,
      totalRevenue: orderStats._sum.totalAmount?.toNumber() || 0,
      averageOrderValue: orderStats._avg.totalAmount?.toNumber() || 0,
      ordersByStatus,
      fulfillmentBreakdown: {
        fromStock: stockFulfilled,
        fromProduction: productionFulfilled,
        hybrid: hybridFulfilled,
        pending: pendingFulfilled,
        percentageFromStock:
          totalFulfillmentLines > 0
            ? Math.round((stockFulfilled / totalFulfillmentLines) * 100)
            : 0,
        percentageFromProduction:
          totalFulfillmentLines > 0
            ? Math.round((productionFulfilled / totalFulfillmentLines) * 100)
            : 0,
      },
      monthlyTrends,
      performanceMetrics,
      customerInsights,
    };
  } catch (error) {
    console.error("Error getting order analytics summary:", error);
    throw new Error("Failed to get order analytics summary");
  }
}

/**
 * Get detailed fulfillment analytics
 */
export async function getFulfillmentAnalytics(dateRange?: {
  from: Date;
  to: Date;
}): Promise<FulfillmentAnalytics> {
  try {
    const whereClause: any = {};

    if (dateRange) {
      whereClause.customerOrder = {
        orderDate: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      };
    }

    const orderLines = await prisma.orderLine.findMany({
      where: whereClause,
      include: {
        customerOrder: {
          select: {
            orderDate: true,
            requiredDate: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalOrderLines = orderLines.length;
    let stockFulfilledLines = 0;
    let productionFulfilledLines = 0;
    let hybridFulfilledLines = 0;
    let pendingLines = 0;

    // Calculate fulfillment times
    const stockFulfillmentTimes: number[] = [];
    const productionFulfillmentTimes: number[] = [];
    const hybridFulfillmentTimes: number[] = [];

    orderLines.forEach((line) => {
      switch (line.fulfillmentType) {
        case FulfillmentType.STOCK:
          stockFulfilledLines++;
          if (line.allocatedAt && line.fulfilledAt) {
            const timeDiff =
              line.fulfilledAt.getTime() - line.allocatedAt.getTime();
            stockFulfillmentTimes.push(timeDiff / (1000 * 60 * 60)); // hours
          }
          break;
        case FulfillmentType.PRODUCTION:
          productionFulfilledLines++;
          if (line.allocatedAt && line.fulfilledAt) {
            const timeDiff =
              line.fulfilledAt.getTime() - line.allocatedAt.getTime();
            productionFulfillmentTimes.push(timeDiff / (1000 * 60 * 60 * 24)); // days
          }
          break;
        case FulfillmentType.HYBRID:
          hybridFulfilledLines++;
          if (line.allocatedAt && line.fulfilledAt) {
            const timeDiff =
              line.fulfilledAt.getTime() - line.allocatedAt.getTime();
            hybridFulfillmentTimes.push(timeDiff / (1000 * 60 * 60 * 24)); // days
          }
          break;
        default:
          pendingLines++;
      }
    });

    const avgFulfillmentTime = {
      stock:
        stockFulfillmentTimes.length > 0
          ? stockFulfillmentTimes.reduce((a, b) => a + b, 0) /
            stockFulfillmentTimes.length
          : 0,
      production:
        productionFulfillmentTimes.length > 0
          ? productionFulfillmentTimes.reduce((a, b) => a + b, 0) /
            productionFulfillmentTimes.length
          : 0,
      hybrid:
        hybridFulfillmentTimes.length > 0
          ? hybridFulfillmentTimes.reduce((a, b) => a + b, 0) /
            hybridFulfillmentTimes.length
          : 0,
    };

    // Calculate fulfillment accuracy (fulfilled vs planned)
    const fulfilledLines = orderLines.filter(
      (line) => line.fulfillmentStatus === FulfillmentStatus.FULFILLED
    );
    const stockAccuracyLines = fulfilledLines.filter(
      (line) => line.fulfillmentType === FulfillmentType.STOCK
    );
    const productionAccuracyLines = fulfilledLines.filter(
      (line) => line.fulfillmentType === FulfillmentType.PRODUCTION
    );

    const fulfillmentAccuracy = {
      stockAccuracy:
        stockFulfilledLines > 0
          ? Math.round((stockAccuracyLines.length / stockFulfilledLines) * 100)
          : 0,
      productionAccuracy:
        productionFulfilledLines > 0
          ? Math.round(
              (productionAccuracyLines.length / productionFulfilledLines) * 100
            )
          : 0,
      overallAccuracy:
        totalOrderLines > 0
          ? Math.round((fulfilledLines.length / totalOrderLines) * 100)
          : 0,
    };

    // Calculate stock vs production trend (last 6 months)
    const stockVsProductionTrend = await calculateStockVsProductionTrend();

    return {
      totalOrderLines,
      stockFulfilledLines,
      productionFulfilledLines,
      hybridFulfilledLines,
      pendingLines,
      avgFulfillmentTime,
      fulfillmentAccuracy,
      stockVsProductionTrend,
    };
  } catch (error) {
    console.error("Error getting fulfillment analytics:", error);
    throw new Error("Failed to get fulfillment analytics");
  }
}

/**
 * Get production planning metrics
 */
export async function getProductionPlanningMetrics(dateRange?: {
  from: Date;
  to: Date;
}): Promise<ProductionPlanningMetrics> {
  try {
    const whereClause: any = {};

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    const productionOrders = await prisma.productionOrder.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            name: true,
          },
        },
        customerOrder: {
          select: {
            requiredDate: true,
          },
        },
      },
    });

    const totalProductionOrders = productionOrders.length;

    // Calculate status breakdown
    const productionOrdersByStatus = productionOrders.reduce(
      (acc: Record<string, number>, po) => {
        acc[po.status] = (acc[po.status] || 0) + 1;
        return acc;
      },
      {}
    );

    // Calculate lead times and on-time delivery
    let totalLeadTime = 0;
    let onTimeDeliveries = 0;
    let completedOrders = 0;

    productionOrders.forEach((po) => {
      if (po.completedAt) {
        const leadTime =
          (po.completedAt.getTime() - po.startDate.getTime()) /
          (1000 * 60 * 60 * 24);
        totalLeadTime += leadTime;
        completedOrders++;

        if (
          po.customerOrder &&
          po.completedAt <= po.customerOrder.requiredDate
        ) {
          onTimeDeliveries++;
        }
      }
    });

    const averageLeadTime =
      completedOrders > 0 ? totalLeadTime / completedOrders : 0;
    const onTimeDelivery =
      completedOrders > 0
        ? Math.round((onTimeDeliveries / completedOrders) * 100)
        : 0;

    // Calculate top produced products
    const productStats = productionOrders.reduce(
      (acc: Record<string, any>, po) => {
        const key = po.productId;
        if (!acc[key]) {
          acc[key] = {
            productId: po.productId,
            productName: po.product.name,
            orders: [],
          };
        }
        acc[key].orders.push(po);
        return acc;
      },
      {}
    );

    const topProducedProducts = Object.values(productStats)
      .map((stat: any) => ({
        productId: stat.productId,
        productName: stat.productName,
        totalQuantityProduced: stat.orders.reduce(
          (sum: number, po: any) => sum + po.completedQuantity,
          0
        ),
        averageLeadTime:
          stat.orders.filter((po: any) => po.completedAt).length > 0
            ? stat.orders
                .filter((po: any) => po.completedAt)
                .reduce(
                  (sum: number, po: any) =>
                    sum +
                    (po.completedAt.getTime() - po.startDate.getTime()) /
                      (1000 * 60 * 60 * 24),
                  0
                ) / stat.orders.filter((po: any) => po.completedAt).length
            : 0,
        successRate:
          stat.orders.length > 0
            ? Math.round(
                (stat.orders.filter((po: any) => po.status === Status.COMPLETED)
                  .length /
                  stat.orders.length) *
                  100
              )
            : 0,
      }))
      .sort((a, b) => b.totalQuantityProduced - a.totalQuantityProduced)
      .slice(0, 10);

    return {
      totalProductionOrders,
      productionOrdersByStatus,
      averageLeadTime,
      onTimeDelivery,
      materialUtilization: 85, // Mock value - would need material consumption data
      productionEfficiency: 78, // Mock value - would need detailed production metrics
      topProducedProducts,
      productionCapacityUtilization: [], // Mock - would need capacity planning data
    };
  } catch (error) {
    console.error("Error getting production planning metrics:", error);
    throw new Error("Failed to get production planning metrics");
  }
}

// Helper functions

async function calculateMonthlyTrends(whereClause: any) {
  // This would calculate monthly trends for the last 12 months
  // For now, returning mock data structure
  return [
    {
      month: "Jan 2025",
      orders: 45,
      revenue: 125000,
      avgFulfillmentTime: 3.2,
      stockFulfillment: 65,
      productionFulfillment: 35,
    },
    {
      month: "Dec 2024",
      orders: 52,
      revenue: 142000,
      avgFulfillmentTime: 2.8,
      stockFulfillment: 72,
      productionFulfillment: 28,
    },
    // ... would calculate actual data from database
  ];
}

async function calculatePerformanceMetrics(orders: any[]) {
  const now = new Date();
  let totalCompletionRate = 0;
  let ordersCompletedOnTime = 0;
  let ordersOverdue = 0;
  let totalProcessingTime = 0;
  let completedOrders = 0;

  orders.forEach((order) => {
    // Calculate completion rate based on order lines
    const orderLines = order.orderLines;
    if (orderLines.length > 0) {
      const fulfilledLines = orderLines.filter(
        (line: any) => line.fulfillmentStatus === FulfillmentStatus.FULFILLED
      );
      const completionRate = (fulfilledLines.length / orderLines.length) * 100;
      totalCompletionRate += completionRate;
    }

    // Check if order is completed on time or overdue
    if (order.status === Status.COMPLETED) {
      completedOrders++;
      const processingTime =
        (order.updatedAt.getTime() - order.orderDate.getTime()) /
        (1000 * 60 * 60 * 24);
      totalProcessingTime += processingTime;

      if (order.updatedAt <= order.requiredDate) {
        ordersCompletedOnTime++;
      }
    } else if (order.requiredDate < now && order.status !== Status.CANCELLED) {
      ordersOverdue++;
    }
  });

  return {
    averageCompletionRate:
      orders.length > 0 ? Math.round(totalCompletionRate / orders.length) : 0,
    ordersCompletedOnTime,
    ordersOverdue,
    averageProcessingTime:
      completedOrders > 0
        ? Math.round(totalProcessingTime / completedOrders)
        : 0,
    stockUtilizationRate: 76, // Mock value
    productionEfficiencyRate: 82, // Mock value
  };
}

async function calculateCustomerInsights(orders: any[]) {
  const customerStats = orders.reduce((acc: Record<string, any>, order) => {
    const customerId = order.customer.id;
    if (!acc[customerId]) {
      acc[customerId] = {
        customerId,
        customerName: order.customer.name,
        orders: [],
        totalRevenue: 0,
      };
    }
    acc[customerId].orders.push(order);
    acc[customerId].totalRevenue += order.totalAmount;
    return acc;
  }, {});

  const topCustomers = Object.values(customerStats)
    .map((customer: any) => {
      const stockOrders = customer.orders.filter((o: any) =>
        o.orderLines.some(
          (line: any) => line.fulfillmentType === FulfillmentType.STOCK
        )
      ).length;
      const productionOrders = customer.orders.filter((o: any) =>
        o.orderLines.some(
          (line: any) => line.fulfillmentType === FulfillmentType.PRODUCTION
        )
      ).length;

      return {
        customerId: customer.customerId,
        customerName: customer.customerName,
        totalOrders: customer.orders.length,
        totalRevenue: customer.totalRevenue,
        avgOrderValue: customer.totalRevenue / customer.orders.length,
        preferredFulfillmentType:
          stockOrders > productionOrders ? "Stock" : "Production",
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  return {
    topCustomers,
    newCustomers: 12, // Mock value - would need customer creation dates
    returningCustomers: Object.keys(customerStats).length - 12,
  };
}

async function calculateStockVsProductionTrend() {
  // Mock data for stock vs production trend over last 6 months
  return [
    {
      period: "Aug 2024",
      stockPercentage: 65,
      productionPercentage: 30,
      hybridPercentage: 5,
    },
    {
      period: "Sep 2024",
      stockPercentage: 62,
      productionPercentage: 33,
      hybridPercentage: 5,
    },
    {
      period: "Oct 2024",
      stockPercentage: 68,
      productionPercentage: 28,
      hybridPercentage: 4,
    },
    {
      period: "Nov 2024",
      stockPercentage: 70,
      productionPercentage: 25,
      hybridPercentage: 5,
    },
    {
      period: "Dec 2024",
      stockPercentage: 72,
      productionPercentage: 23,
      hybridPercentage: 5,
    },
    {
      period: "Jan 2025",
      stockPercentage: 67,
      productionPercentage: 28,
      hybridPercentage: 5,
    },
  ];
}
