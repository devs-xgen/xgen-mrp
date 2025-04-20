// src/types/task.ts
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    assignedToInspector?: {
      inspectorId: string;
      firstName: string;
      lastName: string;
    };
    // Add other properties as needed
  }