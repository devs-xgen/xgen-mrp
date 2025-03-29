// src/types/admin/product.ts

export interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  description?: string | null;
  status: string;
  categoryId: string;
  currentStock: number;
  minimumStockLevel: number;
  leadTime: number;
  sizeRange: string[];
  colorOptions: string[];
  unitCost: number;
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