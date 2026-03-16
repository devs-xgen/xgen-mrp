"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { Status, Priority } from "@prisma/client";

/**
 * Ensure user has SUPER_ADMIN role
 */
async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized - no active session");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden - SUPER_ADMIN role required");
  }

  return session;
}

/**
 * Get all customer orders across all tenants with advanced filtering
 */
export async function getAllCustomerOrdersSuperadmin(filters?: {
  search?: string;
  customerId?: string;
  tenantId?: string;
  status?: Status[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  productId?: string;
  productVariantId?: string;
}) {
  const session = await ensureSuperAdmin();

  try {
    const where: any = {};

    // Search filter (order number, customer name, notes)
    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: "insensitive" } },
        { customer: { name: { contains: filters.search, mode: "insensitive" } } },
        { notes: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Customer filter
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    // Tenant filter
    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    // Status filter
    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    // Date range filter
    if (filters?.dateFrom || filters?.dateTo) {
      where.orderDate = {};
      if (filters.dateFrom) where.orderDate.gte = filters.dateFrom;
      if (filters.dateTo) where.orderDate.lte = filters.dateTo;
    }

    // Amount range filter
    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      where.totalAmount = {};
      if (filters.minAmount !== undefined) where.totalAmount.gte = new Decimal(filters.minAmount);
      if (filters.maxAmount !== undefined) where.totalAmount.lte = new Decimal(filters.maxAmount);
    }

    // Product filter (via order lines)
    if (filters?.productId || filters?.productVariantId) {
      where.orderLines = {
        some: {
          ...(filters.productId && { productId: filters.productId }),
          ...(filters.productVariantId && { productVariantId: filters.productVariantId }),
        },
      };
    }

    const orders = await prisma.customerOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            tenantId: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
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
                sku: true,
                displayName: true,
              },
            },
          },
        },
        productionOrders: {
          select: {
            id: true,
            status: true,
            quantity: true,
            completedQuantity: true,
          },
        },
        billingStatements: {
          select: {
            id: true,
            statementNumber: true,
            status: true,
          },
        },
        _count: {
          select: {
            orderLines: true,
            productionOrders: true,
            billingStatements: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    // Serialize Decimals
    return orders.map(order => ({
      ...order,
      totalAmount: order.totalAmount instanceof Decimal
        ? order.totalAmount.toNumber()
        : Number(order.totalAmount),
      orderLines: order.orderLines.map(line => ({
        ...line,
        unitPrice: line.unitPrice instanceof Decimal
          ? line.unitPrice.toNumber()
          : Number(line.unitPrice),
      })),
    }));
  } catch (error) {
    console.error("[SuperAdmin] Error fetching customer orders:", error);
    throw new Error("Failed to fetch customer orders");
  }
}

/**
 * Get customer order statistics
 */
export async function getCustomerOrderStatsSuperadmin() {
  const session = await ensureSuperAdmin();

  try {
    const [total, byStatus, byTenant, totalRevenue] = await Promise.all([
      // Total orders
      prisma.customerOrder.count(),

      // Orders by status
      prisma.customerOrder.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Orders by tenant (top 5)
      prisma.customerOrder.groupBy({
        by: ["tenantId"],
        _count: true,
        orderBy: {
          _count: {
            tenantId: "desc",
          },
        },
        take: 5,
      }),

      // Total revenue
      prisma.customerOrder.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const statusCounts = byStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus: statusCounts,
      topTenants: byTenant.map(t => ({
        tenantId: t.tenantId,
        count: t._count,
      })),
      totalRevenue: totalRevenue._sum.totalAmount instanceof Decimal
        ? totalRevenue._sum.totalAmount.toNumber()
        : Number(totalRevenue._sum.totalAmount || 0),
    };
  } catch (error) {
    console.error("[SuperAdmin] Error fetching customer order stats:", error);
    throw new Error("Failed to fetch customer order statistics");
  }
}

/**
 * Create customer order with SuperAdmin overrides
 */
export async function createCustomerOrderSuperadmin(input: {
  customerId: string;
  tenantId: string;
  orderDate?: string;
  deliveryDate?: string;
  notes?: string;
  orderLines: Array<{
    productId: string;
    productVariantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  overrides?: {
    skipDateValidation?: boolean;
    skipStockCheck?: boolean;
    customPricing?: boolean;
  };
  options?: {
    createProductionOrders?: boolean;
    autoApprove?: boolean;
  };
  reason: string;
}): Promise<{
  success: true;
  orderId: string;
  orderNumber: string;
  productionOrderIds?: string[];
  warnings?: string[];
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    // Validation
    if (!input.reason || input.reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    if (!input.orderLines || input.orderLines.length === 0) {
      return {
        success: false,
        error: "Order must have at least one line item",
      };
    }

    // Validate customer and tenant exist
    const [customer, tenant] = await Promise.all([
      prisma.customer.findUnique({ where: { id: input.customerId } }),
      prisma.tenant.findUnique({ where: { id: input.tenantId } }),
    ]);

    if (!customer) {
      return {
        success: false,
        error: "Customer not found",
      };
    }

    if (!tenant) {
      return {
        success: false,
        error: "Tenant not found",
      };
    }

    // Generate order number
    const year = new Date().getFullYear();
    const lastOrder = await prisma.customerOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `CO-${year}`,
        },
      },
      orderBy: {
        orderNumber: "desc",
      },
    });

    let sequenceNumber = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2]);
      sequenceNumber = lastSequence + 1;
    }

    const orderNumber = `CO-${year}-${String(sequenceNumber).padStart(4, "0")}`;

    // Calculate total amount
    const totalAmount = input.orderLines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0
    );

    // Parse dates
    const orderDate = input.orderDate ? new Date(input.orderDate) : new Date();
    const deliveryDate = input.deliveryDate ? new Date(input.deliveryDate) : undefined;

    // Date validation (unless overridden)
    if (!input.overrides?.skipDateValidation) {
      if (deliveryDate && deliveryDate < orderDate) {
        return {
          success: false,
          error: "Delivery date cannot be before order date",
        };
      }
    }

    const warnings: string[] = [];
    const productionOrderIds: string[] = [];

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create customer order
      const customerOrder = await tx.customerOrder.create({
        data: {
          orderNumber,
          customerId: input.customerId,
          tenantId: input.tenantId,
          orderDate,
          requiredDate: deliveryDate || orderDate,
          status: input.options?.autoApprove ? Status.APPROVED : Status.PENDING,
          totalAmount: new Decimal(totalAmount),
          notes: input.notes,
          orderLines: {
            create: input.orderLines.map((line) => ({
              productId: line.productId,
              productVariantId: line.productVariantId || null,
              quantity: line.quantity,
              unitPrice: new Decimal(line.unitPrice),
              status: input.options?.autoApprove ? Status.APPROVED : Status.PENDING,
            })),
          },
        },
      });

      // Create production orders if requested
      if (input.options?.createProductionOrders) {
        // Get default work center
        const defaultWorkCenter = await tx.workCenter.findFirst({
          where: { status: Status.ACTIVE },
        });

        if (!defaultWorkCenter) {
          warnings.push("No active work center found - production orders not created");
        } else {
          for (const orderLine of input.orderLines) {
            // Get product lead time
            const product = await tx.product.findUnique({
              where: { id: orderLine.productId },
              select: { leadTimeDays: true },
            });

            const leadTime = product?.leadTimeDays || 7;
            const dueDate = deliveryDate ? new Date(deliveryDate) : new Date();
            dueDate.setDate(dueDate.getDate() - leadTime);

            // Create production order
            const productionOrder = await tx.productionOrder.create({
              data: {
                productId: orderLine.productId,
                productVariantId: orderLine.productVariantId,
                quantity: orderLine.quantity,
                customerOrderId: customerOrder.id,
                tenantId: input.tenantId,
                startDate: new Date(),
                dueDate,
                priority: Priority.MEDIUM,
                status: Status.PENDING,
                plannedMaterialCost: 0,
                createdBy: session.user.id,
              },
            });

            productionOrderIds.push(productionOrder.id);
          }
        }
      }

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_CUSTOMER_ORDER_CREATED",
          description: `Created customer order ${orderNumber} for customer ${customer.name}`,
          metadata: {
            customerOrderId: customerOrder.id,
            orderNumber,
            customerId: input.customerId,
            tenantId: input.tenantId,
            totalAmount,
            orderLinesCount: input.orderLines.length,
            overrides: input.overrides,
            options: input.options,
            productionOrderIds,
            reason: input.reason,
          },
          performedBy: session.user.id,
        },
      });

      return { customerOrder, productionOrderIds, warnings };
    });

    revalidatePath("/superadmin/customer-orders");
    revalidatePath("/admin/customer-orders-v2");

    return {
      success: true,
      orderId: result.customerOrder.id,
      orderNumber: result.customerOrder.orderNumber,
      productionOrderIds: result.productionOrderIds.length > 0 ? result.productionOrderIds : undefined,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error creating customer order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create customer order",
    };
  }
}

/**
 * Bulk update customer order status
 */
export async function bulkUpdateCustomerOrderStatus(
  orderIds: string[],
  newStatus: Status,
  reason: string
): Promise<{
  success: true;
  count: number;
  warnings?: string[];
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    // Validation
    if (orderIds.length === 0) {
      return {
        success: false,
        error: "No orders selected",
      };
    }

    if (orderIds.length > 100) {
      return {
        success: false,
        error: "Cannot update more than 100 orders at once",
      };
    }

    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    // Fetch orders to validate state transitions
    const orders = await prisma.customerOrder.findMany({
      where: { id: { in: orderIds } },
      include: {
        productionOrders: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const warnings: string[] = [];
    const validOrderIds: string[] = [];

    // Validate each order
    for (const order of orders) {
      // Can't cancel if production is in progress or completed
      if (newStatus === Status.CANCELLED) {
        const hasActiveProduction = order.productionOrders.some(po =>
          [Status.IN_PROGRESS, Status.COMPLETED].includes(po.status)
        );

        if (hasActiveProduction) {
          warnings.push(`Order ${order.orderNumber} has active/completed production - skipped`);
          continue;
        }
      }

      validOrderIds.push(order.id);
    }

    if (validOrderIds.length === 0) {
      return {
        success: false,
        error: "No valid orders to update. All orders have constraints preventing status change.",
      };
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update orders
      await tx.customerOrder.updateMany({
        where: { id: { in: validOrderIds } },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      // If cancelling, cancel pending production orders
      if (newStatus === Status.CANCELLED) {
        await tx.productionOrder.updateMany({
          where: {
            customerOrderId: { in: validOrderIds },
            status: Status.PENDING,
          },
          data: {
            status: Status.CANCELLED,
            updatedAt: new Date(),
          },
        });
      }

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_ORDER_STATUS_UPDATE",
          description: `Bulk updated ${validOrderIds.length} customer orders to ${newStatus}`,
          metadata: {
            orderIds: validOrderIds,
            newStatus,
            skippedCount: orderIds.length - validOrderIds.length,
            warnings,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: validOrderIds.length, warnings };
    });

    revalidatePath("/superadmin/customer-orders");
    revalidatePath("/admin/customer-orders-v2");

    return {
      success: true,
      count: result.count,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error bulk updating customer orders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk update orders",
    };
  }
}

/**
 * Link production order to customer order
 */
export async function linkProductionOrderToCustomerOrder(
  customerOrderId: string,
  productionOrderId: string,
  reason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    // Validate both exist
    const [customerOrder, productionOrder] = await Promise.all([
      prisma.customerOrder.findUnique({ where: { id: customerOrderId } }),
      prisma.productionOrder.findUnique({ where: { id: productionOrderId } }),
    ]);

    if (!customerOrder) {
      return {
        success: false,
        error: "Customer order not found",
      };
    }

    if (!productionOrder) {
      return {
        success: false,
        error: "Production order not found",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Link production order
      await tx.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          customerOrderId,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_PRODUCTION_ORDER_LINKED",
          description: `Linked production order to customer order ${customerOrder.orderNumber}`,
          metadata: {
            customerOrderId,
            productionOrderId,
            reason,
          },
          performedBy: session.user.id,
        },
      });
    });

    revalidatePath("/superadmin/customer-orders");
    revalidatePath(`/superadmin/customer-orders/${customerOrderId}`);

    return { success: true };
  } catch (error) {
    console.error("[SuperAdmin] Error linking production order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to link production order",
    };
  }
}

/**
 * Unlink production order from customer order
 */
export async function unlinkProductionOrderFromCustomerOrder(
  productionOrderId: string,
  reason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        customerOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    if (!productionOrder) {
      return {
        success: false,
        error: "Production order not found",
      };
    }

    if (!productionOrder.customerOrderId) {
      return {
        success: false,
        error: "Production order is not linked to any customer order",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Unlink production order
      await tx.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          customerOrderId: null,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_PRODUCTION_ORDER_UNLINKED",
          description: `Unlinked production order from customer order ${productionOrder.customerOrder?.orderNumber}`,
          metadata: {
            productionOrderId,
            previousCustomerOrderId: productionOrder.customerOrderId,
            reason,
          },
          performedBy: session.user.id,
        },
      });
    });

    revalidatePath("/superadmin/customer-orders");
    revalidatePath("/superadmin/production");

    return { success: true };
  } catch (error) {
    console.error("[SuperAdmin] Error unlinking production order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unlink production order",
    };
  }
}

/**
 * Create production orders from customer order
 */
export async function createProductionOrdersFromCustomerOrder(
  customerOrderId: string,
  orderLineIds?: string[], // Optional: specific lines only
  reason?: string
): Promise<{
  success: true;
  productionOrderIds: string[];
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (reason && reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters (if provided)",
      };
    }

    // Get customer order with order lines
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        orderLines: {
          where: orderLineIds ? { id: { in: orderLineIds } } : undefined,
        },
      },
    });

    if (!customerOrder) {
      return {
        success: false,
        error: "Customer order not found",
      };
    }

    if (customerOrder.orderLines.length === 0) {
      return {
        success: false,
        error: "No order lines to create production orders from",
      };
    }

    // Get default work center
    const defaultWorkCenter = await prisma.workCenter.findFirst({
      where: { status: Status.ACTIVE },
    });

    if (!defaultWorkCenter) {
      return {
        success: false,
        error: "No active work center found",
      };
    }

    const productionOrderIds: string[] = [];

    // Transaction
    await prisma.$transaction(async (tx) => {
      for (const orderLine of customerOrder.orderLines) {
        // Check if production order already exists for this line
        const existing = await tx.productionOrder.findFirst({
          where: {
            customerOrderId,
            productId: orderLine.productId,
            productVariantId: orderLine.productVariantId,
          },
        });

        if (existing) continue; // Skip if already exists

        // Get product lead time
        const product = await tx.product.findUnique({
          where: { id: orderLine.productId },
          select: { leadTimeDays: true },
        });

        const leadTime = product?.leadTimeDays || 7;
        const deliveryDate = customerOrder.requiredDate;
        const dueDate = new Date(deliveryDate);
        dueDate.setDate(dueDate.getDate() - leadTime);

        // Calculate priority based on urgency
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const priority = daysUntilDue < 3 ? Priority.URGENT :
                        daysUntilDue < 7 ? Priority.HIGH : Priority.MEDIUM;

        // Create production order
        const productionOrder = await tx.productionOrder.create({
          data: {
            productId: orderLine.productId,
            productVariantId: orderLine.productVariantId,
            quantity: orderLine.quantity,
            customerOrderId,
            tenantId: customerOrder.tenantId,
            startDate: new Date(),
            dueDate,
            priority,
            status: Status.PENDING,
            plannedMaterialCost: 0,
            createdBy: session.user.id,
          },
        });

        productionOrderIds.push(productionOrder.id);
      }

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_PRODUCTION_ORDER_CREATED_FROM_CUSTOMER_ORDER",
          description: `Created ${productionOrderIds.length} production orders from customer order ${customerOrder.orderNumber}`,
          metadata: {
            customerOrderId,
            productionOrderIds,
            orderLineIds: orderLineIds || "all",
            reason: reason || "Auto-created from customer order",
          },
          performedBy: session.user.id,
        },
      });
    });

    revalidatePath("/superadmin/customer-orders");
    revalidatePath("/superadmin/production");

    return {
      success: true,
      productionOrderIds,
      count: productionOrderIds.length,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error creating production orders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create production orders",
    };
  }
}

/**
 * Delete customer order (with cascade)
 */
export async function deleteCustomerOrderSuperadmin(
  orderId: string,
  reason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        orderLines: true,
        productionOrders: true,
        billingStatements: true,
      },
    });

    if (!customerOrder) {
      return {
        success: false,
        error: "Customer order not found",
      };
    }

    // Check if order has completed production
    const hasCompletedProduction = customerOrder.productionOrders.some(
      po => po.status === Status.COMPLETED
    );

    if (hasCompletedProduction) {
      return {
        success: false,
        error: "Cannot delete order with completed production. Consider archiving instead.",
      };
    }

    // Check if order has billing statements
    if (customerOrder.billingStatements.length > 0) {
      return {
        success: false,
        error: "Cannot delete order with billing statements. Remove billing first.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete production orders cascade (handled by schema)
      await tx.productionOrder.deleteMany({
        where: { customerOrderId: orderId },
      });

      // Delete order lines
      await tx.orderLine.deleteMany({
        where: { orderId },
      });

      // Delete customer order
      await tx.customerOrder.delete({
        where: { id: orderId },
      });

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_CUSTOMER_ORDER_DELETED",
          description: `Deleted customer order ${customerOrder.orderNumber}`,
          metadata: {
            customerOrderId: orderId,
            orderNumber: customerOrder.orderNumber,
            orderLinesCount: customerOrder.orderLines.length,
            productionOrdersCount: customerOrder.productionOrders.length,
            reason,
          },
          performedBy: session.user.id,
        },
      });
    });

    revalidatePath("/superadmin/customer-orders");

    return { success: true };
  } catch (error) {
    console.error("[SuperAdmin] Error deleting customer order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete customer order",
    };
  }
}
