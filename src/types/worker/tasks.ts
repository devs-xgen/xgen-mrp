import { Status } from "@prisma/client";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface WorkerTask {
  id: string;
  description: string;
  startDate?: Date;
  dueDate: Date;
  status: Status;
  priority: TaskPriority;
  notes?: string | null;
  productionOrderId?: string;
  workCenterId?: string;
  workCenterName?: string;
  quantity?: number;
  completedQuantity?: number;
  estimatedDuration?: number; // In minutes
  assignedById?: string;
  assignedByName?: string;
  timeTracking?: {
    isActive: boolean;
    startTime?: Date;
    duration?: number;
  };
  // New fields for production status
  productionStatus?: Status; // Status of the parent production order
  isActive?: boolean; // Whether the task is active or paused/pending
}

export interface TaskUpdateInput {
  id: string;
  status: Status;
  notes?: string;
  completedQuantity?: number;
  timeSpent?: number; // In minutes
}

export interface TaskUpdateResult {
  success: boolean;
  triggeredPhaseUpdate: boolean;
  inspectionReadiness: boolean;
  deliveryReadiness: boolean;
  phaseProgressInfo: any; // Phase progress information
  message: string;
}

export interface TaskTimeTracking {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // In minutes
  isActive: boolean;
}

export interface TaskReport {
  taskId: string;
  issueType: "QUALITY" | "MATERIAL" | "EQUIPMENT" | "OTHER";
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  reportedAt: Date;
}

export interface TaskStatistics {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
  urgentTasks: number;
  completionRate: number; // Percentage
  activeTasks?: number; // Tasks from active production orders
  inactiveTasks?: number; // Tasks from inactive production orders
}

export interface WorkCenterCompletionStatus {
  allCompleted: boolean;
  completionPercentage: number;
  completedOperations: number;
  totalOperations: number;
  remainingOperations: Array<{
    id: string;
    workCenterName: string;
    status: Status;
    startTime: Date;
    endTime: Date;
  }>;
}

export interface ProductionOrderWithPhases {
  id: string;
  quantity: number;
  startDate: Date;
  dueDate: Date;
  status: Status;
  priority: TaskPriority;
  notes?: string | null;
  // Product details
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
  // Customer order details
  customerOrder?: {
    id: string;
    orderNumber: string;
    customer: {
      name: string;
    };
  } | null;
  // Operations
  operations: Array<{
    id: string;
    status: Status;
    startTime: Date;
    endTime: Date;
    notes?: string | null;
    workCenter: {
      id: string;
      name: string;
    };
    assignedTo?: {
      id: string;
      email: string;
      profile?: {
        firstName: string;
        lastName: string;
      } | null;
    } | null;
  }>;
  // Quality checks
  qualityChecks: Array<{
    id: string;
    status: Status;
    checkDate: Date;
    defectsFound?: string | null;
    actionTaken?: string | null;
    notes?: string | null;
    inspector: {
      id: string;
      email: string;
      profile?: {
        firstName: string;
        lastName: string;
      } | null;
    };
  }>;
  // Delivery
  delivery?: {
    id: string;
    status: Status;
    scheduledDate?: Date | null;
    user: {
      id: string;
      email: string;
      profile?: {
        firstName: string;
        lastName: string;
      } | null;
    };
  } | null;
  // Phase status
  phaseStatus: any; // Full phase status object
  workCenterStatus: WorkCenterCompletionStatus;
  inspectionStatus: any; // Inspection completion status
  canStartInspection: boolean;
  canStartDelivery: boolean;
  currentPhase: "work_centers" | "inspection" | "delivery" | "completed";
}

export interface InspectionReadinessNotification {
  success: boolean;
  message: string;
  workCenterStatus?: WorkCenterCompletionStatus;
  inspectorCount?: number;
}
