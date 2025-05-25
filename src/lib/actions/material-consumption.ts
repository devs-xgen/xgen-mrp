'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ReservationStatus, MovementType, VarianceType } from "@prisma/client"
import { 
  MaterialConsumptionInput,
  MaterialConsumptionUpdateInput,
  ProductionMaterialConsumption,
  CostVarianceInput,
  MRPActionResponse,
  InventoryMovementInput
} from "@/types/admin/mrp"
import { getBOMForProduct } from "@/lib/actions/bom"
import { Decimal } from "@prisma/client/runtime/library"

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Convert Prisma material consumption result to typed interface
 */
function convertMaterialConsumption(prismaResult: any): ProductionMaterialConsumption {
  return {
    id: prismaResult.id,
    productionOrderId: prismaResult.productionOrderId,
    materialId: prismaResult.materialId,
    plannedQuantity: Number(prismaResult.plannedQuantity),
    actualQuantity: Number(prismaResult.actualQuantity),
    wasteQuantity: Number(prismaResult.wasteQuantity),
    unitCost: Number(prismaResult.unitCost),
    totalCost: Number(prismaResult.totalCost),
    consumedBy: prismaResult.consumedBy,
    consumedAt: prismaResult.consumedAt,
    batchNumber: prismaResult.batchNumber,
    lotNumber: prismaResult.lotNumber,
    expiryDate: prismaResult.expiryDate,
    notes: prismaResult.notes,
    createdAt: prismaResult.createdAt,
    updatedAt: prismaResult.updatedAt,
    
    // Relations
    productionOrder: prismaResult.productionOrder ? {
      id: prismaResult.productionOrder.id,
      product: {
        name: prismaResult.productionOrder.product.name,
        sku: prismaResult.productionOrder.product.sku
      }
    } : undefined,
    material: prismaResult.material ? {
      id: prismaResult.material.id,
      name: prismaResult.material.name,
      sku: prismaResult.material.sku,
      unitOfMeasure: {
        symbol: prismaResult.material.unitOfMeasure?.symbol || 'units'
      }
    } : undefined,
    consumedByUser: prismaResult.consumedByUser ? {
      id: prismaResult.consumedByUser.id,
      email: prismaResult.consumedByUser.email,
      profile: prismaResult.consumedByUser.profile ? {
        firstName: prismaResult.consumedByUser.profile.firstName,
        lastName: prismaResult.consumedByUser.profile.lastName
      } : undefined
    } : undefined
  }
}

// ==============================================
// MATERIAL CONSUMPTION FUNCTIONS
// ==============================================

/**
 * Record material consumption for a production order
 */
export async function consumeMaterialForProduction(
  data: MaterialConsumptionInput
): Promise<MRPActionResponse<ProductionMaterialConsumption>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate production order exists
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      include: {
        product: true
      }
    })

    if (!productionOrder) {
      return { success: false, error: 'Production order not found' }
    }

    // Validate material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId },
      include: {
        unitOfMeasure: true
      }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    // Find the material reservation for this production order
    const reservation = await prisma.materialReservation.findFirst({
      where: {
        productionOrderId: data.productionOrderId,
        materialId: data.materialId,
        status: {
          in: [ReservationStatus.RESERVED, ReservationStatus.PARTIAL]
        }
      }
    })

    if (!reservation) {
      return { 
        success: false, 
        error: 'No active material reservation found for this production order and material' 
      }
    }

    // Calculate total consumed quantity including new consumption
    const totalConsumedQuantity = Number(reservation.quantityConsumed) + data.actualQuantity
    const totalWasteQuantity = (data.wasteQuantity || 0)
    const totalQuantityUsed = data.actualQuantity + totalWasteQuantity

    // Check if consumption exceeds reservation
    if (totalConsumedQuantity > Number(reservation.quantityReserved)) {
      return { 
        success: false, 
        error: `Consumption quantity (${totalConsumedQuantity}) exceeds reserved quantity (${reservation.quantityReserved})` 
      }
    }

    // Calculate costs
    const totalCost = totalQuantityUsed * data.unitCost
    
    // Start transaction to record consumption (no stock deduction since already deducted during reservation)
    const result = await prisma.$transaction(async (tx) => {
      // Create material consumption record
      const consumption = await tx.productionMaterialConsumption.create({
        data: {
          productionOrderId: data.productionOrderId,
          materialId: data.materialId,
          plannedQuantity: data.plannedQuantity,
          actualQuantity: data.actualQuantity,
          wasteQuantity: totalWasteQuantity,
          unitCost: data.unitCost,
          totalCost: totalCost,
          consumedBy: session.user.id,
          consumedAt: new Date(),
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber,
          expiryDate: data.expiryDate,
          notes: data.notes
        },
        include: {
          material: {
            include: {
              unitOfMeasure: true
            }
          },
          productionOrder: {
            include: {
              product: true
            }
          }
        }
      })

      // Update material reservation (no stock changes needed)
      const newReservationStatus = totalConsumedQuantity >= Number(reservation.quantityReserved) 
        ? ReservationStatus.CONSUMED 
        : ReservationStatus.PARTIAL

      await tx.materialReservation.update({
        where: { id: reservation.id },
        data: {
          quantityConsumed: totalConsumedQuantity,
          status: newReservationStatus,
          consumedAt: newReservationStatus === ReservationStatus.CONSUMED ? new Date() : reservation.consumedAt,
          modifiedBy: session.user.id
        }
      })

      // Create inventory movement record for material consumption tracking (no stock change)
      await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.MATERIAL_CONSUMPTION,
          quantity: totalQuantityUsed,
          previousStock: material.currentStock,
          newStock: material.currentStock, // No stock change - already deducted during reservation
          unitCost: data.unitCost,
          totalValue: totalCost,
          referenceId: data.productionOrderId,
          referenceType: 'ProductionOrder',
          performedBy: session.user.id,
          transactionDate: new Date(),
          notes: `Material consumption tracked for production. Actual: ${data.actualQuantity}, Waste: ${totalWasteQuantity}. Stock already deducted during reservation.`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        }
      })

      // Create waste inventory movement if there's waste (tracking only)
      if (totalWasteQuantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            materialId: data.materialId,
            movementType: MovementType.MATERIAL_WASTE,
            quantity: totalWasteQuantity,
            previousStock: material.currentStock,
            newStock: material.currentStock, // No stock change - waste is part of already deducted material
            unitCost: data.unitCost,
            totalValue: totalWasteQuantity * data.unitCost,
            referenceId: data.productionOrderId,
            referenceType: 'ProductionOrder',
            performedBy: session.user.id,
            transactionDate: new Date(),
            notes: `Material waste tracked during production. Reason: ${data.notes || 'Production waste'}. Stock already deducted during reservation.`,
            batchNumber: data.batchNumber,
            lotNumber: data.lotNumber
          }
        })
      }

      // Calculate and record cost variance if actual differs from planned
      if (data.actualQuantity !== data.plannedQuantity) {
        const plannedCost = data.plannedQuantity * data.unitCost
        const actualCost = data.actualQuantity * data.unitCost
        const variance = actualCost - plannedCost
        const variancePercent = plannedCost > 0 ? (variance / plannedCost) * 100 : 0

        await tx.costVariance.create({
          data: {
            productionOrderId: data.productionOrderId,
            materialId: data.materialId,
            varianceType: VarianceType.MATERIAL_USAGE,
            plannedCost: plannedCost,
            actualCost: actualCost,
            variance: variance,
            variancePercent: variancePercent,
            explanation: `Material usage variance: Planned ${data.plannedQuantity}, Actual ${data.actualQuantity}`,
            createdAt: new Date()
          }
        })
      }

      // Update production order actual material cost
      const currentActualCost = Number(productionOrder.actualMaterialCost) + totalCost
      const currentVariance = currentActualCost - Number(productionOrder.plannedMaterialCost)

      await tx.productionOrder.update({
        where: { id: data.productionOrderId },
        data: {
          actualMaterialCost: currentActualCost,
          materialVariance: currentVariance,
          modifiedBy: session.user.id
        }
      })

      // Convert and return the consumption with proper types
      return convertMaterialConsumption(consumption)
    })

    revalidatePath('/admin/production')
    revalidatePath('/admin/materials')
    revalidatePath(`/admin/production/${data.productionOrderId}`)

    return {
      success: true,
      data: result,
      message: `Successfully tracked material consumption. Used: ${data.actualQuantity}, Waste: ${totalWasteQuantity}, Cost: $${totalCost.toFixed(2)}`
    }

  } catch (error) {
    console.error('Error recording material consumption:', error)
    return {
      success: false,
      error: 'Failed to record material consumption'
    }
  }
}

/**
 * Get all material consumptions with optional filters
 */
export async function getMaterialConsumptions(filters?: {
  productionOrderId?: string
  materialId?: string
  consumedBy?: string
  dateFrom?: Date
  dateTo?: Date
}) {
  try {
    const whereClause: any = {}

    if (filters?.productionOrderId) {
      whereClause.productionOrderId = filters.productionOrderId
    }

    if (filters?.materialId) {
      whereClause.materialId = filters.materialId
    }

    if (filters?.consumedBy) {
      whereClause.consumedBy = filters.consumedBy
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.consumedAt = {}
      if (filters.dateFrom) {
        whereClause.consumedAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        whereClause.consumedAt.lte = filters.dateTo
      }
    }

    const consumptions = await prisma.productionMaterialConsumption.findMany({
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
        },
        consumedByUser: {
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
        consumedAt: 'desc'
      }
    })

    return consumptions.map(convertMaterialConsumption)
  } catch (error) {
    console.error('Error fetching material consumptions:', error)
    throw new Error('Failed to fetch material consumptions')
  }
}

/**
 * Get material consumptions for a specific production order
 */
export async function getConsumptionsForProductionOrder(productionOrderId: string) {
  try {
    return await getMaterialConsumptions({ productionOrderId })
  } catch (error) {
    console.error('Error fetching consumptions for production order:', error)
    throw new Error('Failed to fetch consumptions for production order')
  }
}

/**
 * Update a material consumption record
 */
export async function updateMaterialConsumption(
  data: MaterialConsumptionUpdateInput
): Promise<MRPActionResponse<ProductionMaterialConsumption>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get the existing consumption record
    const existingConsumption = await prisma.productionMaterialConsumption.findUnique({
      where: { id: data.id },
      include: {
        material: true,
        productionOrder: true
      }
    })

    if (!existingConsumption) {
      return { success: false, error: 'Material consumption record not found' }
    }

    // Calculate differences for stock adjustments
    const oldActualQuantity = Number(existingConsumption.actualQuantity)
    const oldWasteQuantity = Number(existingConsumption.wasteQuantity)
    const oldTotalUsed = oldActualQuantity + oldWasteQuantity

    const newActualQuantity = data.actualQuantity !== undefined ? data.actualQuantity : oldActualQuantity
    const newWasteQuantity = data.wasteQuantity !== undefined ? data.wasteQuantity : oldWasteQuantity
    const newTotalUsed = newActualQuantity + newWasteQuantity

    const quantityDifference = newTotalUsed - oldTotalUsed
    const newTotalCost = newTotalUsed * Number(existingConsumption.unitCost)

    // Start transaction to update consumption and related records
    const result = await prisma.$transaction(async (tx) => {
      // Update the consumption record
      const updatedConsumption = await tx.productionMaterialConsumption.update({
        where: { id: data.id },
        data: {
          ...(data.actualQuantity !== undefined && { actualQuantity: data.actualQuantity }),
          ...(data.wasteQuantity !== undefined && { wasteQuantity: data.wasteQuantity }),
          ...(data.notes !== undefined && { notes: data.notes }),
          totalCost: newTotalCost,
          updatedAt: new Date()
        },
        include: {
          material: { include: { unitOfMeasure: true } },
          productionOrder: { include: { product: true } }
        }
      })

      // Adjust material stock if quantity changed
      if (quantityDifference !== 0) {
        await tx.material.update({
          where: { id: existingConsumption.materialId },
          data: {
            currentStock: {
              decrement: quantityDifference
            }
          }
        })

        // Create adjustment inventory movement
        const currentMaterial = await tx.material.findUnique({
          where: { id: existingConsumption.materialId }
        })

        if (currentMaterial) {
          await tx.inventoryMovement.create({
            data: {
              materialId: existingConsumption.materialId,
              movementType: MovementType.MATERIAL_ADJUSTMENT,
              quantity: quantityDifference,
              previousStock: currentMaterial.currentStock + quantityDifference,
              newStock: currentMaterial.currentStock,
              unitCost: Number(existingConsumption.unitCost),
              totalValue: quantityDifference * Number(existingConsumption.unitCost),
              referenceId: existingConsumption.productionOrderId,
              referenceType: 'ProductionOrder',
              performedBy: session.user.id,
              transactionDate: new Date(),
              notes: `Material consumption adjustment: ${quantityDifference > 0 ? 'Additional' : 'Reduced'} usage of ${Math.abs(quantityDifference)} units`
            }
          })
        }
      }

      // Update production order actual material cost
      const costDifference = newTotalCost - Number(existingConsumption.totalCost)
      if (costDifference !== 0) {
        const currentActualCost = Number(existingConsumption.productionOrder.actualMaterialCost) + costDifference
        const currentVariance = currentActualCost - Number(existingConsumption.productionOrder.plannedMaterialCost)

        await tx.productionOrder.update({
          where: { id: existingConsumption.productionOrderId },
          data: {
            actualMaterialCost: currentActualCost,
            materialVariance: currentVariance,
            modifiedBy: session.user.id
          }
        })
      }

      return convertMaterialConsumption(updatedConsumption)
    })

    revalidatePath('/admin/production')
    revalidatePath('/admin/materials')
    revalidatePath(`/admin/production/${existingConsumption.productionOrderId}`)

    return {
      success: true,
      data: result,
      message: 'Material consumption updated successfully'
    }

  } catch (error) {
    console.error('Error updating material consumption:', error)
    return {
      success: false,
      error: 'Failed to update material consumption'
    }
  }
}

// ==============================================
// BATCH CONSUMPTION FUNCTIONS
// ==============================================

/**
 * Record multiple material consumptions in a batch (for production line efficiency)
 */
export async function batchConsumeMaterials(
  productionOrderId: string,
  consumptions: Omit<MaterialConsumptionInput, 'productionOrderId'>[]
): Promise<MRPActionResponse<ProductionMaterialConsumption[]>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!consumptions || consumptions.length === 0) {
      return { success: false, error: 'No consumptions provided' }
    }

    // Validate production order exists
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: { product: true }
    })

    if (!productionOrder) {
      return { success: false, error: 'Production order not found' }
    }

    // Validate all materials and check stock availability
    const materialValidations = await Promise.all(
      consumptions.map(async (consumption) => {
        const material = await prisma.material.findUnique({
          where: { id: consumption.materialId },
          include: { unitOfMeasure: true }
        })

        if (!material) {
          throw new Error(`Material not found: ${consumption.materialId}`)
        }

        const totalUsage = consumption.actualQuantity + (consumption.wasteQuantity || 0)
        if (material.currentStock < totalUsage) {
          throw new Error(`Insufficient stock for material ${material.name}: Available ${material.currentStock}, Required ${totalUsage}`)
        }

        return { material, consumption, totalUsage }
      })
    )

    // Start transaction to record all consumptions
    const results = await prisma.$transaction(async (tx) => {
      const createdConsumptions = []
      let totalMaterialCost = 0

      for (const { material, consumption, totalUsage } of materialValidations) {
        // Find reservation
        const reservation = await tx.materialReservation.findFirst({
          where: {
            productionOrderId,
            materialId: consumption.materialId,
            status: { in: [ReservationStatus.RESERVED, ReservationStatus.PARTIAL] }
          }
        })

        if (!reservation) {
          throw new Error(`No active reservation found for material ${material.name}`)
        }

        // Calculate costs
        const totalCost = totalUsage * consumption.unitCost
        totalMaterialCost += totalCost

        // Create consumption record
        const materialConsumption = await tx.productionMaterialConsumption.create({
          data: {
            productionOrderId,
            materialId: consumption.materialId,
            plannedQuantity: consumption.plannedQuantity,
            actualQuantity: consumption.actualQuantity,
            wasteQuantity: consumption.wasteQuantity || 0,
            unitCost: consumption.unitCost,
            totalCost: totalCost,
            consumedBy: session.user.id,
            consumedAt: new Date(),
            batchNumber: consumption.batchNumber,
            lotNumber: consumption.lotNumber,
            expiryDate: consumption.expiryDate,
            notes: consumption.notes
          },
          include: {
            material: { include: { unitOfMeasure: true } },
            productionOrder: { include: { product: true } }
          }
        })

        // Update reservation (no stock changes needed)
        const totalConsumed = Number(reservation.quantityConsumed) + consumption.actualQuantity
        const newReservationStatus = totalConsumed >= Number(reservation.quantityReserved) 
          ? ReservationStatus.CONSUMED 
          : ReservationStatus.PARTIAL

        await tx.materialReservation.update({
          where: { id: reservation.id },
          data: {
            quantityConsumed: totalConsumed,
            status: newReservationStatus,
            consumedAt: newReservationStatus === ReservationStatus.CONSUMED ? new Date() : reservation.consumedAt,
            modifiedBy: session.user.id
          }
        })

        // Create inventory movement for tracking (no stock change)
        await tx.inventoryMovement.create({
          data: {
            materialId: consumption.materialId,
            movementType: MovementType.MATERIAL_CONSUMPTION,
            quantity: totalUsage,
            previousStock: material.currentStock,
            newStock: material.currentStock, // No stock change - already deducted during reservation
            unitCost: consumption.unitCost,
            totalValue: totalCost,
            referenceId: productionOrderId,
            referenceType: 'ProductionOrder',
            performedBy: session.user.id,
            transactionDate: new Date(),
            notes: `Batch material consumption tracked. Actual: ${consumption.actualQuantity}, Waste: ${consumption.wasteQuantity || 0}. Stock already deducted during reservation.`,
            batchNumber: consumption.batchNumber,
            lotNumber: consumption.lotNumber
          }
        })

        // Convert and add to results
        createdConsumptions.push(convertMaterialConsumption(materialConsumption))
      }

      // Update production order costs
      const currentActualCost = Number(productionOrder.actualMaterialCost) + totalMaterialCost
      const currentVariance = currentActualCost - Number(productionOrder.plannedMaterialCost)

      await tx.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          actualMaterialCost: currentActualCost,
          materialVariance: currentVariance,
          modifiedBy: session.user.id
        }
      })

      return { consumptions: createdConsumptions, totalCost: totalMaterialCost }
    })

    revalidatePath('/admin/production')
    revalidatePath('/admin/materials')
    revalidatePath(`/admin/production/${productionOrderId}`)

    return {
      success: true,
      data: results.consumptions,
      message: `Successfully tracked ${results.consumptions.length} material consumptions. Total cost: $${results.totalCost.toFixed(2)}`
    }

  } catch (error) {
    console.error('Error recording batch material consumptions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record batch material consumptions'
    }
  }
}

// ==============================================
// ANALYTICS AND REPORTING FUNCTIONS
// ==============================================

/**
 * Get material consumption analytics for a production order
 */
export async function getProductionOrderConsumptionAnalytics(productionOrderId: string) {
  try {
    const [consumptions, productionOrder, bom] = await Promise.all([
      getMaterialConsumptions({ productionOrderId }),
      prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        include: { product: true }
      }),
      prisma.productionOrder.findUnique({
        where: { id: productionOrderId }
      }).then(order => 
        order ? getBOMForProduct(order.productId) : null
      )
    ])

    if (!productionOrder || !bom) {
      throw new Error('Production order or BOM not found')
    }

    // Calculate analytics
    const analytics = {
      totalPlannedCost: Number(productionOrder.plannedMaterialCost),
      totalActualCost: Number(productionOrder.actualMaterialCost),
      totalVariance: Number(productionOrder.materialVariance),
      variancePercentage: Number(productionOrder.plannedMaterialCost) > 0 
        ? (Number(productionOrder.materialVariance) / Number(productionOrder.plannedMaterialCost)) * 100 
        : 0,
      totalWaste: consumptions.reduce((sum, c) => sum + c.wasteQuantity, 0),
      totalWasteCost: consumptions.reduce((sum, c) => sum + (c.wasteQuantity * c.unitCost), 0),
      materialBreakdown: consumptions.map(consumption => ({
        materialId: consumption.materialId,
        materialName: consumption.material?.name || 'Unknown',
        materialSku: consumption.material?.sku || 'N/A',
        unitSymbol: consumption.material?.unitOfMeasure?.symbol || 'units',
        plannedQuantity: consumption.plannedQuantity,
        actualQuantity: consumption.actualQuantity,
        wasteQuantity: consumption.wasteQuantity,
        unitCost: consumption.unitCost,
        totalCost: consumption.totalCost,
        efficiency: consumption.plannedQuantity > 0 
          ? (consumption.actualQuantity / consumption.plannedQuantity) * 100 
          : 0,
        wastePercentage: consumption.actualQuantity > 0 
          ? (consumption.wasteQuantity / consumption.actualQuantity) * 100 
          : 0
      }))
    }

    return analytics
  } catch (error) {
    console.error('Error fetching consumption analytics:', error)
    throw new Error('Failed to fetch consumption analytics')
  }
}

/**
 * Get material consumption dashboard data
 */
export async function getMaterialConsumptionDashboardData() {
  try {
    const [
      totalConsumptions,
      todayConsumptions,
      totalWasteAmount,
      totalCostVariance
    ] = await Promise.all([
      prisma.productionMaterialConsumption.count(),
      prisma.productionMaterialConsumption.count({
        where: {
          consumedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.productionMaterialConsumption.aggregate({
        _sum: {
          wasteQuantity: true
        }
      }),
      prisma.costVariance.aggregate({
        where: {
          varianceType: VarianceType.MATERIAL_USAGE
        },
        _sum: {
          variance: true
        }
      })
    ])

    // Get recent consumptions
    const recentConsumptions = await prisma.productionMaterialConsumption.findMany({
      take: 10,
      orderBy: { consumedAt: 'desc' },
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
      totalConsumptions,
      todayConsumptions,
      totalWasteAmount: Number(totalWasteAmount._sum.wasteQuantity || 0),
      totalCostVariance: Number(totalCostVariance._sum.variance || 0),
      recentConsumptions: recentConsumptions.map(convertMaterialConsumption)
    }
  } catch (error) {
    console.error('Error fetching consumption dashboard data:', error)
    throw new Error('Failed to fetch consumption dashboard data')
  }
} 