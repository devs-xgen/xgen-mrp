import { Status } from "@prisma/client";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// src/types/task.ts
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: TaskPriority;
    assignedToInspector?: {
      inspectorId: string;
      firstName: string;
      lastName: string;
    };
    // Add other properties as needed
  }


export interface InspectorsTask {
  id: string;
  title?: string;
  description?: string;
  startDate?: Date;
  dueDate: Date;
  status?: string;
  priority: TaskPriority;

  assignedToInspector?: {
    inspectorId: string;
    firstName: string;
    lastName: string;
  };

  notes?: string | null;
  productionOrderId?: string;
  productionOrder?: {
    id: string;
    product?: {
      id: string;
      name: string;
    };
    status: Status;
  };
  workCenterId?: string;
  workCenterName?: string;

  quantity?: number;
  completedQuantity?: number;
  estimatedDuration?: number;

  timeTracking?: {
    isActive: boolean;
    startTime?: Date;
    duration?: number;
  };

  productionStatus?: string;
  isActive?: boolean;
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
    activeTasks?: number;    // Tasks from active production orders
    inactiveTasks?: number;  // Tasks from inactive production orders
  } 