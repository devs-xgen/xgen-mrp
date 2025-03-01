'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Status } from "@prisma/client"
import { 
  CreateQualityCheckInput, 
  UpdateQualityCheckInput 
} from "@/types/admin/quality-checks"

export async function getQualityChecks() {
  try {
    const checks = await prisma.qualityCheck.findMany({
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: { checkDate: 'desc' }
    })
    
    return checks
  } catch (error) {
    console.error('Error fetching quality checks:', error)
    throw new Error('Failed to fetch quality checks')
  }
}

export async function getQualityCheck(id: string) {
  try {
    const check = await prisma.qualityCheck.findUnique({
      where: { id },
      include: {
        productionOrder: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (!check) {
      throw new Error('Quality check not found')
    }
    
    return check
  } catch (error) {
    console.error('Error fetching quality check:', error)
    throw error
  }
}

export async function createQualityCheck(data: CreateQualityCheckInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const check = await prisma.qualityCheck.create({
      data: {
        productionOrderId: data.productionOrderId,
        inspectorId: session.user.id,
        checkDate: data.checkDate,
        status: Status.PENDING,
        defectsFound: data.defectsFound || null,
        actionTaken: data.actionTaken || null,
        notes: data.notes || null,
        createdBy: session.user.id
      },
      include: {
        productionOrder: {
          include: {
            product: true
          }
        }
      }
    })

    revalidatePath('/admin/quality-checks')
    revalidatePath(`/admin/production/${data.productionOrderId}`)
    return check
  } catch (error) {
    console.error('Error creating quality check:', error)
    throw error
  }
}

export async function updateQualityCheck(data: UpdateQualityCheckInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const check = await prisma.qualityCheck.findUnique({
      where: { id: data.id },
      include: { productionOrder: true }
    })
    
    if (!check) {
      throw new Error('Quality check not found')
    }

    const updatedCheck = await prisma.qualityCheck.update({
      where: { id: data.id },
      data: {
        status: data.status,
        defectsFound: data.defectsFound !== undefined ? data.defectsFound : check.defectsFound,
        actionTaken: data.actionTaken !== undefined ? data.actionTaken : check.actionTaken,
        notes: data.notes !== undefined ? data.notes : check.notes,
        modifiedBy: session.user.id,
        updatedAt: new Date()
      },
      include: {
        productionOrder: {
          include: {
            product: true
          }
        }
      }
    })

    revalidatePath('/admin/quality-checks')
    revalidatePath(`/admin/production/${check.productionOrderId}`)
    
    return updatedCheck
  } catch (error) {
    console.error('Error updating quality check:', error)
    throw error
  }
}

export async function deleteQualityCheck(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    const check = await prisma.qualityCheck.findUnique({
      where: { id }
    })
    
    if (!check) {
      throw new Error('Quality check not found')
    }

    await prisma.qualityCheck.delete({
      where: { id }
    })

    revalidatePath('/admin/quality-checks')
    revalidatePath(`/admin/production/${check.productionOrderId}`)
  } catch (error) {
    console.error('Error deleting quality check:', error)
    throw error
  }
}

// Get available production orders for quality checks
export async function getAvailableProductionOrders() {
  try {
    const orders = await prisma.productionOrder.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      select: {
        id: true,
        product: {
          select: {
            name: true,
            sku: true
          }
        },
        quantity: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return orders
  } catch (error) {
    console.error('Error fetching available production orders:', error)
    throw new Error('Failed to fetch available production orders')
  }
}

// Get quality metrics for dashboard
export async function getQualityMetrics() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    const totalChecks = await prisma.qualityCheck.count()
    
    const pendingChecks = await prisma.qualityCheck.count({
      where: { status: 'PENDING' }
    })
    
    const defectsFound = await prisma.qualityCheck.count({
      where: { 
        defectsFound: { not: null },
        NOT: { defectsFound: '' }
      }
    })
    
    const passRate = totalChecks > 0 
      ? ((totalChecks - defectsFound) / totalChecks) * 100 
      : 100
    
    const recentChecks = await prisma.qualityCheck.findMany({
      take: 5,
      orderBy: { checkDate: 'desc' },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        }
      }
    })
    
    return {
      totalChecks,
      pendingChecks,
      defectsFound,
      passRate,
      recentChecks
    }
  } catch (error) {
    console.error('Error getting quality metrics:', error)
    throw error
  }
}