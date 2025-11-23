'use server'

import { prisma } from "@/lib/db"
import { PurchaseOrder, CreatePurchaseOrderInput } from "@/types/admin/purchase-order"
import { Status } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { revalidatePath } from "next/cache"

export async function getPurchaseOrders() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        orderLines: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentStock: true,
                unitOfMeasure: {
                  select: {
                    symbol: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert Decimal values to numbers before sending to client
    return orders.map(order => ({
      ...order,
      totalAmount: order.totalAmount.toNumber(),
      orderLines: order.orderLines.map(line => ({
        ...line,
        unitPrice: line.unitPrice.toNumber()
      }))
    }))
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    throw new Error('Failed to fetch purchase orders')
  }
}

export async function createPurchaseOrder(data: CreatePurchaseOrderInput) {
  try {
    // Generate PO number (format: PO-YYYY-XXXX)
    const year = new Date().getFullYear()
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        poNumber: {
          startsWith: `PO-${year}`
        }
      },
      orderBy: {
        poNumber: 'desc'
      }
    })

    let sequenceNumber = 1
    if (lastPO) {
      const lastSequence = parseInt(lastPO.poNumber.split('-')[2])
      sequenceNumber = lastSequence + 1
    }

    const poNumber = `PO-${year}-${String(sequenceNumber).padStart(4, '0')}`

    // Calculate total amount from order lines
    const totalAmount = data.orderLines.reduce(
      (sum, line) => sum + (line.quantity * line.unitPrice),
      0
    )

    // Create purchase order with its lines
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        orderDate: new Date(),
        expectedDelivery: data.expectedDelivery,
        status: Status.PENDING,
        totalAmount: new Decimal(totalAmount),
        notes: data.notes,
        orderLines: {
          create: data.orderLines.map(line => ({
            materialId: line.materialId,
            quantity: line.quantity,
            unitPrice: new Decimal(line.unitPrice),
            status: Status.PENDING
          }))
        }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        orderLines: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentStock: true,
                unitOfMeasure: {
                  select: {
                    symbol: true
                  }
                }
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin/purchase-orders')
    return purchaseOrder
  } catch (error) {
    console.error('Error creating purchase order:', error)
    throw new Error('Failed to create purchase order')
  }
}

export async function updatePurchaseOrder(
  id: string,
  data: {
    expectedDelivery?: Date
    status?: Status
    notes?: string
  }
) {
  try {
    const result = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        expectedDelivery: data.expectedDelivery,
        status: data.status,
        notes: data.notes,
        modifiedBy: 'system',
        updatedAt: new Date(),
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        orderLines: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentStock: true,
                unitOfMeasure: {
                  select: {
                    symbol: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const updatedOrder = {
      ...result,
      totalAmount: result.totalAmount.toNumber(),
      orderLines: result.orderLines.map(line => ({
        ...line,
        unitPrice: line.unitPrice.toNumber()
      }))
    }

    revalidatePath('/admin/purchase-orders')
    return updatedOrder
  } catch (error) {
    console.error('Error updating purchase order:', error)
    throw new Error('Failed to update purchase order')
  }
}

export async function deletePurchaseOrder(id: string) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        orderLines: {
          select: { id: true },
        },
      },
    })

    if (!purchaseOrder) {
      throw new Error('Purchase order not found')
    }
    if (purchaseOrder.orderLines.length > 0) {
      await prisma.purchaseOrderLine.deleteMany({
        where: { poId: id }
      })
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    })

    revalidatePath('/admin/purchase-orders')
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to delete purchase order')
  }
}

// Paginated fetch for purchase orders
export async function getPaginatedPurchaseOrders({
  page = 1,
  limit = 10,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          orderLines: {
            include: {
              material: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  currentStock: true,
                  unitOfMeasure: {
                    select: {
                      symbol: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    // Convert Decimal values to numbers before sending to client
    const convertedOrders = orders.map((order) => ({
      ...order,
      totalAmount: order.totalAmount.toNumber(),
      orderLines: order.orderLines.map((line) => ({
        ...line,
        unitPrice: line.unitPrice.toNumber(),
      })),
    }));

    return {
      data: convertedOrders,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching paginated purchase orders:", error);
    throw new Error("Failed to fetch paginated purchase orders");
  }
}

export async function getPurchaseOrderStats() {
  try {
    const [total, pending, completed, cancelled, totalAmountResult, pendingAmountResult, supplierCounts] = await Promise.all([
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.count({ where: { status: "PENDING" } }),
      prisma.purchaseOrder.count({ where: { status: "COMPLETED" } }),
      prisma.purchaseOrder.count({ where: { status: "CANCELLED" } }),
      prisma.purchaseOrder.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { status: "PENDING" },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.groupBy({
        by: ['supplierId'],
        _count: {
          id: true
        }
      })
    ]);

    // Get top supplier name
    let topSupplierName = "None";
    let topSupplierCount = 0;

    if (supplierCounts.length > 0) {
      const topSupplier = supplierCounts.sort((a, b) => b._count.id - a._count.id)[0];
      if (topSupplier) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: topSupplier.supplierId },
          select: { name: true }
        });
        if (supplier) {
          topSupplierName = supplier.name;
          topSupplierCount = topSupplier._count.id;
        }
      }
    }

    // Get most recent order
    const mostRecentOrder = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true, createdAt: true }
    });

    // Calculate monthly growth (simplified)
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const [currentMonthOrders, lastMonthOrders] = await Promise.all([
      prisma.purchaseOrder.count({
        where: {
          createdAt: {
            gte: currentMonthStart
          }
        }
      }),
      prisma.purchaseOrder.count({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      })
    ]);

    const orderGrowth = lastMonthOrders === 0
      ? 100
      : Math.round(((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100);

    return {
      totalOrders: total,
      pendingOrders: pending,
      completedOrders: completed,
      cancelledOrders: cancelled,
      totalAmount: totalAmountResult._sum.totalAmount?.toNumber() || 0,
      pendingAmount: pendingAmountResult._sum.totalAmount?.toNumber() || 0,
      topSupplier: {
        name: topSupplierName,
        count: topSupplierCount
      },
      mostRecentOrder: mostRecentOrder ? {
        poNumber: mostRecentOrder.poNumber,
        date: mostRecentOrder.createdAt
      } : null,
      monthlyTrends: {
        currentMonth: currentMonthOrders,
        lastMonth: lastMonthOrders,
        growth: orderGrowth
      }
    };
  } catch (error) {
    console.error("Error fetching purchase order stats:", error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalAmount: 0,
      pendingAmount: 0,
      topSupplier: { name: "None", count: 0 },
      mostRecentOrder: null,
      monthlyTrends: { currentMonth: 0, lastMonth: 0, growth: 0 }
    };
  }
}