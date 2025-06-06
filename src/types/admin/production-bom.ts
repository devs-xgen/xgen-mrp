import { DecimalOrNumber } from "./product";

// Basic ProductionBOM interface
export interface ProductionBOM {
  id: string;
  productionOrderId: string;
  materialId: string;
  originalBOMId?: string | null;
  quantityNeeded: DecimalOrNumber;
  wastePercentage: DecimalOrNumber;
  adjustedQuantity?: DecimalOrNumber | null;
  adjustmentReason?: string | null;
  isAdjusted: boolean;
  unitCost: DecimalOrNumber;
  totalCost: DecimalOrNumber;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

// ProductionBOM with material details for display
export interface ProductionBOMWithMaterial extends ProductionBOM {
  material: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minimumStockLevel: number;
    unitOfMeasure: {
      name: string;
      symbol: string;
    };
    type: {
      name: string;
    };
  };
  originalBOM?: {
    id: string;
    quantityNeeded: DecimalOrNumber;
    wastePercentage: DecimalOrNumber;
  } | null;
}

// Input for creating ProductionBOM from Product BOM
export interface CreateProductionBOMFromProductInput {
  productionOrderId: string;
  productId: string;
  createdBy?: string;
}

// Input for creating individual ProductionBOM entry
export interface CreateProductionBOMEntryInput {
  productionOrderId: string;
  materialId: string;
  originalBOMId?: string;
  quantityNeeded: number;
  wastePercentage: number;
  unitCost: number;
}

// Input for adjusting ProductionBOM quantities
export interface AdjustProductionBOMInput {
  id: string;
  adjustedQuantity: number;
  adjustmentReason?: string;
  modifiedBy?: string;
}

// Input for bulk adjusting ProductionBOM
export interface BulkAdjustProductionBOMInput {
  productionOrderId: string;
  adjustments: {
    materialId: string;
    adjustedQuantity: number;
    adjustmentReason?: string;
  }[];
  modifiedBy?: string;
}

// Production BOM summary for display
export interface ProductionBOMSummary {
  productionOrderId: string;
  totalEntries: number;
  totalAdjusted: number;
  originalTotalCost: number;
  adjustedTotalCost: number;
  costVariance: number;
  costVariancePercentage: number;
  entries: ProductionBOMForDisplay[];
}

// Enhanced ProductionBOM for display with computed fields
export interface ProductionBOMForDisplay {
  id: string;
  productionOrderId: string;
  materialId: string;
  materialName: string;
  materialSku: string;
  unitOfMeasure: string;
  materialType: string;
  currentStock: number;
  minimumStockLevel: number;

  // Original BOM data
  originalQuantity: number;
  originalWastePercentage: number;
  originalTotalQuantity: number; // originalQuantity + waste

  // Production-specific data
  quantityNeeded: number;
  wastePercentage: number;
  adjustedQuantity?: number | null;
  finalQuantity: number; // adjustedQuantity || quantityNeeded
  totalQuantityWithWaste: number; // finalQuantity + waste

  // Cost data
  unitCost: number;
  originalTotalCost: number; // originalTotalQuantity * unitCost
  currentTotalCost: number; // totalQuantityWithWaste * unitCost
  costVariance: number; // currentTotalCost - originalTotalCost

  // Adjustment data
  isAdjusted: boolean;
  adjustmentReason?: string | null;
  quantityVariance: number; // finalQuantity - originalQuantity
  quantityVariancePercentage: number;

  // Stock availability
  isStockSufficient: boolean;
  stockShortage: number; // If negative, indicates shortage

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Input for updating ProductionBOM entry
export interface UpdateProductionBOMEntryInput {
  id: string;
  quantityNeeded?: number;
  wastePercentage?: number;
  adjustedQuantity?: number;
  adjustmentReason?: string;
  unitCost?: number;
}

// Production BOM comparison data
export interface ProductionBOMComparison {
  materialId: string;
  materialName: string;
  originalBOM: {
    quantityNeeded: number;
    wastePercentage: number;
    totalQuantity: number;
  };
  productionBOM: {
    quantityNeeded: number;
    wastePercentage: number;
    adjustedQuantity?: number;
    finalQuantity: number;
    totalQuantity: number;
  };
  variance: {
    quantity: number;
    percentage: number;
    cost: number;
  };
}

// Stats for ProductionBOM analytics
export interface ProductionBOMStats {
  totalMaterials: number;
  adjustedMaterials: number;
  adjustmentRate: number; // Percentage of materials adjusted
  totalOriginalCost: number;
  totalCurrentCost: number;
  totalCostVariance: number;
  costVariancePercentage: number;
  materialShortages: number;
  criticalShortages: number; // Materials below minimum stock
}
