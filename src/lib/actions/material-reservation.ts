'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ReservationStatus, MovementType } from "@prisma/client"
import { 
  MaterialReservationInput,
  MaterialReservationUpdateInput,
  MaterialAvailabilityCheck,
  ProductionOrderMaterialRequirements,
  MaterialShortageAlert,
  MRPActionResponse
} from "@/types/admin/mrp"
import { getBOMForProduct } from "@/lib/actions/bom"

// ==============================================
// MATERIAL AVAILABILITY FUNCTIONS
// ==============================================

/**
 * Check availability of a single material for a specific quantity
 */
export async function checkMaterialAvailability(
  materialId: string, 
  requiredQuantity: number
): Promise<MaterialAvailabilityCheck> {
  try {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        unitOfMeasure: {
          select: {
            symbol: true
          }
        }
      }
    })

    if (!material) {
      throw new Error('Material not found')
    }

    const availableStock = material.currentStock - material.committedStock
    const shortfall = Math.max(0, requiredQuantity - availableStock)

    return {
      materialId: material.id,
      materialName: material.name,
      materialSku: material.sku,
      currentStock: material.currentStock,
      committedStock: material.committedStock,
      availableStock,
      requiredQuantity,
      isAvailable: availableStock >= requiredQuantity,
      shortfall,
      unitSymbol: material.unitOfMeasure?.symbol || 'units'
    }
  } catch (error) {
    console.error('Error checking material availability:', error)
    throw new Error('Failed to check material availability')
  }
}

/**
 * Check availability of all materials required for a production order
 */
export async function checkProductionOrderMaterialRequirements(
  productId: string,
  quantity: number
): Promise<ProductionOrderMaterialRequirements> {
  try {
    // Get BOM for the product
    const bom = await getBOMForProduct(productId)
    
    if (!bom.entries || bom.entries.length === 0) {
      return {
        productionOrderId: '', // Will be set when creating actual order
        materials: [],
        totalMaterialCost: 0,
        allMaterialsAvailable: true
      }
    }

    const materialRequirements = []
    let totalMaterialCost = 0
    let allMaterialsAvailable = true

    for (const bomEntry of bom.entries) {
      const quantityNeeded = bomEntry.quantityNeeded * quantity
      const wasteQuantity = (quantityNeeded * bomEntry.wastePercentage) / 100
      const totalQuantityNeeded = quantityNeeded + wasteQuantity

      const availability = await checkMaterialAvailability(
        bomEntry.materialId, 
        totalQuantityNeeded
      )

      const materialCost = totalQuantityNeeded * bomEntry.costPerUnit
      totalMaterialCost += materialCost

      materialRequirements.push({
        materialId: bomEntry.materialId,
        materialName: bomEntry.materialName,
        materialSku: bomEntry.materialSku,
        quantityNeeded: totalQuantityNeeded,
        quantityAvailable: availability.availableStock,
        isAvailable: availability.isAvailable,
        unitCost: bomEntry.costPerUnit,
        totalCost: materialCost
      })

      if (!availability.isAvailable) {
        allMaterialsAvailable = false
      }
    }

    return {
      productionOrderId: '', // Will be set when creating actual order
      materials: materialRequirements,
      totalMaterialCost,
      allMaterialsAvailable
    }
  } catch (error) {
    console.error('Error checking production order material requirements:', error)
    throw new Error('Failed to check material requirements')
  }
}

// ==============================================
// MATERIAL RESERVATION FUNCTIONS
// ==============================================

/**
 * Reserve materials for a production order
 */
export async function reserveMaterialsForProduction(
  productionOrderId: string
): Promise<MRPActionResponse<any>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get production order details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true
      }
    })

    if (!productionOrder) {
      return { success: false, error: 'Production order not found' }
    }

    // Check if materials are already reserved
    const existingReservations = await prisma.materialReservation.findMany({
      where: { productionOrderId }
    })

    if (existingReservations.length > 0) {
      return { 
        success: false, 
        error: 'Materials are already reserved for this production order' 
      }
    }

    // Get material requirements
    const requirements = await checkProductionOrderMaterialRequirements(
      productionOrder.productId,
      productionOrder.quantity
    )

    if (!requirements.allMaterialsAvailable) {
      const shortageDetails = requirements.materials
        .filter(m => !m.isAvailable)
        .map(m => `${m.materialName}: need ${m.quantityNeeded}, available ${m.quantityAvailable}`)
        .join('; ')
      
      return { 
        success: false, 
        error: `Insufficient materials available: ${shortageDetails}` 
      }
    }

    // Start transaction to reserve materials
    const result = await prisma.$transaction(async (tx) => {
      const reservations = []
      
      for (const material of requirements.materials) {
        // Create material reservation
        const reservation = await tx.materialReservation.create({
          data: {
            productionOrderId,
            materialId: material.materialId,
            quantityReserved: material.quantityNeeded,
            status: ReservationStatus.RESERVED,
            reservedAt: new Date(),
            createdBy: session.user.id,
            notes: `Automatic reservation for production order ${productionOrderId}`
          }
        })

        // Update material committed stock
        await tx.material.update({
          where: { id: material.materialId },
          data: {
            committedStock: {
              increment: material.quantityNeeded
            },
            availableStock: {
              decrement: material.quantityNeeded
            }
          }
        })

        // Create inventory movement record
        const currentMaterial = await tx.material.findUnique({
          where: { id: material.materialId }
        })

        if (currentMaterial) {
          await tx.inventoryMovement.create({
            data: {
              materialId: material.materialId,
              movementType: MovementType.MATERIAL_RESERVATION,
              quantity: material.quantityNeeded,
              previousStock: currentMaterial.currentStock,
              newStock: currentMaterial.currentStock, // Stock level doesn't change, just committed
              referenceId: productionOrderId,
              referenceType: 'ProductionOrder',
              performedBy: session.user.id,
              transactionDate: new Date(),
              notes: `Material reserved for production order ${productionOrderId}`
            }
          })
        }

        reservations.push(reservation)
      }

      // Update production order with planned material cost
      await tx.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          plannedMaterialCost: requirements.totalMaterialCost,
          modifiedBy: session.user.id
        }
      })

      return reservations
    })

    revalidatePath('/admin/production')
    revalidatePath('/admin/materials')

    return {
      success: true,
      data: result,
      message: `Successfully reserved materials for production order. Total cost: $${requirements.totalMaterialCost.toFixed(2)}`
    }

  } catch (error) {
    console.error('Error reserving materials for production:', error)
    return {
      success: false,
      error: 'Failed to reserve materials for production'
    }
  }
}

/**
 * Release reserved materials (when production is cancelled)
 */
export async function releaseMaterialReservations(
  productionOrderId: string,
  reason?: string
): Promise<MRPActionResponse<any>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get active reservations
    const reservations = await prisma.materialReservation.findMany({
      where: {
        productionOrderId,
        status: {
          in: [ReservationStatus.RESERVED, ReservationStatus.PARTIAL]
        }
      },
      include: {
        material: true
      }
    })

    if (reservations.length === 0) {
      return {
        success: false,
        error: 'No active reservations found for this production order'
      }
    }

    // Start transaction to release materials
    const result = await prisma.$transaction(async (tx) => {
      const releasedReservations = []

      for (const reservation of reservations) {
        const quantityToRelease = reservation.quantityReserved - reservation.quantityConsumed

        if (quantityToRelease > 0) {
          // Update reservation status
          const updatedReservation = await tx.materialReservation.update({
            where: { id: reservation.id },
            data: {
              status: ReservationStatus.RELEASED,
              quantityReleased: quantityToRelease,
              releasedAt: new Date(),
              notes: reservation.notes 
                ? `${reservation.notes}; Released: ${reason || 'Production cancelled'}`
                : `Released: ${reason || 'Production cancelled'}`,
              modifiedBy: session.user.id
            }
          })

          // Update material committed stock
          await tx.material.update({
            where: { id: reservation.materialId },
            data: {
              committedStock: {
                decrement: quantityToRelease
              },
              availableStock: {
                increment: quantityToRelease
              }
            }
          })

          // Create inventory movement record
          const currentMaterial = await tx.material.findUnique({
            where: { id: reservation.materialId }
          })

          if (currentMaterial) {
            await tx.inventoryMovement.create({
              data: {
                materialId: reservation.materialId,
                movementType: MovementType.MATERIAL_RETURN,
                quantity: quantityToRelease,
                previousStock: currentMaterial.currentStock,
                newStock: currentMaterial.currentStock, // Stock level doesn't change, just committed
                referenceId: productionOrderId,
                referenceType: 'ProductionOrder',
                performedBy: session.user.id,
                transactionDate: new Date(),
                notes: `Material reservation released: ${reason || 'Production cancelled'}`
              }
            })
          }

          releasedReservations.push(updatedReservation)
        }
      }

      return releasedReservations
    })

    revalidatePath('/admin/production')
    revalidatePath('/admin/materials')

    return {
      success: true,
      data: result,
      message: `Successfully released ${result.length} material reservations`
    }

  } catch (error) {
    console.error('Error releasing material reservations:', error)
    return {
      success: false,
      error: 'Failed to release material reservations'
    }
  }
}

// ==============================================
// RESERVATION MANAGEMENT FUNCTIONS
// ==============================================

/**
 * Get all material reservations with optional filters
 */
export async function getMaterialReservations(filters?: {
  status?: ReservationStatus[]
  productionOrderId?: string
  materialId?: string
  dateFrom?: Date
  dateTo?: Date
}) {
  try {
    const whereClause: any = {}

    if (filters?.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status }
    }

    if (filters?.productionOrderId) {
      whereClause.productionOrderId = filters.productionOrderId
    }

    if (filters?.materialId) {
      whereClause.materialId = filters.materialId
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.reservedAt = {}
      if (filters.dateFrom) {
        whereClause.reservedAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        whereClause.reservedAt.lte = filters.dateTo
      }
    }

    const reservations = await prisma.materialReservation.findMany({
      where: whereClause,
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
      orderBy: [
        { status: 'asc' },
        { reservedAt: 'desc' }
      ]
    })

    return reservations
  } catch (error) {
    console.error('Error fetching material reservations:', error)
    throw new Error('Failed to fetch material reservations')
  }
}

/**
 * Get reservations for a specific production order
 */
export async function getReservationsForProductionOrder(productionOrderId: string) {
  try {
    return await getMaterialReservations({ productionOrderId })
  } catch (error) {
    console.error('Error fetching reservations for production order:', error)
    throw new Error('Failed to fetch reservations for production order')
  }
}

/**
 * Update a material reservation
 */
export async function updateMaterialReservation(
  data: MaterialReservationUpdateInput
): Promise<MRPActionResponse<any>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const reservation = await prisma.materialReservation.update({
      where: { id: data.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.quantityConsumed !== undefined && { 
          quantityConsumed: data.quantityConsumed 
        }),
        ...(data.quantityReleased !== undefined && { 
          quantityReleased: data.quantityReleased 
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        modifiedBy: session.user.id,
        updatedAt: new Date()
      },
      include: {
        material: true,
        productionOrder: {
          include: {
            product: true
          }
        }
      }
    })

    revalidatePath('/admin/production')
    revalidatePath('/admin/materials')

    return {
      success: true,
      data: reservation,
      message: 'Material reservation updated successfully'
    }

  } catch (error) {
    console.error('Error updating material reservation:', error)
    return {
      success: false,
      error: 'Failed to update material reservation'
    }
  }
}

// ==============================================
// SHORTAGE ALERT FUNCTIONS
// ==============================================

/**
 * Check for material shortages and affected production orders
 */
export async function checkMaterialShortages(): Promise<MaterialShortageAlert[]> {
  try {
    // Get all active materials first
    const materials = await prisma.material.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        reservations: {
          where: {
            status: {
              in: [ReservationStatus.RESERVED, ReservationStatus.PARTIAL]
            }
          },
          include: {
            productionOrder: {
              include: {
                product: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Filter for materials below minimum stock level and create alerts
    const alerts: MaterialShortageAlert[] = materials
      .filter(material => Number(material.currentStock) < Number(material.minimumStockLevel))
      .map(material => {
        const currentStock = Number(material.currentStock)
        const minimumStockLevel = Number(material.minimumStockLevel)
        const shortageAmount = minimumStockLevel - currentStock
        
        return {
          materialId: material.id,
          materialName: material.name,
          materialSku: material.sku,
          currentStock,
          minimumStockLevel,
          shortageAmount,
          affectedProductionOrders: material.reservations.map(reservation => ({
            id: reservation.productionOrder.id,
            productName: reservation.productionOrder.product.name,
            quantity: reservation.productionOrder.quantity,
            dueDate: reservation.productionOrder.dueDate
          }))
        }
      })

    return alerts
  } catch (error) {
    console.error('Error checking material shortages:', error)
    throw new Error('Failed to check material shortages')
  }
}

/**
 * Get dashboard data for material reservations
 */
export async function getMaterialReservationDashboardData() {
  try {
    const [totalReservations, activeReservations, consumedReservations, expiredReservations] = 
      await Promise.all([
        prisma.materialReservation.count(),
        prisma.materialReservation.count({
          where: { status: ReservationStatus.RESERVED }
        }),
        prisma.materialReservation.count({
          where: { status: ReservationStatus.CONSUMED }
        }),
        prisma.materialReservation.count({
          where: { status: ReservationStatus.EXPIRED }
        })
      ])

    // Get recent reservations
    const recentReservations = await prisma.materialReservation.findMany({
      take: 10,
      orderBy: { reservedAt: 'desc' },
      include: {
        material: {
          select: {
            name: true,
            sku: true
          }
        },
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
      totalReservations,
      activeReservations,
      consumedReservations,
      expiredReservations,
      recentReservations
    }
  } catch (error) {
    console.error('Error fetching material reservation dashboard data:', error)
    throw new Error('Failed to fetch dashboard data')
  }
} 