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
    title?: string;              // Short title or summary of the task
    description?: string;       // Optional detailed description
    startDate?: Date;           // Optional planned start date
    dueDate: Date;              // Deadline for task completion
    status: string;             // Current status (consider using an enum or union type)
    priority: TaskPriority;     // Task priority level
  
    assignedToInspector?: {     // Optional inspector assignment info
      inspectorId: string;
      firstName: string;
      lastName: string;
    };
  
    notes?: string | null;      // Optional additional notes
    productionOrderId?: string; // Optional related production order ID
    workCenterId?: string;      // Optional work center identifier
    workCenterName?: string;    // Optional work center name
  
    quantity?: number;          // Optional quantity involved
    completedQuantity?: number; // Optional quantity completed
    estimatedDuration?: number; // Optional estimated duration in minutes
  
    timeTracking?: {            // Optional time tracking info
      isActive: boolean;
      startTime?: Date;
      duration?: number;        // Duration tracked in minutes
    };
  
    productionStatus?: string;  // Optional status of the parent production order
    isActive?: boolean;         // Whether the task is currently active or paused/pending
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