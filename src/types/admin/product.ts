// src/types/admin/product.ts
import { Decimal } from "@prisma/client/runtime/library";
import { Status } from "@prisma/client";

// Helper type for values that could be Decimal or number
export type DecimalOrNumber = number | Decimal;

// Base product type with Decimal values
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

// Helper function to convert any Decimal values to numbers
export function convertDecimalsToNumbers<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Decimal objects
  if (obj instanceof Decimal || (obj && typeof obj === 'object' && 'toNumber' in obj && typeof obj.toNumber === 'function')) {
    return (obj as unknown as Decimal).toNumber() as unknown as T;
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
      if (value instanceof Decimal || (typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function')) {
        result[key] = (value as unknown as Decimal).toNumber();
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