// src/lib/actions/materials.ts
'use server'

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next" // Replace auth import
import { authOptions } from "@/lib/auth" // Import authOptions instead
import { revalidatePath } from "next/cache"
import { Material, MaterialCreateInput, MaterialUpdateInput } from "@/types/admin/materials"
import { Status } from "@prisma/client"

// used in purchase order
export async function getAllMaterials() {
  try {
    const materials = await prisma.material.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        sku: true,
        costPerUnit: true,
        currentStock: true,
        unitOfMeasure: {
          select: {
            symbol: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Safely convert Decimal to number
    return materials.map(material => ({
      ...material,
      costPerUnit: typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit
        ? material.costPerUnit.toNumber()
        : Number(material.costPerUnit)
    }))
  } catch (error) {
    console.error('Error fetching all materials:', error);
    throw new Error('Failed to fetch materials')
  }
}

export async function getAllMaterialTypes() {
  try {
    const materialTypes = await prisma.materialType.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return materialTypes;
  } catch (error) {
    throw new Error('Failed to fetch material types');
  }
}
// was used in purchase order
export async function getAllUnitMeasures() {
  try {
    const unitMeasures = await prisma.unitOfMeasure.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return unitMeasures;
  } catch (error) {
    throw new Error('Failed to fetch unit measures');
  }
}

export async function getMaterials(): Promise<Material[]> {
  try {
    const materials = await prisma.material.findMany({
      include: {
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        unitOfMeasure: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    
    return materials.map(material => ({
      ...material,
      costPerUnit: typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit 
        ? material.costPerUnit.toNumber() 
        : Number(material.costPerUnit)
    })) as Material[]
  } catch (error) {
    throw new Error('Failed to fetch materials')
  }
}

export async function createMaterial(data: MaterialCreateInput) {
  try {
    const costPerUnit = typeof data.costPerUnit === 'string' 
      ? parseFloat(data.costPerUnit) 
      : data.costPerUnit;
    
    if (isNaN(costPerUnit)) {
      throw new Error('Invalid cost per unit value');
    }
    
    const material = await prisma.material.create({
      data: {
        ...data,
        costPerUnit,
        status: 'ACTIVE',
      },
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
      },
    });
    
    const result = {
      ...material,
      costPerUnit: typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit 
        ? material.costPerUnit.toNumber() 
        : Number(material.costPerUnit)
    };
    
    revalidatePath('/admin/materials');
    return result as Material;
  } catch (error) {
    console.error('Error creating material:', error);
    throw new Error(`Failed to create material: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export async function updateMaterial(data: MaterialUpdateInput) {
  try {
    // Get the current user for audit trail
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || "system"

    // Calculate effective stock level with null checking
    // Use nullish coalescing to provide default value of 0 for any undefined values
    const calculatedStock = 
      (data.currentStock ?? 0) + 
      (data.expectedStock ?? 0) - 
      (data.committedStock ?? 0)

    // Extract ID and relation fields
    const { 
      id, 
      typeId, 
      unitOfMeasureId, 
      supplierId,
      ...otherFields 
    } = data
    
    // Prepare the data for update with proper Prisma relation format
    const updateData = {
      ...otherFields,
      calculatedStock, // Use the calculated value
      modifiedBy: userId,
      updatedAt: new Date(),
      // Define relations properly for Prisma
      type: typeId ? {
        connect: { id: typeId }
      } : undefined,
      unitOfMeasure: unitOfMeasureId ? {
        connect: { id: unitOfMeasureId }
      } : undefined,
      supplier: supplierId ? {
        connect: { id: supplierId }
      } : undefined
    }

    // Update the material in the database
    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        type: true,
        unitOfMeasure: true,
        boms: {
          include: {
            product: true,
          },
        },
        purchaseOrderLines: {
          include: {
            purchaseOrder: true,
          },
        },
      },
    })

    // Check for low stock levels and create alerts if necessary
    if (calculatedStock <= (data.minimumStockLevel ?? 0)) {
      await createLowStockAlert({
        materialId: id,
        currentLevel: calculatedStock,
        minimumLevel: data.minimumStockLevel ?? 0,
        createdBy: userId,
      })
    }

    // Revalidate paths
    revalidatePath('/admin/materials')
    revalidatePath('/materials')
    revalidatePath(`/materials/${id}`)
    
    // Return the updated material with converted Decimal to Number
    return {
      ...updatedMaterial,
      costPerUnit: typeof updatedMaterial.costPerUnit === 'object' && 'toNumber' in updatedMaterial.costPerUnit
        ? updatedMaterial.costPerUnit.toNumber()
        : updatedMaterial.costPerUnit
    }
  } catch (error) {
    console.error("Error updating material:", error)
    throw new Error(`Failed to update material: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

async function createLowStockAlert({
  materialId,
  currentLevel,
  minimumLevel,
  createdBy
}: {
  materialId: string
  currentLevel: number
  minimumLevel: number
  createdBy: string
}) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        supplier: true,
        unitOfMeasure: true,
      },
    })

    if (!material) {
      throw new Error("Material not found")
    }

    const suggestedOrderQuantity = Math.max(minimumLevel * 2 - currentLevel, 0)

    console.warn(`LOW STOCK ALERT: Material "${material.name}" (SKU: ${material.sku}) has fallen below minimum stock level. Current: ${currentLevel} ${material.unitOfMeasure?.symbol || 'units'}, Minimum: ${minimumLevel} ${material.unitOfMeasure?.symbol || 'units'}.`);
    

    
    return true
  } catch (error) {
    console.error("Error creating low stock alert:", error)
    return false
  }
}

export async function deleteMaterial(id: string) {
  try {
    await prisma.material.delete({
      where: { id },
    })
    revalidatePath('/admin/materials')
  } catch (error) {
    throw new Error('Failed to delete material')
  }
}


export async function getMaterialTypes() {
  try {
    return await prisma.materialType.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    })
  } catch (error) {
    console.error('Error fetching material types:', error);
    throw new Error('Failed to fetch material types')
  }
}

export async function getUnitOfMeasures() {
  try {
    return await prisma.unitOfMeasure.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        status: true
      }
    })
  } catch (error) {
    console.error('Error fetching units of measure:', error);
    throw new Error('Failed to fetch units of measure')
  }
}

export async function getSuppliers() {
  try {
    return await prisma.supplier.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true
      }
    })
  } catch (error) {
    throw new Error('Failed to fetch suppliers')
  }
}

export async function getMaterialsWithRelations() {
  try {
    const materials = await prisma.material.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        type: {
          select: {
            id: true,
            name: true
          }
        },
        unitOfMeasure: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        purchaseOrderLines: {
          include: {
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
                orderDate: true,
                status: true
              }
            }
          }
        },
        boms: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    // Convert Decimal to number for client-side use with safe checking
    return materials.map(material => {
      // Process any Decimal fields from purchase order lines
      const processedPurchaseOrderLines = material.purchaseOrderLines?.map(line => ({
        ...line,
        unitPrice: typeof line.unitPrice === 'object' && 'toNumber' in line.unitPrice 
          ? line.unitPrice.toNumber() 
          : Number(line.unitPrice)
      })) || [];
      
      // Process any Decimal fields from BOM
      const processedBoms = material.boms?.map(bom => ({
        ...bom,
        quantityNeeded: typeof bom.quantityNeeded === 'object' && 'toNumber' in bom.quantityNeeded 
          ? bom.quantityNeeded.toNumber() 
          : Number(bom.quantityNeeded),
        wastePercentage: typeof bom.wastePercentage === 'object' && 'toNumber' in bom.wastePercentage 
          ? bom.wastePercentage.toNumber() 
          : Number(bom.wastePercentage)
      })) || [];
      
      return {
        ...material,
        costPerUnit: typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit 
          ? material.costPerUnit.toNumber() 
          : Number(material.costPerUnit),
        purchaseOrderLines: processedPurchaseOrderLines,
        boms: processedBoms
      };
    });
  } catch (error) {
    console.error('Error fetching materials with relations:', error)
    throw new Error('Failed to fetch materials with relations')
  }
}
