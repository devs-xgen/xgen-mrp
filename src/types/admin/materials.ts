// src/types/admin/materials.ts
import { Status } from "@prisma/client";

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
  
  // Optional calculated fields
  calculatedStock?: number;
  expectedStock?: number;
  committedStock?: number;
}

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