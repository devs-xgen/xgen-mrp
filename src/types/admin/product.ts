// src/types/admin/product.ts
import { Status } from "@prisma/client";

// Helper type for values that could be Decimal or number
export type DecimalOrNumber = number;

// Base product type with number values (not Decimal)
export interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: DecimalOrNumber;
  description?: string | null;
  status: Status;
  categoryId: string;
  currentStock: number;
  minimumStockLevel: number;
  leadTime: number;
  sizeRange: string[];
  colorOptions: string[];
  unitCost: DecimalOrNumber;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
  };
  productionOrders?: ProductionOrderSummary[];
  boms?: ExtendedBOM[];
}

/**
 * A simpler version of convertDecimalsToNumbers that doesn't rely on Prisma's Decimal type
 */
export function convertDecimalsToNumbers<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle special case of objects with toNumber method (like Decimal)
  if (obj && typeof obj === 'object' && 'toNumber' in obj && typeof (obj as any).toNumber === 'function') {
    return Number((obj as any).toNumber()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalsToNumbers(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
    }
    else if (typeof value === 'object') {
      if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
        result[key] = Number((value as any).toNumber());
      } else {
        result[key] = convertDecimalsToNumbers(value);
      }
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

export interface ProductionOrderSummary {
  id: string;
  status: string;
  quantity: number;
  dueDate: Date;
}

export interface ProductForOrder {
  id: string;
  name: string;
  unitPrice: number; 
  sku?: string;
  currentStock?: number;
  minimumStockLevel?: number;
}

export interface ExtendedBOM {
  id: string;
  productId: string;
  materialId: string;
  quantityNeeded: DecimalOrNumber;
  wastePercentage: DecimalOrNumber;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
  material: {
    id: string;
    name: string;
    costPerUnit: DecimalOrNumber;
  }
}

// For usage in components, extends Product but guarantees number types
export interface ProductWithNumberValues {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  description?: string | null;
  status: Status;
  categoryId: string;
  currentStock: number;
  minimumStockLevel: number;
  leadTime: number;
  sizeRange: string[];
  colorOptions: string[];
  unitCost: number;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
  };
  productionOrders?: ProductionOrderSummary[];
  boms?: ExtendedBOMWithNumberValues[];
  // Add these properties to avoid type errors
  expectedStock: number;
  committedStock: number;
  calculatedStock: number;
  createdBy: string | null;
  modifiedBy: string | null;
}

export interface ExtendedBOMWithNumberValues {
  id: string;
  productId: string;
  materialId: string;
  quantityNeeded: number;
  wastePercentage: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
  material: {
    id: string;
    name: string;
    costPerUnit: number;
  }
}