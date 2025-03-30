// src/lib/adapters/bom-adapters.ts
import { BOMEntry, BOMEntryForDisplay, CreateBOMEntryInput, ProductBOM, UpdateBOMEntryInput } from "@/types/admin/bom";
import { convertDecimalsToNumbers } from "@/types/admin/product";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Adapts a Prisma BOM entry to the display format with computed properties
 * 
 * @param bomEntry The Prisma BOM entry with material details
 * @returns A formatted BOM entry for display in UI components
 */
export function adaptBOMEntryForDisplay(bomEntry: any): BOMEntryForDisplay {
  // First convert any Decimal values to numbers
  const converted = convertDecimalsToNumbers(bomEntry);
  
  // Calculate the total cost based on quantity and unit price
  const quantityNeeded = Number(converted.quantityNeeded);
  const costPerUnit = Number(converted.material?.costPerUnit || 0);
  const totalCost = quantityNeeded * costPerUnit;
  
  return {
    id: converted.id,
    productId: converted.productId,
    materialId: converted.materialId,
    quantityNeeded: quantityNeeded,
    wastePercentage: Number(converted.wastePercentage),
    materialName: converted.material?.name || 'Unknown Material',
    materialSku: converted.material?.sku || 'N/A',
    unitOfMeasure: converted.material?.unitOfMeasure?.symbol || 'units',
    costPerUnit: costPerUnit,
    totalCost: totalCost,
    createdAt: converted.createdAt,
    updatedAt: converted.updatedAt
  };
}

/**
 * Converts a display BOM entry back to API format for updates
 * 
 * @param displayEntry The display format of the BOM entry
 * @returns A BOM entry formatted for API operations
 */
export function adaptDisplayEntryForAPI(displayEntry: BOMEntryForDisplay): UpdateBOMEntryInput {
  return {
    id: displayEntry.id,
    quantityNeeded: displayEntry.quantityNeeded,
    wastePercentage: displayEntry.wastePercentage
  };
}

/**
 * Adapts an array of BOM entries to create a complete product BOM with totals
 * 
 * @param productId The ID of the product
 * @param productName The name of the product
 * @param bomEntries Array of BOM entries from Prisma
 * @returns A complete product BOM with entries and total material cost
 */
export function adaptProductBOM(productId: string, productName: string, bomEntries: any[]): ProductBOM {
  const displayEntries = bomEntries.map(entry => adaptBOMEntryForDisplay(entry));
  
  // Calculate the total material cost
  const totalMaterialCost = displayEntries.reduce(
    (sum, entry) => sum + entry.totalCost, 
    0
  );
  
  return {
    productId,
    productName,
    entries: displayEntries,
    totalMaterialCost
  };
}

/**
 * Converts a create input to Prisma-compatible format with Decimal values
 * 
 * @param input The create input with number values
 * @returns An object with Decimal values for Prisma
 */
export function adaptCreateInputForPrisma(input: CreateBOMEntryInput): any {
  return {
    productId: input.productId,
    materialId: input.materialId,
    quantityNeeded: new Decimal(input.quantityNeeded),
    wastePercentage: new Decimal(input.wastePercentage)
  };
}

/**
 * Converts an update input to Prisma-compatible format with Decimal values
 * 
 * @param input The update input with number values
 * @returns An object with Decimal values for Prisma
 */
export function adaptUpdateInputForPrisma(input: UpdateBOMEntryInput): any {
  const result: any = { id: input.id };
  
  if (input.quantityNeeded !== undefined) {
    result.quantityNeeded = new Decimal(input.quantityNeeded);
  }
  
  if (input.wastePercentage !== undefined) {
    result.wastePercentage = new Decimal(input.wastePercentage);
  }
  
  return result;
}