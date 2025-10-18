"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * SUPERADMIN Production Order Actions
 * Enhanced with override capabilities and unrestricted access
 */

// ==================== READ OPERATIONS ====================

/**
 * Get ALL production orders (no restrictions) with full details
 */
export async function getAllProductionOrdersSuperadmin(filters?: {
  status?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  productId?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const where: any = {};

    // Apply filters
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { id: { contains: filters.search, mode: "insensitive" } },
        { product: { name: { contains: filters.search, mode: "insensitive" } } },
        { product: { sku: { contains: filters.search, mode: "insensitive" } } },
        { customerOrder: { orderNumber: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters?.customerId) {
      where.customerOrder = { customerId: filters.customerId };
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    const orders = await prisma.productionOrder.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
            expectedStock: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            displayName: true,
            sku: true,
            currentStock: true,
          },
        },
        customerOrder: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        operations: {
          include: {
            workCenter: true,
            assignedTo: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        qualityChecks: {
          include: {
            inspector: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        ProductionBOM: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentStock: true,
              },
            },
          },
        },
        materialReservations: {
          include: {
            material: true,
          },
        },
        delivery: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
        modifiedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
        productionHistoryLogs: {
          orderBy: {
            timestamp: "desc",
          },
          take: 50,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders;
  } catch (error) {
    console.error("[SUPERADMIN_GET_ALL_PRODUCTION_ORDERS]", error);
    throw error;
  }
}

/**
 * Get production order by ID with FULL unrestricted details
 */
export async function getProductionOrderByIdSuperadmin(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        productVariant: true,
        customerOrder: {
          include: {
            customer: true,
            orderLines: true,
          },
        },
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
        ProductionBOM: {
          include: {
            material: true,
          },
        },
        materialReservations: {
          include: {
            material: true,
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
        delivery: {
          include: {
            user: true,
          },
        },
        createdByUser: true,
        modifiedByUser: true,
        productionHistoryLogs: {
          include: {
            user: true,
          },
          orderBy: {
            timestamp: "desc",
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error("[SUPERADMIN_GET_PRODUCTION_ORDER_BY_ID]", error);
    throw error;
  }
}

// ==================== SUPERADMIN OVERRIDE OPERATIONS ====================

/**
 * OVERRIDE: Force update production order status
 * Bypasses normal workflow validation
 */
export async function forceUpdateProductionOrderStatus(
  orderId: string,
  newStatus: string,
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const order = await prisma.$transaction(async (tx) => {
      // Update status directly
      const updated = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: newStatus as any,
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Log the override action
      await tx.productionOrderHistoryLog.create({
        data: {
          productionOrderId: orderId,
          userId: session.user.id,
          status: newStatus as any,
          changeType: "SUPERADMIN_STATUS_OVERRIDE",
          notes: `SUPERADMIN OVERRIDE: ${reason}`,
          timestamp: new Date(),
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath(`/superadmin/production/${orderId}`);
    revalidatePath("/admin/production");

    return { success: true, order };
  } catch (error) {
    console.error("[SUPERADMIN_FORCE_UPDATE_STATUS]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Adjust production order costs (planned/actual/variance)
 */
export async function overrideProductionOrderCosts(
  orderId: string,
  costs: {
    plannedMaterialCost?: number;
    actualMaterialCost?: number;
    materialVariance?: number;
  },
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          ...(costs.plannedMaterialCost !== undefined && {
            plannedMaterialCost: costs.plannedMaterialCost,
          }),
          ...(costs.actualMaterialCost !== undefined && {
            actualMaterialCost: costs.actualMaterialCost,
          }),
          ...(costs.materialVariance !== undefined && {
            materialVariance: costs.materialVariance,
          }),
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Log the override
      await tx.productionOrderHistoryLog.create({
        data: {
          productionOrderId: orderId,
          userId: session.user.id,
          changeType: "SUPERADMIN_COST_OVERRIDE",
          notes: `COST OVERRIDE: ${reason}\nUpdated: ${JSON.stringify(costs)}`,
          timestamp: new Date(),
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath(`/superadmin/production/${orderId}`);

    return { success: true, order };
  } catch (error) {
    console.error("[SUPERADMIN_OVERRIDE_COSTS]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Adjust production order quantity
 */
export async function overrideProductionOrderQuantity(
  orderId: string,
  newQuantity: number,
  reason: string,
  completedQuantity?: number
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          quantity: newQuantity,
          ...(completedQuantity !== undefined && { completedQuantity }),
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Log the override
      await tx.productionOrderHistoryLog.create({
        data: {
          productionOrderId: orderId,
          userId: session.user.id,
          changeType: "SUPERADMIN_QUANTITY_OVERRIDE",
          notes: `QUANTITY OVERRIDE: ${reason}\nNew Quantity: ${newQuantity}${
            completedQuantity !== undefined ? `, Completed: ${completedQuantity}` : ""
          }`,
          timestamp: new Date(),
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath(`/superadmin/production/${orderId}`);

    return { success: true, order };
  } catch (error) {
    console.error("[SUPERADMIN_OVERRIDE_QUANTITY]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Adjust production order dates
 */
export async function overrideProductionOrderDates(
  orderId: string,
  dates: {
    startDate?: Date;
    dueDate?: Date;
    completedAt?: Date | null;
  },
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          ...(dates.startDate && { startDate: dates.startDate }),
          ...(dates.dueDate && { dueDate: dates.dueDate }),
          ...(dates.completedAt !== undefined && { completedAt: dates.completedAt }),
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Log the override
      await tx.productionOrderHistoryLog.create({
        data: {
          productionOrderId: orderId,
          userId: session.user.id,
          changeType: "SUPERADMIN_DATE_OVERRIDE",
          notes: `DATE OVERRIDE: ${reason}\n${JSON.stringify(dates, null, 2)}`,
          timestamp: new Date(),
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath(`/superadmin/production/${orderId}`);

    return { success: true, order };
  } catch (error) {
    console.error("[SUPERADMIN_OVERRIDE_DATES]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Force delete production order (with full cascade)
 */
export async function forceDeleteProductionOrder(orderId: string, reason: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    // Get order details for logging
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        customerOrder: true,
      },
    });

    if (!order) {
      throw new Error("Production order not found");
    }

    // Create audit log before deletion
    await prisma.activityLog.create({
      data: {
        type: "SUPERADMIN_PRODUCTION_ORDER_DELETION",
        userId: session.user.id,
        details: {
          orderId,
          productName: order.product.name,
          customerOrderNumber: order.customerOrder?.orderNumber,
          reason,
          deletedAt: new Date().toISOString(),
          orderSnapshot: order,
        },
      },
    });

    // Delete with cascade (Prisma handles related records)
    await prisma.productionOrder.delete({
      where: { id: orderId },
    });

    revalidatePath("/superadmin/production");
    revalidatePath("/admin/production");

    return { success: true, message: "Production order deleted successfully" };
  } catch (error) {
    console.error("[SUPERADMIN_FORCE_DELETE]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Bulk update production orders
 */
export async function bulkUpdateProductionOrders(
  orderIds: string[],
  updates: {
    status?: string;
    priority?: string;
  },
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const results = await prisma.$transaction(async (tx) => {
      const updated = await tx.productionOrder.updateMany({
        where: {
          id: { in: orderIds },
        },
        data: {
          ...(updates.status && { status: updates.status as any }),
          ...(updates.priority && { priority: updates.priority as any }),
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Log bulk action
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_PRODUCTION_UPDATE",
          userId: session.user.id,
          details: {
            orderIds,
            updates,
            reason,
            count: updated.count,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath("/admin/production");

    return { success: true, count: results.count };
  } catch (error) {
    console.error("[SUPERADMIN_BULK_UPDATE]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Bulk update quantities
 */
export async function bulkUpdateProductionOrderQuantities(
  orderIds: string[],
  newQuantity: number,
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const results = await prisma.$transaction(async (tx) => {
      const updated = await tx.productionOrder.updateMany({
        where: {
          id: { in: orderIds },
        },
        data: {
          quantity: newQuantity,
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Log bulk action
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_QUANTITY_UPDATE",
          userId: session.user.id,
          details: {
            orderIds,
            newQuantity,
            reason,
            count: updated.count,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath("/admin/production");

    return { success: true, count: results.count };
  } catch (error) {
    console.error("[SUPERADMIN_BULK_UPDATE_QUANTITIES]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Bulk update costs
 */
export async function bulkUpdateProductionOrderCosts(
  orderIds: string[],
  costs: {
    plannedMaterialCost?: number;
    actualMaterialCost?: number;
    materialVariance?: number;
  },
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const results = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      };

      if (costs.plannedMaterialCost !== undefined) {
        updateData.plannedMaterialCost = costs.plannedMaterialCost;
      }
      if (costs.actualMaterialCost !== undefined) {
        updateData.actualMaterialCost = costs.actualMaterialCost;
      }
      if (costs.materialVariance !== undefined) {
        updateData.materialVariance = costs.materialVariance;
      }

      const updated = await tx.productionOrder.updateMany({
        where: {
          id: { in: orderIds },
        },
        data: updateData,
      });

      // Log bulk action
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_COST_UPDATE",
          userId: session.user.id,
          details: {
            orderIds,
            costs,
            reason,
            count: updated.count,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath("/admin/production");

    return { success: true, count: results.count };
  } catch (error) {
    console.error("[SUPERADMIN_BULK_UPDATE_COSTS]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Bulk update dates
 */
export async function bulkUpdateProductionOrderDates(
  orderIds: string[],
  dates: {
    startDate?: Date;
    dueDate?: Date;
  },
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const results = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      };

      if (dates.startDate) {
        updateData.startDate = dates.startDate;
      }
      if (dates.dueDate) {
        updateData.dueDate = dates.dueDate;
      }

      const updated = await tx.productionOrder.updateMany({
        where: {
          id: { in: orderIds },
        },
        data: updateData,
      });

      // Log bulk action
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_DATE_UPDATE",
          userId: session.user.id,
          details: {
            orderIds,
            dates,
            reason,
            count: updated.count,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    revalidatePath("/admin/production");

    return { success: true, count: results.count };
  } catch (error) {
    console.error("[SUPERADMIN_BULK_UPDATE_DATES]", error);
    throw error;
  }
}

/**
 * Get production order statistics for superadmin dashboard
 */
export async function getProductionOrderStatsSuperadmin() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const [
      total,
      byStatus,
      byPriority,
      overdue,
      avgMaterialVariance,
      totalCostVariance,
    ] = await Promise.all([
      // Total orders
      prisma.productionOrder.count(),

      // By status
      prisma.productionOrder.groupBy({
        by: ["status"],
        _count: true,
      }),

      // By priority
      prisma.productionOrder.groupBy({
        by: ["priority"],
        _count: true,
      }),

      // Overdue orders
      prisma.productionOrder.count({
        where: {
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { lt: new Date() },
        },
      }),

      // Average material variance
      prisma.productionOrder.aggregate({
        _avg: {
          materialVariance: true,
        },
      }),

      // Total cost variance
      prisma.productionOrder.aggregate({
        _sum: {
          materialVariance: true,
        },
      }),
    ]);

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      avgMaterialVariance: avgMaterialVariance._avg.materialVariance || 0,
      totalCostVariance: totalCostVariance._sum.materialVariance || 0,
    };
  } catch (error) {
    console.error("[SUPERADMIN_GET_PRODUCTION_STATS]", error);
    throw error;
  }
}

// ==================== EXPORT OPERATIONS ====================

/**
 * Export production orders to CSV
 */
export async function exportProductionOrdersCSV(filters?: {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const orders = await getAllProductionOrdersSuperadmin(filters);

    // Build CSV content
    const headers = [
      "Order ID",
      "Product Name",
      "Product SKU",
      "Variant",
      "Quantity",
      "Completed",
      "Progress %",
      "Status",
      "Priority",
      "Customer",
      "Customer Order",
      "Start Date",
      "Due Date",
      "Completed At",
      "Planned Cost",
      "Actual Cost",
      "Variance",
      "Operations",
      "Quality Checks",
      "Created By",
      "Created At",
    ];

    const rows = orders.map((order: any) => [
      order.id,
      order.product.name,
      order.product.sku,
      order.productVariant?.displayName || "N/A",
      order.quantity,
      order.completedQuantity,
      Math.round((order.completedQuantity / order.quantity) * 100),
      order.status,
      order.priority,
      order.customerOrder?.customer?.name || "Standalone",
      order.customerOrder?.orderNumber || "N/A",
      new Date(order.startDate).toISOString().split("T")[0],
      new Date(order.dueDate).toISOString().split("T")[0],
      order.completedAt ? new Date(order.completedAt).toISOString() : "N/A",
      order.plannedMaterialCost,
      order.actualMaterialCost,
      order.materialVariance,
      order.operations.length,
      order.qualityChecks.length,
      order.createdByUser?.email || "System",
      new Date(order.createdAt).toISOString(),
    ]);

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell);
            return cellStr.includes(",") ? `"${cellStr}"` : cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    return csvContent;
  } catch (error) {
    console.error("[SUPERADMIN_EXPORT_CSV]", error);
    throw error;
  }
}

/**
 * Export production orders to Excel
 */
export async function exportProductionOrdersExcel(filters?: {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const orders = await getAllProductionOrdersSuperadmin(filters);

    // Import ExcelJS dynamically (server-side only)
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Production Orders");

    // Define columns
    worksheet.columns = [
      { header: "Order ID", key: "id", width: 15 },
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Product SKU", key: "productSku", width: 15 },
      { header: "Variant", key: "variant", width: 20 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Completed", key: "completed", width: 10 },
      { header: "Progress %", key: "progress", width: 10 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Customer Order", key: "customerOrder", width: 15 },
      { header: "Start Date", key: "startDate", width: 12 },
      { header: "Due Date", key: "dueDate", width: 12 },
      { header: "Completed At", key: "completedAt", width: 18 },
      { header: "Planned Cost", key: "plannedCost", width: 15 },
      { header: "Actual Cost", key: "actualCost", width: 15 },
      { header: "Variance", key: "variance", width: 15 },
      { header: "Operations", key: "operations", width: 12 },
      { header: "Quality Checks", key: "qualityChecks", width: 12 },
      { header: "Created By", key: "createdBy", width: 25 },
      { header: "Created At", key: "createdAt", width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4B5563" },
    };
    worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    // Add data rows
    orders.forEach((order: any) => {
      const progress = Math.round((order.completedQuantity / order.quantity) * 100);
      
      worksheet.addRow({
        id: order.id.substring(0, 12),
        productName: order.product.name,
        productSku: order.product.sku,
        variant: order.productVariant?.displayName || "N/A",
        quantity: order.quantity,
        completed: order.completedQuantity,
        progress,
        status: order.status,
        priority: order.priority,
        customer: order.customerOrder?.customer?.name || "Standalone",
        customerOrder: order.customerOrder?.orderNumber || "N/A",
        startDate: new Date(order.startDate).toISOString().split("T")[0],
        dueDate: new Date(order.dueDate).toISOString().split("T")[0],
        completedAt: order.completedAt
          ? new Date(order.completedAt).toISOString()
          : "N/A",
        plannedCost: Number(order.plannedMaterialCost),
        actualCost: Number(order.actualMaterialCost),
        variance: Number(order.materialVariance),
        operations: order.operations.length,
        qualityChecks: order.qualityChecks.length,
        createdBy: order.createdByUser?.email || "System",
        createdAt: new Date(order.createdAt).toISOString(),
      });
    });

    // Apply number format to cost columns
    ["plannedCost", "actualCost", "variance"].forEach((col) => {
      const column = worksheet.getColumn(col);
      column.numFmt = "₱#,##0.00";
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error("[SUPERADMIN_EXPORT_EXCEL]", error);
    throw error;
  }
}

// ==================== SUPERADMIN PRODUCTION ORDER CREATION ====================

/**
 * SUPERADMIN: Create production order with override capabilities
 * Allows bypassing validation, backdating, force-allocate materials
 */
export async function createProductionOrderSuperadmin(input: {
  productId: string;
  productVariantId?: string;
  quantity: number;
  startDate: string;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
  notes?: string;
  customerOrderId?: string;
  overrides?: {
    skipDateValidation?: boolean; // Allow backdated orders
    skipMaterialCheck?: boolean; // Create even without materials
    forceAllocateMaterials?: boolean; // Reserve materials even if insufficient
    customOrderNumber?: string; // Custom order number
    customCosts?: {
      plannedMaterialCost?: number;
      actualMaterialCost?: number;
      materialVariance?: number;
    };
  };
  options?: {
    generateBOM?: boolean;
    reserveMaterials?: boolean;
  };
  reason: string; // Required for audit trail
}): Promise<{
  success: true;
  orderId: string;
  warnings?: string[];
  overridesApplied?: string[];
} | {
  success: false;
  error: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized: SUPER_ADMIN access required" };
    }

    const warnings: string[] = [];
    const overridesApplied: string[] = [];

    // Validate dates (unless override is set)
    const startDate = new Date(input.startDate);
    const dueDate = new Date(input.dueDate);

    if (!input.overrides?.skipDateValidation) {
      if (dueDate <= startDate) {
        return { success: false, error: "Due date must be after start date (use skipDateValidation override if intentional)" };
      }

      // Check for backdated orders
      const now = new Date();
      if (startDate < now) {
        warnings.push("Warning: Start date is in the past. This is a backdated production order.");
      }
    } else {
      overridesApplied.push("Date validation bypassed - backdated order allowed");
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, name: true, hasVariants: true, sku: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Validate variant if provided
    let variant = null;
    if (input.productVariantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: input.productVariantId },
        select: { id: true, productId: true, displayName: true },
      });

      if (!variant || variant.productId !== input.productId) {
        return { success: false, error: "Invalid product variant" };
      }
    }

    // Check material availability (unless override is set)
    if (!input.overrides?.skipMaterialCheck && input.options?.reserveMaterials) {
      // Import material check function
      const { checkProductionOrderMaterialRequirements } = await import("@/lib/actions/material-reservation");

      try {
        const materialCheck = await checkProductionOrderMaterialRequirements(
          input.productId,
          input.quantity,
          input.productVariantId
        );

        if (!materialCheck.allMaterialsAvailable) {
          if (!input.overrides?.forceAllocateMaterials) {
            const shortageDetails = materialCheck.materials
              .filter((m: any) => !m.isAvailable)
              .map((m: any) => `${m.materialName}: need ${m.quantityNeeded}, available ${m.quantityAvailable}`)
              .join("; ");

            return {
              success: false,
              error: `Insufficient materials: ${shortageDetails}. Use forceAllocateMaterials override to proceed anyway.`,
            };
          } else {
            overridesApplied.push("Force allocate materials - proceeding despite insufficient stock");
            warnings.push("Materials reserved despite insufficient stock. This may cause production delays.");
          }
        }
      } catch (materialCheckError) {
        warnings.push("Could not verify material availability");
      }
    } else if (input.overrides?.skipMaterialCheck) {
      overridesApplied.push("Material availability check bypassed");
    }

    // Create the production order
    const order = await prisma.productionOrder.create({
      data: {
        productId: input.productId,
        productVariantId: input.productVariantId || null,
        quantity: input.quantity,
        startDate: startDate,
        dueDate: dueDate,
        priority: input.priority,
        customerOrderId: input.customerOrderId || null,
        notes: input.notes || null,
        status: "PENDING",
        createdBy: session.user.id,
        ...(input.overrides?.customCosts && {
          plannedMaterialCost: input.overrides.customCosts.plannedMaterialCost,
          actualMaterialCost: input.overrides.customCosts.actualMaterialCost,
          materialVariance: input.overrides.customCosts.materialVariance,
        }),
      },
      include: {
        product: true,
        productVariant: true,
      },
    });

    if (input.overrides?.customCosts) {
      overridesApplied.push("Custom costs applied on creation");
    }

    // Generate BOM if requested
    if (input.options?.generateBOM) {
      try {
        const { generateProductionBOM } = await import("@/lib/actions/production-order");
        const bomResult = await generateProductionBOM(order.id);

        if (bomResult.warnings && bomResult.warnings.length > 0) {
          warnings.push(...bomResult.warnings);
        }
      } catch (bomError) {
        warnings.push("Failed to generate BOM automatically");
        console.error("BOM generation error:", bomError);
      }
    }

    // Reserve materials if requested
    if (input.options?.reserveMaterials && input.options?.generateBOM) {
      try {
        const { reserveMaterialsForOrder } = await import("@/lib/actions/production-order");
        const reservationResult = await reserveMaterialsForOrder(order.id);

        if (reservationResult.partials.length > 0) {
          warnings.push(`Partial reservations: ${reservationResult.partials.length} materials have limited stock`);
        }
      } catch (reservationError) {
        warnings.push("Failed to reserve materials automatically");
        console.error("Material reservation error:", reservationError);
      }
    }

    // Log the creation with SUPERADMIN tag
    try {
      await prisma.activityLog.create({
        data: {
          type: "SUPERADMIN_PRODUCTION_ORDER_CREATED",
          userId: session.user.id,
          details: {
            productionOrderId: order.id,
            productName: order.product.name,
            productVariantName: order.productVariant?.displayName,
            quantity: order.quantity,
            source: input.customerOrderId ? "customer_order" : "standalone",
            customerOrderId: input.customerOrderId,
            overridesApplied,
            reason: input.reason,
            backdated: startDate < new Date(),
          },
        },
      });

      // Also create production history log
      await prisma.productionOrderHistoryLog.create({
        data: {
          productionOrderId: order.id,
          userId: session.user.id,
          status: "PENDING",
          changeType: "SUPERADMIN_ORDER_CREATION",
          notes: `SUPERADMIN CREATION: ${input.reason}${overridesApplied.length > 0 ? `\nOverrides: ${overridesApplied.join(", ")}` : ""}`,
          timestamp: new Date(),
        },
      });
    } catch (logError) {
      console.error("Failed to log production order creation:", logError);
    }

    revalidatePath("/superadmin/production");
    revalidatePath("/admin/production");
    revalidatePath("/admin/customer-orders");

    return {
      success: true,
      orderId: order.id,
      warnings: warnings.length > 0 ? warnings : undefined,
      overridesApplied: overridesApplied.length > 0 ? overridesApplied : undefined,
    };
  } catch (error) {
    console.error("Error creating SuperAdmin production order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create production order",
    };
  }
}

// ==================== MATERIAL OVERRIDE OPERATIONS ====================

/**
 * OVERRIDE: Force release material reservation
 */
export async function forceReleaseMaterialReservation(
  reservationId: string,
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get reservation details
      const reservation = await tx.materialReservation.findUnique({
        where: { id: reservationId },
        include: {
          material: true,
          productionOrder: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      // Update reservation status to RELEASED
      const updated = await tx.materialReservation.update({
        where: { id: reservationId },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          quantityReleased: reservation.quantityReserved - reservation.quantityConsumed,
          modifiedBy: session.user.id,
        },
      });

      // Update material committed stock
      await tx.material.update({
        where: { id: reservation.materialId },
        data: {
          committedStock: {
            decrement: reservation.quantityReserved - reservation.quantityConsumed,
          },
        },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_MATERIAL_RELEASE",
          userId: session.user.id,
          details: {
            reservationId,
            materialName: reservation.material.name,
            productionOrderId: reservation.productionOrderId,
            productName: reservation.productionOrder.product.name,
            quantityReleased: reservation.quantityReserved - reservation.quantityConsumed,
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    return { success: true, reservation: result };
  } catch (error) {
    console.error("[SUPERADMIN_FORCE_RELEASE_MATERIAL]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Adjust material consumption record
 */
export async function overrideMaterialConsumption(
  consumptionId: string,
  adjustments: {
    actualQuantity?: number;
    wasteQuantity?: number;
    totalCost?: number;
  },
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const result = await prisma.$transaction(async (tx) => {
      const consumption = await tx.productionMaterialConsumption.update({
        where: { id: consumptionId },
        data: {
          ...(adjustments.actualQuantity !== undefined && {
            actualQuantity: adjustments.actualQuantity,
          }),
          ...(adjustments.wasteQuantity !== undefined && {
            wasteQuantity: adjustments.wasteQuantity,
          }),
          ...(adjustments.totalCost !== undefined && {
            totalCost: adjustments.totalCost,
          }),
          updatedAt: new Date(),
        },
        include: {
          material: true,
          productionOrder: {
            include: {
              product: true,
            },
          },
        },
      });

      // Log the override
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_CONSUMPTION_OVERRIDE",
          userId: session.user.id,
          details: {
            consumptionId,
            materialName: consumption.material.name,
            productionOrderId: consumption.productionOrderId,
            productName: consumption.productionOrder.product.name,
            adjustments,
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return consumption;
    });

    revalidatePath("/superadmin/production");
    return { success: true, consumption: result };
  } catch (error) {
    console.error("[SUPERADMIN_OVERRIDE_CONSUMPTION]", error);
    throw error;
  }
}

/**
 * OVERRIDE: Force update material reservation quantity
 */
export async function overrideMaterialReservationQuantity(
  reservationId: string,
  newQuantity: number,
  reason: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current reservation
      const current = await tx.materialReservation.findUnique({
        where: { id: reservationId },
        include: {
          material: true,
        },
      });

      if (!current) {
        throw new Error("Reservation not found");
      }

      const oldQuantity = Number(current.quantityReserved);
      const quantityDiff = newQuantity - oldQuantity;

      // Update reservation
      const updated = await tx.materialReservation.update({
        where: { id: reservationId },
        data: {
          quantityReserved: newQuantity,
          modifiedBy: session.user.id,
        },
      });

      // Update material committed stock
      await tx.material.update({
        where: { id: current.materialId },
        data: {
          committedStock: {
            increment: quantityDiff,
          },
        },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_RESERVATION_QUANTITY_OVERRIDE",
          userId: session.user.id,
          details: {
            reservationId,
            materialName: current.material.name,
            oldQuantity,
            newQuantity,
            quantityDiff,
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    revalidatePath("/superadmin/production");
    return { success: true, reservation: result };
  } catch (error) {
    console.error("[SUPERADMIN_OVERRIDE_RESERVATION_QUANTITY]", error);
    throw error;
  }
}
