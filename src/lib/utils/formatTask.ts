// inspector/utils/formatTask.ts
export type RawTask = {
    id: string;
    name: string;
    description?: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    assignedAt: string; // ISO string
    dueDate: string;    // ISO string
  };
  
  export type FormattedTask = {
    id: string;
    title: string;
    summary: string;
    status: string;
    assignedDate: string;
    dueDate: string;
    isOverdue: boolean;
  };
  
  export function formatTask(task: RawTask): FormattedTask {
    const assignedDate = new Date(task.assignedAt).toLocaleDateString();
    const dueDate = new Date(task.dueDate).toLocaleDateString();
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
  
    return {
      id: task.id,
      title: task.name,
      summary: task.description || "No description provided.",
      status: task.status.replace("_", " "),
      assignedDate,
      dueDate,
      isOverdue,
    };
  }
  