"use server";

import { InventoryItem, StockLevel } from "@/types/worker/inventory";
import { prisma } from "@/lib/db";

// Helper function to determine stock level
function getStockLevel(
  currentStock: number,
  minimumStockLevel: number,
  criticalStockLevel: number
): StockLevel {
  if (currentStock <= 0) return "outOfStock";
  if (currentStock <= criticalStockLevel) return "critical";
  if (currentStock <= minimumStockLevel) return "low";
  return "normal";
}

export async function getInventoryItemById(id: string) {
  if (!id) return null;
  
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            locationType: true
          }
        }
      }
    });
    
    if (!item) return null;
    
    // Map Prisma model to our type definition
    const inventoryItem: InventoryItem = {
      id: item.id,
      name: item.name,
      sku: item.sku,
      materialTypeId: item.materialType,
      locationId: item.locationId,
      currentStock: item.currentStock,
      reorderPoint: item.minimumStockLevel,
      criticalPoint: item.criticalStockLevel,
      unitOfMeasure: item.unit,
      cost: Number(item.cost),
      lastUpdated: item.updatedAt.toISOString(),
      stockLevel: getStockLevel(
        item.currentStock, 
        item.minimumStockLevel, 
        item.criticalStockLevel
      )
    };
    
    return inventoryItem;
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return null;
  }
} 