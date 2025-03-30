// src/types/admin/bom.ts
import { Status } from "@prisma/client";
import { DecimalOrNumber } from "./product";

// Base Material interface for reference in BOM entries
export interface Material {
  id: string;
  name: string;
  sku: string;
  costPerUnit: DecimalOrNumber;
  currentStock: number;
  minimumStockLevel: number;
  unitOfMeasureId: string;
  typeId: string;
  status: Status;
  unitOfMeasure?: {
    name: string;
    symbol: string;
  };
}

// Basic BOM entry with core fields
export interface BOMEntry {
  id: string;
  productId: string;
  materialId: string;
  quantityNeeded: DecimalOrNumber;
  wastePercentage: DecimalOrNumber;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
  material?: Material;
}

// Input for creating new BOM entries
export interface CreateBOMEntryInput {
  productId: string;
  materialId: string;
  quantityNeeded: number;
  wastePercentage: number;
}

// Input for updating existing BOM entries
export interface UpdateBOMEntryInput {
  id: string;
  quantityNeeded?: number;
  wastePercentage?: number;
}

// Enhanced BOM entry for display in UI with computed properties
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
  totalCost: number; // Computed field: quantityNeeded * costPerUnit
  createdAt?: Date;
  updatedAt?: Date;
}

// For retrieving a product's complete BOM with materials
export interface ProductBOM {
  productId: string;
  productName: string;
  entries: BOMEntryForDisplay[];
  totalMaterialCost: number; // Sum of all entry totalCosts
}