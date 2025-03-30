// src/types/admin/materials.ts
import { Status } from "@prisma/client";

// Base Material interface
export interface Material {
  id: string;
  name: string;
  sku: string;
  typeId: string;
  unitOfMeasureId: string;
  costPerUnit: number;
  currentStock: number;
  minimumStockLevel: number;
  leadTime: number;
  supplierId: string;
  status: Status;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
  
  // Relations
  type?: {
    id: string;
    name: string;
  };
  unitOfMeasure?: {
    id: string;
    name: string;
    symbol: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  boms?: BOMEntry[];
  
  // Optional calculated fields for inventory management
  calculatedStock?: number;
  expectedStock?: number;
  committedStock?: number;
}

// Represents a BOM entry in the material type
interface BOMEntry {
  id: string;
  productId: string;
  materialId: string;
  quantityNeeded: number;
  wastePercentage: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

// Input for creating materials
export interface MaterialCreateInput {
  name: string;
  sku: string;
  typeId: string;
  unitOfMeasureId: string;
  costPerUnit: number;
  currentStock: number;
  minimumStockLevel: number;
  leadTime: number;
  supplierId: string;
  notes?: string;
}

// Input for updating materials
export interface MaterialUpdateInput {
  id: string;
  name?: string;
  sku?: string;
  typeId?: string;
  unitOfMeasureId?: string;
  costPerUnit?: number;
  currentStock?: number;
  minimumStockLevel?: number;
  leadTime?: number;
  supplierId?: string;
  status?: Status;
  notes?: string;
  
  // Stock calculation fields
  calculatedStock?: number;
  expectedStock?: number;
  committedStock?: number;
}

// Material usage in products
export interface MaterialUsageInfo {
  productId: string;
  productName: string;
  productSku: string;
  quantityNeeded: number;
  wastePercentage: number;
  pendingProduction: number;
  projectedUsage: number;
}

// Material availability check result
export interface MaterialAvailability {
  materialId: string;
  materialName: string;
  unitSymbol: string;
  currentStock: number;
  committedQuantity: number;
  availableStock: number;
  requiredQuantity: number;
  isAvailable: boolean;
  isBelowMinimum: boolean;
  shortfall: number;
}