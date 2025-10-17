// src/types/worker/production-order.ts
import { Status, Priority } from "@prisma/client";
/**
 * The full, detailed structure of a Production Order record.
 * This is typically used for retrieval and detailed reporting.
 */
export interface ProductionOrder {
  id: string;
  productId: string;
  productVariantId?: string | null; // Optional variant tracking
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

  // Relations (Detailed)
  product: {
    id: string;
    name: string;
    sku: string;
  };
  productVariant?: {
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
  operations: ProductionOperationDetail[]; // Use the detailed operation interface
  qualityChecks: {
    id: string;
    checkDate: Date;
    status: Status;
    defectsFound?: string | null;
    actionTaken?: string | null;
  }[];
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

/**
 * Detailed structure for an individual operation within the Production Order.
 * Used for admin planning and tracking.
 */
export interface ProductionOperationDetail {
  id: string;
  workCenterId: string;
  startTime: Date;
  endTime: Date;
  status: Status;
  cost: number; // Added cost field for full detail
  workCenter: {
    name: string;
  };
}

/**
 * Input structure for creating a new Production Order.
 */
export interface CreateProductionOrderInput {
  productId: string;
  productVariantId?: string;
  quantity: number;
  startDate: Date;
  dueDate: Date;
  priority: Priority;
  customerOrderId?: string;
  notes?: string;
  // Simplified operation creation input
  operations: {
    workCenterId: string;
    startTime: Date;
    endTime: Date;
    cost: number;
  }[];
}

/**
 * Input structure for updating an existing Production Order.
 */
export interface UpdateProductionOrderInput
  extends Partial<CreateProductionOrderInput> {
  id: string;
  status?: Status;
  plannedMaterialCost?: number;
  actualMaterialCost?: number;
  completedQuantity?: number;
}

/**
 * Optimized structure for displaying Production Orders in a list or table (Admin/Manager view).
 */
export interface ProductionOrderColumn {
  id: string;
  productName: string;
  productSku: string;
  variantDisplayName?: string;
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

// Delivery Assignment Types
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

// =========================================================================
// Worker/Production Floor Interfaces
//    (Focuses on the immediate operation and simple data entry)
// =========================================================================

/**
 * Interface for a single Production Operation as seen by a worker.
 * This represents the 'job card' a worker uses at their work center.
 */
export interface WorkerOperationView {
  // Operation Details
  id: string; // The ID of the specific operation
  workCenterId: string;
  workCenterName: string; // Display name of the work center
  status: Status; // Status of THIS operation (e.g., Pending, InProgress, Completed)

  // Production Order Context (Simplified)
  productionOrderId: string;
  orderStatus: Status; // Status of the entire production order
  orderPriority: Priority;
  quantityToProduce: number;

  // Product Context
  productName: string;
  productSku: string;
  productVariantDisplayName?: string | null;

  // Time & Tracking
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date | null;
  actualEndTime?: Date | null;
  notes?: string | null;

  // Worker's primary data input/current progress
  completedQuantityAtThisStep: number; // The total quantity completed for this operation so far
  defectsFoundTotal: number; // The total defects found for this operation so far
}

/**
 * Input for a worker to start an operation (Clock-In for the Job).
 */
export interface StartOperationInput {
  operationId: string;
  workerId: string; // The ID of the worker starting the job (for labor tracking)
  actualStartTime: Date;
}

/**
 * Input for a worker to record progress (partial completion) or batch completion.
 */
export interface ReportOperationProgressInput {
  operationId: string;
  workerId: string;
  completedQuantity: number; // Quantity completed in THIS specific reporting batch/session
  defectsFound?: number; // Defects found in THIS specific reporting batch/session
  notes?: string;
}

/**
 * Input for a worker to mark an operation as finished (Clock-Out for the Job).
 */
export interface CompleteOperationInput {
  operationId: string;
  workerId: string;
  actualEndTime: Date;
  // Allow reporting the final batch quantity/defects if not already done
  completedQuantity?: number;
  defectsFound?: number;
  finalStatus: "COMPLETED" | "QUALITY_HOLD" | "CANCELED";
}