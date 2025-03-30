export interface BOMEntry {
    id: string;
    productId: string;
    materialId: string;
    quantityNeeded: number;
    wastePercentage: number;
    material: Material;
  }
  
  export interface CreateBOMEntryInput {
    productId: string;
    materialId: string;
    quantityNeeded: number;
    wastePercentage: number;
  }
  
  export interface UpdateBOMEntryInput {
    id: string;
    quantityNeeded?: number;
    wastePercentage?: number;
  }
  
  // Adapter interface for component usage
  export interface BOMEntryForDisplay {
    id: string;
    productId: string;
    materialId: string;
    quantityNeeded: number;
    wastePercentage: number;
    materialName: string;
    materialSku: string;
    unitOfMeasure: string;
    costPerUnit: number;
    totalCost: number;
  }