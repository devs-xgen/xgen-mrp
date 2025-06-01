// src/lib/actions/inspector/production-order.ts
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Status } from "@prisma/client"
import { 
  CreateProductionOrderInput, 
  UpdateProductionOrderInput 
} from "@/types/inspector/production-order"
import { getBOMForProduct } from "@/lib/actions/bom"
import { updateMaterial, getMaterialById } from "@/lib/actions/materials"
import { 
  checkProductionOrderMaterialRequirements,
  reserveMaterialsForProduction,
  releaseMaterialReservations 
} from "@/lib/actions/material-reservation"

export async function getProductionOrders() {
  try {
    const orders = await prisma.productionOrder.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true
          }
        },
        operations: {
          include: {
            workCenter: {
              select: {
                name: true
              }
            }
          }
        },
        qualityChecks: {
          select: {
            id: true,
            checkDate: true,
            status: true,
            defectsFound: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'asc' }
      ]
    })
    
    return orders
  } catch (error) {
    console.error('Error fetching production orders:', error)
    throw new Error('Failed to fetch production orders')
  }
}

export async function getProductionOrder(id: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        customerOrder: true,
        operations: {
          include: {
            workCenter: true
          }
        },
        qualityChecks: true
      }
    })
    
    if (!order) {
      throw new Error('Production order not found')
    }

    // Fetch BOM/materials for the product
    const bom = await getBOMForProduct(order.productId)
    return { ...order, bom }
  } catch (error) {
    console.error('Error fetching production order:', error)
    throw error
  }
}


export async function createProductionOrder(data: CreateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // First, check material availability for the production order
    const materialRequirements = await checkProductionOrderMaterialRequirements(
      data.productId,
      data.quantity
    )

    if (!materialRequirements.allMaterialsAvailable) {
      const shortageDetails = materialRequirements.materials
        .filter(m => !m.isAvailable)
        .map(m => `${m.materialName}: need ${m.quantityNeeded}, available ${m.quantityAvailable}`)
        .join('; ')
      
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
          create: data.operations.map(op => ({
            workCenterId: op.workCenterId,
            startTime: op.startTime,
            endTime: op.endTime,
            status: Status.PENDING,
            cost: op.cost || 0.00, // Add the required cost field with default value if not provided
          }))
        }
      },
      include: {
        product: true,
        operations: {
          include: {
            workCenter: true
          }
        }
      }
    })

    // Automatically reserve materials for the production order
    const reservationResult = await reserveMaterialsForProduction(order.id)
    
    if (!reservationResult.success) {
      // If material reservation fails, we should clean up the production order
      await prisma.productionOrder.delete({ where: { id: order.id } })
      throw new Error(`Production order created but material reservation failed: ${reservationResult.error}`)
    }

    revalidatePath('/inspector/production')
    revalidatePath('/inspector/materials')
    
    return {
      ...order,
      materialReservation: {
        success: true,
        message: reservationResult.message,
        totalMaterialCost: materialRequirements.totalMaterialCost
      }
    }
  } catch (error) {
    console.error('Error creating production order:', error)
    throw error
  }
}

export async function updateProductionOrder(data: UpdateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const order = await prisma.productionOrder.update({
      where: { id: data.id },
      data: {
        ...(data.productId && { productId: data.productId }),
        ...(data.quantity && { quantity: data.quantity }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.dueDate && { dueDate: data.dueDate }),
        ...(data.priority && { priority: data.priority }),
        ...(data.status && { status: data.status }),
        ...(data.customerOrderId !== undefined && { 
          customerOrderId: data.customerOrderId || null 
        }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        modifiedBy: session.user.id
      }
    })

    revalidatePath('/inspector/production')
    return order
  } catch (error) {
    console.error('Error updating production order:', error)
    throw error
  }
}

export async function deleteProductionOrder(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // First, release any material reservations for this production order
    const releaseResult = await releaseMaterialReservations(id, 'Production order deleted')
    
    if (releaseResult.success) {
      console.log(`Released material reservations for production order ${id}: ${releaseResult.message}`)
    } else {
      console.warn(`Failed to release material reservations for production order ${id}: ${releaseResult.error}`)
      // Continue with deletion even if release fails
    }

    // Delete related operations and quality checks first
    await prisma.operation.deleteMany({
      where: { productionOrderId: id }
    })
    
    await prisma.qualityCheck.deleteMany({
      where: { productionOrderId: id }
    })

    // Delete material reservations (if any remain)
    await prisma.materialReservation.deleteMany({
      where: { productionOrderId: id }
    })

    // Delete material consumptions (if any)
    await prisma.productionMaterialConsumption.deleteMany({
      where: { productionOrderId: id }
    })

    // Delete production batches (if any)
    await prisma.productionBatch.deleteMany({
      where: { productionOrderId: id }
    })

    // Delete cost variances (if any)
    await prisma.costVariance.deleteMany({
      where: { productionOrderId: id }
    })

    // Delete inventory movements related to this production order
    await prisma.inventoryMovement.deleteMany({
      where: { 
        referenceId: id,
        referenceType: 'ProductionOrder'
      }
    })

    // Finally, delete the production order
    await prisma.productionOrder.delete({
      where: { id }
    })

    revalidatePath('/inspector/request')
    revalidatePath('/inspector/materials')
  } catch (error) {
    console.error('Error deleting production order:', error)
    throw error
  }
}

// Helper function to get available products
export async function getAvailableProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching available products:', error)
    throw new Error('Failed to fetch available products')
  }
}

// Helper function to get work centers
export async function getAvailableWorkCenters() {
  try {
    return await prisma.workCenter.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        capacityPerHour: true
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching work centers:', error)
    throw error
  }
}



// Fixed addOperation function for src/lib/actions/production-order.ts
export async function addOperation(
  productionOrderId: string,
  data: {
    workCenterId: string
    startTime: Date
    endTime: Date
    cost: number // Add the missing required cost field
    notes?: string
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const operation = await prisma.operation.create({
      data: {
        workCenterId: data.workCenterId,
        productionOrderId,
        startTime: data.startTime,
        endTime: data.endTime,
        cost: data.cost, // Include cost in the creation data
        status: Status.PENDING,
        notes: data.notes || null,
        createdBy: session.user.id
      },
      include: {
        workCenter: true
      }
    })

    revalidatePath(`/inspector/production/${productionOrderId}`)
    return operation
  } catch (error) {
    console.error('Error creating operation:', error)
    throw error
  }
}

export async function deleteOperation(operationId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // First get the operation to find its production order ID
    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: { productionOrderId: true, status: true }
    })

    if (!operation) {
      throw new Error('Operation not found')
    }

    // Check if the operation is already in progress or completed
    if (operation.status === 'IN_PROGRESS' || operation.status === 'COMPLETED') {
      throw new Error('Cannot delete an operation that is in progress or completed')
    }

    // Delete the operation
    await prisma.operation.delete({
      where: { id: operationId }
    })

    // Revalidate the path for the production order
    revalidatePath(`/inspector/production/${operation.productionOrderId}`)
    return { success: true, productionOrderId: operation.productionOrderId }
  } catch (error) {
    console.error('Error deleting operation:', error)
    throw error
  }
}

export async function updateOperationStatus(
  operationId: string,
  status: Status
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const operation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        status,
        modifiedBy: session.user.id
      },
      include: {
        productionOrder: true
      }
    })

    revalidatePath(`/inspector/production/${operation.productionOrderId}`)
    return operation
  } catch (error) {
    console.error('Error updating operation status:', error)
    throw error
  }
}

/**
 * Links a customer order to an existing production order
 * @param productionOrderId The ID of the production order to update
 * @param customerOrderId The ID of the customer order to link
 * @returns The updated production order
 */
export async function linkCustomerOrderToProduction(
  productionOrderId: string,
  customerOrderId: string
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Verify that both the production order and customer order exist
    const [productionOrder, customerOrder] = await Promise.all([
      prisma.productionOrder.findUnique({ where: { id: productionOrderId } }),
      prisma.customerOrder.findUnique({ where: { id: customerOrderId } })
    ])

    if (!productionOrder) {
      throw new Error('Production order not found')
    }

    if (!customerOrder) {
      throw new Error('Customer order not found')
    }

    // Check if the production order already has a customer order linked
    if (productionOrder.customerOrderId) {
      throw new Error('Production order is already linked to a customer order')
    }

    // Update the production order with the customer order ID
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        customerOrderId,
        modifiedBy: session.user.id
      },
      include: {
        product: true,
        customerOrder: true
      }
    })

    revalidatePath('/inspector/production')
    revalidatePath(`/inspector/production/${productionOrderId}`)
    
    return updatedOrder
  } catch (error) {
    console.error('Error linking customer order to production order:', error)
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
          in: ['PENDING', 'IN_PROGRESS', 'ACTIVE']
        }
      },
      select: {
        id: true,
        orderNumber: true,
        customer: {
          select: {
            name: true
          }
        },
        requiredDate: true
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching available customer orders:', error)
    throw new Error('Failed to fetch available customer orders')
  }
}

// Update the updateProductionOrderStatus function to handle errors when creating ActivityLog entries
export async function updateProductionOrderStatus(
  productionOrderId: string,
  status: Status,
  notes?: string
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Get current production order
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true
      }
    })

    if (!currentOrder) {
      throw new Error('Production order not found')
    }

    const oldStatus = currentOrder.status
    const productionQty = currentOrder.quantity

    // If cancelling production, release material reservations
    if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      const releaseResult = await releaseMaterialReservations(
        productionOrderId, 
        'Production order cancelled'
      )
      
      if (!releaseResult.success) {
        console.error('Failed to release material reservations:', releaseResult.error)
        // Continue with status update even if release fails
      }
    }

    // If completing production, increase product stock and update completion fields
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      await prisma.product.update({
        where: { id: currentOrder.productId },
        data: {
          currentStock: currentOrder.product.currentStock + productionQty
        }
      })
      
      // Update production order completion fields
      await prisma.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          completedQuantity: productionQty,
          completedAt: new Date()
        }
      })
      
      // Log product stock increment
      if (prisma.activityLog) {
        await prisma.activityLog.create({
          data: {
            type: 'PRODUCT_STOCK_INCREMENT',
            userId: session.user.id,
            details: {
              productId: currentOrder.productId,
              productName: currentOrder.product.name,
              change: productionQty,
              reason: `Production order ${productionOrderId} completed`
            }
          }
        })
      }
    }

    // Update the production order status
    const order = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        status,
        modifiedBy: session.user.id,
        notes: notes || undefined
      }
    })

    // Log the status change using the ActivityLog model
    try {
      if (prisma.activityLog) {
        await prisma.activityLog.create({
          data: {
            type: 'PRODUCTION_STATUS_CHANGE',
            userId: session.user.id,
            details: {
              productionOrderId,
              oldStatus,
              newStatus: status,
              notes: notes || null
            }
          }
        })
      }
    } catch (logError) {
      console.error("Failed to create activity log:", logError)
    }

    revalidatePath('/inspector/production')
    revalidatePath(`/inspector/production/${productionOrderId}`)
    revalidatePath('/inspector/materials')
    
    return order
  } catch (error) {
    console.error('Error updating production order status:', error)
    throw error
  }
}

// Update the getProductionLogs function to handle errors
export async function getProductionLogs(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Check if ActivityLog model exists in prisma client
    if (!prisma.activityLog) {
      console.log('ActivityLog model not available in Prisma client')
      return [] // Return empty array if model is not available
    }

    // Fetch the activity logs related to this production order using Prisma
    const logs = await prisma.activityLog.findMany({
      where: {
        type: 'PRODUCTION_STATUS_CHANGE',
        details: {
          path: ['productionOrderId'],
          equals: productionOrderId
        }
      },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the logs for display
    const formattedLogs = logs.map(log => {
      const details = log.details as any
      
      // Get user name if available
      const userName = log.user.profile 
        ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
        : log.user.email;
      
      return {
        id: log.id,
        action: `Status changed from ${details.oldStatus} to ${details.newStatus}`,
        details: details.notes || '',
        timestamp: log.createdAt,
        userId: log.userId,
        userName
      }
    })

    return formattedLogs
  } catch (error) {
    console.error('Error fetching production logs:', error)
    return [] // Return empty array on error
  }
}

// Update the createInitialProductionLog function to handle errors
export async function createInitialProductionLog(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // Get the production order
    const order = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId }
    })

    if (!order) throw new Error('Production order not found')

    // Check if ActivityLog model exists in prisma client
    if (!prisma.activityLog) {
      console.log('ActivityLog model not available in Prisma client')
      return { success: false, error: 'ActivityLog model not available' }
    }

    // Create an initial log entry
    await prisma.activityLog.create({
      data: {
        type: 'PRODUCTION_STATUS_CHANGE',
        userId: session.user.id,
        details: {
          productionOrderId,
          oldStatus: 'PENDING',
          newStatus: order.status,
          notes: 'Initial production order status'
        }
      }
    })

    revalidatePath(`/inspector/production/${productionOrderId}`)
    return { success: true }
  } catch (error) {
    console.error('Error creating initial production log:', error)
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
    });

    if (!order) {
      throw new Error("Production order not found");
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
    });

    // Optionally fetch BOM if you have a function for it
    const bom = await getBOMForProduct(order.productId);

    // Combine and return
    return { ...order, materialRequests, bom };
  } catch (error) {
    console.error("Error fetching production order with material requests:", error);
    throw error;
  }
}
