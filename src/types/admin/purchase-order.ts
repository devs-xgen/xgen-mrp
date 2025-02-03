// src/types/admin/purchase-order.ts
import { Status } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: Date;
  expectedDelivery: Date;
  status: Status;
  totalAmount: Decimal;
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
    unitPrice: Decimal;
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
  unitPrice: Decimal;
  status: Status;
  notes?: string | null;
  material: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    unitOfMeasure: {
      symbol: string;
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