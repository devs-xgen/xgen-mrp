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
}

export interface TaskUpdateInput {
  id: string;
  status: Status;
  notes?: string;
  completedQuantity?: number;
  timeSpent?: number; // In minutes
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
} 