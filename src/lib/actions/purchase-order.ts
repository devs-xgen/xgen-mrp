// src/lib/actions/purchase-order.ts
'use server'

import { prisma } from "@/lib/db"
import { PurchaseOrder, PurchaseOrderLine, CreatePurchaseOrderInput } from "@/types/admin/purchase-order"
import { Status } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
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

    return orders as unknown as PurchaseOrder[]
  } catch (error) {
    throw new Error('Failed to fetch purchase orders')
  }
}

export async function getPurchaseOrderLines(): Promise<PurchaseOrderLine[]> {
  try {
    const lines = await prisma.purchaseOrderLine.findMany({
      include: {
        material: {
          include: {
            unitOfMeasure: true,
          },
        },
      },
    })

    return lines.map(line => ({
      id: line.id,
      poId: line.poId,
      materialId: line.materialId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      status: line.status,
      notes: line.notes || undefined,
      material: {
        id: line.material.id,
        name: line.material.name,
        sku: line.material.sku,
        currentStock: line.material.currentStock,
        unitOfMeasure: {
          symbol: line.material.unitOfMeasure.symbol,
        },
      },
    }))
  } catch (error) {
    throw new Error('Failed to fetch purchase order lines')
  }
}

export async function deletePurchaseOrder(id: string) {
  try {
    // Check if the purchase order has order lines
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
      throw new Error('Cannot delete purchase order with existing order lines')
    }

    // Delete the purchase order
    await prisma.purchaseOrder.delete({
      where: { id },
    })

    // Revalidate the purchase orders page
    revalidatePath('/admin/purchase-orders')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to delete purchase order')
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
          totalAmount,
          notes: data.notes,
          orderLines: {
            create: data.orderLines.map(line => ({
              materialId: line.materialId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
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