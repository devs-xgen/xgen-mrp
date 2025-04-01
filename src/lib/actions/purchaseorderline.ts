// src/lib/actions/purchaseorderline.ts
'use server'

import { prisma } from "@/lib/db"
import { PurchaseOrderLine } from "@/types/admin/purchase-order"
import { Prisma, Status } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function getPurchaseOrderLines(poId?: string): Promise<PurchaseOrderLine[]> {
  try {
    // Create the where clause conditionally
    const where = poId ? { poId } : undefined
    
    const lines = await prisma.purchaseOrderLine.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
            status: true,
            supplier: {
              select: {
                name: true
              }
            }
          }
        },
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return lines.map(line => ({
      ...line,
      unitPrice: typeof line.unitPrice === 'object' && 'toNumber' in line.unitPrice
        ? line.unitPrice.toNumber()
        : Number(line.unitPrice)
    })) as PurchaseOrderLine[]
  } catch (error) {
    console.error("Error retrieving PurchaseOrderLines:", error)
    throw new Error("Failed to retrieve PurchaseOrderLines.")
  }
}

// src/lib/actions/purchaseorderline.ts (Delete Function)
// This function should be added to your purchaseorderline.ts file

export async function deletePurchaseOrderLine(id: string) {
  try {
    // First get the orderline to know which PO to update later
    const orderLine = await prisma.purchaseOrderLine.findUnique({
      where: { id },
      select: { poId: true }
    })
    
    if (!orderLine) {
      throw new Error("Order line not found")
    }
    
    // Delete the order line
    await prisma.purchaseOrderLine.delete({
      where: { id },
    })

    // Update the total amount of the parent purchase order
    await updatePurchaseOrderTotal(orderLine.poId)
    
    // Revalidate both purchase order and orderline paths  
    revalidatePath('/admin/purchase-orderline')
    revalidatePath('/admin/purchase-orders')
    return true;
  } catch (error) {
    console.error("Error deleting PurchaseOrderLine:", error)
    throw new Error("Failed to delete PurchaseOrderLine.")
  }
}

// Helper function to update the total amount of a purchase order
async function updatePurchaseOrderTotal(poId: string) {
  try {
    // Get all order lines for this PO
    const orderLines = await prisma.purchaseOrderLine.findMany({
      where: { poId },
      select: {
        quantity: true,
        unitPrice: true
      }
    })
    
    // Calculate the new total amount
    const totalAmount = orderLines.reduce((sum, line) => {
      const unitPrice = typeof line.unitPrice === 'object' && 'toNumber' in line.unitPrice
        ? line.unitPrice.toNumber()
        : Number(line.unitPrice)
      
      return sum + (line.quantity * unitPrice)
    }, 0)
    
    // Update the purchase order
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        totalAmount,
        updatedAt: new Date()
      }
    })
    
    return true
  } catch (error) {
    console.error("Error updating purchase order total:", error)
    return false
  }
}

// src/lib/actions/purchaseorderline.ts (Add Function)
// Add this function to your purchaseorderline.ts file

export async function addPurchaseOrderLine(data: { 
  poId: string
  materialId: string
  quantity: number
  unitPrice: number
  notes?: string
  createdBy?: string
}) {
  try {
    const createdLine = await prisma.purchaseOrderLine.create({
      data: {
        poId: data.poId,
        materialId: data.materialId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        notes: data.notes,
        status: Status.PENDING,
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

    // Update the total amount of the parent purchase order
    await updatePurchaseOrderTotal(data.poId)
    
    // Revalidate both purchase order and orderline paths
    revalidatePath('/admin/purchase-orderline')
    revalidatePath('/admin/purchase-orders')
    
    return createdLine
  } catch (error) {
    console.error("Error adding PurchaseOrderLine:", error)
    throw new Error("Failed to add PurchaseOrderLine.")
  }
}

// Add to src/lib/actions/purchaseorderline.ts
export async function updatePurchaseOrderline(
  id: string, 
  data: {
    quantity: number;
    unitPrice: number;
    status: Status;
    notes?: string;
  }
) {
  try {
    // First get the order line to know which PO to update later
    const orderLine = await prisma.purchaseOrderLine.findUnique({
      where: { id },
      select: { poId: true }
    });
    
    if (!orderLine) {
      throw new Error("Order line not found");
    }
    
    // Update the order line
    const updated = await prisma.purchaseOrderLine.update({
      where: { id },
      data: {
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        status: data.status,
        notes: data.notes,
        updatedAt: new Date()
      },
    });
    
    // Update the total amount of the parent purchase order
    await updatePurchaseOrderTotal(orderLine.poId);
    
    // Revalidate paths
    revalidatePath('/admin/purchase-orderline');
    revalidatePath('/admin/purchase-orders');
    
    return updated;
  } catch (error) {
    console.error("Error updating PurchaseOrderLine:", error);
    throw new Error("Failed to update PurchaseOrderLine.");
  }
}