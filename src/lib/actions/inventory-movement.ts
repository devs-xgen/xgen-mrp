'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MovementType, Status } from "@prisma/client"
import { 
  InventoryMovement,
  InventoryMovementInput,
  InventoryMovementFilters,
  MRPActionResponse,
  PaginatedMRPResponse
} from "@/types/admin/mrp"
import { Decimal } from "@prisma/client/runtime/library"

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Convert Prisma inventory movement result to typed interface
 */
function convertInventoryMovement(prismaResult: any): InventoryMovement {
  return {
    id: prismaResult.id,
    materialId: prismaResult.materialId,
    productId: prismaResult.productId,
    movementType: prismaResult.movementType,
    quantity: Number(prismaResult.quantity),
    previousStock: Number(prismaResult.previousStock),
    newStock: Number(prismaResult.newStock),
    unitCost: prismaResult.unitCost ? Number(prismaResult.unitCost) : null,
    totalValue: prismaResult.totalValue ? Number(prismaResult.totalValue) : null,
    referenceId: prismaResult.referenceId,
    referenceType: prismaResult.referenceType,
    locationFrom: prismaResult.locationFrom,
    locationTo: prismaResult.locationTo,
    performedBy: prismaResult.performedBy,
    approvedBy: prismaResult.approvedBy,
    transactionDate: prismaResult.transactionDate,
    notes: prismaResult.notes,
    batchNumber: prismaResult.batchNumber,
    lotNumber: prismaResult.lotNumber,
    createdAt: prismaResult.createdAt,
    updatedAt: prismaResult.updatedAt,
    
    // Relations
    material: prismaResult.material ? {
      id: prismaResult.material.id,
      name: prismaResult.material.name,
      sku: prismaResult.material.sku
    } : undefined,
    product: prismaResult.product ? {
      id: prismaResult.product.id,
      name: prismaResult.product.name,
      sku: prismaResult.product.sku
    } : undefined,
    performedByUser: prismaResult.performedByUser ? {
      id: prismaResult.performedByUser.id,
      email: prismaResult.performedByUser.email,
      profile: prismaResult.performedByUser.profile ? {
        firstName: prismaResult.performedByUser.profile.firstName,
        lastName: prismaResult.performedByUser.profile.lastName
      } : undefined
    } : undefined,
    approvedByUser: prismaResult.approvedByUser ? {
      id: prismaResult.approvedByUser.id,
      email: prismaResult.approvedByUser.email,
      profile: prismaResult.approvedByUser.profile ? {
        firstName: prismaResult.approvedByUser.profile.firstName,
        lastName: prismaResult.approvedByUser.profile.lastName
      } : undefined
    } : undefined
  }
}

/**
 * Validate movement type and entity requirements
 */
function validateMovementRequirements(movementType: MovementType, materialId?: string, productId?: string): boolean {
  const materialMovements = [
    'MATERIAL_RESERVATION', 'MATERIAL_CONSUMPTION', 'MATERIAL_RETURN',
    'MATERIAL_RECEIPT', 'MATERIAL_TRANSFER', 'MATERIAL_ADJUSTMENT', 'MATERIAL_WASTE'
  ]
  
  const productMovements = [
    'PRODUCTION_COMPLETE', 'PRODUCT_SHIPMENT', 'PRODUCT_RETURN',
    'PRODUCT_ADJUSTMENT', 'PRODUCT_TRANSFER'
  ]

  const otherMovements = ['CYCLE_COUNT', 'DAMAGE_WRITE_OFF', 'EXPIRY_WRITE_OFF']

  if (materialMovements.includes(movementType)) {
    return !!materialId
  }
  
  if (productMovements.includes(movementType)) {
    return !!productId
  }
  
  if (otherMovements.includes(movementType)) {
    return !!(materialId || productId)
  }
  
  return false
}

// ==============================================
// INVENTORY MOVEMENT QUERY FUNCTIONS
// ==============================================

/**
 * Get inventory movements with comprehensive filtering and pagination
 */
export async function getInventoryMovements(
  filters?: InventoryMovementFilters,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedMRPResponse<InventoryMovement>> {
  try {
    const whereClause: any = {}

    if (filters?.movementType && filters.movementType.length > 0) {
      whereClause.movementType = { in: filters.movementType }
    }

    if (filters?.materialId) {
      whereClause.materialId = filters.materialId
    }

    if (filters?.productId) {
      whereClause.productId = filters.productId
    }

    if (filters?.performedBy) {
      whereClause.performedBy = filters.performedBy
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.transactionDate = {}
      if (filters.dateFrom) {
        whereClause.transactionDate.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        whereClause.transactionDate.lte = filters.dateTo
      }
    }

    const skip = (page - 1) * limit

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where: whereClause,
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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
          },
          approvedByUser: {
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
          transactionDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.inventoryMovement.count({
        where: whereClause
      })
    ])

    return {
      data: movements.map(convertInventoryMovement),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error('Error fetching inventory movements:', error)
    throw new Error('Failed to fetch inventory movements')
  }
}

/**
 * Get inventory movements for a specific material
 */
export async function getMaterialMovementHistory(
  materialId: string,
  limit: number = 100
): Promise<InventoryMovement[]> {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: { materialId },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        performedByUser: {
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
        },
        approvedByUser: {
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
        transactionDate: 'desc'
      },
      take: limit
    })

    return movements.map(convertInventoryMovement)
  } catch (error) {
    console.error('Error fetching material movement history:', error)
    throw new Error('Failed to fetch material movement history')
  }
}

/**
 * Get inventory movements for a specific product
 */
export async function getProductMovementHistory(
  productId: string,
  limit: number = 100
): Promise<InventoryMovement[]> {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        performedByUser: {
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
        },
        approvedByUser: {
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
        transactionDate: 'desc'
      },
      take: limit
    })

    return movements.map(convertInventoryMovement)
  } catch (error) {
    console.error('Error fetching product movement history:', error)
    throw new Error('Failed to fetch product movement history')
  }
}

// ==============================================
// MATERIAL ADJUSTMENT FUNCTIONS
// ==============================================

/**
 * Perform manual material stock adjustment
 */
export async function adjustMaterialStock(data: {
  materialId: string
  adjustmentQuantity: number // Positive for increase, negative for decrease
  unitCost?: number
  reason: string
  notes?: string
  batchNumber?: string
  lotNumber?: string
  requireApproval?: boolean
}): Promise<MRPActionResponse<InventoryMovement>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
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

    // Validate adjustment doesn't result in negative stock
    const newStock = material.currentStock + data.adjustmentQuantity
    if (newStock < 0) {
      return { 
        success: false, 
        error: `Adjustment would result in negative stock. Current: ${material.currentStock}, Adjustment: ${data.adjustmentQuantity}` 
      }
    }

    // Calculate cost information
    const unitCost = data.unitCost || Number(material.costPerUnit)
    const totalValue = Math.abs(data.adjustmentQuantity) * unitCost

    // Start transaction to update stock and record movement
    const result = await prisma.$transaction(async (tx) => {
      // Update material stock
      await tx.material.update({
        where: { id: data.materialId },
        data: {
          currentStock: newStock,
          ...(data.unitCost && { costPerUnit: data.unitCost })
        }
      })

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.MATERIAL_ADJUSTMENT,
          quantity: Math.abs(data.adjustmentQuantity),
          previousStock: material.currentStock,
          newStock: newStock,
          unitCost: unitCost,
          totalValue: data.adjustmentQuantity > 0 ? totalValue : -totalValue,
          performedBy: session.user.id,
          approvedBy: data.requireApproval ? null : session.user.id,
          transactionDate: new Date(),
          notes: `${data.reason}${data.notes ? ` - ${data.notes}` : ''}`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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

      return convertInventoryMovement(movement)
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: result,
      message: `Material stock ${data.adjustmentQuantity > 0 ? 'increased' : 'decreased'} by ${Math.abs(data.adjustmentQuantity)} units. New stock: ${newStock}`
    }

  } catch (error) {
    console.error('Error adjusting material stock:', error)
    return {
      success: false,
      error: 'Failed to adjust material stock'
    }
  }
}

/**
 * Perform material transfer between locations
 */
export async function transferMaterial(data: {
  materialId: string
  quantity: number
  fromLocation: string
  toLocation: string
  unitCost?: number
  notes?: string
  batchNumber?: string
  lotNumber?: string
}): Promise<MRPActionResponse<InventoryMovement[]>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (data.quantity <= 0) {
      return { success: false, error: 'Transfer quantity must be positive' }
    }

    // Validate material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    // Validate sufficient stock for transfer
    if (material.currentStock < data.quantity) {
      return { 
        success: false, 
        error: `Insufficient stock for transfer. Available: ${material.currentStock}, Required: ${data.quantity}` 
      }
    }

    const unitCost = data.unitCost || Number(material.costPerUnit)
    const totalValue = data.quantity * unitCost

    // Create transfer movements (out from source, in to destination)
    const result = await prisma.$transaction(async (tx) => {
      // Movement out from source location
      const outMovement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.MATERIAL_TRANSFER,
          quantity: -data.quantity, // Negative for outbound
          previousStock: material.currentStock,
          newStock: material.currentStock, // No actual stock change in total
          unitCost: unitCost,
          totalValue: -totalValue,
          locationFrom: data.fromLocation,
          locationTo: data.toLocation,
          performedBy: session.user.id,
          approvedBy: session.user.id,
          transactionDate: new Date(),
          notes: `Transfer from ${data.fromLocation} to ${data.toLocation}${data.notes ? ` - ${data.notes}` : ''}`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        },
        include: {
          material: { select: { id: true, name: true, sku: true } },
          performedByUser: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } }
            }
          }
        }
      })

      // Movement in to destination location
      const inMovement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.MATERIAL_TRANSFER,
          quantity: data.quantity, // Positive for inbound
          previousStock: material.currentStock,
          newStock: material.currentStock, // No actual stock change in total
          unitCost: unitCost,
          totalValue: totalValue,
          locationFrom: data.fromLocation,
          locationTo: data.toLocation,
          performedBy: session.user.id,
          approvedBy: session.user.id,
          transactionDate: new Date(),
          notes: `Transfer receipt from ${data.fromLocation} to ${data.toLocation}${data.notes ? ` - ${data.notes}` : ''}`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        },
        include: {
          material: { select: { id: true, name: true, sku: true } },
          performedByUser: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } }
            }
          }
        }
      })

      return [convertInventoryMovement(outMovement), convertInventoryMovement(inMovement)]
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: result,
      message: `Successfully transferred ${data.quantity} units from ${data.fromLocation} to ${data.toLocation}`
    }

  } catch (error) {
    console.error('Error transferring material:', error)
    return {
      success: false,
      error: 'Failed to transfer material'
    }
  }
}

// ==============================================
// MATERIAL RECEIPT FUNCTIONS
// ==============================================

/**
 * Record material receipt from supplier
 */
export async function receiveMaterialFromSupplier(data: {
  materialId: string
  quantity: number
  unitCost: number
  supplierReference?: string
  purchaseOrderId?: string
  batchNumber?: string
  lotNumber?: string
  expiryDate?: Date
  notes?: string
}): Promise<MRPActionResponse<InventoryMovement>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (data.quantity <= 0) {
      return { success: false, error: 'Receipt quantity must be positive' }
    }

    if (data.unitCost < 0) {
      return { success: false, error: 'Unit cost must be non-negative' }
    }

    // Validate material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId },
      include: {
        supplier: true,
        unitOfMeasure: true
      }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    const newStock = material.currentStock + data.quantity
    const totalValue = data.quantity * data.unitCost

    // Calculate weighted average cost
    const totalCurrentValue = material.currentStock * Number(material.costPerUnit)
    const newWeightedAverageCost = newStock > 0 
      ? (totalCurrentValue + totalValue) / newStock 
      : data.unitCost

    // Start transaction to update stock and record receipt
    const result = await prisma.$transaction(async (tx) => {
      // Update material stock and cost
      await tx.material.update({
        where: { id: data.materialId },
        data: {
          currentStock: newStock,
          costPerUnit: newWeightedAverageCost
        }
      })

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.MATERIAL_RECEIPT,
          quantity: data.quantity,
          previousStock: material.currentStock,
          newStock: newStock,
          unitCost: data.unitCost,
          totalValue: totalValue,
          referenceId: data.purchaseOrderId,
          referenceType: data.purchaseOrderId ? 'PurchaseOrder' : undefined,
          performedBy: session.user.id,
          approvedBy: session.user.id,
          transactionDate: new Date(),
          notes: `Material receipt from supplier${data.supplierReference ? ` (Ref: ${data.supplierReference})` : ''}${data.notes ? ` - ${data.notes}` : ''}`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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

      return convertInventoryMovement(movement)
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)
    if (data.purchaseOrderId) {
      revalidatePath(`/admin/purchase-orders/${data.purchaseOrderId}`)
    }

    return {
      success: true,
      data: result,
      message: `Successfully received ${data.quantity} units. New stock: ${newStock}, New average cost: $${newWeightedAverageCost.toFixed(4)}`
    }

  } catch (error) {
    console.error('Error receiving material:', error)
    return {
      success: false,
      error: 'Failed to record material receipt'
    }
  }
}

// ==============================================
// MATERIAL RETURN FUNCTIONS
// ==============================================

/**
 * Record material return to stock (from production or other use)
 */
export async function returnMaterialToStock(data: {
  materialId: string
  quantity: number
  returnReason: string
  sourceReference?: string
  sourceType?: string
  unitCost?: number
  notes?: string
  batchNumber?: string
  lotNumber?: string
}): Promise<MRPActionResponse<InventoryMovement>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (data.quantity <= 0) {
      return { success: false, error: 'Return quantity must be positive' }
    }

    // Validate material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    const newStock = material.currentStock + data.quantity
    const unitCost = data.unitCost || Number(material.costPerUnit)
    const totalValue = data.quantity * unitCost

    // Start transaction to update stock and record return
    const result = await prisma.$transaction(async (tx) => {
      // Update material stock
      await tx.material.update({
        where: { id: data.materialId },
        data: {
          currentStock: newStock
        }
      })

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.MATERIAL_RETURN,
          quantity: data.quantity,
          previousStock: material.currentStock,
          newStock: newStock,
          unitCost: unitCost,
          totalValue: totalValue,
          referenceId: data.sourceReference,
          referenceType: data.sourceType,
          performedBy: session.user.id,
          approvedBy: session.user.id,
          transactionDate: new Date(),
          notes: `Material return - ${data.returnReason}${data.notes ? ` - ${data.notes}` : ''}`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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

      return convertInventoryMovement(movement)
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: result,
      message: `Successfully returned ${data.quantity} units to stock. New stock: ${newStock}`
    }

  } catch (error) {
    console.error('Error returning material to stock:', error)
    return {
      success: false,
      error: 'Failed to record material return'
    }
  }
}

// ==============================================
// WRITE-OFF FUNCTIONS
// ==============================================

/**
 * Write off damaged material
 */
export async function writeOffDamagedMaterial(data: {
  materialId: string
  quantity: number
  damageReason: string
  notes?: string
  batchNumber?: string
  lotNumber?: string
}): Promise<MRPActionResponse<InventoryMovement>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (data.quantity <= 0) {
      return { success: false, error: 'Write-off quantity must be positive' }
    }

    // Validate material exists and has sufficient stock
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    if (material.currentStock < data.quantity) {
      return { 
        success: false, 
        error: `Insufficient stock for write-off. Available: ${material.currentStock}, Required: ${data.quantity}` 
      }
    }

    const newStock = material.currentStock - data.quantity
    const unitCost = Number(material.costPerUnit)
    const totalValue = data.quantity * unitCost

    // Start transaction to update stock and record write-off
    const result = await prisma.$transaction(async (tx) => {
      // Update material stock
      await tx.material.update({
        where: { id: data.materialId },
        data: {
          currentStock: newStock
        }
      })

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.DAMAGE_WRITE_OFF,
          quantity: data.quantity,
          previousStock: material.currentStock,
          newStock: newStock,
          unitCost: unitCost,
          totalValue: -totalValue, // Negative because it's a loss
          performedBy: session.user.id,
          approvedBy: session.user.id,
          transactionDate: new Date(),
          notes: `Damage write-off: ${data.damageReason}${data.notes ? ` - ${data.notes}` : ''}`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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

      return convertInventoryMovement(movement)
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: result,
      message: `Successfully wrote off ${data.quantity} units due to damage. New stock: ${newStock}, Loss value: $${totalValue.toFixed(2)}`
    }

  } catch (error) {
    console.error('Error writing off damaged material:', error)
    return {
      success: false,
      error: 'Failed to write off damaged material'
    }
  }
}

/**
 * Write off expired material
 */
export async function writeOffExpiredMaterial(data: {
  materialId: string
  quantity: number
  expiryDate: Date
  notes?: string
  batchNumber?: string
  lotNumber?: string
}): Promise<MRPActionResponse<InventoryMovement>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (data.quantity <= 0) {
      return { success: false, error: 'Write-off quantity must be positive' }
    }

    // Validate material exists and has sufficient stock
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    if (material.currentStock < data.quantity) {
      return { 
        success: false, 
        error: `Insufficient stock for write-off. Available: ${material.currentStock}, Required: ${data.quantity}` 
      }
    }

    const newStock = material.currentStock - data.quantity
    const unitCost = Number(material.costPerUnit)
    const totalValue = data.quantity * unitCost

    // Start transaction to update stock and record write-off
    const result = await prisma.$transaction(async (tx) => {
      // Update material stock
      await tx.material.update({
        where: { id: data.materialId },
        data: {
          currentStock: newStock
        }
      })

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.EXPIRY_WRITE_OFF,
          quantity: data.quantity,
          previousStock: material.currentStock,
          newStock: newStock,
          unitCost: unitCost,
          totalValue: -totalValue, // Negative because it's a loss
          performedBy: session.user.id,
          approvedBy: session.user.id,
          transactionDate: new Date(),
          notes: `Expiry write-off (Expired: ${data.expiryDate.toDateString()})${data.notes ? ` - ${data.notes}` : ''}`,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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

      return convertInventoryMovement(movement)
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: result,
      message: `Successfully wrote off ${data.quantity} expired units. New stock: ${newStock}, Loss value: $${totalValue.toFixed(2)}`
    }

  } catch (error) {
    console.error('Error writing off expired material:', error)
    return {
      success: false,
      error: 'Failed to write off expired material'
    }
  }
}

// ==============================================
// CYCLE COUNT FUNCTIONS
// ==============================================

/**
 * Perform cycle count adjustment
 */
export async function performCycleCount(data: {
  materialId: string
  countedQuantity: number
  countDate?: Date
  countedBy?: string
  notes?: string
}): Promise<MRPActionResponse<InventoryMovement>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (data.countedQuantity < 0) {
      return { success: false, error: 'Counted quantity cannot be negative' }
    }

    // Validate material exists
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    const variance = data.countedQuantity - material.currentStock
    const unitCost = Number(material.costPerUnit)
    const totalValue = Math.abs(variance) * unitCost

    // If no variance, just record the count without stock change
    if (variance === 0) {
      const movement = await prisma.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.CYCLE_COUNT,
          quantity: 0,
          previousStock: material.currentStock,
          newStock: material.currentStock,
          unitCost: unitCost,
          totalValue: 0,
          performedBy: data.countedBy || session.user.id,
          approvedBy: session.user.id,
          transactionDate: data.countDate || new Date(),
          notes: `Cycle count - No variance found${data.notes ? ` - ${data.notes}` : ''}`
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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
        data: convertInventoryMovement(movement),
        message: `Cycle count completed - No variance found`
      }
    }

    // Start transaction to update stock and record adjustment
    const result = await prisma.$transaction(async (tx) => {
      // Update material stock
      await tx.material.update({
        where: { id: data.materialId },
        data: {
          currentStock: data.countedQuantity
        }
      })

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          materialId: data.materialId,
          movementType: MovementType.CYCLE_COUNT,
          quantity: Math.abs(variance),
          previousStock: material.currentStock,
          newStock: data.countedQuantity,
          unitCost: unitCost,
          totalValue: variance > 0 ? totalValue : -totalValue,
          performedBy: data.countedBy || session.user.id,
          approvedBy: session.user.id,
          transactionDate: data.countDate || new Date(),
          notes: `Cycle count adjustment: ${variance > 0 ? 'Increase' : 'Decrease'} of ${Math.abs(variance)} units${data.notes ? ` - ${data.notes}` : ''}`
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          performedByUser: {
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

      return convertInventoryMovement(movement)
    })

    revalidatePath('/admin/materials')
    revalidatePath(`/admin/materials/${data.materialId}`)

    return {
      success: true,
      data: result,
      message: `Cycle count completed. Variance: ${variance} units, Value impact: $${(variance * unitCost).toFixed(2)}`
    }

  } catch (error) {
    console.error('Error performing cycle count:', error)
    return {
      success: false,
      error: 'Failed to perform cycle count'
    }
  }
}

// ==============================================
// ANALYTICS AND REPORTING FUNCTIONS
// ==============================================

/**
 * Get inventory movement analytics dashboard data
 */
export async function getInventoryMovementDashboardData() {
  try {
    const [
      totalMovements,
      todayMovements,
      movementsByType,
      recentMovements,
      topMaterialsByMovement
    ] = await Promise.all([
      // Total movements count
      prisma.inventoryMovement.count(),
      
      // Today's movements count
      prisma.inventoryMovement.count({
        where: {
          transactionDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Movements by type (last 30 days)
      prisma.inventoryMovement.groupBy({
        by: ['movementType'],
        where: {
          transactionDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          id: true
        },
        _sum: {
          totalValue: true
        }
      }),
      
      // Recent movements
      prisma.inventoryMovement.findMany({
        take: 10,
        orderBy: { transactionDate: 'desc' },
        include: {
          material: {
            select: {
              name: true,
              sku: true
            }
          },
          product: {
            select: {
              name: true,
              sku: true
            }
          }
        }
      }),
      
      // Top materials by movement activity
      prisma.inventoryMovement.groupBy({
        by: ['materialId'],
        where: {
          materialId: { not: null },
          transactionDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      })
    ])

    // Get material details for top materials
    const topMaterialsWithDetails = await Promise.all(
      topMaterialsByMovement.map(async (item) => {
        const material = await prisma.material.findUnique({
          where: { id: item.materialId! },
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
      totalMovements,
      todayMovements,
      movementsByType: movementsByType.map(item => ({
        movementType: item.movementType,
        count: item._count.id,
        totalValue: Number(item._sum.totalValue || 0)
      })),
      recentMovements: recentMovements.map(convertInventoryMovement),
      topMaterialsByMovement: topMaterialsWithDetails.map(item => ({
        materialId: item.materialId,
        material: item.material,
        movementCount: item._count.id
      }))
    }
  } catch (error) {
    console.error('Error fetching inventory movement dashboard data:', error)
    throw new Error('Failed to fetch inventory movement dashboard data')
  }
}

/**
 * Get stock level history for a material
 */
export async function getMaterialStockHistory(
  materialId: string,
  days: number = 30
): Promise<Array<{
  date: Date
  stock: number
  movementType: MovementType
  quantity: number
  notes?: string
}>> {
  try {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        materialId,
        transactionDate: {
          gte: fromDate
        }
      },
      orderBy: {
        transactionDate: 'asc'
      },
      select: {
        transactionDate: true,
        newStock: true,
        movementType: true,
        quantity: true,
        notes: true
      }
    })

    return movements.map(movement => ({
      date: movement.transactionDate,
      stock: Number(movement.newStock),
      movementType: movement.movementType,
      quantity: Number(movement.quantity),
      notes: movement.notes || undefined
    }))
  } catch (error) {
    console.error('Error fetching material stock history:', error)
    throw new Error('Failed to fetch material stock history')
  }
}

/**
 * Approve pending inventory movement
 */
export async function approveInventoryMovement(movementId: string): Promise<MRPActionResponse<InventoryMovement>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const movement = await prisma.inventoryMovement.update({
      where: { id: movementId },
      data: {
        approvedBy: session.user.id
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        performedByUser: {
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
        },
        approvedByUser: {
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
      data: convertInventoryMovement(movement),
      message: 'Inventory movement approved successfully'
    }
  } catch (error) {
    console.error('Error approving inventory movement:', error)
    return {
      success: false,
      error: 'Failed to approve inventory movement'
    }
  }
} 