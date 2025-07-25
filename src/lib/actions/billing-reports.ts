"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  BillingAnalytics,
  SalesReportData,
  DeliveryAnalytics,
  MonthlyRevenue,
  StatusBreakdown,
  CustomerAnalytics,
  BillingActivity,
  DailySales,
  MonthlySales,
  ProductSales,
  CustomerSales,
  DeliveryMethodStats,
  CourierStats,
  DeliveryActivity,
  BillingStatus,
  DeliveryStatus,
  InvoiceStatus,
} from "@/types/admin/billing";

// ==============================================
// BILLING TYPE ANALYTICS
// ==============================================

export interface BillingTypeAnalytics {
  billingType: 'direct-customer' | 'customer-order' | 'manual-customer';
  count: number;
  totalAmount: number;
  percentage: number;
  averageAmount: number;
  lastUsed?: Date;
}

export interface BillingTypeRecommendation {
  recommendedType: 'direct-customer' | 'customer-order' | 'manual-customer';
  reason: string;
  confidence: number;
  basedOn: 'usage-pattern' | 'recent-activity' | 'customer-data';
}

export async function getBillingTypeAnalytics(
  startDate?: Date,
  endDate?: Date,
  userId?: string
): Promise<BillingTypeAnalytics[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const dateFilter =
      startDate && endDate
        ? {
            billingDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    const userFilter = userId ? { createdBy: userId } : {};

    // Determine billing type based on data patterns
    const billingStatements = await prisma.billingStatement.findMany({
      where: {
        ...dateFilter,
        ...userFilter,
      },
      select: {
        id: true,
        customerId: true,
        customerOrderId: true,
        customerName: true,
        totalAmount: true,
        createdAt: true,
        customer: {
          select: { id: true, name: true }
        },
        customerOrder: {
          select: { id: true, orderNumber: true }
        }
      },
    });

    // Categorize billing statements by type
    const typeStats: Record<string, { count: number; totalAmount: number; lastUsed?: Date }> = {
      'direct-customer': { count: 0, totalAmount: 0 },
      'customer-order': { count: 0, totalAmount: 0 },
      'manual-customer': { count: 0, totalAmount: 0 },
    };

    billingStatements.forEach((statement) => {
      let billingType: string;
      
      if (statement.customerOrderId && statement.customerOrder) {
        billingType = 'customer-order';
      } else if (statement.customerId && statement.customer) {
        billingType = 'direct-customer';
      } else {
        billingType = 'manual-customer';
      }

      typeStats[billingType].count++;
      typeStats[billingType].totalAmount += statement.totalAmount.toNumber();
      
      if (!typeStats[billingType].lastUsed || statement.createdAt > typeStats[billingType].lastUsed) {
        typeStats[billingType].lastUsed = statement.createdAt;
      }
    });

    const totalCount = billingStatements.length;
    
    return Object.entries(typeStats).map(([type, stats]) => ({
      billingType: type as 'direct-customer' | 'customer-order' | 'manual-customer',
      count: stats.count,
      totalAmount: stats.totalAmount,
      percentage: totalCount > 0 ? (stats.count / totalCount) * 100 : 0,
      averageAmount: stats.count > 0 ? stats.totalAmount / stats.count : 0,
      lastUsed: stats.lastUsed,
    }));
  } catch (error) {
    console.error("Error fetching billing type analytics:", error);
    throw new Error("Failed to fetch billing type analytics");
  }
}

export async function getBillingTypeRecommendations(
  userId?: string
): Promise<BillingTypeRecommendation[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const currentUserId = userId || session.user.id;
    
    // Get recent billing patterns (last 30 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    
    const recentAnalytics = await getBillingTypeAnalytics(recentDate, new Date(), currentUserId);
    const allTimeAnalytics = await getBillingTypeAnalytics(undefined, undefined, currentUserId);
    
    const recommendations: BillingTypeRecommendation[] = [];
    
    // Recommendation 1: Most used type
    const mostUsedType = allTimeAnalytics.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    );
    
    if (mostUsedType.count > 0) {
      recommendations.push({
        recommendedType: mostUsedType.billingType,
        reason: `Your most frequently used billing type (${mostUsedType.count} times, ${mostUsedType.percentage.toFixed(1)}% of all billing)`,
        confidence: Math.min(mostUsedType.percentage / 100, 0.9),
        basedOn: 'usage-pattern'
      });
    }
    
    // Recommendation 2: Recently active type
    const recentlyUsedType = recentAnalytics
      .filter(type => type.count > 0)
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))[0];
    
    if (recentlyUsedType && recentlyUsedType.billingType !== mostUsedType.billingType) {
      recommendations.push({
        recommendedType: recentlyUsedType.billingType,
        reason: `Recently active - used ${recentlyUsedType.count} times in the last 30 days`,
        confidence: Math.min(recentlyUsedType.count / 10, 0.8),
        basedOn: 'recent-activity'
      });
    }
    
    // Recommendation 3: Based on available data
    const [customerCount, customerOrderCount] = await Promise.all([
      prisma.customer.count(),
      prisma.customerOrder.count({ where: { status: { not: 'CANCELLED' } } })
    ]);
    
    if (customerOrderCount > customerCount * 0.5) {
      recommendations.push({
        recommendedType: 'customer-order',
        reason: `You have many active customer orders (${customerOrderCount}) - consider order-based billing`,
        confidence: 0.7,
        basedOn: 'customer-data'
      });
    } else if (customerCount > 10) {
      recommendations.push({
        recommendedType: 'direct-customer',
        reason: `You have a good customer database (${customerCount} customers) - direct billing might be efficient`,
        confidence: 0.6,
        basedOn: 'customer-data'
      });
    }
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  } catch (error) {
    console.error("Error generating billing type recommendations:", error);
    return [];
  }
}

// ==============================================
// COMPREHENSIVE BILLING ANALYTICS
// ==============================================

export async function getComprehensiveBillingAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<BillingAnalytics> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const dateFilter =
      startDate && endDate
        ? {
            billingDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    // Get basic billing metrics
    const [
      totalCount,
      totalRevenue,
      paidStatements,
      overdueStatements,
      pendingStatements,
    ] = await Promise.all([
      prisma.billingStatement.count({ where: dateFilter }),
      prisma.billingStatement.aggregate({
        where: { ...dateFilter, status: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.billingStatement.aggregate({
        where: { ...dateFilter, status: "PAID" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.billingStatement.aggregate({
        where: { ...dateFilter, status: "OVERDUE" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.billingStatement.aggregate({
        where: {
          ...dateFilter,
          status: { in: ["DRAFT", "SENT"] },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    // Get monthly revenue trends
    const monthlyRevenue = await getMonthlyRevenueTrends(startDate, endDate);

    // Get status breakdown
    const statusBreakdown = await getBillingStatusBreakdown(startDate, endDate);

    // Get top customers
    const topCustomers = await getTopBillingCustomers(startDate, endDate);

    // Get recent billing activity
    const recentActivity = await getRecentBillingActivity();

    // Get billing type analytics
    const billingTypeBreakdown = await getBillingTypeAnalytics(startDate, endDate);
    const billingTypeRecommendations = await getBillingTypeRecommendations();

    return {
      totalBillingStatements: totalCount,
      totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
      paidAmount: paidStatements._sum.totalAmount?.toNumber() || 0,
      overdueAmount: overdueStatements._sum.totalAmount?.toNumber() || 0,
      pendingAmount: pendingStatements._sum.totalAmount?.toNumber() || 0,
      monthlyRevenue,
      statusBreakdown,
      topCustomers,
      recentActivity,
      billingTypeBreakdown,
      billingTypeRecommendations,
    };
  } catch (error) {
    console.error("Error fetching comprehensive billing analytics:", error);
    throw new Error("Failed to fetch billing analytics");
  }
}

// ==============================================
// SALES REPORTING
// ==============================================

export async function getAdvancedSalesReport(
  startDate?: Date,
  endDate?: Date,
  customerId?: string
): Promise<SalesReportData> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const dateFilter =
      startDate && endDate
        ? {
            invoiceDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    // Optimized customer filter using new relationship structure (Requirements 4.1, 4.4)
    const customerFilter = customerId
      ? {
          billingStatement: {
            customerId: customerId,
          },
        }
      : {};

    const combinedFilter = { ...dateFilter, ...customerFilter };

    // Get basic sales metrics
    const [totalSales, totalInvoices, paidInvoices, overdueInvoices] =
      await Promise.all([
        prisma.salesInvoice.aggregate({
          where: { ...combinedFilter, status: "PAID" },
          _sum: { totalAmount: true },
        }),
        prisma.salesInvoice.count({
          where: combinedFilter,
        }),
        prisma.salesInvoice.count({
          where: { ...combinedFilter, status: "PAID" },
        }),
        prisma.salesInvoice.count({
          where: { ...combinedFilter, status: "OVERDUE" },
        }),
      ]);

    // Get time-based analytics
    const dailySales = await getDailySalesAnalytics(
      startDate,
      endDate,
      customerId
    );
    const monthlySales = await getMonthlySalesAnalytics(
      startDate,
      endDate,
      customerId
    );

    // Get product analytics
    const topProducts = await getTopProductSales(
      startDate,
      endDate,
      customerId
    );

    // Get customer analytics
    const topCustomers = await getTopCustomerSales(startDate, endDate);

    return {
      totalSales: totalSales._sum.totalAmount?.toNumber() || 0,
      totalInvoices,
      averageInvoiceValue:
        totalInvoices > 0
          ? (totalSales._sum.totalAmount?.toNumber() || 0) / totalInvoices
          : 0,
      paidInvoices,
      overdueInvoices,
      dailySales,
      monthlySales,
      topProducts,
      topCustomers,
    };
  } catch (error) {
    console.error("Error fetching advanced sales report:", error);
    throw new Error("Failed to fetch sales report");
  }
}

// ==============================================
// DELIVERY ANALYTICS
// ==============================================

export async function getAdvancedDeliveryAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<DeliveryAnalytics> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const dateFilter =
      startDate && endDate
        ? {
            deliveryDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    // Get basic delivery metrics
    const [totalDeliveries, successfulDeliveries, failedDeliveries] =
      await Promise.all([
        prisma.deliveryReceipt.count({ where: dateFilter }),
        prisma.deliveryReceipt.count({
          where: { ...dateFilter, deliveryStatus: "DELIVERED" },
        }),
        prisma.deliveryReceipt.count({
          where: { ...dateFilter, deliveryStatus: "FAILED" },
        }),
      ]);

    const successRate =
      totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    // Get delivery method breakdown
    const deliveryMethodBreakdown = await getAdvancedDeliveryMethodBreakdown(
      startDate,
      endDate
    );

    // Get courier performance
    const courierPerformance = await getAdvancedCourierPerformance(
      startDate,
      endDate
    );

    // Get recent deliveries
    const recentDeliveries = await getRecentDeliveryActivity(
      startDate,
      endDate
    );

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate,
      deliveryMethodBreakdown,
      courierPerformance,
      recentDeliveries,
    };
  } catch (error) {
    console.error("Error fetching advanced delivery analytics:", error);
    throw new Error("Failed to fetch delivery analytics");
  }
}

// ==============================================
// CUSTOMER-SPECIFIC REPORTS
// ==============================================

export async function getCustomerBillingReport(
  customerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  customer: any;
  billingStatements: any[];
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  monthlyBreakdown: MonthlyRevenue[];
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const dateFilter =
      startDate && endDate
        ? {
            billingDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        tinNumber: true,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get customer's billing statements
    const billingStatements = await prisma.billingStatement.findMany({
      where: {
        customerId,
        ...dateFilter,
      },
      include: {
        customerOrder: {
          select: {
            orderNumber: true,
            orderDate: true,
          },
        },
        productionOrder: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        salesInvoice: {
          select: {
            invoiceNumber: true,
            invoiceDate: true,
          },
        },
      },
      orderBy: { billingDate: "desc" },
    });

    // Calculate totals
    const totalAmount = billingStatements.reduce(
      (sum, stmt) => sum + stmt.totalAmount.toNumber(),
      0
    );
    const paidAmount = billingStatements
      .filter((stmt) => stmt.status === "PAID")
      .reduce((sum, stmt) => sum + stmt.totalAmount.toNumber(), 0);
    const outstandingAmount = billingStatements
      .filter((stmt) => stmt.status !== "PAID" && stmt.status !== "CANCELLED")
      .reduce((sum, stmt) => sum + stmt.totalAmount.toNumber(), 0);
    const overdueAmount = billingStatements
      .filter((stmt) => stmt.status === "OVERDUE")
      .reduce((sum, stmt) => sum + stmt.totalAmount.toNumber(), 0);

    // Get monthly breakdown
    const monthlyBreakdown = await getCustomerMonthlyBreakdown(
      customerId,
      startDate,
      endDate
    );

    return {
      customer,
      billingStatements,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      monthlyBreakdown,
    };
  } catch (error) {
    console.error("Error fetching customer billing report:", error);
    throw new Error("Failed to fetch customer billing report");
  }
}

// ==============================================
// OVERDUE PAYMENTS REPORT
// ==============================================

export async function getOverduePaymentsReport(): Promise<{
  totalOverdue: number;
  totalAmount: number;
  statements: any[];
  agingAnalysis: Array<{
    range: string;
    count: number;
    amount: number;
  }>;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Get overdue statements
    const overdueStatements = await prisma.billingStatement.findMany({
      where: {
        OR: [
          { status: "OVERDUE" },
          {
            status: "SENT",
            dueDate: {
              lt: new Date(),
            },
          },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        customerOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const totalOverdue = overdueStatements.length;
    const totalAmount = overdueStatements.reduce(
      (sum, stmt) => sum + stmt.totalAmount.toNumber(),
      0
    );

    // Calculate aging analysis
    const now = new Date();
    const agingAnalysis = [
      { range: "1-30 days", count: 0, amount: 0 },
      { range: "31-60 days", count: 0, amount: 0 },
      { range: "61-90 days", count: 0, amount: 0 },
      { range: "90+ days", count: 0, amount: 0 },
    ];

    overdueStatements.forEach((stmt) => {
      if (!stmt.dueDate) return;

      const daysPastDue = Math.floor(
        (now.getTime() - stmt.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const amount = stmt.totalAmount.toNumber();

      if (daysPastDue <= 30) {
        agingAnalysis[0].count++;
        agingAnalysis[0].amount += amount;
      } else if (daysPastDue <= 60) {
        agingAnalysis[1].count++;
        agingAnalysis[1].amount += amount;
      } else if (daysPastDue <= 90) {
        agingAnalysis[2].count++;
        agingAnalysis[2].amount += amount;
      } else {
        agingAnalysis[3].count++;
        agingAnalysis[3].amount += amount;
      }
    });

    return {
      totalOverdue,
      totalAmount,
      statements: overdueStatements,
      agingAnalysis,
    };
  } catch (error) {
    console.error("Error fetching overdue payments report:", error);
    throw new Error("Failed to fetch overdue payments report");
  }
}

// ==============================================
// UTILITY FUNCTIONS FOR ANALYTICS
// ==============================================

async function getMonthlyRevenueTrends(
  startDate?: Date,
  endDate?: Date
): Promise<MonthlyRevenue[]> {
  const defaultStartDate =
    startDate ||
    new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
  const defaultEndDate = endDate || new Date();

  const results = await prisma.billingStatement.groupBy({
    by: ["billingDate"],
    where: {
      billingDate: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
      status: "PAID",
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  // Group by month
  const monthlyData: { [key: string]: MonthlyRevenue } = {};
  results.forEach((result) => {
    const date = new Date(result.billingDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[key]) {
      monthlyData[key] = {
        month: date.toLocaleString("default", { month: "long" }),
        year: date.getFullYear(),
        revenue: 0,
        invoiceCount: 0,
      };
    }

    monthlyData[key].revenue += result._sum.totalAmount?.toNumber() || 0;
    monthlyData[key].invoiceCount += result._count;
  });

  return Object.values(monthlyData).sort(
    (a, b) =>
      new Date(a.year, new Date(`${a.month} 1`).getMonth()).getTime() -
      new Date(b.year, new Date(`${b.month} 1`).getMonth()).getTime()
  );
}

async function getBillingStatusBreakdown(
  startDate?: Date,
  endDate?: Date
): Promise<StatusBreakdown[]> {
  const dateFilter =
    startDate && endDate
      ? {
          billingDate: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  const results = await prisma.billingStatement.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: true,
    _sum: {
      totalAmount: true,
    },
  });

  const total = results.reduce((sum, result) => sum + result._count, 0);

  return results.map((result) => ({
    status: result.status as BillingStatus,
    count: result._count,
    amount: result._sum.totalAmount?.toNumber() || 0,
    percentage: total > 0 ? (result._count / total) * 100 : 0,
  }));
}

// Optimized top billing customers query using new schema structure (Requirements 4.1, 4.2, 4.4)
async function getTopBillingCustomers(
  startDate?: Date,
  endDate?: Date
): Promise<CustomerAnalytics[]> {
  const dateFilter =
    startDate && endDate
      ? {
          billingDate: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  // Use customerName field for better performance and include it in groupBy (Requirements 2.1, 2.2)
  const results = await prisma.billingStatement.groupBy({
    by: ["customerId", "customerName"],
    where: dateFilter,
    _count: true,
    _sum: {
      totalAmount: true,
    },
    orderBy: {
      _sum: {
        totalAmount: "desc",
      },
    },
    take: 10,
  });

  // Enhanced query with additional customer analytics using optimized joins (Requirement 4.4)
  const enhancedResults = await Promise.all(
    results.map(async (result) => {
      // Get outstanding amount for this customer using efficient query
      const outstandingAmount = await prisma.billingStatement.aggregate({
        where: {
          customerId: result.customerId,
          status: { in: ["DRAFT", "SENT", "OVERDUE"] },
        },
        _sum: { totalAmount: true },
      });

      // Get last billing date using optimized query
      const lastBilling = await prisma.billingStatement.findFirst({
        where: { customerId: result.customerId },
        orderBy: { billingDate: "desc" },
        select: { billingDate: true },
      });

      return {
        customerId: result.customerId,
        customerName: result.customerName || "Unknown", // Use cached customerName field
        totalAmount: result._sum.totalAmount?.toNumber() || 0,
        statementCount: result._count,
        lastBillingDate: lastBilling?.billingDate || new Date(),
        outstandingAmount: outstandingAmount._sum.totalAmount?.toNumber() || 0,
      };
    })
  );

  return enhancedResults;
}

async function getRecentBillingActivity(): Promise<BillingActivity[]> {
  const recentStatements = await prisma.billingStatement.findMany({
    take: 20,
    orderBy: { updatedAt: "desc" },
    include: {
      modifiedByUser: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return recentStatements.map((statement) => ({
    id: statement.id,
    type: determineActivityType(statement),
    description: generateActivityDescription(statement),
    timestamp: statement.updatedAt,
    userId: statement.modifiedBy || statement.createdBy || "",
    userName: statement.modifiedByUser?.profile
      ? `${statement.modifiedByUser.profile.firstName} ${statement.modifiedByUser.profile.lastName}`
      : statement.modifiedByUser?.email || "System",
  }));
}

function determineActivityType(
  statement: any
): "CREATED" | "UPDATED" | "PAID" | "OVERDUE" | "CANCELLED" {
  if (statement.status === "PAID" && statement.paidDate) return "PAID";
  if (statement.status === "OVERDUE") return "OVERDUE";
  if (statement.status === "CANCELLED") return "CANCELLED";
  if (statement.createdAt.getTime() === statement.updatedAt.getTime())
    return "CREATED";
  return "UPDATED";
}

function generateActivityDescription(statement: any): string {
  const type = determineActivityType(statement);

  switch (type) {
    case "CREATED":
      return `Billing statement ${statement.statementNumber} was created`;
    case "PAID":
      return `Billing statement ${statement.statementNumber} was marked as paid`;
    case "OVERDUE":
      return `Billing statement ${statement.statementNumber} is overdue`;
    case "CANCELLED":
      return `Billing statement ${statement.statementNumber} was cancelled`;
    default:
      return `Billing statement ${statement.statementNumber} was updated`;
  }
}

// Additional utility functions for sales and delivery analytics would follow the same pattern...

// Optimized daily sales analytics using new relationship structure (Requirements 4.1, 4.2, 4.4)
async function getDailySalesAnalytics(
  startDate?: Date,
  endDate?: Date,
  customerId?: string
): Promise<DailySales[]> {
  const defaultStartDate =
    startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const defaultEndDate = endDate || new Date();

  // Optimized customer filter using new relationship structure (Requirements 4.1, 4.4)
  const customerFilter = customerId
    ? {
        billingStatement: {
          customerId: customerId,
        },
      }
    : {};

  const results = await prisma.salesInvoice.groupBy({
    by: ["invoiceDate"],
    where: {
      invoiceDate: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
      status: "PAID",
      ...customerFilter,
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  return results.map((result) => ({
    date: result.invoiceDate,
    sales: result._sum.totalAmount?.toNumber() || 0,
    invoiceCount: result._count,
  }));
}

// Optimized monthly sales analytics using new relationship structure (Requirements 4.1, 4.2, 4.4)
async function getMonthlySalesAnalytics(
  startDate?: Date,
  endDate?: Date,
  customerId?: string
): Promise<MonthlySales[]> {
  const defaultStartDate =
    startDate ||
    new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
  const defaultEndDate = endDate || new Date();

  // Optimized customer filter using new relationship structure (Requirements 4.1, 4.4)
  const customerFilter = customerId
    ? {
        billingStatement: {
          customerId: customerId,
        },
      }
    : {};

  const results = await prisma.salesInvoice.groupBy({
    by: ["invoiceDate"],
    where: {
      invoiceDate: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
      status: "PAID",
      ...customerFilter,
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  // Group by month and calculate growth
  const monthlyData: {
    [key: string]: {
      month: string;
      year: number;
      sales: number;
      invoiceCount: number;
    };
  } = {};

  results.forEach((result) => {
    const date = new Date(result.invoiceDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[key]) {
      monthlyData[key] = {
        month: date.toLocaleString("default", { month: "long" }),
        year: date.getFullYear(),
        sales: 0,
        invoiceCount: 0,
      };
    }

    monthlyData[key].sales += result._sum.totalAmount?.toNumber() || 0;
    monthlyData[key].invoiceCount += result._count;
  });

  const monthlyArray = Object.values(monthlyData).sort(
    (a, b) =>
      new Date(a.year, new Date(`${a.month} 1`).getMonth()).getTime() -
      new Date(b.year, new Date(`${b.month} 1`).getMonth()).getTime()
  );

  return monthlyArray.map((month, index) => ({
    ...month,
    growth:
      index > 0
        ? ((month.sales - monthlyArray[index - 1].sales) /
            monthlyArray[index - 1].sales) *
          100
        : 0,
  }));
}

async function getTopProductSales(
  startDate?: Date,
  endDate?: Date,
  customerId?: string
): Promise<ProductSales[]> {
  const dateFilter =
    startDate && endDate
      ? {
          salesInvoice: {
            invoiceDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        }
      : {};

  // Optimized customer filter using new relationship structure (Requirements 4.1, 4.4)
  const customerFilter = customerId
    ? {
        salesInvoice: {
          billingStatement: {
            customerId: customerId,
          },
        },
      }
    : {};

  const results = await prisma.salesInvoiceItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      ...dateFilter,
      ...customerFilter,
    },
    _sum: {
      totalPrice: true,
      quantity: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalPrice: "desc",
      },
    },
    take: 10,
  });

  // Get product details
  const productIds = results.map((result) => result.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  return results.map((result) => {
    const product = products.find((p) => p.id === result.productId);
    return {
      productId: result.productId || "",
      productName: product?.name || "Unknown",
      totalSales: result._sum.totalPrice?.toNumber() || 0,
      quantitySold: result._sum.quantity?.toNumber() || 0,
      invoiceCount: result._count,
    };
  });
}

async function getTopCustomerSales(
  startDate?: Date,
  endDate?: Date
): Promise<CustomerSales[]> {
  const dateFilter =
    startDate && endDate
      ? {
          billingDate: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  const results = await prisma.billingStatement.groupBy({
    by: ["customerId"],
    where: dateFilter,
    _sum: {
      totalAmount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalAmount: "desc",
      },
    },
    take: 10,
  });

  // Get customer details
  const customerIds = results.map((result) => result.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true },
  });

  return results.map((result) => {
    const customer = customers.find((c) => c.id === result.customerId);
    return {
      customerId: result.customerId,
      customerName: customer?.name || "Unknown",
      totalSales: result._sum.totalAmount?.toNumber() || 0,
      invoiceCount: result._count,
      averageOrderValue:
        result._count > 0
          ? (result._sum.totalAmount?.toNumber() || 0) / result._count
          : 0,
      lastOrderDate: new Date(), // Would need separate query for actual last order date
    };
  });
}

// Simplified delivery method breakdown using new schema structure (Requirements 4.1, 4.2, 4.4)
async function getAdvancedDeliveryMethodBreakdown(
  startDate?: Date,
  endDate?: Date
): Promise<DeliveryMethodStats[]> {
  const dateFilter =
    startDate && endDate
      ? {
          deliveryDate: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  // Since we simplified the schema and removed deliveryMethod field, 
  // we'll provide a single "Standard Delivery" method (Requirements 3.1, 3.2)
  const totalDeliveries = await prisma.deliveryReceipt.count({
    where: dateFilter,
  });

  const successfulDeliveries = await prisma.deliveryReceipt.count({
    where: {
      ...dateFilter,
      deliveryStatus: "DELIVERED",
    },
  });

  const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

  return [
    {
      method: "Standard Delivery",
      count: totalDeliveries,
      successRate: successRate,
      averageDeliveryTime: 0, // Would need timestamp tracking for this
    },
  ];
}

async function getAdvancedCourierPerformance(
  startDate?: Date,
  endDate?: Date
): Promise<CourierStats[]> {
  const dateFilter =
    startDate && endDate
      ? {
          deliveryDate: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  const results = await prisma.deliveryReceipt.groupBy({
    by: ["courierService"],
    where: {
      ...dateFilter,
      courierService: { not: null },
    },
    _count: true,
  });

  // Get success rates for each courier
  const couriersWithStats = await Promise.all(
    results.map(async (result) => {
      const successfulCount = await prisma.deliveryReceipt.count({
        where: {
          ...dateFilter,
          courierService: result.courierService,
          deliveryStatus: "DELIVERED",
        },
      });

      return {
        courierService: result.courierService || "Unknown",
        deliveryCount: result._count,
        successRate:
          result._count > 0 ? (successfulCount / result._count) * 100 : 0,
        averageDeliveryTime: 0, // Would need timestamp tracking for this
      };
    })
  );

  return couriersWithStats;
}

// Optimized delivery activity query using new relationship structure (Requirements 4.1, 4.2, 4.4)
async function getRecentDeliveryActivity(
  startDate?: Date,
  endDate?: Date
): Promise<DeliveryActivity[]> {
  const dateFilter =
    startDate && endDate
      ? {
          deliveryDate: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  // Use correct relationship structure - DeliveryReceipt belongs to BillingStatement (Requirements 4.4)
  const recentReceipts = await prisma.deliveryReceipt.findMany({
    where: dateFilter,
    take: 10,
    orderBy: { deliveryDate: "desc" },
    include: {
      billingStatement: {
        select: {
          customerName: true, // Use cached customerName field for better performance (Requirements 2.1, 2.2)
          customer: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return recentReceipts.map((receipt) => ({
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    deliveryDate: receipt.deliveryDate,
    status: receipt.deliveryStatus as DeliveryStatus,
    customerName: receipt.billingStatement?.customerName || 
                  receipt.billingStatement?.customer?.name || 
                  "Unknown",
    deliveryMethod: "Standard", // Simplified delivery method since we removed complex tracking
  }));
}

async function getCustomerMonthlyBreakdown(
  customerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<MonthlyRevenue[]> {
  const defaultStartDate =
    startDate ||
    new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
  const defaultEndDate = endDate || new Date();

  const results = await prisma.billingStatement.groupBy({
    by: ["billingDate"],
    where: {
      customerId,
      billingDate: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
      status: "PAID",
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  // Group by month
  const monthlyData: { [key: string]: MonthlyRevenue } = {};
  results.forEach((result) => {
    const date = new Date(result.billingDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[key]) {
      monthlyData[key] = {
        month: date.toLocaleString("default", { month: "long" }),
        year: date.getFullYear(),
        revenue: 0,
        invoiceCount: 0,
      };
    }

    monthlyData[key].revenue += result._sum.totalAmount?.toNumber() || 0;
    monthlyData[key].invoiceCount += result._count;
  });

  return Object.values(monthlyData).sort(
    (a, b) =>
      new Date(a.year, new Date(`${a.month} 1`).getMonth()).getTime() -
      new Date(b.year, new Date(`${b.month} 1`).getMonth()).getTime()
  );
}
