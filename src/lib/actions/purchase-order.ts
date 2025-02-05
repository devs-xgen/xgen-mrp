// src/lib/actions/purchase-order.ts
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