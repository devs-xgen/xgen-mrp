// src/lib/actions/purchaseorderline.ts
'use server'

import { prisma } from "@/lib/db"
import { PurchaseOrderLine } from "@/types/admin/purchase-order"
import { Prisma, Status } from "@prisma/client"

export async function getPurchaseOrderLines(): Promise<PurchaseOrderLine[]> {
  try {
    const lines = await prisma.purchaseOrderLine.findMany({
      include: {
        material: {
          include: {
            unitOfMeasure: {
              select: {
                symbol: true
              }
            }
          }
        }
      },
    })

    return lines.map(line => ({
      id: line.id,
      poId: line.poId,
      materialId: line.materialId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      status: line.status,
      notes: line.notes,
      material: {
        id: line.material.id,
        name: line.material.name,
        sku: line.material.sku,
        currentStock: line.material.currentStock,
        unitOfMeasure: {
          symbol: line.material.unitOfMeasure.symbol
        }
      }
    }))
  } catch (error) {
    console.error("Error retrieving PurchaseOrderLines:", error)
    throw new Error("Failed to retrieve PurchaseOrderLines.")
  }
}

export async function addPurchaseOrderLine(data: { 
  poId: string
  materialId: string
  quantity: number
  unitPrice: number
  notes?: string
  createdBy?: string
}) {
  try {
    return await prisma.purchaseOrderLine.create({
      data: {
        poId: data.poId,
        materialId: data.materialId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        notes: data.notes,
        createdBy: data.createdBy,
      },
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      }
    })
  } catch (error) {
    console.error("Error adding PurchaseOrderLine:", error)
    throw new Error("Failed to add PurchaseOrderLine.")
  }
}

type PurchaseOrderLineUpdateInput = {
  quantity?: number
  unitPrice?: number
  status?: Status
  notes?: string | null
  modifiedBy?: string | null
}

export async function updatePurchaseOrderline(
  id: string, 
  updates: PurchaseOrderLineUpdateInput
) {
  try {
    const updateData: Prisma.PurchaseOrderLineUpdateInput = {
      quantity: updates.quantity,
      unitPrice: updates.unitPrice,
      status: updates.status as Status,
      notes: updates.notes,
      modifiedBy: updates.modifiedBy,
    }

    return await prisma.purchaseOrderLine.update({
      where: { id },
      data: updateData,
      include: {
        material: {
          include: {
            unitOfMeasure: true
          }
        }
      }
    })
  } catch (error) {
    console.error("Error updating PurchaseOrderLine:", error)
    throw new Error("Failed to update PurchaseOrderLine.")
  }
}

export async function deletePurchaseOrderLine(id: string) {
  try {
    await prisma.purchaseOrderLine.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Error deleting PurchaseOrderLine:", error)
    throw new Error("Failed to delete PurchaseOrderLine.")
  }
}