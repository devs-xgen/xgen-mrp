// src/types/admin/purchase-order.ts
import { Status } from "@prisma/client";

// Update to use number instead of Decimal for client-side usage
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: Date;
  expectedDelivery: Date;
  status: Status;
  totalAmount: number; // Changed from Decimal to number
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  orderLines: Array<{
    id: string;
    materialId: string;
    quantity: number;
    unitPrice: number; // Changed from Decimal to number
    status: Status;
    material: {
      id: string;
      name: string;
      sku: string;
      currentStock: number;
      unitOfMeasure: {
        symbol: string;
      };
    };
  }>;
}

export interface PurchaseOrderLine {
  id: string;
  poId: string;
  materialId: string;
  quantity: number;
  unitPrice: number; // Changed from Decimal to number
  status: Status;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  material: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    unitOfMeasure: {
      symbol: string;
    };
  };
  purchaseOrder?: {
    poNumber: string;
    status: Status;
    supplier: {
      name: string;
    };
  };
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDelivery: Date;
  notes?: string;
  orderLines: {
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdatePurchaseOrderInput {
  id: string;
  expectedDelivery?: Date;
  status?: Status;
  notes?: string;
}