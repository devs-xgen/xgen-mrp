// src/lib/actions/materials.ts - Partial fixed version focusing on the updateMaterial function
'use server'

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next" 
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Material, MaterialCreateInput, MaterialUpdateInput } from "@/types/admin/materials"
import { Status } from "@prisma/client"
import { convertDecimalsToNumbers } from "@/types/admin/product";


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

export async function getAllMaterials(): Promise<Material[]> {
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
    });
    
    // Properly convert Decimal values to numbers to match Material interface
    const convertedMaterials = materials.map(material => {
      // First handle the Decimal conversion for costPerUnit
      const costPerUnit = typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit
        ? material.costPerUnit.toNumber()
        : Number(material.costPerUnit);
      
      // Then return a properly shaped Material object
      return {
        ...material,
        costPerUnit, // Replace the Decimal with number
        // Make sure all required Material interface properties are present
        boms: [], // Add empty array if it's required in your Material interface
      } as Material; // Explicit casting to Material type
    });
    
    return convertedMaterials;
  } catch (error) {
    console.error('Error fetching materials:', error);
    throw new Error('Failed to fetch materials');
  }
}

export async function getMaterialTypes() {
  try {
    return await prisma.materialType.findMany({
      where: {
        status: Status.ACTIVE
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true
      },
      orderBy: {
        name: 'asc'
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
        status: Status.ACTIVE
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        status: true
      },
      orderBy: {
        name: 'asc'
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
        status: Status.ACTIVE
      },
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw new Error('Failed to fetch suppliers')
  }
}

export async function createMaterial(data: MaterialCreateInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')
    
    const costPerUnit = typeof data.costPerUnit === 'string' 
      ? parseFloat(data.costPerUnit) 
      : data.costPerUnit;
    
    if (isNaN(costPerUnit)) {
      throw new Error('Invalid cost per unit value');
    }
    
    // Prepare create data with only the fields that exist in the Prisma schema
    const createData: any = {
      name: data.name,
      sku: data.sku,
      costPerUnit,
      currentStock: data.currentStock,
      minimumStockLevel: data.minimumStockLevel,
      leadTime: data.leadTime,
      notes: data.notes,
      status: Status.ACTIVE,
      createdBy: session.user.id
    };
    
    // Only add committedStock if it exists (this field exists in the schema)
    if (data.committedStock !== undefined) {
      createData.committedStock = data.committedStock;
    }
    
    // Handle relations
    if (data.typeId) {
      createData.type = { connect: { id: data.typeId } };
    }
    
    if (data.unitOfMeasureId) {
      createData.unitOfMeasure = { connect: { id: data.unitOfMeasureId } };
    }
    
    if (data.supplierId) {
      createData.supplier = { connect: { id: data.supplierId } };
    }
    
    const material = await prisma.material.create({
      data: createData,
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
      },
    });
    
    // Properly convert to match Material interface
    // Add the virtual fields that are in the interface but not in the database
    const result = {
      ...material,
      costPerUnit: typeof material.costPerUnit === 'object' && 'toNumber' in material.costPerUnit
        ? material.costPerUnit.toNumber()
        : Number(material.costPerUnit),
      // Add virtual fields for the TypeScript interface
      calculatedStock: data.calculatedStock !== undefined ? data.calculatedStock : 
                       (data.currentStock || 0) - (data.committedStock || 0),
      expectedStock: data.expectedStock || 0,
      boms: [] // Add any other required properties from your Material interface
    } as Material;
    
    revalidatePath('/admin/materials');
    return result;
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

    // Initialize update data with audit fields
    let updateData: any = {
      modifiedBy: userId,
      updatedAt: new Date(),
    };
    
    // Only add fields to updateData if they exist in Prisma schema
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.costPerUnit !== undefined) updateData.costPerUnit = data.costPerUnit;
    if (data.currentStock !== undefined) updateData.currentStock = data.currentStock;
    if (data.minimumStockLevel !== undefined) updateData.minimumStockLevel = data.minimumStockLevel;
    if (data.leadTime !== undefined) updateData.leadTime = data.leadTime;
    if (data.committedStock !== undefined) updateData.committedStock = data.committedStock;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // NOTE: We don't include calculatedStock or expectedStock as they're not in the Prisma schema
    
    // Handle relations with connect if IDs are provided
    if (data.typeId) {
      updateData.type = { connect: { id: data.typeId } };
    }
    
    if (data.unitOfMeasureId) {
      updateData.unitOfMeasure = { connect: { id: data.unitOfMeasureId } };
    }
    
    if (data.supplierId) {
      updateData.supplier = { connect: { id: data.supplierId } };
    }

    // Update the material in the database
    const updatedMaterial = await prisma.material.update({
      where: { id: data.id },
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
      }
    })

    // Check for low stock levels and create alerts if necessary
    const currentStock = data.currentStock !== undefined ? data.currentStock : updatedMaterial.currentStock;
    const minimumLevel = data.minimumStockLevel !== undefined ? data.minimumStockLevel : updatedMaterial.minimumStockLevel;
    
    if (currentStock <= minimumLevel) {
      await createLowStockAlert({
        materialId: data.id,
        currentLevel: currentStock,
        minimumLevel: minimumLevel,
        createdBy: userId,
      })
    }

    // Revalidate paths
    revalidatePath('/admin/materials')
    revalidatePath('/materials')
    revalidatePath(`/materials/${data.id}`)
    
    // Return the updated material with converted values for the TypeScript interface
    const result = {
      ...updatedMaterial,
      costPerUnit: typeof updatedMaterial.costPerUnit === 'object' && 'toNumber' in updatedMaterial.costPerUnit
        ? updatedMaterial.costPerUnit.toNumber()
        : Number(updatedMaterial.costPerUnit),
      // Add virtual fields for the TypeScript interface
      calculatedStock: data.calculatedStock !== undefined ? data.calculatedStock : 
                       currentStock - (data.committedStock || updatedMaterial.committedStock),
      expectedStock: data.expectedStock || 0
    };
    
    return result;
  } catch (error) {
    console.error("Error updating material:", error)
    throw new Error(`Failed to update material: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getMaterialById(id: string): Promise<Material | null> {
  try {
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
        boms: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!material) {
      return null;
    }

    const materialData = JSON.parse(JSON.stringify(material));
  
    return materialData as Material;
    
  } catch (error) {
    console.error('Error fetching material by ID:', error);
    throw new Error('Failed to fetch material');
  }
}

export async function deleteMaterial(id: string) {
  try {
    // Check if the material is used in any BOMs
    const bomCount = await prisma.bOM.count({
      where: { materialId: id }
    });
    
    if (bomCount > 0) {
      throw new Error(`Cannot delete this material as it's used in ${bomCount} bill of materials`);
    }
    
    // Check if the material is used in any purchase order lines
    const poLineCount = await prisma.purchaseOrderLine.count({
      where: { materialId: id }
    });
    
    if (poLineCount > 0) {
      throw new Error(`Cannot delete this material as it's used in ${poLineCount} purchase order lines`);
    }
    
    // If the material is not referenced, delete it
    await prisma.material.delete({
      where: { id }
    });
    
    // Revalidate paths
    revalidatePath('/admin/materials');
    revalidatePath('/materials');
    
    return { success: true, message: "Material deleted successfully" };
  } catch (error) {
    console.error("Error deleting material:", error);
    throw new Error(`Failed to delete material: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}