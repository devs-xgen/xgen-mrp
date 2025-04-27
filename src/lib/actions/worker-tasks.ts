import { prisma } from '../prisma';
import { Prisma, Status, Operation } from '@prisma/client';

export interface Task {
  id: string;
  notes: string | null;
  status: Status;
  startTime: Date;
  endTime: Date;
  productionOrder: {
    id: string;
    status: Status;
  } | null;
}

export interface Stat {
  title: string;
  value: number;
  description: string;
  icon: "ClipboardList" | "Package" | "Clock" | "CheckCircle";
}

export async function getWorkerTasks(workerId: string): Promise<{ tasks: Task[]; stats: Stat[] }> {
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch tasks for the worker
  const tasks = await prisma.operation.findMany({
    where: {
      assignedToId: workerId,
    },
    include: {
      productionOrder: true,
    },
  });

  // Calculate stats
  const totalTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
    },
  });

  const completedTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
      status: "COMPLETED",
    },
  });

  const inProgressTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
      status: "IN_PROGRESS",
    },
  });

  const urgentTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
      status: Status.IN_PROGRESS,
    },
  });

  const stats: Stat[] = [
    {
      title: "Total Tasks",
      value: totalTasks,
      description: "All assigned tasks",
      icon: "ClipboardList",
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      description: "Currently working on",
      icon: "Clock",
    },
    {
      title: "Completed",
      value: completedTasks,
      description: "Successfully finished",
      icon: "CheckCircle",
    },
    {
      title: "Urgent",
      value: urgentTasks,
      description: "Requires immediate attention",
      icon: "Package",
    },
  ];

  return {
    tasks: tasks.map((task) => ({
      id: task.id,
      notes: task.notes,
      status: task.status,
      startTime: task.startTime,
      endTime: task.endTime,
      productionOrder: task.productionOrder
        ? {
            id: task.productionOrder.id,
            status: task.productionOrder.status,
          }
        : null,
    })),
    stats,
  };
}

export async function updateWorkerTask(
  taskId: string,
  workerId: string,
  data: {
    status?: Status;
    notes?: string;
    startTime?: Date;
    endTime?: Date;
  }
): Promise<Task> {
  // First verify that the task belongs to the worker
  const task = await prisma.operation.findFirst({
    where: {
      id: taskId,
      assignedToId: workerId,
    },
  });

  if (!task) {
    throw new Error("Task not found or not assigned to this worker");
  }

  // Update the task
  const updatedTask = await prisma.operation.update({
    where: {
      id: taskId,
    },
    data: {
      status: data.status,
      notes: data.notes,
      startTime: data.startTime,
      endTime: data.endTime,
      updatedAt: new Date(),
    },
    include: {
      productionOrder: true,
    },
  });

  return {
    id: updatedTask.id,
    notes: updatedTask.notes,
    status: updatedTask.status,
    startTime: updatedTask.startTime,
    endTime: updatedTask.endTime,
    productionOrder: updatedTask.productionOrder
      ? {
          id: updatedTask.productionOrder.id,
          status: updatedTask.productionOrder.status,
        }
      : null,
  };
} 