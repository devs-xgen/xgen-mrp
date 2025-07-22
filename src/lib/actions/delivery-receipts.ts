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
import { z } from "zod";

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
        {
          billingStatement: {
            customerName: {
              contains: validatedFilters.search,
              mode: "insensitive",
            },
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

    // Get receipts with billing statement data - includes billing statement relationship (Requirement 4.4)
    const receipts = await prisma.deliveryReceipt.findMany({
      where: whereClause,
      include: {
        billingStatement: {
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

    // Get delivery receipt with billing statement relationship data (Requirement 4.4)
    const receipt = await prisma.deliveryReceipt.findUnique({
      where: { id },
      include: {
        billingStatement: {
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

    // Validate input data - billingStatementId is required (Requirement 3.1, 3.5)
    const validatedData = deliveryReceiptSchema.parse(data);

    // Verify billing statement exists and maintain relationship integrity (Requirement 4.1, 4.2)
    const billingStatement = await prisma.billingStatement.findUnique({
      where: { id: validatedData.billingStatementId },
      include: {
        customer: true,
        customerOrder: true,
      },
    });

    if (!billingStatement) {
      return { success: false, error: "Billing statement not found" };
    }

    // Generate unique receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create delivery receipt with required billingStatementId and simplified fields only (Requirements 3.1, 3.2, 3.3, 3.4)
    const deliveryReceipt = await prisma.deliveryReceipt.create({
      data: {
        receiptNumber,
        billingStatementId: validatedData.billingStatementId, // Required field (Requirement 3.5)
        // Essential delivery information (Requirement 3.1, 3.2)
        deliveryDate: validatedData.deliveryDate,
        receivedBy: validatedData.receivedBy,
        receivedByTitle: validatedData.receivedByTitle,
        deliveryAddress: validatedData.deliveryAddress,
        deliveryNotes: validatedData.deliveryNotes,
        deliveryStatus: validatedData.deliveryStatus as PrismaDeliveryStatus,
        // Optional proof fields (Requirement 3.3)
        signatureImage: validatedData.signatureImage,
        photoEvidence: validatedData.photoEvidence,
        // Optional tracking fields (Requirement 3.4)
        trackingNumber: validatedData.trackingNumber,
        courierService: validatedData.courierService,
        createdBy: session.user.id,
      },
    });

    revalidatePath("/admin/billing/delivery-receipts");
    revalidatePath(`/admin/billing/statements/${validatedData.billingStatementId}`);

    return {
      success: true,
      data: deliveryReceipt as DeliveryReceipt,
      message: "Delivery receipt created successfully",
    };
  } catch (error) {
    console.error("Error creating delivery receipt:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`,
      };
    }
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

    // Get existing receipt with billing statement to maintain relationship integrity (Requirement 4.2, 4.3)
    const existingReceipt = await prisma.deliveryReceipt.findUnique({
      where: { id },
      include: {
        billingStatement: true,
      },
    });

    if (!existingReceipt) {
      return { success: false, error: "Delivery receipt not found" };
    }

    // If billingStatementId is being changed, verify the new billing statement exists (Requirement 4.1, 4.2)
    if (data.billingStatementId && data.billingStatementId !== existingReceipt.billingStatementId) {
      const newBillingStatement = await prisma.billingStatement.findUnique({
        where: { id: data.billingStatementId },
      });

      if (!newBillingStatement) {
        return { success: false, error: "New billing statement not found" };
      }
    }

    // Prepare update data with simplified fields only - no itemsDelivered JSON handling (Requirements 3.1, 3.2, 3.3, 3.4)
    const updateData: any = {
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    };

    // Essential delivery information (Requirements 3.1, 3.2)
    if (data.billingStatementId !== undefined) {
      updateData.billingStatementId = data.billingStatementId;
    }

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

    if (data.deliveryStatus !== undefined) {
      updateData.deliveryStatus = data.deliveryStatus as PrismaDeliveryStatus;
    }

    // Optional proof fields (Requirement 3.3)
    if (data.signatureImage !== undefined) {
      updateData.signatureImage = data.signatureImage;
    }

    if (data.photoEvidence !== undefined) {
      updateData.photoEvidence = data.photoEvidence;
    }

    // Optional tracking fields (Requirement 3.4)
    if (data.trackingNumber !== undefined) {
      updateData.trackingNumber = data.trackingNumber;
    }

    if (data.courierService !== undefined) {
      updateData.courierService = data.courierService;
    }

    // Update delivery receipt while maintaining relationship integrity (Requirement 4.3, 4.4)
    const updatedReceipt = await prisma.deliveryReceipt.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/billing/delivery-receipts");
    revalidatePath(`/admin/billing/delivery-receipts/${id}`);
    revalidatePath(`/admin/billing/statements/${updatedReceipt.billingStatementId}`);

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
    revalidatePath(`/admin/billing/statements/${updatedReceipt.billingStatementId}`);

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

    // Get the receipt to check if it can be deleted - maintain relationship integrity
    const receipt = await prisma.deliveryReceipt.findUnique({
      where: { id },
      include: { billingStatement: true },
    });

    if (!receipt) {
      return { success: false, error: "Delivery receipt not found" };
    }

    // Since billingStatementId is required, all receipts are linked to billing statements
    // Only allow deletion of pending or cancelled receipts to maintain data integrity
    if (!["PENDING", "CANCELLED"].includes(receipt.deliveryStatus)) {
      return {
        success: false,
        error: "Only pending or cancelled delivery receipts can be deleted",
      };
    }

    // Additional check: ensure billing statement allows receipt deletion
    if (receipt.billingStatement && receipt.billingStatement.status === "PAID") {
      return {
        success: false,
        error: "Cannot delete delivery receipt for paid billing statements",
      };
    }

    // Delete delivery receipt
    await prisma.deliveryReceipt.delete({
      where: { id },
    });

    revalidatePath("/admin/billing/delivery-receipts");
    revalidatePath(`/admin/billing/statements/${receipt.billingStatementId}`);

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
    revalidatePath(`/admin/billing/statements/${updatedReceipt.billingStatementId}`);

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
    revalidatePath(`/admin/billing/statements/${updatedReceipt.billingStatementId}`);

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

    // Get customer order with details and find associated billing statement
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        customer: true,
        billingStatements: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customerOrder) {
      return { success: false, error: "Customer order not found" };
    }

    // Find the billing statement for this customer order
    const billingStatement = customerOrder.billingStatements[0];
    if (!billingStatement) {
      return { 
        success: false, 
        error: "No billing statement found for this customer order. Please create a billing statement first." 
      };
    }

    // Create delivery receipt from order data with simplified fields
    const formData: DeliveryReceiptFormData = {
      billingStatementId: billingStatement.id,
      deliveryDate: deliveryData.deliveryDate || new Date(),
      receivedBy: deliveryData.receivedBy || "",
      receivedByTitle: deliveryData.receivedByTitle,
      deliveryAddress:
        deliveryData.deliveryAddress ||
        customerOrder.shippingAddress ||
        customerOrder.customer.address ||
        "",
      deliveryNotes: deliveryData.deliveryNotes,
      deliveryStatus: deliveryData.deliveryStatus || DeliveryStatus.PENDING,
      signatureImage: deliveryData.signatureImage,
      photoEvidence: deliveryData.photoEvidence,
      trackingNumber: deliveryData.trackingNumber,
      courierService: deliveryData.courierService,
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

    // Get production order with details and find associated billing statement
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
        billingStatements: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
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

    // Find the billing statement for this production order
    const billingStatement = productionOrder.billingStatements[0];
    if (!billingStatement) {
      return { 
        success: false, 
        error: "No billing statement found for this production order. Please create a billing statement first." 
      };
    }

    // Create delivery receipt from production order data with simplified fields
    const formData: DeliveryReceiptFormData = {
      billingStatementId: billingStatement.id,
      deliveryDate: deliveryData.deliveryDate || new Date(),
      receivedBy: deliveryData.receivedBy || "",
      receivedByTitle: deliveryData.receivedByTitle,
      deliveryAddress:
        deliveryData.deliveryAddress ||
        productionOrder.customerOrder?.shippingAddress ||
        productionOrder.customerOrder?.customer.address ||
        "",
      deliveryNotes: deliveryData.deliveryNotes || 
        `Delivery for production order - ${productionOrder.product.name} (Qty: ${productionOrder.quantity})`,
      deliveryStatus: deliveryData.deliveryStatus || DeliveryStatus.PENDING,
      signatureImage: deliveryData.signatureImage,
      photoEvidence: deliveryData.photoEvidence,
      trackingNumber: deliveryData.trackingNumber,
      courierService: deliveryData.courierService,
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

    // Get simplified delivery method breakdown (no longer tracking specific methods)
    const deliveryMethodBreakdown = [
      {
        method: "Standard Delivery",
        count: totalDeliveries,
        successRate: successRate,
        averageDeliveryTime: 0, // Would need timestamp tracking
      },
    ];

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
      billingStatement: {
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
    customerName: receipt.billingStatement?.customer?.name || receipt.billingStatement?.customerName || "Unknown",
    deliveryMethod: "Standard", // Simplified - no longer tracking delivery method
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
