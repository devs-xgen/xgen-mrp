// // src/lib/actions/inspector/production-order.ts
"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Status } from "@prisma/client"
import type { CreateProductionOrderInput, UpdateProductionOrderInput } from "@/types/inspector/production-order"
import { getBOMForProduct } from "@/lib/actions/bom"
import {
  checkProductionOrderMaterialRequirements,
  reserveMaterialsForProduction,
  releaseMaterialReservations,
} from "@/lib/actions/material-reservation"
import { createProductionBOMFromProduct, getProductionBOMForDisplay } from "@/lib/actions/production-bom"
import { convertDecimals } from "@/lib/convertDecimals" // Added import
import { redirect } from "next/navigation"

export async function getProductionOrders() {
  try {
    const orders = await prisma.productionOrder.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        productVariant: {
          // 🆕 ADD: Include variant information
          select: {
            id: true,
            sku: true,
            displayName: true,
            sizeName: true,
            colorName: true,
          },
        },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        operations: {
          include: {
            workCenter: {
              select: {
                name: true,
              },
            },
          },
        },
        qualityChecks: {
          select: {
            id: true,
            checkDate: true,
            status: true,
            defectsFound: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startDate: "asc" }],
    })
    return orders
  } catch (error) {
    console.error("Error fetching production orders:", error)
    throw new Error("Failed to fetch production orders")
  }
}

export async function getProductionOrder(id: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        productVariant: {
          // 🆕 ADD: Include variant information
          select: {
            id: true,
            sku: true,
            displayName: true,
            sizeName: true,
            colorName: true,
          },
        },
        customerOrder: true,
        operations: {
          include: {
            workCenter: true,
          },
        },
        qualityChecks: true,
        delivery: true, // Include delivery assignment
      },
    })

    if (!order) {
      throw new Error("Production order not found")
    }

    // Fetch ProductionBOM (working copy) for this production order
    let productionBOM = null
    try {
      const productionBOMResult = await getProductionBOMForDisplay(id)
      if (productionBOMResult.success) {
        productionBOM = productionBOMResult.data
      }
    } catch (bomError) {
      console.warn(`Failed to fetch ProductionBOM for order ${id}:`, bomError)
    }

    // If no ProductionBOM exists, fall back to Product BOM as template
    let bom = null
    if (productionBOM && productionBOM.length > 0) {
      // Transform ProductionBOM to BOM format for compatibility
      bom = {
        productId: order.productId,
        productName: order.product.name,
        entries: productionBOM.map((entry) => ({
          id: entry.id,
          materialId: entry.materialId,
          materialName: entry.materialName,
          materialSku: entry.materialSku,
          unitOfMeasure: entry.unitOfMeasure,
          quantityNeeded: entry.finalQuantity, // Use adjusted quantity if available
          wastePercentage: entry.wastePercentage,
          costPerUnit: entry.unitCost,
          totalCost: entry.currentTotalCost,
        })),
        totalMaterialCost: productionBOM.reduce((sum, entry) => sum + entry.currentTotalCost, 0),
      }
    } else {
      // Fall back to Product BOM template
      bom = await getBOMForProduct(order.productId)
    }

    return { ...order, bom, productionBOM }
  } catch (error) {
    console.error("Error fetching production order:", error)
    throw error
  }
}

export async function createProductionOrder(data: CreateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // First, check material availability for the production order
    const materialRequirements = await checkProductionOrderMaterialRequirements(data.productId, data.quantity)
    if (!materialRequirements.allMaterialsAvailable) {
      const shortageDetails = materialRequirements.materials
        .filter((m) => !m.isAvailable)
        .map((m) => `${m.materialName}: need ${m.quantityNeeded}, available ${m.quantityAvailable}`)
        .join("; ")

      throw new Error(`Cannot create production order due to insufficient materials: ${shortageDetails}`)
    }

    const order = await prisma.productionOrder.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        startDate: data.startDate,
        dueDate: data.dueDate,
        priority: data.priority,
        customerOrderId: data.customerOrderId,
        notes: data.notes || null,
        status: Status.PENDING,
        createdBy: session.user.id,
        // Include planned material cost from requirements check
        plannedMaterialCost: materialRequirements.totalMaterialCost,
        operations: {
          create: data.operations.map((op) => ({
            workCenterId: op.workCenterId,
            startTime: op.startTime,
            endTime: op.endTime,
            status: Status.PENDING,
            cost: op.cost || 0.0, // Add the required cost field with default value if not provided
          })),
        },
      },
      include: {
        product: true,
        operations: {
          include: {
            workCenter: true,
          },
        },
      },
    })

    // Log the creation of the production order
    try {
      await prisma.activityLog.create({
        data: {
          type: "PRODUCTION_ORDER_CREATED",
          userId: session.user.id,
          details: {
            productionOrderId: order.id,
            productName: order.product.name,
            quantity: order.quantity,
            status: order.status,
            notes: data.notes || null,
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create production order creation activity log:", logError)
    }

    // Create ProductionBOM from Product BOM template
    try {
      await createProductionBOMFromProduct({
        productionOrderId: order.id,
        productId: data.productId,
        createdBy: session.user.id,
      })
      // Log ProductionBOM creation
      await prisma.activityLog.create({
        data: {
          type: "PRODUCTION_BOM_CREATED",
          userId: session.user.id,
          details: {
            productionOrderId: order.id,
            productId: data.productId,
            productName: order.product.name,
            notes: `Production BOM created for order ${order.id}`,
          },
        },
      })
    } catch (bomError) {
      console.warn(`Failed to create ProductionBOM for production order ${order.id}:`, bomError)
      // Continue even if ProductionBOM creation fails - not critical for basic order creation
    }

    // Automatically reserve materials for the production order
    const reservationResult = await reserveMaterialsForProduction(order.id)
    if (!reservationResult.success) {
      // If material reservation fails, we should clean up the production order
      await prisma.productionOrder.delete({ where: { id: order.id } })
      throw new Error(`Production order created but material reservation failed: ${reservationResult.error}`)
    }
    // Log material reservation
    try {
      await prisma.activityLog.create({
        data: {
          type: "MATERIAL_RESERVED",
          userId: session.user.id,
          details: {
            productionOrderId: order.id,
            productName: order.product.name,
            quantity: order.quantity,
            reason: reservationResult.message,
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create material reservation activity log:", logError)
    }

    revalidatePath("/inspector/production")
    revalidatePath("/inspector/materials")

    return {
      ...order,
      materialReservation: {
        success: true,
        message: reservationResult.message,
        totalMaterialCost: materialRequirements.totalMaterialCost,
      },
    }
  } catch (error) {
    console.error("Error creating production order:", error)
    throw error
  }
}

export async function updateProductionOrder(data: UpdateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        productId: true,
        quantity: true,
        startDate: true,
        dueDate: true,
        priority: true,
        status: true,
        customerOrderId: true,
        notes: true,
        product: {
          select: { name: true },
        },
      },
    })

    if (!currentOrder) {
      throw new Error("Production order not found")
    }

    const updatedFields: { [key: string]: any } = {}
    const changes: { field: string; oldValue: any; newValue: any }[] = []

    if (data.productId && data.productId !== currentOrder.productId) {
      updatedFields.productId = data.productId
      changes.push({ field: "productId", oldValue: currentOrder.productId, newValue: data.productId })
    }
    if (data.quantity && data.quantity !== currentOrder.quantity) {
      updatedFields.quantity = data.quantity
      changes.push({ field: "quantity", oldValue: currentOrder.quantity, newValue: data.quantity })
    }
    if (data.startDate && data.startDate.toISOString() !== currentOrder.startDate.toISOString()) {
      updatedFields.startDate = data.startDate
      changes.push({ field: "startDate", oldValue: currentOrder.startDate, newValue: data.startDate })
    }
    if (data.dueDate && data.dueDate.toISOString() !== currentOrder.dueDate.toISOString()) {
      updatedFields.dueDate = data.dueDate
      changes.push({ field: "dueDate", oldValue: currentOrder.dueDate, newValue: data.dueDate })
    }
    if (data.priority && data.priority !== currentOrder.priority) {
      updatedFields.priority = data.priority
      changes.push({ field: "priority", oldValue: currentOrder.priority, newValue: data.priority })
    }
    // Status is handled by updateProductionOrderStatus, but if it's passed here, log it
    if (data.status && data.status !== currentOrder.status) {
      updatedFields.status = data.status
      changes.push({ field: "status", oldValue: currentOrder.status, newValue: data.status })
    }
    if (data.customerOrderId !== undefined && data.customerOrderId !== currentOrder.customerOrderId) {
      updatedFields.customerOrderId = data.customerOrderId || null
      changes.push({ field: "customerOrderId", oldValue: currentOrder.customerOrderId, newValue: data.customerOrderId })
    }
    if (data.notes !== undefined && data.notes !== currentOrder.notes) {
      updatedFields.notes = data.notes || null
      changes.push({ field: "notes", oldValue: currentOrder.notes, newValue: data.notes })
    }

    if (Object.keys(updatedFields).length === 0) {
      // No changes detected, return current order without updating or logging
      return currentOrder
    }

    const order = await prisma.productionOrder.update({
      where: { id: data.id },
      data: {
        ...updatedFields,
        modifiedBy: session.user.id,
      },
    })

    // Log the update of the production order
    try {
      await prisma.activityLog.create({
        data: {
          type: "PRODUCTION_ORDER_UPDATED",
          userId: session.user.id,
          details: {
            productionOrderId: order.id,
            productName: currentOrder.product.name,
            changes,
            notes: data.notes || null, // Include the latest notes if provided
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create production order update activity log:", logError)
    }

    revalidatePath("/inspector/production")
    revalidatePath(`/inspector/production/${data.id}`)
    return order
  } catch (error) {
    console.error("Error updating production order:", error)
    throw error
  }
}

export async function deleteProductionOrder(productionOrderId: string, notes?: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const orderToDelete = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
      },
    })

    if (!orderToDelete) {
      throw new Error("Production order not found")
    }

    // Business rule check: Only allow deletion if PENDING or CANCELLED
    if (orderToDelete.status !== "PENDING" && orderToDelete.status !== "CANCELLED") {
      throw new Error("Cannot delete production orders that are in progress or completed.")
    }

    // Release material reservations if the order was pending
    if (orderToDelete.status === "PENDING") {
      const releaseResult = await releaseMaterialReservations(productionOrderId, "Production order deleted")
      if (!releaseResult.success) {
        console.error("Failed to release material reservations during deletion:", releaseResult.error)
        // Decide if you want to throw here or continue with deletion
        // For now, we'll continue but log the error
      }
      // Log material release due to deletion
      try {
        await prisma.activityLog.create({
          data: {
            type: "MATERIAL_RELEASED",
            userId: session.user.id,
            details: {
              productionOrderId,
              reason: `Materials released due to deletion of production order ${productionOrderId}`,
              productName: orderToDelete.product.name,
              quantity: orderToDelete.quantity,
            },
          },
        })
      } catch (logError) {
        console.error("Failed to create material release activity log during deletion:", logError)
      }
    }

    // Perform the deletion
    await prisma.productionOrder.delete({
      where: { id: productionOrderId },
    })

    // Log the deletion using the ActivityLog model
    try {
      await prisma.activityLog.create({
        data: {
          type: "PRODUCTION_ORDER_DELETED",
          userId: session.user.id,
          details: {
            productionOrderId,
            productName: orderToDelete.product.name,
            productSku: orderToDelete.product.sku,
            deletedBy: session.user.email, // Or session.user.name
            notes: notes || null,
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create production order deletion activity log:", logError)
    }

    revalidatePath("/inspector/production")
    return { success: true }
  } catch (error) {
    console.error("Error deleting production order:", error)
    throw error
  }
}

// Helper function to get available products
export async function getAvailableProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
      },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    console.error("Error fetching available products:", error)
    throw new Error("Failed to fetch available products")
  }
}

// Helper function to get work centers
export async function getAvailableWorkCenters() {
  try {
    return await prisma.workCenter.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        capacityPerHour: true,
      },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    console.error("Error fetching work centers:", error)
    throw error
  }
}

export async function addOperation(
  productionOrderId: string,
  data: {
    workCenterId: string
    startTime: Date
    endTime: Date
    cost: number // Add the missing required cost field
    notes?: string
  },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const operation = await prisma.operation.create({
      data: {
        workCenterId: data.workCenterId,
        productionOrderId,
        startTime: data.startTime,
        endTime: data.endTime,
        cost: data.cost, // Include cost in the creation data
        status: Status.PENDING,
        notes: data.notes || null,
        createdBy: session.user.id,
      },
      include: {
        workCenter: true,
      },
    })

    // Log the creation of the operation
    try {
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        select: { product: { select: { name: true } } },
      })
      await prisma.activityLog.create({
        data: {
          type: "OPERATION_CREATED",
          userId: session.user.id,
          details: {
            productionOrderId,
            productName: productionOrder?.product.name || "Unknown Product",
            operationId: operation.id,
            workCenterName: operation.workCenter.name,
            notes: data.notes || null,
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create operation creation activity log:", logError)
    }

    revalidatePath(`/inspector/production/${productionOrderId}`)
    return operation
  } catch (error) {
    console.error("Error creating operation:", error)
    throw error
  }
}

export async function deleteOperation(operationId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // First get the operation to find its production order ID
    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: { productionOrderId: true, status: true, workCenter: { select: { name: true } } },
    })
    if (!operation) {
      throw new Error("Operation not found")
    }

    // Check if the operation is already in progress or completed
    if (operation.status === "IN_PROGRESS" || operation.status === "COMPLETED") {
      throw new Error("Cannot delete an operation that is in progress or completed")
    }

    // Delete the operation
    await prisma.operation.delete({
      where: { id: operationId },
    })

    // Log the deletion of the operation
    try {
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: operation.productionOrderId },
        select: { product: { select: { name: true } } },
      })
      await prisma.activityLog.create({
        data: {
          type: "OPERATION_DELETED",
          userId: session.user.id,
          details: {
            productionOrderId: operation.productionOrderId,
            productName: productionOrder?.product.name || "Unknown Product",
            operationId: operation.id,
            workCenterName: operation.workCenter?.name || "Unknown Work Center",
            notes: `Operation ${operation.id} deleted`,
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create operation deletion activity log:", logError)
    }

    // Revalidate the path for the production order
    revalidatePath(`/inspector/production/${operation.productionOrderId}`)
    return { success: true, productionOrderId: operation.productionOrderId }
  } catch (error) {
    console.error("Error deleting operation:", error)
    throw error
  }
}

export async function updateOperationStatus(operationId: string, status: Status, notes?: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const currentOperation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: {
        id: true,
        status: true,
        productionOrderId: true,
        workCenter: { select: { name: true } },
        productionOrder: { select: { product: { name: true } } },
      },
    })

    if (!currentOperation) {
      throw new Error("Operation not found")
    }

    const oldStatus = currentOperation.status

    const operation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        status,
        modifiedBy: session.user.id,
        notes: notes || undefined,
      },
      include: {
        productionOrder: true,
      },
    })

    // Log the status change of the operation
    try {
      await prisma.activityLog.create({
        data: {
          type: "OPERATION_STATUS_CHANGE",
          userId: session.user.id,
          details: {
            productionOrderId: currentOperation.productionOrderId,
            productName: currentOperation.productionOrder?.product.name || "Unknown Product",
            operationId: currentOperation.id,
            workCenterName: currentOperation.workCenter?.name || "Unknown Work Center",
            oldStatus,
            newStatus: status,
            notes: notes || null,
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create operation status change activity log:", logError)
    }

    revalidatePath(`/inspector/production/${operation.productionOrderId}`)
    return operation
  } catch (error) {
    console.error("Error updating operation status:", error)
    throw error
  }
}

/**
 * Links a customer order to an existing production order
 * @param productionOrderId The ID of the production order to update
 * @param customerOrderId The ID of the customer order to link
 * @param notes Optional notes for the action
 * @returns The updated production order
 */
export async function linkCustomerOrderToProduction(
  productionOrderId: string,
  customerOrderId: string,
  notes?: string,
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Verify that both the production order and customer order exist
    const [productionOrder, customerOrder] = await Promise.all([
      prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        select: { id: true, customerOrderId: true, product: { select: { name: true } } },
      }),
      prisma.customerOrder.findUnique({
        where: { id: customerOrderId },
        select: { id: true, orderNumber: true },
      }),
    ])

    if (!productionOrder) {
      throw new Error("Production order not found")
    }
    if (!customerOrder) {
      throw new Error("Customer order not found")
    }

    // Check if the production order already has a customer order linked
    if (productionOrder.customerOrderId) {
      throw new Error("Production order is already linked to a customer order")
    }

    // Update the production order with the customer order ID
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        customerOrderId,
        modifiedBy: session.user.id,
      },
      include: {
        product: true,
        customerOrder: true,
      },
    })

    // Log the customer order linking
    try {
      await prisma.activityLog.create({
        data: {
          type: "CUSTOMER_ORDER_LINKED",
          userId: session.user.id,
          details: {
            productionOrderId: updatedOrder.id,
            productName: updatedOrder.product.name,
            customerOrderId: updatedOrder.customerOrder?.id,
            customerOrderNumber: updatedOrder.customerOrder?.orderNumber,
            notes: notes || null,
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create customer order linked activity log:", logError)
    }

    revalidatePath("/inspector/production")
    revalidatePath(`/inspector/production/${productionOrderId}`)

    return updatedOrder
  } catch (error) {
    console.error("Error linking customer order to production order:", error)
    throw error
  }
}

/**
 * Gets available customer orders for linking to a production order
 * @returns List of active customer orders that can be linked
 */
export async function getAvailableCustomerOrders() {
  try {
    return await prisma.customerOrder.findMany({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS", "ACTIVE"],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        customer: {
          select: {
            name: true,
          },
        },
        requiredDate: true,
      },
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Error fetching available customer orders:", error)
    throw new Error("Failed to fetch available customer orders")
  }
}

// Update the updateProductionOrderStatus function to handle errors when creating ActivityLog entries
export async function updateProductionOrderStatus(
  productionOrderId: string,
  status: Status,
  notes?: string,
  actionTaken?: string,
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Get current production order
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
      },
    })

    if (!currentOrder) {
      throw new Error("Production order not found")
    }

    const oldStatus = currentOrder.status
    const productionQty = currentOrder.quantity

    // If cancelling production, release material reservations
    if (status === "CANCELLED" && oldStatus !== "CANCELLED") {
      const releaseResult = await releaseMaterialReservations(productionOrderId, "Production order cancelled")
      if (!releaseResult.success) {
        console.error("Failed to release material reservations:", releaseResult.error)
        // Continue with status update even if release fails
      }
      // Log material release due to cancellation
      try {
        await prisma.activityLog.create({
          data: {
            type: "MATERIAL_RELEASED",
            userId: session.user.id,
            details: {
              productionOrderId,
              reason: `Materials released due to cancellation of production order ${productionOrderId}`,
              productName: currentOrder.product.name,
              quantity: productionQty,
              notes: notes || null,
              actionTaken: actionTaken || null, // Include actionTaken
            },
          },
        })
      } catch (logError) {
        console.error("Failed to create material release activity log:", logError)
      }
    }

    // If completing production, increase product stock and update completion fields
    if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
      await prisma.product.update({
        where: { id: currentOrder.productId },
        data: {
          currentStock: currentOrder.product.currentStock + productionQty,
        },
      })
      // Update production order completion fields
      await prisma.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          completedQuantity: productionQty,
          completedAt: new Date(),
        },
      })
      // Log product stock increment
      try {
        await prisma.activityLog.create({
          data: {
            type: "PRODUCT_STOCK_INCREMENT",
            userId: session.user.id,
            details: {
              productId: currentOrder.productId,
              productName: currentOrder.product.name,
              change: productionQty,
              reason: `Production order ${productionOrderId} completed`,
              notes: notes || null,
              actionTaken: actionTaken || null, // Include actionTaken
            },
          },
        })
      } catch (logError) {
        console.error("Failed to create product stock increment activity log:", logError)
      }
    }

    // Update the production order status
    const order = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        status,
        modifiedBy: session.user.id,
        notes: notes || undefined,
      },
    })

    // Log the status change using the ActivityLog model
    try {
      await prisma.activityLog.create({
        data: {
          type: "PRODUCTION_STATUS_CHANGE",
          userId: session.user.id,
          details: {
            productionOrderId,
            productName: currentOrder.product.name,
            oldStatus,
            newStatus: status,
            notes: notes || null,
            actionTaken: actionTaken || null, // Include actionTaken
          },
        },
      })
    } catch (logError) {
      console.error("Failed to create production status change activity log:", logError)
    }

    revalidatePath("/inspector/production")
    revalidatePath(`/inspector/production/${productionOrderId}`)
    revalidatePath("/inspector/materials")

    return order
  } catch (error) {
    console.error("Error updating production order status:", error)
    throw error
  }
}

// Update the getProductionLogs function to handle errors
export async function getProductionLogs(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    if (!prisma.activityLog) {
      console.log("ActivityLog model not available in Prisma client")
      return []
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        OR: [
          {
            details: {
              path: ["productionOrderId"],
              equals: productionOrderId,
            },
          },
          // Add other conditions if logs are linked by other means, e.g., qualityCheckId
          {
            type: {
              in: ["QUALITY_CHECK_CREATED", "QUALITY_CHECK_STATUS_UPDATED"],
            },
            details: {
              path: ["productionOrderId"],
              equals: productionOrderId,
            },
          },
          {
            type: "MATERIAL_REQUEST_CREATED", // New log type for material requests
            details: {
              path: ["productionOrderId"],
              equals: productionOrderId,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
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
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedLogs = logs.map((log) => {
      let detailsObject = log.details as any // Start with the raw details from Prisma

      // Ensure detailsObject is a proper JavaScript object if it came as a stringified JSON
      if (typeof detailsObject === "string") {
        try {
          detailsObject = JSON.parse(detailsObject)
        } catch (e) {
          // If it's a plain string that's not JSON, wrap it in a message object
          detailsObject = { message: detailsObject }
        }
      } else if (detailsObject === null || typeof detailsObject !== "object") {
        // Handle null or non-object details by wrapping them in a message object
        detailsObject = { message: String(detailsObject) }
      }

      const userName = log.user.profile ? `${log.user.profile.firstName} ${log.user.profile.lastName}` : log.user.email

      let action = "Unknown Action"
      let displayDetails: Record<string, any> = {} // This will be the object passed to renderDetails

      // Populate displayDetails based on log type
      switch (log.type) {
        case "PRODUCTION_ORDER_CREATED":
          action = `Production order created for ${detailsObject.productName} (${detailsObject.quantity} units)`
          displayDetails = {
            message: action,
            status: detailsObject.status,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "PRODUCTION_ORDER_UPDATED":
          action = `Production order updated`
          if (detailsObject.changes && Array.isArray(detailsObject.changes)) {
            displayDetails.changes = detailsObject.changes.map((change: any) => ({
              field: change.field,
              oldValue: String(change.oldValue),
              newValue: String(change.newValue),
            }))
          } else {
            displayDetails.message = "Details updated."
          }
          if (detailsObject.notes) {
            displayDetails.notes = detailsObject.notes
          }
          break
        case "PRODUCTION_STATUS_CHANGE":
          action = `Status changed from ${detailsObject.oldStatus} to ${detailsObject.newStatus}`
          displayDetails = {
            message: action,
            productName: detailsObject.productName,
            oldStatus: detailsObject.oldStatus,
            newStatus: detailsObject.newStatus,
            notes: detailsObject.notes || "N/A",
            actionTaken: detailsObject.actionTaken || "N/A", // Include actionTaken
          }
          break
        case "MATERIAL_RELEASED":
          action = `Materials released`
          displayDetails = {
            message: action,
            productName: detailsObject.productName,
            quantity: detailsObject.quantity,
            reason: detailsObject.reason || "N/A",
            notes: detailsObject.notes || "N/A",
            actionTaken: detailsObject.actionTaken || "N/A", // Include actionTaken
          }
          break
        case "PRODUCT_STOCK_INCREMENT":
          action = `Product stock incremented`
          displayDetails = {
            message: action,
            productName: detailsObject.productName,
            change: detailsObject.change,
            reason: detailsObject.reason || "N/A",
            notes: detailsObject.notes || "N/A",
            actionTaken: detailsObject.actionTaken || "N/A", // Include actionTaken
          }
          break
        case "PRODUCTION_ORDER_DELETED":
          action = `Production order deleted`
          displayDetails = {
            message: action,
            productName: detailsObject.productName,
            productSku: detailsObject.productSku,
            deletedBy: detailsObject.deletedBy,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "PRODUCTION_BOM_CREATED":
          action = `Production Bill of Materials created`
          displayDetails = {
            message: action,
            productName: detailsObject.productName,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "MATERIAL_RESERVED":
          action = `Materials reserved`
          displayDetails = {
            message: action,
            productName: detailsObject.productName,
            quantity: detailsObject.quantity,
            reason: detailsObject.reason || "N/A",
          }
          break
        case "OPERATION_CREATED":
          action = `Operation created`
          displayDetails = {
            message: action,
            workCenterName: detailsObject.workCenterName,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "OPERATION_DELETED":
          action = `Operation deleted`
          displayDetails = {
            message: action,
            workCenterName: detailsObject.workCenterName,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "OPERATION_STATUS_CHANGE":
          action = `Operation status changed`
          displayDetails = {
            message: action,
            workCenterName: detailsObject.workCenterName,
            oldStatus: detailsObject.oldStatus,
            newStatus: detailsObject.newStatus,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "CUSTOMER_ORDER_LINKED":
          action = `Customer order linked`
          displayDetails = {
            message: action,
            customerOrderNumber: detailsObject.customerOrderNumber,
            productName: detailsObject.productName,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "PRODUCTION_STARTED":
          action = `Production started`
          displayDetails = {
            message: action,
            startedAt: detailsObject.startedAt,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "QUALITY_CHECK_STATUS_UPDATED":
          action = `Quality check status updated`
          displayDetails = {
            message: detailsObject.message || action, // Use existing message or default
            newStatus: detailsObject.newStatus,
            previousStatus: detailsObject.previousStatus,
            qualityCheckId: detailsObject.qualityCheckId,
            deliveryReadiness: detailsObject.deliveryReadiness,
            productionOrderId: detailsObject.productionOrderId,
            allInspectionsComplete: detailsObject.allInspectionsComplete,
            notes: detailsObject.notes || "N/A",
            takenAction: detailsObject.takenAction || "N/A", // Added takenAction
          }
          break
        case "QUALITY_CHECK_CREATED":
          action = `Quality check created`
          displayDetails = {
            message: detailsObject.message || action, // Use existing message or default
            inspectorId: detailsObject.inspectorId,
            qualityCheckId: detailsObject.qualityCheckId,
            workCenterStatus: detailsObject.workCenterStatus, // This is the nested object
            productionOrderId: detailsObject.productionOrderId,
            notes: detailsObject.notes || "N/A",
            takenAction: detailsObject.takenAction || "N/A", // Added takenAction
          }
          break
        case "MATERIAL_REQUEST_CREATED": // New log type for material requests
          action = `Material request created`
          displayDetails = {
            message: action,
            requestId: detailsObject.requestId,
            requestedBy: detailsObject.requestedBy,
            totalItems: detailsObject.totalItems,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "ADMIN_WORKFLOW_OVERRIDE":
          action = `Admin Workflow Override: ${detailsObject.type.replace(/_/g, " ")}`
          displayDetails = {
            message: action,
            reason: detailsObject.reason,
            targetStatus: detailsObject.afterStatus || "N/A",
            bypassedValidations: Array.isArray(detailsObject.bypassedValidations)
              ? detailsObject.bypassedValidations.join(", ")
              : detailsObject.bypassedValidations,
            notes: detailsObject.notes || "N/A",
          }
          break
        case "SECURITY_ADMIN_ACTION":
          action = `Security Admin Action: ${detailsObject.action}`
          displayDetails = {
            message: action,
            resource: detailsObject.resource,
            resourceId: detailsObject.resourceId,
            severity: detailsObject.severity,
            reason: detailsObject.reason,
            notes: detailsObject.notes || "N/A",
          }
          break
        default:
          action = log.type.replace(/_/g, " ")
          displayDetails = detailsObject // Fallback to the processed detailsObject
          break
      }

      return {
        id: log.id,
        type: log.type,
        action, // This 'action' string is not used in renderDetails, but kept for consistency
        details: displayDetails, // This will now always be a JSON-serializable object
        timestamp: log.createdAt.toISOString(), // Ensure ISO string for dates
        userId: log.userId,
        userName,
      }
    })

    return formattedLogs
  } catch (error) {
    console.error("Error fetching production logs:", error)
    return [] // Return empty array on error
  }
}

// Update the createInitialProductionLog function to handle errors
export async function createInitialProductionLog(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Get the production order
    const order = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      select: { status: true, product: { select: { name: true } } },
    })
    if (!order) throw new Error("Production order not found")

    if (!prisma.activityLog) {
      console.log("ActivityLog model not available in Prisma client")
      return { success: false, error: "ActivityLog model not available" }
    }

    // Create an initial log entry
    await prisma.activityLog.create({
      data: {
        type: "PRODUCTION_STATUS_CHANGE",
        userId: session.user.id,
        details: {
          productionOrderId,
          productName: order.product.name,
          oldStatus: "N/A", // Initial state, no old status
          newStatus: order.status,
          notes: "Initial production order status",
        },
      },
    })
    revalidatePath(`/inspector/production/${productionOrderId}`)
    return { success: true }
  } catch (error) {
    console.error("Error creating initial production log:", error)
    return { success: false, error: String(error) }
  }
}

export async function getProductionOrderWithMaterialRequests(id: string) {
  try {
    // Fetch production order
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        customerOrder: true,
        operations: {
          include: { workCenter: true },
        },
        qualityChecks: true,
      },
    })
    if (!order) {
      throw new Error("Production order not found")
    }
    // Fetch material requests separately
    const materialRequests = await prisma.materialRequest.findMany({
      where: { productionOrderId: id },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        workCenter: {
          select: { id: true, name: true },
        },
      },
    })
    // Optionally fetch BOM if you have a function for it
    const bom = await getBOMForProduct(order.productId)

    // Convert Decimal fields in the order and its nested objects
    const convertedOrder = convertDecimals(order)
    const convertedMaterialRequests = materialRequests.map((req) => ({
      ...req,
      items: req.items.map((item) => ({
        ...item,
        inventoryItem: convertDecimals(item.inventoryItem),
      })),
    }))

    // Combine and return
    return { ...convertedOrder, materialRequests: convertedMaterialRequests, bom }
  } catch (error) {
    console.error("Error fetching production order with material requests:", error)
    throw error
  }
}

// Placeholder for createMaterialRequest to demonstrate logging
export async function createMaterialRequest(
  productionOrderId: string,
  workCenterId: string,
  items: Array<{ materialId: string; quantity: number }>,
  notes?: string,
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Simulate material request creation
    console.log(`Creating material request for production order ${productionOrderId}`)
    // In a real app, you would create the MaterialRequest and MaterialRequestItem records here
    const requestId = `MR-${Date.now()}` // Placeholder ID

    // Log the material request creation
    await prisma.activityLog.create({
      data: {
        type: "MATERIAL_REQUEST_CREATED",
        userId: session.user.id,
        details: {
          productionOrderId,
          workCenterId,
          requestId,
          totalItems: items.length,
          requestedBy: session.user.email,
          notes: notes || null,
        },
      },
    })

    revalidatePath(`/inspector/production/${productionOrderId}`)
    return { success: true, requestId }
  } catch (error) {
    console.error("Error creating material request:", error)
    throw error
  }
}

export async function getMyQualityChecks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const qualityChecks = await prisma.qualityCheck.findMany({
      where: {
        inspectorId: session.user.id,
      },
      include: {
        // Include the productionOrder with specific fields
        productionOrder: {
          select: {
            id: true,
            status: true,
            startDate: true,
            dueDate: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                displayName: true,
                sku: true,
                sizeName: true,
                colorName: true,
              },
            },
          },
        },
        inspector: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkDate: "desc", // Retain the sorting by checkDate
      },
    });

    return qualityChecks;
  } catch (error) {
    console.error("Error fetching quality checks for inspector:", error);
    throw new Error("Failed to fetch quality checks");
  }
}

export async function getAllQualityChecks() {
  try {
    const checks = await prisma.qualityCheck.findMany({
      include: {
        productionOrder: {
          select: {
            orderNumber: true,
          },
        },
        inspector: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        checkDate: "desc",
      },
    });

    return checks;
  } catch (error) {
    console.error("Error fetching all quality checks:", error);
    return [];
  }
}

export interface CreateQualityCheckData {
  productionOrderId: string;
  defectsFound?: string;
  actionTaken?: string;
  notes?: string;
  status: Status; // Add the status field here
}

export interface QualityCheckFormData {
  taskId: string;
  defectsFound?: string;
  actionTaken?: string;
  notes?: string;
  status: Status; // Add status to the form data interface
}


export async function createQualityCheck(data: CreateQualityCheckData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const newQualityCheck = await prisma.qualityCheck.create({
      data: {
        productionOrderId: data.productionOrderId,
        inspectorId: session.user.id,
        checkDate: new Date(),
        status: data.status, // Use the status from the form data
        defectsFound: data.defectsFound,
        actionTaken: data.actionTaken,
        notes: data.notes,
      },
    });

    return { success: true, qualityCheck: newQualityCheck };
  } catch (error) {
    console.error("Error creating quality check:", error);
    return { success: false, message: "Failed to create quality check" };
  }
}

export async function getInspectorQualityChecks() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return [];
  }

  try {
    const qualityChecks = await prisma.qualityCheck.findMany({
      where: {
        inspectorId: session.user.id,
      },
      orderBy: {
        checkDate: "desc",
      },
      include: {
        productionOrder: { // Include the production order relation
          include: {
            product: true, // Include the product data if you need it
          },
        },
      },
    });

    return qualityChecks;
  } catch (error) {
    console.error("Failed to fetch quality checks:", error);
    return [];
  }
}


export async function updateQualityCheck(
    id: string,
    data: {
        defectsFound: string | null;
        actionTaken: string | null;
        notes: string | null;
        status: "PENDING" | "COMPLETED" | "FAILED" | "ACTIVE";
    }
) {
    try {
        const updatedCheck = await prisma.qualityCheck.update({
            where: { id },
            data: {
                defectsFound: data.defectsFound,
                actionTaken: data.actionTaken,
                notes: data.notes, // This line must match your Prisma schema field type
                status: data.status,
            },
        });

        // Revalidate the path to refresh the data on the client
        revalidatePath("/inspector/dashboard");

        return { success: true, qualityCheck: updatedCheck };
    } catch (error) {
        console.error("Error updating quality check:", error);
        return { success: false, message: "Failed to update quality check." };
    }
}

export async function handleTaskUpdate(
  formData: QualityCheckFormData,
  qualityCheckId?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the task's production order ID
  const task = await prisma.operation.findUnique({
    where: { id: formData.taskId },
    select: { productionOrderId: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Use the qualityCheckId to determine if it's an update or creation
  if (qualityCheckId) {
    // Update existing quality check
    await prisma.qualityCheck.update({
      where: { id: qualityCheckId },
      data: {
        defectsFound: formData.defectsFound,
        actionTaken: formData.actionTaken,
        notes: formData.notes,
        status: formData.status,
      },
    });
  } else {
    // Create new quality check
    await prisma.qualityCheck.create({
      data: {
        taskId: formData.taskId,
        productionOrderId: task.productionOrderId,
        inspectorId: session.user.id,
        defectsFound: formData.defectsFound,
        actionTaken: formData.actionTaken,
        notes: formData.notes,
        status: formData.status,
      },
    });
  }
  
  // Redirect back to the task page after submission
  redirect(`/inspector/tasks/${formData.taskId}`);
}

export interface UpdateFormData {
    id: string; // Add id for editing an existing quality check
    taskId: string;
    status: Status;
    defectsFound: string | null;
    actionTaken: string | null;
    notes: string | null;
}