'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { VarianceType, MovementType } from "@prisma/client"
import { 
  CostVariance,
  CostVarianceInput,
  CostVarianceUpdateInput,
  CostVarianceFilters,
  MRPActionResponse,
  PaginatedMRPResponse,
  ProductionCostSummary
} from "@/types/admin/mrp"
import { getBOMForProduct } from "@/lib/actions/bom"
import { Decimal } from "@prisma/client/runtime/library"

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Convert Prisma cost variance result to typed interface
 */
function convertCostVariance(prismaResult: any): CostVariance {
  return {
    id: prismaResult.id,
    productionOrderId: prismaResult.productionOrderId,
    materialId: prismaResult.materialId,
    varianceType: prismaResult.varianceType,
    plannedCost: Number(prismaResult.plannedCost),
    actualCost: Number(prismaResult.actualCost),
    variance: Number(prismaResult.variance),
    variancePercent: Number(prismaResult.variancePercent),
    explanation: prismaResult.explanation,
    investigatedBy: prismaResult.investigatedBy,
    investigatedAt: prismaResult.investigatedAt,
    resolution: prismaResult.resolution,
    resolvedAt: prismaResult.resolvedAt,
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
      sku: prismaResult.material.sku
    } : undefined,
    investigator: prismaResult.investigator ? {
      id: prismaResult.investigator.id,
      email: prismaResult.investigator.email,
      profile: prismaResult.investigator.profile ? {
        firstName: prismaResult.investigator.profile.firstName,
        lastName: prismaResult.investigator.profile.lastName
      } : undefined
    } : undefined
  }
}

/**
 * Calculate variance percentage
 */
function calculateVariancePercent(planned: number, actual: number): number {
  if (planned === 0) return actual === 0 ? 0 : 100
  return ((actual - planned) / planned) * 100
}

/**
 * Determine variance significance level
 */
function getVarianceSignificance(variancePercent: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const absPercent = Math.abs(variancePercent)
  if (absPercent < 5) return 'LOW'
  if (absPercent < 15) return 'MEDIUM'
  if (absPercent < 30) return 'HIGH'
  return 'CRITICAL'
}

// ==============================================
// COST VARIANCE CALCULATION FUNCTIONS
// ==============================================

/**
 * Calculate material price variance for a specific material receipt
 */
export async function calculateMaterialPriceVariance(data: {
  materialId: string
  plannedUnitCost: number
  actualUnitCost: number
  quantity: number
  referenceId?: string
  referenceType?: string
  explanation?: string
}): Promise<MRPActionResponse<CostVariance>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId },
      include: { unitOfMeasure: true }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    const plannedCost = data.plannedUnitCost * data.quantity
    const actualCost = data.actualUnitCost * data.quantity
    const variance = actualCost - plannedCost
    const variancePercent = calculateVariancePercent(plannedCost, actualCost)

    // Only create variance record if there's a significant difference
    if (Math.abs(variancePercent) < 1) {
      return {
        success: true,
        message: 'No significant price variance detected'
      }
    }

    const costVariance = await prisma.costVariance.create({
      data: {
        productionOrderId: '',  // Temporary empty string for material-only variances
        materialId: data.materialId,
        varianceType: VarianceType.MATERIAL_PRICE,
        plannedCost: plannedCost,
        actualCost: actualCost,
        variance: variance,
        variancePercent: variancePercent,
        explanation: data.explanation || `Material price variance: Planned $${data.plannedUnitCost}/unit, Actual $${data.actualUnitCost}/unit`,
        createdAt: new Date()
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: convertCostVariance(costVariance),
      message: `Material price variance recorded: ${variance > 0 ? '+' : ''}$${variance.toFixed(2)} (${variancePercent.toFixed(1)}%)`
    }

  } catch (error) {
    console.error('Error calculating material price variance:', error)
    return {
      success: false,
      error: 'Failed to calculate material price variance'
    }
  }
}

/**
 * Calculate material usage variance for production consumption
 */
export async function calculateMaterialUsageVariance(data: {
  productionOrderId: string
  materialId: string
  plannedQuantity: number
  actualQuantity: number
  unitCost: number
  explanation?: string
}): Promise<MRPActionResponse<CostVariance>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate production order and material exist
    const [productionOrder, material] = await Promise.all([
      prisma.productionOrder.findUnique({
        where: { id: data.productionOrderId },
        include: { product: true }
      }),
      prisma.material.findUnique({
        where: { id: data.materialId }
      })
    ])

    if (!productionOrder) {
      return { success: false, error: 'Production order not found' }
    }

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    const plannedCost = data.plannedQuantity * data.unitCost
    const actualCost = data.actualQuantity * data.unitCost
    const variance = actualCost - plannedCost
    const variancePercent = calculateVariancePercent(plannedCost, actualCost)

    // Only create variance record if there's a significant difference
    if (Math.abs(variancePercent) < 2) {
      return {
        success: true,
        message: 'No significant usage variance detected'
      }
    }

    const costVariance = await prisma.costVariance.create({
      data: {
        productionOrderId: data.productionOrderId,
        materialId: data.materialId,
        varianceType: VarianceType.MATERIAL_USAGE,
        plannedCost: plannedCost,
        actualCost: actualCost,
        variance: variance,
        variancePercent: variancePercent,
        explanation: data.explanation || `Material usage variance: Planned ${data.plannedQuantity} units, Actual ${data.actualQuantity} units`,
        createdAt: new Date()
      },
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
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    })

    revalidatePath('/admin/production')
    revalidatePath(`/admin/production/${data.productionOrderId}`)
    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: convertCostVariance(costVariance),
      message: `Material usage variance recorded: ${variance > 0 ? '+' : ''}$${variance.toFixed(2)} (${variancePercent.toFixed(1)}%)`
    }

  } catch (error) {
    console.error('Error calculating material usage variance:', error)
    return {
      success: false,
      error: 'Failed to calculate material usage variance'
    }
  }
}

/**
 * Calculate production order total cost variance
 */
export async function calculateProductionOrderCostVariance(
  productionOrderId: string
): Promise<MRPActionResponse<CostVariance>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get production order with cost details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true
      }
    })

    if (!productionOrder) {
      return { success: false, error: 'Production order not found' }
    }

    const plannedCost = Number(productionOrder.plannedMaterialCost)
    const actualCost = Number(productionOrder.actualMaterialCost)
    const variance = actualCost - plannedCost
    const variancePercent = calculateVariancePercent(plannedCost, actualCost)

    // Only create variance record if there's a significant difference
    if (Math.abs(variancePercent) < 3) {
      return {
        success: true,
        message: 'No significant total cost variance detected'
      }
    }

    const costVariance = await prisma.costVariance.create({
      data: {
        productionOrderId: productionOrderId,
        varianceType: VarianceType.TOTAL_COST,
        plannedCost: plannedCost,
        actualCost: actualCost,
        variance: variance,
        variancePercent: variancePercent,
        explanation: `Production order total cost variance: Planned $${plannedCost.toFixed(2)}, Actual $${actualCost.toFixed(2)}`,
        createdAt: new Date()
      },
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

    revalidatePath('/admin/production')
    revalidatePath(`/admin/production/${productionOrderId}`)

    return {
      success: true,
      data: convertCostVariance(costVariance),
      message: `Production cost variance recorded: ${variance > 0 ? '+' : ''}$${variance.toFixed(2)} (${variancePercent.toFixed(1)}%)`
    }

  } catch (error) {
    console.error('Error calculating production order cost variance:', error)
    return {
      success: false,
      error: 'Failed to calculate production order cost variance'
    }
  }
}

/**
 * Calculate product standard cost variance based on BOM vs actual production costs
 */
export async function calculateProductStandardCostVariance(data: {
  productId: string
  productionOrderId: string
  actualQuantityProduced: number
  explanation?: string
}): Promise<MRPActionResponse<CostVariance[]>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get product with BOM and production order details
    const [product, productionOrder, bom] = await Promise.all([
      prisma.product.findUnique({
        where: { id: data.productId }
      }),
      prisma.productionOrder.findUnique({
        where: { id: data.productionOrderId }
      }),
      getBOMForProduct(data.productId)
    ])

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    if (!productionOrder) {
      return { success: false, error: 'Production order not found' }
    }

    if (!bom || !bom.entries || bom.entries.length === 0) {
      return { success: false, error: 'No BOM found for product' }
    }

    // Calculate standard cost based on BOM
    const standardMaterialCost = bom.entries.reduce((total: number, item) => {
      return total + (item.quantityNeeded * item.costPerUnit * data.actualQuantityProduced)
    }, 0)

    const actualMaterialCost = Number(productionOrder.actualMaterialCost)
    const variance = actualMaterialCost - standardMaterialCost
    const variancePercent = calculateVariancePercent(standardMaterialCost, actualMaterialCost)

    // Only create variance record if there's a significant difference
    if (Math.abs(variancePercent) < 5) {
      return {
        success: true,
        data: [],
        message: 'No significant product standard cost variance detected'
      }
    }

    const costVariance = await prisma.costVariance.create({
      data: {
        productionOrderId: data.productionOrderId,
        varianceType: VarianceType.MATERIAL_USAGE,
        plannedCost: standardMaterialCost,
        actualCost: actualMaterialCost,
        variance: variance,
        variancePercent: variancePercent,
        explanation: data.explanation || `Product standard cost variance for ${product.name}: Standard $${standardMaterialCost.toFixed(2)}, Actual $${actualMaterialCost.toFixed(2)}`,
        createdAt: new Date()
      },
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

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${data.productId}`)
    revalidatePath('/admin/production')
    revalidatePath(`/admin/production/${data.productionOrderId}`)

    return {
      success: true,
      data: [convertCostVariance(costVariance)],
      message: `Product standard cost variance recorded: ${variance > 0 ? '+' : ''}$${variance.toFixed(2)} (${variancePercent.toFixed(1)}%)`
    }

  } catch (error) {
    console.error('Error calculating product standard cost variance:', error)
    return {
      success: false,
      error: 'Failed to calculate product standard cost variance'
    }
  }
}

// ==============================================
// COST VARIANCE QUERY FUNCTIONS
// ==============================================

/**
 * Get cost variances with comprehensive filtering and pagination
 */
export async function getCostVariances(
  filters?: CostVarianceFilters,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedMRPResponse<CostVariance>> {
  try {
    const whereClause: any = {}

    if (filters?.varianceType && filters.varianceType.length > 0) {
      whereClause.varianceType = { in: filters.varianceType }
    }

    if (filters?.productionOrderId) {
      whereClause.productionOrderId = filters.productionOrderId
    }

    if (filters?.materialId) {
      whereClause.materialId = filters.materialId
    }

    if (filters?.varianceThreshold) {
      whereClause.OR = [
        { variance: { gte: filters.varianceThreshold } },
        { variance: { lte: -filters.varianceThreshold } }
      ]
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.createdAt = {}
      if (filters.dateFrom) {
        whereClause.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        whereClause.createdAt.lte = filters.dateTo
      }
    }

    const skip = (page - 1) * limit

    const [variances, total] = await Promise.all([
      prisma.costVariance.findMany({
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
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          investigator: {
            select: {
              id: true,
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
        },
        skip,
        take: limit
      }),
      prisma.costVariance.count({
        where: whereClause
      })
    ])

    return {
      data: variances.map(convertCostVariance),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error('Error fetching cost variances:', error)
    throw new Error('Failed to fetch cost variances')
  }
}

/**
 * Get cost variances for a specific production order
 */
export async function getProductionOrderCostVariances(productionOrderId: string): Promise<CostVariance[]> {
  try {
    const variances = await prisma.costVariance.findMany({
      where: { productionOrderId },
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
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return variances.map(convertCostVariance)
  } catch (error) {
    console.error('Error fetching production order cost variances:', error)
    throw new Error('Failed to fetch production order cost variances')
  }
}

/**
 * Get cost variances for a specific material
 */
export async function getMaterialCostVariances(materialId: string): Promise<CostVariance[]> {
  try {
    const variances = await prisma.costVariance.findMany({
      where: { materialId },
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
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return variances.map(convertCostVariance)
  } catch (error) {
    console.error('Error fetching material cost variances:', error)
    throw new Error('Failed to fetch material cost variances')
  }
}

// ==============================================
// VARIANCE INVESTIGATION FUNCTIONS
// ==============================================

/**
 * Start investigation of a cost variance
 */
export async function investigateCostVariance(data: {
  varianceId: string
  explanation?: string
}): Promise<MRPActionResponse<CostVariance>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const variance = await prisma.costVariance.update({
      where: { id: data.varianceId },
      data: {
        investigatedBy: session.user.id,
        investigatedAt: new Date(),
        explanation: data.explanation
      },
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
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        investigator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: convertCostVariance(variance),
      message: 'Cost variance investigation started'
    }
  } catch (error) {
    console.error('Error starting cost variance investigation:', error)
    return {
      success: false,
      error: 'Failed to start cost variance investigation'
    }
  }
}

/**
 * Resolve a cost variance investigation
 */
export async function resolveCostVariance(data: {
  varianceId: string
  resolution: string
}): Promise<MRPActionResponse<CostVariance>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const variance = await prisma.costVariance.update({
      where: { id: data.varianceId },
      data: {
        resolution: data.resolution,
        resolvedAt: new Date()
      },
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
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        investigator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin/production')
    revalidatePath('/admin/materials')

    return {
      success: true,
      data: convertCostVariance(variance),
      message: 'Cost variance resolved successfully'
    }
  } catch (error) {
    console.error('Error resolving cost variance:', error)
    return {
      success: false,
      error: 'Failed to resolve cost variance'
    }
  }
}

// ==============================================
// ANALYTICS AND REPORTING FUNCTIONS
// ==============================================

/**
 * Get cost variance analytics dashboard data
 */
export async function getCostVarianceAnalytics() {
  try {
    const [
      totalVariances,
      unresolvedVariances,
      variancesByType,
      significantVariances,
      topMaterialVariances,
      varianceTrends
    ] = await Promise.all([
      // Total variances count
      prisma.costVariance.count(),
      
      // Unresolved variances count
      prisma.costVariance.count({
        where: {
          resolvedAt: null
        }
      }),
      
      // Variances by type (last 30 days)
      prisma.costVariance.groupBy({
        by: ['varianceType'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          id: true
        },
        _sum: {
          variance: true
        }
      }),
      
      // Significant variances (>15% or >$100)
      prisma.costVariance.count({
        where: {
          OR: [
            { variancePercent: { gte: 15 } },
            { variancePercent: { lte: -15 } },
            { variance: { gte: 100 } },
            { variance: { lte: -100 } }
          ]
        }
      }),
      
      // Top materials by variance impact
      prisma.costVariance.groupBy({
        by: ['materialId'],
        where: {
          materialId: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          variance: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            variance: 'desc'
          }
        },
        take: 10
      }),
      
      // Variance trends (last 6 months, by month)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as variance_count,
          SUM("variance") as total_variance
        FROM "CostVariance" 
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `
    ])

    // Get material details for top variance materials
    const topMaterialsWithDetails = await Promise.all(
      topMaterialVariances.map(async (item) => {
        if (!item.materialId) return null
        const material = await prisma.material.findUnique({
          where: { id: item.materialId },
          select: {
            id: true,
            name: true,
            sku: true
          }
        })
        return {
          ...item,
          material
        }
      })
    )

    return {
      totalVariances,
      unresolvedVariances,
      significantVariances,
      variancesByType: variancesByType.map(item => ({
        varianceType: item.varianceType,
        count: item._count.id,
        totalVariance: Number(item._sum.variance || 0)
      })),
      topMaterialVariances: topMaterialsWithDetails.filter((item): item is NonNullable<typeof item> => item !== null).map(item => ({
        materialId: item.materialId,
        material: item.material,
        totalVariance: Number(item._sum.variance || 0),
        varianceCount: item._count.id
      })),
      varianceTrends: (varianceTrends as Array<{month: Date, variance_count: bigint, total_variance: number}>).map((trend) => ({
        month: trend.month,
        varianceCount: Number(trend.variance_count),
        totalVariance: Number(trend.total_variance)
      }))
    }
  } catch (error) {
    console.error('Error fetching cost variance analytics:', error)
    throw new Error('Failed to fetch cost variance analytics')
  }
}

/**
 * Get production cost summary with variance analysis
 */
export async function getProductionCostSummary(productionOrderId: string): Promise<ProductionCostSummary> {
  try {
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        costVariances: true
      }
    })

    if (!productionOrder) {
      throw new Error('Production order not found')
    }

    const plannedMaterialCost = Number(productionOrder.plannedMaterialCost)
    const actualMaterialCost = Number(productionOrder.actualMaterialCost)
    const materialVariance = Number(productionOrder.materialVariance)
    const materialVariancePercent = plannedMaterialCost > 0 
      ? (materialVariance / plannedMaterialCost) * 100 
      : 0

    // For now, we'll use placeholder values for labor and overhead costs
    // These would be enhanced in future iterations
    const plannedLaborCost = 0
    const actualLaborCost = 0
    const laborVariance = 0

    const totalPlannedCost = plannedMaterialCost + plannedLaborCost
    const totalActualCost = actualMaterialCost + actualLaborCost
    const totalVariance = totalActualCost - totalPlannedCost

    return {
      productionOrderId,
      plannedMaterialCost,
      actualMaterialCost,
      materialVariance,
      materialVariancePercent,
      plannedLaborCost,
      actualLaborCost,
      laborVariance,
      totalPlannedCost,
      totalActualCost,
      totalVariance
    }
  } catch (error) {
    console.error('Error fetching production cost summary:', error)
    throw new Error('Failed to fetch production cost summary')
  }
}

/**
 * Get material cost performance analysis
 */
export async function getMaterialCostPerformance(materialId: string, days: number = 90) {
  try {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [material, priceVariances, usageVariances, recentReceipts] = await Promise.all([
      prisma.material.findUnique({
        where: { id: materialId },
        include: {
          unitOfMeasure: true,
          supplier: true
        }
      }),
      
      prisma.costVariance.findMany({
        where: {
          materialId,
          varianceType: VarianceType.MATERIAL_PRICE,
          createdAt: { gte: fromDate }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.costVariance.findMany({
        where: {
          materialId,
          varianceType: VarianceType.MATERIAL_USAGE,
          createdAt: { gte: fromDate }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.inventoryMovement.findMany({
        where: {
          materialId,
          movementType: MovementType.MATERIAL_RECEIPT,
          transactionDate: { gte: fromDate }
        },
        orderBy: { transactionDate: 'desc' },
        take: 10
      })
    ])

    if (!material) {
      throw new Error('Material not found')
    }

    // Calculate performance metrics
    const totalPriceVariance = priceVariances.reduce((sum, v) => sum + Number(v.variance), 0)
    const totalUsageVariance = usageVariances.reduce((sum, v) => sum + Number(v.variance), 0)
    const averagePriceVariancePercent = priceVariances.length > 0 
      ? priceVariances.reduce((sum, v) => sum + Number(v.variancePercent), 0) / priceVariances.length 
      : 0

    // Cost trend analysis from recent receipts
    const costTrend = recentReceipts.map(receipt => ({
      date: receipt.transactionDate,
      unitCost: Number(receipt.unitCost || 0),
      quantity: Number(receipt.quantity)
    }))

    return {
      material: {
        id: material.id,
        name: material.name,
        sku: material.sku,
        currentCostPerUnit: Number(material.costPerUnit),
        unitSymbol: material.unitOfMeasure?.symbol || 'units',
        supplierName: material.supplier?.name
      },
      performanceMetrics: {
        totalPriceVariance,
        totalUsageVariance,
        averagePriceVariancePercent,
        priceVarianceCount: priceVariances.length,
        usageVarianceCount: usageVariances.length
      },
      costTrend,
      recentVariances: {
        priceVariances: priceVariances.map(convertCostVariance),
        usageVariances: usageVariances.map(convertCostVariance)
      }
    }
  } catch (error) {
    console.error('Error fetching material cost performance:', error)
    throw new Error('Failed to fetch material cost performance')
  }
}

/**
 * Get product profitability analysis with cost variance impact
 */
export async function getProductProfitabilityAnalysis(productId: string, days: number = 90) {
  try {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [product, productionOrders, bom] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId }
      }),
      
      prisma.productionOrder.findMany({
        where: {
          productId,
          createdAt: { gte: fromDate }
        },
        include: {
          costVariances: true
        }
      }),
      
      getBOMForProduct(productId)
    ])

    if (!product) {
      throw new Error('Product not found')
    }

    // Calculate standard cost from BOM
    const standardMaterialCost = bom?.entries?.reduce((total: number, item) => {
      return total + (item.quantityNeeded * item.costPerUnit)
    }, 0) || 0

    // Analyze production orders
    const productionAnalysis = productionOrders.map(order => {
      const plannedCost = Number(order.plannedMaterialCost)
      const actualCost = Number(order.actualMaterialCost)
      const variance = actualCost - plannedCost
      const variancePercent = plannedCost > 0 ? (variance / plannedCost) * 100 : 0

      return {
        orderId: order.id,
        quantity: order.quantity,
        plannedCost,
        actualCost,
        variance,
        variancePercent,
        costVarianceCount: order.costVariances.length
      }
    })

    // Calculate totals
    const totalQuantityProduced = productionOrders.reduce((sum, order) => sum + order.quantity, 0)
    const totalPlannedCost = productionOrders.reduce((sum, order) => sum + Number(order.plannedMaterialCost), 0)
    const totalActualCost = productionOrders.reduce((sum, order) => sum + Number(order.actualMaterialCost), 0)
    const totalVariance = totalActualCost - totalPlannedCost

    const averagePlannedCostPerUnit = totalQuantityProduced > 0 ? totalPlannedCost / totalQuantityProduced : 0
    const averageActualCostPerUnit = totalQuantityProduced > 0 ? totalActualCost / totalQuantityProduced : 0

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      standardCost: {
        materialCost: standardMaterialCost,
        totalCost: standardMaterialCost // For now, only material costs
      },
      productionSummary: {
        totalOrders: productionOrders.length,
        totalQuantityProduced,
        averagePlannedCostPerUnit,
        averageActualCostPerUnit,
        totalPlannedCost,
        totalActualCost,
        totalVariance,
        averageVariancePercent: totalPlannedCost > 0 ? (totalVariance / totalPlannedCost) * 100 : 0
      },
      productionAnalysis
    }
  } catch (error) {
    console.error('Error fetching product profitability analysis:', error)
    throw new Error('Failed to fetch product profitability analysis')
  }
} 