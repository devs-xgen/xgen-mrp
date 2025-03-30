import { BOMEntry, BOMEntryForDisplay } from "@/types/admin/bom";
import { convertDecimalsToNumbers } from "@/types/admin/product";

export function adaptBOMEntryForDisplay(bomEntry: any): BOMEntryForDisplay {
  const converted = convertDecimalsToNumbers(bomEntry);
  
  return {
    id: converted.id,
    productId: converted.productId,
    materialId: converted.materialId,
    quantityNeeded: Number(converted.quantityNeeded),
    wastePercentage: Number(converted.wastePercentage),
    materialName: converted.material?.name || 'Unknown Material',
    materialSku: converted.material?.sku || 'N/A',
    unitOfMeasure: converted.material?.unitOfMeasure?.symbol || 'units',
    costPerUnit: Number(converted.material?.costPerUnit || 0),
    totalCost: Number(converted.quantityNeeded) * Number(converted.material?.costPerUnit || 0)
  };
}

export function adaptDisplayEntryForAPI(displayEntry: BOMEntryForDisplay): any {
  return {
    id: displayEntry.id,
    productId: displayEntry.productId,
    materialId: displayEntry.materialId,
    quantityNeeded: displayEntry.quantityNeeded,
    wastePercentage: displayEntry.wastePercentage
  };
}