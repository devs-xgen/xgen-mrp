// src/types/admin/production-order.ts
import { Status, Priority } from "@prisma/client";

export interface ProductionOrder {
  id: string;
  productId: string;
  productVariantId?: string | null; // 🆕 ADD: Optional variant tracking
  quantity: number;
  startDate: Date;
  dueDate: Date;
  status: Status;
  priority: Priority;
  customerOrderId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;

  // MRP Enhancement Fields
  plannedMaterialCost: number;
  actualMaterialCost: number;
  materialVariance: number;
  completedQuantity: number;
  completedAt?: Date | null;

  // Relations
  product: {
    id: string;
    name: string;
    sku: string;
  };
  productVariant?: {
    // 🆕 ADD: Variant information
    id: string;
    sku: string;
    displayName: string;
    sizeName?: string | null;
    colorName?: string | null;
  } | null;
  customerOrder?: {
    id: string;
    orderNumber: string;
  } | null;
  operations: {
    id: string;
    workCenterId: string;
    startTime: Date;
    endTime: Date;
    status: Status;
    workCenter: {
      name: string;
    };
  }[];
  qualityChecks: {
    id: string;
    checkDate: Date;
    status: Status;
    defectsFound?: string | null;
    actionTaken?: string | null;
  }[];
  // New field for delivery assignment
  deliveryAssignment?: {
    id: string;
    userId: string;
    userName?: string;
    scheduledDate?: Date;
    status: Status;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export interface CreateProductionOrderInput {
  productId: string;
  productVariantId?: string; // 🆕 ADD: Optional variant tracking
  quantity: number;
  startDate: Date;
  dueDate: Date;
  priority: Priority;
  customerOrderId?: string;
  notes?: string;
  operations: {
    workCenterId: string;
    startTime: Date;
    endTime: Date;
    cost: number;
  }[];
}

export interface UpdateProductionOrderInput
  extends Partial<CreateProductionOrderInput> {
  id: string;
  status?: Status;
  plannedMaterialCost?: number;
  actualMaterialCost?: number;
  completedQuantity?: number;
}

export interface ProductionOrderColumn {
  id: string;
  productName: string;
  productSku: string;
  variantDisplayName?: string; // 🆕 ADD: Variant display information
  quantity: number;
  startDate: Date;
  dueDate: Date;
  status: Status;
  priority: Priority;
  customerOrderNumber?: string | undefined;
  progress: number; // Calculated from operations
  lastUpdated: Date;

  // MRP Enhancement Fields
  plannedMaterialCost: number;
  actualMaterialCost: number;
  materialVariance: number;
  completedQuantity: number;
}

// New interface for delivery assignment
export interface DeliveryAssignmentInput {
  productionOrderId: string;
  userId: string;
  scheduledDate?: Date;
  notes?: string;
}

export interface UpdateDeliveryAssignmentInput {
  id: string;
  status?: Status;
  scheduledDate?: Date;
  notes?: string;
}
