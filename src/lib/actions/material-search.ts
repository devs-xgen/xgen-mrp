// src/lib/actions/material-search.ts
'use server'

import { prisma } from "@/lib/db"
import { convertDecimalsToNumbers } from "@/types/admin/product";
import { Status } from "@prisma/client";

// Define the MaterialOption interface here instead of importing it
// This prevents the circular dependency
export interface MaterialOption {
  id: string;
  name: string;
  sku: string;
  costPerUnit: number;
  currentStock: number;
  minimumStockLevel: number;
  unitOfMeasureSymbol: string;
  unitOfMeasureName: string;
  typeId: string;
  typeName: string;
}

/**
 * Search for materials with optional query
 * @param query Optional search query
 * @returns Array of material options
 */
export async function searchMaterials(query: string = ""): Promise<MaterialOption[]> {
  try {
    const searchTerm = query.trim();
    
    // Fixed where clause using a simpler approach
    let whereClause: any = { status: Status.ACTIVE };
    
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { sku: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const materials = await prisma.material.findMany({
      where: whereClause,
      include: {
        type: {
          select: {
            name: true,
          },
        },
        unitOfMeasure: {
          select: {
            name: true,
            symbol: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: 50, // Limit number of results for performance
    });

    // Convert Decimal values to numbers for client-side use
    const convertedMaterials = convertDecimalsToNumbers(materials);
    
    // Map to expected MaterialOption structure
    return convertedMaterials.map(material => ({
      id: material.id,
      name: material.name,
      sku: material.sku,
      costPerUnit: Number(material.costPerUnit),
      currentStock: material.currentStock,
      minimumStockLevel: material.minimumStockLevel,
      unitOfMeasureSymbol: material.unitOfMeasure?.symbol || '',
      unitOfMeasureName: material.unitOfMeasure?.name || '',
      typeId: material.typeId,
      typeName: material.type?.name || '',
    }));
  } catch (error) {
    console.error('Error searching materials:', error);
    throw new Error('Failed to search materials');
  }
}

/**
 * Get material usage information (where it's used in BOMs)
 * @param materialId The ID of the material
 * @returns Array of products and usage details
 */
export async function getMaterialUsage(materialId: string) {
  try {
    const bomEntries = await prisma.bOM.findMany({
      where: {
        materialId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
            minimumStockLevel: true,
            productionOrders: {
              where: {
                status: {
                  in: [Status.PENDING, Status.IN_PROGRESS]
                }
              },
              select: {
                id: true,
                quantity: true,
                status: true,
                dueDate: true,
              }
            }
          }
        }
      }
    });

    // Calculate total projected usage based on pending production orders
    const usageData = bomEntries.map(entry => {
      const pendingProduction = entry.product.productionOrders.reduce(
        (total, order) => total + order.quantity, 
        0
      );
      
      // Convert Decimal values to numbers
      const quantityNeeded = typeof entry.quantityNeeded === 'object' && 'toNumber' in entry.quantityNeeded
        ? entry.quantityNeeded.toNumber()
        : Number(entry.quantityNeeded);
      
      const wastePercentage = typeof entry.wastePercentage === 'object' && 'toNumber' in entry.wastePercentage
        ? entry.wastePercentage.toNumber()
        : Number(entry.wastePercentage);
      
      // Calculate total quantity needed for pending production
      const projectedUsage = pendingProduction * quantityNeeded * (1 + wastePercentage / 100);
      
      return {
        productId: entry.productId,
        productName: entry.product.name,
        productSku: entry.product.sku,
        quantityNeeded,
        wastePercentage,
        pendingProduction,
        projectedUsage: parseFloat(projectedUsage.toFixed(2)),
      };
    });

    return usageData;
  } catch (error) {
    console.error('Error getting material usage:', error);
    throw new Error('Failed to get material usage information');
  }
}

/**
 * Check material availability for a specific BOM requirement
 * @param materialId The material ID
 * @param requiredQuantity The required quantity
 * @returns Availability information
 */
export async function checkMaterialAvailability(materialId: string, requiredQuantity: number) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        unitOfMeasure: {
          select: {
            symbol: true,
          }
        },
        boms: {
          include: {
            product: {
              select: {
                productionOrders: {
                  where: {
                    status: {
                      in: [Status.PENDING, Status.IN_PROGRESS]
                    }
                  },
                  select: {
                    quantity: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!material) {
      throw new Error('Material not found');
    }

    // Calculate committed quantity from active production orders
    let committedQuantity = 0;
    material.boms.forEach(bom => {
      const quantityNeeded = typeof bom.quantityNeeded === 'object' && 'toNumber' in bom.quantityNeeded
        ? bom.quantityNeeded.toNumber()
        : Number(bom.quantityNeeded);
      
      const wastePercentage = typeof bom.wastePercentage === 'object' && 'toNumber' in bom.wastePercentage
        ? bom.wastePercentage.toNumber()
        : Number(bom.wastePercentage);
      
      bom.product.productionOrders.forEach(order => {
        committedQuantity += order.quantity * quantityNeeded * (1 + wastePercentage / 100);
      });
    });

    const availableStock = material.currentStock - committedQuantity;
    const isAvailable = availableStock >= requiredQuantity;
    const isBelowMinimum = availableStock < material.minimumStockLevel;

    return {
      materialId: material.id,
      materialName: material.name,
      unitSymbol: material.unitOfMeasure?.symbol || '',
      currentStock: material.currentStock,
      committedQuantity,
      availableStock,
      requiredQuantity,
      isAvailable,
      isBelowMinimum,
      shortfall: isAvailable ? 0 : requiredQuantity - availableStock,
    };
  } catch (error) {
    console.error('Error checking material availability:', error);
    throw new Error('Failed to check material availability');
  }
}