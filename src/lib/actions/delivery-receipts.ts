"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  DeliveryReceipt,
  DeliveryReceiptWithBilling,
  DeliveryReceiptFormData,
  DeliveryReceiptFilters,
  BillingActionResponse,
  PaginatedResponse,
  DeliveryAnalytics,
  DeliveryStatus,
  deliveryReceiptSchema,
  deliveryReceiptFiltersSchema,
} from "@/types/admin/billing";
import { DeliveryStatus as PrismaDeliveryStatus } from "@prisma/client";

// ==============================================
// DELIVERY RECEIPT CRUD OPERATIONS
// ==============================================

export async function getAllDeliveryReceipts(
  filters?: DeliveryReceiptFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<DeliveryReceiptWithBilling>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Parse and validate filters
    const validatedFilters = filters
      ? deliveryReceiptFiltersSchema.parse(filters)
      : {};

    // Build where clause
    const whereClause: any = {};

    if (validatedFilters.status && validatedFilters.status.length > 0) {
      whereClause.deliveryStatus = {
        in: validatedFilters.status as PrismaDeliveryStatus[],
      };
    }

    if (
      validatedFilters.deliveryMethod &&
      validatedFilters.deliveryMethod.length > 0
    ) {
      whereClause.deliveryMethod = { in: validatedFilters.deliveryMethod };
    }

    if (
      validatedFilters.courierService &&
      validatedFilters.courierService.length > 0
    ) {
      whereClause.courierService = { in: validatedFilters.courierService };
    }

    if (validatedFilters.dateRange) {
      whereClause.deliveryDate = {
        gte: validatedFilters.dateRange.start,
        lte: validatedFilters.dateRange.end,
      };
    }

    if (validatedFilters.search) {
      whereClause.OR = [
        {
          receiptNumber: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
        {
          receivedBy: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
        {
          deliveryAddress: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
        {
          trackingNumber: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Build order clause
    const orderBy: any = {};
    if (validatedFilters.sortBy) {
      orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder || "desc";
    } else {
      orderBy.deliveryDate = "desc";
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await prisma.deliveryReceipt.count({ where: whereClause });

    // Get receipts with billing statements
    const receipts = await prisma.deliveryReceipt.findMany({
      where: whereClause,
      include: {
        billingStatements: {
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
                id: true,
                orderNumber: true,
                orderDate: true,
              },
            },
            productionOrder: {
              select: {
                id: true,
                quantity: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        modifiedByUser: {
          select: {
            id: true,
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
      orderBy,
      skip,
      take: pageSize,
    });

    return {
      data: receipts as DeliveryReceiptWithBilling[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Error fetching delivery receipts:", error);
    throw new Error("Failed to fetch delivery receipts");
  }
}

export async function getDeliveryReceiptById(
  id: string
): Promise<DeliveryReceiptWithBilling | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const receipt = await prisma.deliveryReceipt.findUnique({
      where: { id },
      include: {
        billingStatements: {
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
                id: true,
                orderNumber: true,
                orderDate: true,
              },
            },
            productionOrder: {
              select: {
                id: true,
                quantity: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        modifiedByUser: {
          select: {
            id: true,
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

    return receipt as DeliveryReceiptWithBilling | null;
  } catch (error) {
    console.error("Error fetching delivery receipt:", error);
    throw new Error("Failed to fetch delivery receipt");
  }
}

export async function createDeliveryReceipt(
  data: DeliveryReceiptFormData
): Promise<BillingActionResponse<DeliveryReceipt>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = deliveryReceiptSchema.parse(data);

    // Generate unique receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create delivery receipt
    const deliveryReceipt = await prisma.deliveryReceipt.create({
      data: {
        receiptNumber,
        deliveryDate: validatedData.deliveryDate,
        receivedBy: validatedData.receivedBy,
        receivedByTitle: validatedData.receivedByTitle,
        deliveryAddress: validatedData.deliveryAddress,
        deliveryNotes: validatedData.deliveryNotes,
        itemsDelivered: validatedData.itemsDelivered,
        deliveryStatus: validatedData.deliveryStatus as PrismaDeliveryStatus,
        trackingNumber: validatedData.trackingNumber,
        courierService: validatedData.courierService,
        deliveryMethod: validatedData.deliveryMethod,
        createdBy: session.user.id,
      },
    });

    revalidatePath("/admin/billing/delivery-receipts");

    return {
      success: true,
      data: deliveryReceipt as DeliveryReceipt,
      message: "Delivery receipt created successfully",
    };
  } catch (error) {
    console.error("Error creating delivery receipt:", error);
    return {
      success: false,
      error: "Failed to create delivery receipt",
    };
  }
}

export async function updateDeliveryReceipt(
  id: string,
  data: Partial<DeliveryReceiptFormData>
): Promise<BillingActionResponse<DeliveryReceipt>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get existing receipt
    const existingReceipt = await prisma.deliveryReceipt.findUnique({
      where: { id },
    });

    if (!existingReceipt) {
      return { success: false, error: "Delivery receipt not found" };
    }

    // Prepare update data
    const updateData: any = {
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    };

    if (data.deliveryDate !== undefined) {
      updateData.deliveryDate = data.deliveryDate;
    }

    if (data.receivedBy !== undefined) {
      updateData.receivedBy = data.receivedBy;
    }

    if (data.receivedByTitle !== undefined) {
      updateData.receivedByTitle = data.receivedByTitle;
    }

    if (data.deliveryAddress !== undefined) {
      updateData.deliveryAddress = data.deliveryAddress;
    }

    if (data.deliveryNotes !== undefined) {
      updateData.deliveryNotes = data.deliveryNotes;
    }

    if (data.itemsDelivered !== undefined) {
      updateData.itemsDelivered = data.itemsDelivered;
    }

    if (data.deliveryStatus !== undefined) {
      updateData.deliveryStatus = data.deliveryStatus as PrismaDeliveryStatus;
    }

    if (data.trackingNumber !== undefined) {
      updateData.trackingNumber = data.trackingNumber;
    }

    if (data.courierService !== undefined) {
      updateData.courierService = data.courierService;
    }

    if (data.deliveryMethod !== undefined) {
      updateData.deliveryMethod = data.deliveryMethod;
    }

    // Update delivery receipt
    const updatedReceipt = await prisma.deliveryReceipt.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/billing/delivery-receipts");
    revalidatePath(`/admin/billing/delivery-receipts/${id}`);

    return {
      success: true,
      data: updatedReceipt as DeliveryReceipt,
      message: "Delivery receipt updated successfully",
    };
  } catch (error) {
    console.error("Error updating delivery receipt:", error);
    return {
      success: false,
      error: "Failed to update delivery receipt",
    };
  }
}

export async function updateDeliveryReceiptStatus(
  id: string,
  status: DeliveryStatus
): Promise<BillingActionResponse<DeliveryReceipt>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedReceipt = await prisma.deliveryReceipt.update({
      where: { id },
      data: {
        deliveryStatus: status as PrismaDeliveryStatus,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/billing/delivery-receipts");
    revalidatePath(`/admin/billing/delivery-receipts/${id}`);

    return {
      success: true,
      data: updatedReceipt as DeliveryReceipt,
      message: `Delivery receipt marked as ${status.toLowerCase()}`,
    };
  } catch (error) {
    console.error("Error updating delivery receipt status:", error);
    return {
      success: false,
      error: "Failed to update delivery receipt status",
    };
  }
}

export async function deleteDeliveryReceipt(
  id: string
): Promise<BillingActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the receipt to check if it can be deleted
    const receipt = await prisma.deliveryReceipt.findUnique({
      where: { id },
      include: { billingStatements: true },
    });

    if (!receipt) {
      return { success: false, error: "Delivery receipt not found" };
    }

    // Check if receipt is linked to billing statements
    if (receipt.billingStatements.length > 0) {
      return {
        success: false,
        error:
          "Cannot delete delivery receipt that is linked to billing statements",
      };
    }

    // Only allow deletion of pending or cancelled receipts
    if (!["PENDING", "CANCELLED"].includes(receipt.deliveryStatus)) {
      return {
        success: false,
        error: "Only pending or cancelled delivery receipts can be deleted",
      };
    }

    // Delete delivery receipt
    await prisma.deliveryReceipt.delete({
      where: { id },
    });

    revalidatePath("/admin/billing/delivery-receipts");

    return {
      success: true,
      message: "Delivery receipt deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting delivery receipt:", error);
    return {
      success: false,
      error: "Failed to delete delivery receipt",
    };
  }
}

// ==============================================
// DELIVERY CONFIRMATION FUNCTIONS
// ==============================================

export async function confirmDelivery(
  id: string,
  signature?: string,
  photoEvidence?: string
): Promise<BillingActionResponse<DeliveryReceipt>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = {
      deliveryStatus: "DELIVERED" as PrismaDeliveryStatus,
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    };

    if (signature) {
      updateData.signatureImage = signature;
    }

    if (photoEvidence) {
      updateData.photoEvidence = photoEvidence;
    }

    const updatedReceipt = await prisma.deliveryReceipt.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/billing/delivery-receipts");
    revalidatePath(`/admin/billing/delivery-receipts/${id}`);

    return {
      success: true,
      data: updatedReceipt as DeliveryReceipt,
      message: "Delivery confirmed successfully",
    };
  } catch (error) {
    console.error("Error confirming delivery:", error);
    return {
      success: false,
      error: "Failed to confirm delivery",
    };
  }
}

export async function markDeliveryFailed(
  id: string,
  reason: string
): Promise<BillingActionResponse<DeliveryReceipt>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedReceipt = await prisma.deliveryReceipt.update({
      where: { id },
      data: {
        deliveryStatus: "FAILED" as PrismaDeliveryStatus,
        deliveryNotes: reason,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/billing/delivery-receipts");
    revalidatePath(`/admin/billing/delivery-receipts/${id}`);

    return {
      success: true,
      data: updatedReceipt as DeliveryReceipt,
      message: "Delivery marked as failed",
    };
  } catch (error) {
    console.error("Error marking delivery as failed:", error);
    return {
      success: false,
      error: "Failed to mark delivery as failed",
    };
  }
}

// ==============================================
// DELIVERY CREATION FROM ORDERS
// ==============================================

export async function createDeliveryReceiptFromCustomerOrder(
  customerOrderId: string,
  deliveryData: Partial<DeliveryReceiptFormData>
): Promise<BillingActionResponse<DeliveryReceipt>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get customer order with details
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!customerOrder) {
      return { success: false, error: "Customer order not found" };
    }

    // Create delivery receipt from order data
    const formData: DeliveryReceiptFormData = {
      deliveryDate: deliveryData.deliveryDate || new Date(),
      receivedBy: deliveryData.receivedBy || "",
      receivedByTitle: deliveryData.receivedByTitle,
      deliveryAddress:
        deliveryData.deliveryAddress ||
        customerOrder.shippingAddress ||
        customerOrder.customer.address ||
        "",
      deliveryNotes: deliveryData.deliveryNotes,
      itemsDelivered: customerOrder.orderLines.map((line) => ({
        productId: line.productId,
        productName: line.product.name,
        quantity: line.quantity,
        unit: "PCS",
        condition: "GOOD",
        notes: "",
      })),
      deliveryStatus: deliveryData.deliveryStatus || DeliveryStatus.PENDING,
      trackingNumber: deliveryData.trackingNumber,
      courierService: deliveryData.courierService,
      deliveryMethod: deliveryData.deliveryMethod || "DELIVERY",
    };

    return await createDeliveryReceipt(formData);
  } catch (error) {
    console.error(
      "Error creating delivery receipt from customer order:",
      error
    );
    return {
      success: false,
      error: "Failed to create delivery receipt from customer order",
    };
  }
}

export async function createDeliveryReceiptFromProductionOrder(
  productionOrderId: string,
  deliveryData: Partial<DeliveryReceiptFormData>
): Promise<BillingActionResponse<DeliveryReceipt>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get production order with details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
        customerOrder: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!productionOrder) {
      return { success: false, error: "Production order not found" };
    }

    if (!productionOrder.customerOrder) {
      return {
        success: false,
        error: "Production order must be linked to a customer order",
      };
    }

    // Create delivery receipt from production order data
    const formData: DeliveryReceiptFormData = {
      deliveryDate: deliveryData.deliveryDate || new Date(),
      receivedBy: deliveryData.receivedBy || "",
      receivedByTitle: deliveryData.receivedByTitle,
      deliveryAddress:
        deliveryData.deliveryAddress ||
        productionOrder.customerOrder.shippingAddress ||
        productionOrder.customerOrder.customer.address ||
        "",
      deliveryNotes: deliveryData.deliveryNotes,
      itemsDelivered: [
        {
          productId: productionOrder.productId,
          productName: productionOrder.product.name,
          quantity: productionOrder.quantity,
          unit: "PCS",
          condition: "GOOD",
          notes: `Produced under order ${productionOrder.customerOrder.orderNumber}`,
        },
      ],
      deliveryStatus: deliveryData.deliveryStatus || DeliveryStatus.PENDING,
      trackingNumber: deliveryData.trackingNumber,
      courierService: deliveryData.courierService,
      deliveryMethod: deliveryData.deliveryMethod || "DELIVERY",
    };

    return await createDeliveryReceipt(formData);
  } catch (error) {
    console.error(
      "Error creating delivery receipt from production order:",
      error
    );
    return {
      success: false,
      error: "Failed to create delivery receipt from production order",
    };
  }
}

// ==============================================
// ANALYTICS FUNCTIONS
// ==============================================

export async function getDeliveryAnalytics(): Promise<DeliveryAnalytics> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Get basic delivery metrics
    const [totalDeliveries, successfulDeliveries, failedDeliveries] =
      await Promise.all([
        prisma.deliveryReceipt.count(),
        prisma.deliveryReceipt.count({
          where: { deliveryStatus: "DELIVERED" },
        }),
        prisma.deliveryReceipt.count({
          where: { deliveryStatus: "FAILED" },
        }),
      ]);

    const successRate =
      totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    // Get delivery method breakdown
    const deliveryMethodBreakdown = await getDeliveryMethodBreakdown();

    // Get courier performance
    const courierPerformance = await getCourierPerformance();

    // Get recent deliveries
    const recentDeliveries = await getRecentDeliveries();

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
    console.error("Error fetching delivery analytics:", error);
    throw new Error("Failed to fetch delivery analytics");
  }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Get count of receipts for this month
  const count = await prisma.deliveryReceipt.count({
    where: {
      receiptNumber: {
        startsWith: `DR-${year}${month}`,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `DR-${year}${month}-${sequence}`;
}

async function getDeliveryMethodBreakdown() {
  const results = await prisma.deliveryReceipt.groupBy({
    by: ["deliveryMethod"],
    _count: true,
    where: {
      deliveryMethod: { not: null },
    },
  });

  return results.map((result) => ({
    method: result.deliveryMethod || "Unknown",
    count: result._count,
    successRate: 0, // Would need more complex query to calculate
    averageDeliveryTime: 0, // Would need timestamp tracking
  }));
}

async function getCourierPerformance() {
  const results = await prisma.deliveryReceipt.groupBy({
    by: ["courierService"],
    _count: true,
    where: {
      courierService: { not: null },
    },
  });

  return results.map((result) => ({
    courierService: result.courierService || "Unknown",
    deliveryCount: result._count,
    successRate: 0, // Would need more complex query to calculate
    averageDeliveryTime: 0, // Would need timestamp tracking
  }));
}

async function getRecentDeliveries() {
  const recentReceipts = await prisma.deliveryReceipt.findMany({
    take: 10,
    orderBy: { deliveryDate: "desc" },
    include: {
      billingStatements: {
        include: {
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
    customerName: receipt.billingStatements[0]?.customer?.name || "Unknown",
    deliveryMethod: receipt.deliveryMethod || "Unknown",
  }));
}

// ==============================================
// BULK OPERATIONS
// ==============================================

export async function bulkUpdateDeliveryStatus(
  ids: string[],
  status: DeliveryStatus
): Promise<BillingActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.deliveryReceipt.updateMany({
      where: { id: { in: ids } },
      data: {
        deliveryStatus: status as PrismaDeliveryStatus,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/billing/delivery-receipts");

    return {
      success: true,
      message: `${ids.length} delivery receipts updated successfully`,
    };
  } catch (error) {
    console.error("Error bulk updating delivery status:", error);
    return {
      success: false,
      error: "Failed to update delivery receipts",
    };
  }
}
