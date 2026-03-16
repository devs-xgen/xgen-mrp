"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";

export interface OrderArchiveEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  archivedAt: Date;
  archivedBy: string;
  archiveReason: string;
  originalData: any; // Complete snapshot of the order at time of archiving
  fulfillmentSummary: {
    totalItems: number;
    totalQuantity: number;
    completionRate: number;
    stockFulfilled: number;
    productionFulfilled: number;
    productionOrdersCreated: number;
  };
  billingStatus: string;
  totalValue: number;
  restorable: boolean;
}

export interface OrderArchiveFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  customerName?: string;
  archiveReason?: string;
  billingStatus?: string;
  minValue?: number;
  maxValue?: number;
}

/**
 * Archive a customer order with complete history preservation
 */
export async function archiveCustomerOrder(
  orderId: string,
  reason: string
): Promise<{ success: boolean; message: string; archiveId?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Authentication required" };
    }

    // Fetch complete order data for archiving
    const order = await prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
            productVariant: true,
            variants: {
              include: {
                variant: true,
              },
            },
          },
        },
        productionOrders: {
          include: {
            product: true,
            productVariant: true,
            operations: {
              include: {
                workCenter: true,
                assignedTo: true,
                performedBy: true,
              },
            },
            qualityChecks: {
              include: {
                inspector: true,
              },
            },
            MaterialReservation: {
              include: {
                material: true,
              },
            },
            ProductionBOM: {
              include: {
                material: true,
                originalBOM: {
                  include: {
                    material: true,
                  },
                },
              },
            },
            materialConsumptions: {
              include: {
                material: true,
                consumedByUser: true,
              },
            },
            productionBatches: true,
            costVariances: {
              include: {
                material: true,
                investigator: true,
              },
            },
          },
        },
        billingStatements: {
          include: {
            salesInvoice: {
              include: {
                invoiceItems: {
                  include: {
                    product: true,
                    Material: true,
                    InventoryItem: true,
                  },
                },
              },
            },
            deliveryReceipts: true,
            createdByUser: true,
            modifiedByUser: true,
          },
        },
        transaction: {
          include: {
            handledByUser: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, message: "Order not found" };
    }

    // Check if order is in a state that can be archived
    if (order.status === Status.CANCELLED) {
      return { success: false, message: "Cannot archive cancelled orders" };
    }

    // Calculate fulfillment summary
    const fulfillmentSummary = calculateFulfillmentSummary(order);

    // Create comprehensive archive entry
    const archiveEntry = await prisma.$transaction(async (tx) => {
      // Create the archive record
      const archive = await tx.customerOrderArchive.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          archivedAt: new Date(),
          archivedBy: session.user.id,
          archiveReason: reason,
          originalData: order, // Complete JSON snapshot
          fulfillmentSummary,
          billingStatus: getBillingStatus(order.billingStatements),
          totalValue: order.totalAmount,
          restorable: canOrderBeRestored(order),
        },
      });

      // Update order status to ARCHIVED
      await tx.customerOrder.update({
        where: { id: orderId },
        data: {
          status: Status.ARCHIVED,
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Create audit log entry
      await tx.activityLog.create({
        data: {
          type: "ORDER_ARCHIVED",
          userId: session.user.id,
          details: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customer.name,
            reason,
            fulfillmentSummary,
            archiveId: archive.id,
          },
        },
      });

      return archive;
    });

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/analytics/orders");

    return {
      success: true,
      message: `Order ${order.orderNumber} archived successfully`,
      archiveId: archiveEntry.id,
    };
  } catch (error) {
    console.error("Error archiving customer order:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to archive order",
    };
  }
}

/**
 * Restore an archived customer order
 */
export async function restoreCustomerOrder(
  archiveId: string
): Promise<{ success: boolean; message: string; orderId?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Authentication required" };
    }

    const archive = await prisma.customerOrderArchive.findUnique({
      where: { id: archiveId },
    });

    if (!archive) {
      return { success: false, message: "Archive entry not found" };
    }

    if (!archive.restorable) {
      return {
        success: false,
        message: "This order cannot be restored due to data dependencies",
      };
    }

    // Restore the order
    const result = await prisma.$transaction(async (tx) => {
      // Update order status back to active
      const restoredOrder = await tx.customerOrder.update({
        where: { id: archive.orderId },
        data: {
          status: Status.ACTIVE,
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Mark archive as restored
      await tx.customerOrderArchive.update({
        where: { id: archiveId },
        data: {
          restoredAt: new Date(),
          restoredBy: session.user.id,
        },
      });

      // Create audit log entry
      await tx.activityLog.create({
        data: {
          type: "ORDER_RESTORED",
          userId: session.user.id,
          details: {
            orderId: archive.orderId,
            orderNumber: archive.orderNumber,
            customerName: archive.customerName,
            archiveId,
            restoredAt: new Date(),
          },
        },
      });

      return restoredOrder;
    });

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/analytics/orders");

    return {
      success: true,
      message: `Order ${archive.orderNumber} restored successfully`,
      orderId: result.id,
    };
  } catch (error) {
    console.error("Error restoring customer order:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to restore order",
    };
  }
}

/**
 * Get archived orders with filtering and pagination
 */
export async function getArchivedOrders(
  filters?: OrderArchiveFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  archives: OrderArchiveEntry[];
  total: number;
  pageCount: number;
}> {
  try {
    const where: any = {};

    // Apply filters
    if (filters?.dateRange) {
      where.archivedAt = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    if (filters?.customerName) {
      where.customerName = {
        contains: filters.customerName,
        mode: "insensitive",
      };
    }

    if (filters?.archiveReason) {
      where.archiveReason = {
        contains: filters.archiveReason,
        mode: "insensitive",
      };
    }

    if (filters?.billingStatus) {
      where.billingStatus = filters.billingStatus;
    }

    if (filters?.minValue !== undefined || filters?.maxValue !== undefined) {
      where.totalValue = {};
      if (filters.minValue !== undefined) {
        where.totalValue.gte = filters.minValue;
      }
      if (filters.maxValue !== undefined) {
        where.totalValue.lte = filters.maxValue;
      }
    }

    const [archives, total] = await Promise.all([
      prisma.customerOrderArchive.findMany({
        where,
        orderBy: {
          archivedAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          archivedByUser: {
            select: {
              email: true,
            },
          },
          restoredByUser: {
            select: {
              email: true,
            },
          },
        },
      }),
      prisma.customerOrderArchive.count({ where }),
    ]);

    const transformedArchives: OrderArchiveEntry[] = archives.map(
      (archive) => ({
        id: archive.id,
        orderId: archive.orderId,
        orderNumber: archive.orderNumber,
        customerName: archive.customerName,
        archivedAt: archive.archivedAt,
        archivedBy: archive.archivedByUser?.email || archive.archivedBy,
        archiveReason: archive.archiveReason,
        originalData: archive.originalData,
        fulfillmentSummary: archive.fulfillmentSummary as any,
        billingStatus: archive.billingStatus,
        totalValue: archive.totalValue.toNumber(),
        restorable: archive.restorable,
      })
    );

    return {
      archives: transformedArchives,
      total,
      pageCount: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching archived orders:", error);
    return {
      archives: [],
      total: 0,
      pageCount: 0,
    };
  }
}

/**
 * Get archive statistics
 */
export async function getArchiveStatistics(): Promise<{
  totalArchived: number;
  archivedThisMonth: number;
  archivedThisYear: number;
  topArchiveReasons: Array<{ reason: string; count: number }>;
  averageOrderValue: number;
  totalArchivedValue: number;
}> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalArchived,
      archivedThisMonth,
      archivedThisYear,
      topReasonsResult,
      valueStats,
    ] = await Promise.all([
      prisma.customerOrderArchive.count(),
      prisma.customerOrderArchive.count({
        where: {
          archivedAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.customerOrderArchive.count({
        where: {
          archivedAt: {
            gte: startOfYear,
          },
        },
      }),
      prisma.customerOrderArchive.groupBy({
        by: ["archiveReason"],
        _count: {
          archiveReason: true,
        },
        orderBy: {
          _count: {
            archiveReason: "desc",
          },
        },
        take: 5,
      }),
      prisma.customerOrderArchive.aggregate({
        _avg: {
          totalValue: true,
        },
        _sum: {
          totalValue: true,
        },
      }),
    ]);

    const topArchiveReasons = topReasonsResult.map((result) => ({
      reason: result.archiveReason,
      count: result._count.archiveReason,
    }));

    return {
      totalArchived,
      archivedThisMonth,
      archivedThisYear,
      topArchiveReasons,
      averageOrderValue: valueStats._avg.totalValue?.toNumber() || 0,
      totalArchivedValue: valueStats._sum.totalValue?.toNumber() || 0,
    };
  } catch (error) {
    console.error("Error fetching archive statistics:", error);
    return {
      totalArchived: 0,
      archivedThisMonth: 0,
      archivedThisYear: 0,
      topArchiveReasons: [],
      averageOrderValue: 0,
      totalArchivedValue: 0,
    };
  }
}

/**
 * Helper function to calculate fulfillment summary
 */
function calculateFulfillmentSummary(order: any) {
  const orderLines = order.orderLines || [];
  const totalItems = orderLines.length;
  const totalQuantity = orderLines.reduce(
    (sum: number, line: any) => sum + line.quantity,
    0
  );

  const stockFulfilled = orderLines.reduce(
    (sum: number, line: any) => sum + (line.stockAllocated || 0),
    0
  );

  const productionFulfilled = orderLines.reduce(
    (sum: number, line: any) => sum + (line.productionQuantity || 0),
    0
  );

  const totalAllocated = stockFulfilled + productionFulfilled;
  const completionRate =
    totalQuantity > 0 ? Math.round((totalAllocated / totalQuantity) * 100) : 0;

  return {
    totalItems,
    totalQuantity,
    completionRate,
    stockFulfilled,
    productionFulfilled,
    productionOrdersCreated: order.productionOrders?.length || 0,
  };
}

/**
 * Helper function to determine billing status
 */
function getBillingStatus(billingStatements: any[]) {
  if (!billingStatements || billingStatements.length === 0) {
    return "NOT_BILLED";
  }

  const latestStatement = billingStatements[billingStatements.length - 1];
  return latestStatement.status || "UNKNOWN";
}

/**
 * Helper function to check if order can be restored
 */
function canOrderBeRestored(order: any): boolean {
  // Order can be restored if:
  // 1. No critical billing processes are in progress
  // 2. No production orders are actively running
  // 3. No delivery receipts have been issued

  const hasActiveProduction = order.productionOrders?.some(
    (po: any) => po.status === Status.IN_PROGRESS
  );

  const hasDeliveryReceipts = order.billingStatements?.some(
    (bs: any) => bs.deliveryReceipts && bs.deliveryReceipts.length > 0
  );

  const hasPaidBilling = order.billingStatements?.some(
    (bs: any) => bs.status === "PAID"
  );

  return !hasActiveProduction && !hasDeliveryReceipts && !hasPaidBilling;
}
