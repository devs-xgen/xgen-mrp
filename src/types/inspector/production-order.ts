// src/types/inspector/production-order.ts
import { Status, Priority } from "@prisma/client"

export interface MaterialRequestItem {
  id: string;
  quantityRequested: number;
  quantityApproved?: number | null;
  quantityFulfilled?: number | null;
  unit: string;
  notes?: string | null;
  status: string;
  inventoryItem: {
    id: string;
    sku: string;
    name: string;
    description?: string | null;
    unit: string;
    cost: number;
  };
}

export interface MaterialRequest {
  id: string;
  requestDate: Date;
  requestedById: string;
  workCenterId: string;
  status: string;
  priority: string;
  requiredDate: Date;
  approvedById?: string | null;
  approvedDate?: Date | null;
  fulfilledDate?: Date | null;
  notes?: string | null;
  productionOrderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  requestedBy?: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  workCenter: { id: string; name: string };
  items: MaterialRequestItem[];
}


export interface ProductionOrder {
  id: string
  productId: string
  quantity: number
  startDate: Date
  dueDate: Date
  status: Status
  priority: Priority
  customerOrderId?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  modifiedBy?: string | null
  
  // MRP Enhancement Fields
  plannedMaterialCost: number
  actualMaterialCost: number
  materialVariance: number
  completedQuantity: number
  completedAt?: Date | null
  
  // Relations
  product: {
    id: string
    name: string
    sku: string
  }
  customerOrder?: {
    id: string
    orderNumber: string
  } | null
  operations: {
    id: string
    workCenterId: string
    startTime: Date
    endTime: Date
    status: Status
    workCenter: {
      name: string
    }
  }[]
  qualityChecks: {
    id: string
    checkDate: Date
    status: Status
    defectsFound?: string | null
    actionTaken?: string | null
  }[]
  // New field for delivery assignment
  deliveryAssignment?: {
    id: string
    userId: string
    userName?: string
    scheduledDate?: Date
    status: Status
    notes?: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  materialRequests?: MaterialRequest[];
}


export interface CreateProductionOrderInput {
  productId: string
  quantity: number
  startDate: Date
  dueDate: Date
  priority: Priority
  customerOrderId?: string
  notes?: string
  operations: {
    workCenterId: string
    startTime: Date
    endTime: Date
    cost: number
  }[]
}

export interface UpdateProductionOrderInput extends Partial<CreateProductionOrderInput> {
  id: string
  status?: Status
  plannedMaterialCost?: number
  actualMaterialCost?: number
  completedQuantity?: number
}

export interface ProductionOrderColumn {
  id: string
  productName: string
  productSku: string
  quantity: number
  startDate: Date
  dueDate: Date
  status: Status
  priority: Priority
  customerOrderNumber?: string | undefined
  progress: number // Calculated from operations
  lastUpdated: Date
  
  // MRP Enhancement Fields
  plannedMaterialCost: number
  actualMaterialCost: number
  materialVariance: number
  completedQuantity: number
}

// New interface for delivery assignment
export interface DeliveryAssignmentInput {
  productionOrderId: string
  userId: string
  scheduledDate?: Date
  notes?: string
}

export interface UpdateDeliveryAssignmentInput {
  id: string
  status?: Status
  scheduledDate?: Date
  notes?: string
}

export interface ProductionOrderColumnPerRequest {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  startDate: Date;
  dueDate: Date;
  status: Status;
  priority: Priority;
  customerOrderNumber?: string;
  progress: number; // Calculated from operations
  lastUpdated: Date;

  // MRP Enhancement Fields
  plannedMaterialCost: number;
  actualMaterialCost: number;
  materialVariance: number;
  completedQuantity: number;

  // ✅ New: Associated material requests
  materialRequests?: {
    id: string;
    requestDate: Date;
    requiredDate: Date;
    status: string;
    priority: string;
    notes?: string;

    items: {
      id: string;
      inventoryItemId: string;
      quantityRequested: number;
      unit: string;
      status: string;
      notes?: string;

      // ✅ Embedded inventory item name for display
      inventoryItem: {
        id: string;
        name: string;
      };
    }[];
  }[];
}