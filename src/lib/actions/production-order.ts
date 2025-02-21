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
            status: Status.PENDING
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
    throw error
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



// aksjbdfjhavsdjhlfvaklsvdfk;jasdf
export async function addOperation(
    productionOrderId: string,
    data: {
      workCenterId: string
      startTime: Date
      endTime: Date
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
  
  // Update operation status
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