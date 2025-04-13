// src/lib/actions/production-order.ts
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Status } from "@prisma/client"
import { 
  CreateProductionOrderInput, 
  UpdateProductionOrderInput 
} from "@/types/admin/production-order"

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
    
    return order
  } catch (error) {
    console.error('Error fetching production order:', error)
    throw error
  }
}


export async function createProductionOrder(data: CreateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

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

    revalidatePath('/admin/production')
    return order
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

    revalidatePath('/admin/production')
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

    // Delete related operations and quality checks first
    await prisma.operation.deleteMany({
      where: { productionOrderId: id }
    })
    
    await prisma.qualityCheck.deleteMany({
      where: { productionOrderId: id }
    })

    await prisma.productionOrder.delete({
      where: { id }
    })

    revalidatePath('/admin/production')
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

    revalidatePath(`/admin/production/${productionOrderId}`)
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
    revalidatePath(`/admin/production/${operation.productionOrderId}`)
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

    revalidatePath(`/admin/production/${operation.productionOrderId}`)
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

    revalidatePath('/admin/production')
    revalidatePath(`/admin/production/${productionOrderId}`)
    
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