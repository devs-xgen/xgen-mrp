"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FulfillmentType, FulfillmentStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface StockAllocationResult {
  success: boolean;
  message: string;
  allocatedQuantity: number;
  availableStock: number;
  errors?: string[];
}

export interface StockReservation {
  id: string;
  orderLineId: string;
  productId: string;
  productVariantId?: string;
  quantityReserved: number;
  quantityAllocated: number;
  reservedAt: Date;
  expiresAt: Date;
  status: "RESERVED" | "ALLOCATED" | "EXPIRED" | "RELEASED";
}

/**
 * Reserve stock for an order line without immediate allocation
 * This creates a temporary hold on inventory
 */
export async function reserveStockForOrderLine(
  orderLineId: string,
  quantity: number,
  reservationDurationMinutes: number = 30
): Promise<StockAllocationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    // Get order line details
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currentStock: true,
            committedStock: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            displayName: true,
            currentStock: true,
            committedStock: true,
          },
        },
      },
    });

    if (!orderLine) {
      return {
        success: false,
        message: "Order line not found",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    const currentStock = orderLine.productVariant
      ? orderLine.productVariant.currentStock
      : orderLine.product.currentStock;

    const committedStock = orderLine.productVariant
      ? orderLine.productVariant.committedStock
      : orderLine.product.committedStock;

    const availableStock = currentStock - committedStock;

    if (availableStock < quantity) {
      return {
        success: false,
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
        allocatedQuantity: 0,
        availableStock,
      };
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + reservationDurationMinutes);

    // Create stock reservation record (using a simple table approach)
    // Note: This is a simplified reservation system - in production, you might want a dedicated table
    await prisma.orderLine.update({
      where: { id: orderLineId },
      data: {
        fulfillmentType: FulfillmentType.PENDING,
        fulfillmentStatus: FulfillmentStatus.PENDING,
        stockAllocated: 0, // Reserved but not yet allocated
        notes: `Stock reserved: ${quantity} units until ${expiresAt.toISOString()}`,
      },
    });

    // Reserve stock by increasing committed stock
    if (orderLine.productVariantId) {
      await prisma.productVariant.update({
        where: { id: orderLine.productVariantId },
        data: {
          committedStock: { increment: quantity },
        },
      });
    } else {
      await prisma.product.update({
        where: { id: orderLine.productId },
        data: {
          committedStock: { increment: quantity },
        },
      });
    }

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: `Successfully reserved ${quantity} units`,
      allocatedQuantity: 0,
      availableStock: availableStock - quantity,
    };
  } catch (error) {
    console.error("Error reserving stock:", error);
    return {
      success: false,
      message: "Failed to reserve stock",
      allocatedQuantity: 0,
      availableStock: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Allocate reserved stock to an order line
 * This converts a reservation into an actual allocation
 */
export async function allocateStockForOrderLine(
  orderLineId: string,
  quantity: number
): Promise<StockAllocationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    // Get order line details
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currentStock: true,
            committedStock: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            displayName: true,
            currentStock: true,
            committedStock: true,
          },
        },
      },
    });

    if (!orderLine) {
      return {
        success: false,
        message: "Order line not found",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    const currentStock = orderLine.productVariant
      ? orderLine.productVariant.currentStock
      : orderLine.product.currentStock;

    const committedStock = orderLine.productVariant
      ? orderLine.productVariant.committedStock
      : orderLine.product.committedStock;

    // Check if there's sufficient committed stock (reserved)
    if (committedStock < quantity) {
      return {
        success: false,
        message: `Insufficient reserved stock. Reserved: ${committedStock}, Requested: ${quantity}`,
        allocatedQuantity: 0,
        availableStock: currentStock - committedStock,
      };
    }

    // Allocate stock by reducing current stock and committed stock
    if (orderLine.productVariantId) {
      await prisma.productVariant.update({
        where: { id: orderLine.productVariantId },
        data: {
          currentStock: { decrement: quantity },
          committedStock: { decrement: quantity },
        },
      });
    } else {
      await prisma.product.update({
        where: { id: orderLine.productId },
        data: {
          currentStock: { decrement: quantity },
          committedStock: { decrement: quantity },
        },
      });
    }

    // Update order line with allocation details
    await prisma.orderLine.update({
      where: { id: orderLineId },
      data: {
        fulfillmentType: FulfillmentType.STOCK,
        fulfillmentStatus: FulfillmentStatus.ALLOCATED,
        stockAllocated: quantity,
        allocatedAt: new Date(),
      },
    });

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: `Successfully allocated ${quantity} units from stock`,
      allocatedQuantity: quantity,
      availableStock: currentStock - quantity,
    };
  } catch (error) {
    console.error("Error allocating stock:", error);
    return {
      success: false,
      message: "Failed to allocate stock",
      allocatedQuantity: 0,
      availableStock: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Release reserved stock back to available inventory
 * This cancels a reservation without allocation
 */
export async function releaseStockReservation(
  orderLineId: string,
  quantity?: number
): Promise<StockAllocationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    // Get order line details
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currentStock: true,
            committedStock: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            displayName: true,
            currentStock: true,
            committedStock: true,
          },
        },
      },
    });

    if (!orderLine) {
      return {
        success: false,
        message: "Order line not found",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    const committedStock = orderLine.productVariant
      ? orderLine.productVariant.committedStock
      : orderLine.product.committedStock;

    const quantityToRelease = quantity || committedStock;

    if (quantityToRelease > committedStock) {
      return {
        success: false,
        message: `Cannot release more than reserved. Reserved: ${committedStock}, Requested: ${quantityToRelease}`,
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    // Release stock by reducing committed stock
    if (orderLine.productVariantId) {
      await prisma.productVariant.update({
        where: { id: orderLine.productVariantId },
        data: {
          committedStock: { decrement: quantityToRelease },
        },
      });
    } else {
      await prisma.product.update({
        where: { id: orderLine.productId },
        data: {
          committedStock: { decrement: quantityToRelease },
        },
      });
    }

    // Update order line status
    await prisma.orderLine.update({
      where: { id: orderLineId },
      data: {
        fulfillmentType: FulfillmentType.PENDING,
        fulfillmentStatus: FulfillmentStatus.PENDING,
        stockAllocated: 0,
        allocatedAt: null,
        notes: orderLine.notes
          ? `${orderLine.notes}\nStock reservation released: ${quantityToRelease} units`
          : `Stock reservation released: ${quantityToRelease} units`,
      },
    });

    const currentStock = orderLine.productVariant
      ? orderLine.productVariant.currentStock
      : orderLine.product.currentStock;

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: `Successfully released ${quantityToRelease} units back to inventory`,
      allocatedQuantity: 0,
      availableStock: currentStock - (committedStock - quantityToRelease),
    };
  } catch (error) {
    console.error("Error releasing stock reservation:", error);
    return {
      success: false,
      message: "Failed to release stock reservation",
      allocatedQuantity: 0,
      availableStock: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Complete fulfillment of an order line
 * This marks the order line as fulfilled
 */
export async function completeFulfillment(
  orderLineId: string
): Promise<StockAllocationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    // Get current order line status
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
      select: {
        id: true,
        quantity: true,
        stockAllocated: true,
        productionQuantity: true,
        fulfillmentStatus: true,
      },
    });

    if (!orderLine) {
      return {
        success: false,
        message: "Order line not found",
        allocatedQuantity: 0,
        availableStock: 0,
      };
    }

    const totalAllocated =
      (orderLine.stockAllocated || 0) + (orderLine.productionQuantity || 0);

    if (totalAllocated < orderLine.quantity) {
      return {
        success: false,
        message: `Cannot complete fulfillment. Required: ${orderLine.quantity}, Allocated: ${totalAllocated}`,
        allocatedQuantity: totalAllocated,
        availableStock: 0,
      };
    }

    // Mark as fulfilled
    await prisma.orderLine.update({
      where: { id: orderLineId },
      data: {
        fulfillmentStatus: FulfillmentStatus.FULFILLED,
        fulfilledAt: new Date(),
      },
    });

    revalidatePath("/admin/customer-orders-v2");

    return {
      success: true,
      message: "Order line marked as fulfilled",
      allocatedQuantity: totalAllocated,
      availableStock: 0,
    };
  } catch (error) {
    console.error("Error completing fulfillment:", error);
    return {
      success: false,
      message: "Failed to complete fulfillment",
      allocatedQuantity: 0,
      availableStock: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Get stock allocation status for an order line
 */
export async function getStockAllocationStatus(orderLineId: string) {
  try {
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
            committedStock: true,
            minimumStockLevel: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            displayName: true,
            sku: true,
            currentStock: true,
            committedStock: true,
            minimumStockLevel: true,
          },
        },
      },
    });

    if (!orderLine) {
      return null;
    }

    const productInfo = orderLine.productVariant || orderLine.product;
    const availableStock =
      productInfo.currentStock - productInfo.committedStock;

    return {
      orderLineId: orderLine.id,
      quantity: orderLine.quantity,
      stockAllocated: orderLine.stockAllocated || 0,
      productionQuantity: orderLine.productionQuantity || 0,
      fulfillmentType: orderLine.fulfillmentType,
      fulfillmentStatus: orderLine.fulfillmentStatus,
      allocatedAt: orderLine.allocatedAt,
      fulfilledAt: orderLine.fulfilledAt,
      product: {
        ...productInfo,
        availableStock,
      },
    };
  } catch (error) {
    console.error("Error getting stock allocation status:", error);
    return null;
  }
}

/**
 * Update fulfillment status and send notifications
 */
export async function updateFulfillmentStatus(
  orderLineId: string,
  status: FulfillmentStatus,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    await prisma.orderLine.update({
      where: { id: orderLineId },
      data: {
        fulfillmentStatus: status,
        ...(status === FulfillmentStatus.FULFILLED && {
          fulfilledAt: new Date(),
        }),
        ...(notes && {
          notes: notes,
        }),
        modifiedBy: session.user.id,
      },
    });

    // Check if entire order is fulfilled
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
      include: {
        customerOrder: {
          include: {
            orderLines: {
              select: {
                fulfillmentStatus: true,
              },
            },
          },
        },
      },
    });

    if (orderLine) {
      const allOrderLinesFulfilled = orderLine.customerOrder.orderLines.every(
        (line) => line.fulfillmentStatus === FulfillmentStatus.FULFILLED
      );

      if (allOrderLinesFulfilled) {
        await prisma.customerOrder.update({
          where: { id: orderLine.customerOrder.id },
          data: {
            status: "COMPLETED",
            modifiedBy: session.user.id,
          },
        });
      }
    }

    revalidatePath("/admin/customer-orders-v2");
    return {
      success: true,
      message: "Fulfillment status updated successfully",
    };
  } catch (error) {
    console.error("Error updating fulfillment status:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get fulfillment tracking for all order lines of a customer order
 */
export async function getOrderFulfillmentTracking(orderId: string) {
  try {
    const order = await prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                displayName: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    const fulfillmentTracking = order.orderLines.map((line) => ({
      id: line.id,
      product: line.productVariant || line.product,
      quantity: line.quantity,
      stockAllocated: line.stockAllocated || 0,
      productionQuantity: line.productionQuantity || 0,
      fulfillmentType: line.fulfillmentType,
      fulfillmentStatus: line.fulfillmentStatus,
      allocatedAt: line.allocatedAt,
      fulfilledAt: line.fulfilledAt,
      completionPercentage: Math.round(
        (((line.stockAllocated || 0) + (line.productionQuantity || 0)) /
          line.quantity) *
          100
      ),
    }));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderLines: fulfillmentTracking,
      overallCompletion: Math.round(
        fulfillmentTracking.reduce(
          (sum, line) => sum + line.completionPercentage,
          0
        ) / fulfillmentTracking.length
      ),
    };
  } catch (error) {
    console.error("Error getting order fulfillment tracking:", error);
    return null;
  }
}

/**
 * Batch stock allocation for multiple order lines
 */
export async function batchAllocateStock(
  allocations: Array<{
    orderLineId: string;
    quantity: number;
  }>
): Promise<{
  success: boolean;
  message: string;
  results: StockAllocationResult[];
  errors?: string[];
}> {
  try {
    const results: StockAllocationResult[] = [];
    const errors: string[] = [];

    for (const allocation of allocations) {
      const result = await allocateStockForOrderLine(
        allocation.orderLineId,
        allocation.quantity
      );
      results.push(result);

      if (!result.success) {
        errors.push(`Line ${allocation.orderLineId}: ${result.message}`);
      }
    }

    const successfulAllocations = results.filter((r) => r.success).length;

    return {
      success: successfulAllocations > 0,
      message: `${successfulAllocations}/${allocations.length} allocations successful`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error in batch stock allocation:", error);
    return {
      success: false,
      message: "Batch allocation failed",
      results: [],
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}
