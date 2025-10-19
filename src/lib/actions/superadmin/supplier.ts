"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

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
 * Get all suppliers across all tenants
 */
export async function getAllSuppliersSuperadmin(filters?: {
  search?: string;
  tenantId?: string;
  status?: string;
}) {
  const session = await ensureSuperAdmin();

  try {
    const where: any = {
      archivedAt: null,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
            materials: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return suppliers.map(s => ({
      ...s,
      creditLimit: s.creditLimit instanceof Decimal ? s.creditLimit.toNumber() : Number(s.creditLimit || 0),
    }));
  } catch (error) {
    console.error("[SuperAdmin] Error fetching suppliers:", error);
    throw new Error("Failed to fetch suppliers");
  }
}

/**
 * Get supplier statistics
 */
export async function getSupplierStatsSuperadmin() {
  const session = await ensureSuperAdmin();

  try {
    const [total, active, totalPOs, pendingPOs] = await Promise.all([
      prisma.supplier.count({ where: { archivedAt: null } }),
      prisma.supplier.count({ where: { archivedAt: null, status: "ACTIVE" } }),
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.count({ where: { status: "PENDING" } }),
    ]);

    return {
      total,
      active,
      totalPOs,
      pendingPOs,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error fetching supplier stats:", error);
    throw new Error("Failed to fetch supplier statistics");
  }
}

/**
 * Get all purchase orders across all tenants
 */
export async function getAllPurchaseOrdersSuperadmin(filters?: {
  search?: string;
  supplierId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const session = await ensureSuperAdmin();

  try {
    const where: any = {};

    if (filters?.search) {
      where.orderNumber = { contains: filters.search, mode: "insensitive" };
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.orderDate = {};
      if (filters.dateFrom) where.orderDate.gte = filters.dateFrom;
      if (filters.dateTo) where.orderDate.lte = filters.dateTo;
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        purchaseOrderLines: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        _count: {
          select: {
            purchaseOrderLines: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return purchaseOrders.map(po => ({
      ...po,
      totalAmount: po.totalAmount instanceof Decimal ? po.totalAmount.toNumber() : Number(po.totalAmount || 0),
      purchaseOrderLines: po.purchaseOrderLines.map(line => ({
        ...line,
        quantity: line.quantity instanceof Decimal ? line.quantity.toNumber() : Number(line.quantity),
        receivedQuantity: line.receivedQuantity instanceof Decimal ? line.receivedQuantity.toNumber() : Number(line.receivedQuantity || 0),
        unitCost: line.unitCost instanceof Decimal ? line.unitCost.toNumber() : Number(line.unitCost),
      })),
    }));
  } catch (error) {
    console.error("[SuperAdmin] Error fetching purchase orders:", error);
    throw new Error("Failed to fetch purchase orders");
  }
}

/**
 * Create purchase order
 */
export async function createPurchaseOrderSuperadmin(input: {
  supplierId: string;
  tenantId: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  lines: Array<{
    materialId: string;
    quantity: number;
    unitCost: number;
  }>;
  reason: string;
}): Promise<{
  success: true;
  orderId: string;
  orderNumber: string;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (!input.reason || input.reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    if (!input.lines || input.lines.length === 0) {
      return {
        success: false,
        error: "Purchase order must have at least one line item",
      };
    }

    // Generate PO number
    const year = new Date().getFullYear();
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `PO-${year}`,
        },
      },
      orderBy: {
        orderNumber: "desc",
      },
    });

    let sequenceNumber = 1;
    if (lastPO) {
      const lastSequence = parseInt(lastPO.orderNumber.split("-")[2]);
      sequenceNumber = lastSequence + 1;
    }

    const orderNumber = `PO-${year}-${String(sequenceNumber).padStart(4, "0")}`;

    // Calculate total
    const totalAmount = input.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitCost,
      0
    );

    const orderDate = input.orderDate ? new Date(input.orderDate) : new Date();
    const expectedDeliveryDate = input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: input.supplierId,
          tenantId: input.tenantId,
          orderDate,
          expectedDeliveryDate,
          status: "PENDING",
          totalAmount: new Decimal(totalAmount),
          notes: input.notes,
          createdBy: session.user.id,
          purchaseOrderLines: {
            create: input.lines.map((line) => ({
              materialId: line.materialId,
              quantity: new Decimal(line.quantity),
              receivedQuantity: 0,
              unitCost: new Decimal(line.unitCost),
            })),
          },
        },
      });

      // Update material expected stock
      for (const line of input.lines) {
        await tx.material.update({
          where: { id: line.materialId },
          data: {
            expectedStock: {
              increment: new Decimal(line.quantity),
            },
          },
        });
      }

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_PURCHASE_ORDER_CREATED",
          description: `Created purchase order ${orderNumber}`,
          metadata: {
            purchaseOrderId: po.id,
            orderNumber,
            supplierId: input.supplierId,
            totalAmount,
            linesCount: input.lines.length,
            reason: input.reason,
          },
          performedBy: session.user.id,
        },
      });

      return { po };
    });

    revalidatePath("/superadmin/suppliers");

    return {
      success: true,
      orderId: result.po.id,
      orderNumber: result.po.orderNumber,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error creating purchase order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create purchase order",
    };
  }
}

/**
 * Mark purchase order as received
 */
export async function markPOReceivedSuperadmin(
  poId: string,
  receivedLines: Array<{
    lineId: string;
    quantityReceived: number;
  }>,
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

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { purchaseOrderLines: true },
    });

    if (!po) {
      return {
        success: false,
        error: "Purchase order not found",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Update each line and material stock
      for (const receivedLine of receivedLines) {
        const poLine = po.purchaseOrderLines.find(l => l.id === receivedLine.lineId);
        if (!poLine) continue;

        const newReceivedQty = Number(poLine.receivedQuantity || 0) + receivedLine.quantityReceived;

        // Update PO line
        await tx.purchaseOrderLine.update({
          where: { id: receivedLine.lineId },
          data: {
            receivedQuantity: new Decimal(newReceivedQty),
          },
        });

        // Update material stock
        await tx.material.update({
          where: { id: poLine.materialId },
          data: {
            currentStock: {
              increment: new Decimal(receivedLine.quantityReceived),
            },
            expectedStock: {
              decrement: new Decimal(receivedLine.quantityReceived),
            },
          },
        });

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            materialId: poLine.materialId,
            movementType: "PURCHASE_ORDER_RECEIPT",
            quantity: new Decimal(receivedLine.quantityReceived),
            unitCost: poLine.unitCost,
            performedBy: session.user.id,
            referenceId: poId,
            referenceType: "PURCHASE_ORDER",
          },
        });
      }

      // Check if PO fully received
      const allReceived = po.purchaseOrderLines.every(line => {
        const receivedQty = receivedLines.find(r => r.lineId === line.id)?.quantityReceived || 0;
        const totalReceived = Number(line.receivedQuantity || 0) + receivedQty;
        return totalReceived >= Number(line.quantity);
      });

      // Update PO status
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_PURCHASE_ORDER_RECEIVED",
          description: `Marked PO ${po.orderNumber} as ${allReceived ? "received" : "partially received"}`,
          metadata: {
            purchaseOrderId: poId,
            receivedLines,
            reason,
          },
          performedBy: session.user.id,
        },
      });
    });

    revalidatePath("/superadmin/suppliers");

    return { success: true };
  } catch (error) {
    console.error("[SuperAdmin] Error marking PO received:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark PO as received",
    };
  }
}

/**
 * Bulk approve purchase orders
 */
export async function bulkApprovePurchaseOrders(
  poIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (poIds.length === 0) {
      return { success: false, error: "No purchase orders selected" };
    }

    if (!reason || reason.length < 15) {
      return { success: false, error: "Audit reason must be at least 15 characters" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.updateMany({
        where: { id: { in: poIds }, status: "PENDING" },
        data: {
          status: "APPROVED",
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_PO_APPROVE",
          description: `Approved ${updated.count} purchase orders`,
          metadata: {
            poIds,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/suppliers");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[SuperAdmin] Error approving POs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve purchase orders",
    };
  }
}

/**
 * Bulk cancel purchase orders
 */
export async function bulkCancelPurchaseOrders(
  poIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (poIds.length === 0) {
      return { success: false, error: "No purchase orders selected" };
    }

    if (!reason || reason.length < 15) {
      return { success: false, error: "Audit reason must be at least 15 characters" };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get POs to adjust expected stock
      const pos = await tx.purchaseOrder.findMany({
        where: { id: { in: poIds } },
        include: { purchaseOrderLines: true },
      });

      // Update expected stock
      for (const po of pos) {
        for (const line of po.purchaseOrderLines) {
          const remainingQty = Number(line.quantity) - Number(line.receivedQuantity || 0);
          if (remainingQty > 0) {
            await tx.material.update({
              where: { id: line.materialId },
              data: {
                expectedStock: {
                  decrement: new Decimal(remainingQty),
                },
              },
            });
          }
        }
      }

      const updated = await tx.purchaseOrder.updateMany({
        where: { id: { in: poIds } },
        data: {
          status: "CANCELLED",
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_PO_CANCEL",
          description: `Cancelled ${updated.count} purchase orders`,
          metadata: {
            poIds,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/suppliers");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[SuperAdmin] Error cancelling POs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel purchase orders",
    };
  }
}
