'use server'

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import { TaskUpdateInput, TaskStatistics, TaskTimeTracking, TaskReport, WorkerTask } from "@/types/worker/tasks";

// Get tasks assigned to the current worker
export async function getMyTasks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Find the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true }
    });

    const workCenterIds = userWorkCenters.map(uwc => uwc.workCenterId);

    // Get operations for these work centers
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS, Status.COMPLETED] },
        // Only include operations from production orders that are IN_PROGRESS or COMPLETED
        productionOrder: {
          status: { in: [Status.IN_PROGRESS, Status.COMPLETED] }
        }
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        workCenter: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Also get operations from PENDING/PAUSED production orders to show them as disabled
    const pausedOperations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        // Only include operations from production orders that are PENDING (not started yet) or PAUSED
        productionOrder: {
          status: { in: [Status.PENDING] }
        }
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        workCenter: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Transform active operations
    const activeTasks = operations.map(op => ({
      id: op.id,
      description: `${op.productionOrder.product.name} (${op.productionOrder.product.sku})`,
      startDate: op.startTime,
      dueDate: op.endTime,
      status: op.status,
      priority: op.productionOrder.priority,
      notes: op.notes,
      productionOrderId: op.productionOrderId,
      workCenterId: op.workCenterId,
      workCenterName: op.workCenter.name,
      quantity: op.productionOrder.quantity,
      productionStatus: op.productionOrder.status,
      isActive: true
    }));

    // Transform paused/pending operations
    const pausedTasks = pausedOperations.map(op => ({
      id: op.id,
      description: `${op.productionOrder.product.name} (${op.productionOrder.product.sku})`,
      startDate: op.startTime,
      dueDate: op.endTime,
      status: op.status,
      priority: op.productionOrder.priority,
      notes: op.notes,
      productionOrderId: op.productionOrderId,
      workCenterId: op.workCenterId,
      workCenterName: op.workCenter.name,
      quantity: op.productionOrder.quantity,
      productionStatus: op.productionOrder.status,
      isActive: false
    }));

    // Return both active and paused tasks
    return [...activeTasks, ...pausedTasks];
  } catch (error) {
    console.error("Error fetching worker tasks:", error);
    throw new Error("Failed to fetch tasks");
  }
}

// Get today's tasks
export async function getTodaysTasks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true }
    });

    const workCenterIds = userWorkCenters.map(uwc => uwc.workCenterId);

    // Get operations for these work centers that are due today
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        OR: [
          { startTime: { gte: today, lt: tomorrow } },
          { endTime: { gte: today, lt: tomorrow } },
          { status: Status.IN_PROGRESS }
        ]
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        workCenter: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { startTime: 'asc' }
      ],
      take: 5 // Limit to top 5 for dashboard
    });

    return operations.map(op => ({
      id: op.id,
      description: `${op.productionOrder.product.name} (${op.productionOrder.product.sku})`,
      startDate: op.startTime,
      dueDate: op.endTime,
      status: op.status,
      priority: op.productionOrder.priority,
      workCenterName: op.workCenter.name,
      quantity: op.productionOrder.quantity
    }));
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    throw new Error("Failed to fetch today's tasks");
  }
}

// Update task status
export async function updateTaskStatus(data: TaskUpdateInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Update the operation
    await prisma.operation.update({
      where: { id: data.id },
      data: {
        status: data.status,
        notes: data.notes,
        performedById: session.user.id,
        modifiedBy: session.user.id
      }
    });

    // Log the activity manually in your database
    try {
      const details = JSON.stringify({
        taskId: data.id,
        newStatus: data.status,
        timeSpent: data.timeSpent
      });

      await prisma.$executeRaw`
        INSERT INTO "ActivityLog" (type, "userId", details, "createdAt")
        VALUES ('TASK_UPDATE', ${session.user.id}, ${details}, NOW())
      `;
    } catch (logError) {
      console.error("Failed to log activity but task was updated:", logError);
    }

    revalidatePath("/worker/tasks");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating task status:", error);
    throw new Error("Failed to update task status");
  }
}

// Get task statistics
export async function getTaskStatistics(): Promise<TaskStatistics> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Find the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true }
    });

    const workCenterIds = userWorkCenters.map(uwc => uwc.workCenterId);

    // Get counts for each status
    const pending = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: Status.PENDING
      }
    });

    const inProgress = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: Status.IN_PROGRESS
      }
    });

    // Get today's completed tasks
    const completed = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: Status.COMPLETED,
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Count urgent tasks
    const urgentTasks = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: {
          priority: "URGENT"
        }
      }
    });
    
    // Count active tasks (from IN_PROGRESS production orders)
    const activeTasks = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: {
          status: Status.IN_PROGRESS
        }
      }
    });
    
    // Count inactive tasks (from PENDING production orders)
    const inactiveTasks = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: {
          status: Status.PENDING
        }
      }
    });

    const total = pending + inProgress;
    const completionRate = total > 0 ? (completed / (total + completed)) * 100 : 0;

    return {
      pending,
      inProgress,
      completed,
      total: total + completed,
      urgentTasks,
      completionRate,
      activeTasks,
      inactiveTasks
    };
  } catch (error) {
    console.error("Error getting task statistics:", error);
    return {
      pending: 0,
      inProgress: 0,
      completed: 0,
      total: 0,
      urgentTasks: 0,
      completionRate: 0,
      activeTasks: 0,
      inactiveTasks: 0
    };
  }
}

// Start tracking time for a task - simplified version
export async function startTaskTimer(taskId: string): Promise<TaskTimeTracking> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const startTime = new Date();

    // Update operation status to IN_PROGRESS if it's PENDING
    await prisma.operation.updateMany({
      where: {
        id: taskId,
        status: Status.PENDING
      },
      data: {
        status: Status.IN_PROGRESS,
        modifiedBy: session.user.id
      }
    });

    revalidatePath("/worker/tasks");
    revalidatePath("/worker/dashboard");
    revalidatePath("/worker/production/tracking");

    return {
      taskId,
      startTime,
      isActive: true
    };
  } catch (error) {
    console.error("Error starting task timer:", error);
    throw new Error("Failed to start timer");
  }
}

// Stop tracking time for a task - simplified version
export async function stopTaskTimer(taskId: string): Promise<TaskTimeTracking> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - 30); // Assume 30 min session for demo
    const endTime = new Date();
    const durationMinutes = 30; // Use fixed duration for demo

    // Update operation modified info
    await prisma.operation.update({
      where: { id: taskId },
      data: {
        modifiedBy: session.user.id
      }
    });

    revalidatePath("/worker/tasks");
    revalidatePath("/worker/dashboard");
    revalidatePath("/worker/production/tracking");

    return {
      taskId,
      startTime,
      endTime,
      duration: durationMinutes,
      isActive: false
    };
  } catch (error) {
    console.error("Error stopping task timer:", error);
    throw new Error("Failed to stop timer");
  }
}

// Report an issue with a task - simplified version
export async function reportTaskIssue(
  taskId: string,
  issueType: "QUALITY" | "MATERIAL" | "EQUIPMENT" | "OTHER",
  description: string,
  severity: "LOW" | "MEDIUM" | "HIGH"
): Promise<TaskReport> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const now = new Date();

    // Get existing notes for the operation
    const operation = await prisma.operation.findUnique({
      where: { id: taskId },
      select: { notes: true }
    });

    // Add a note to the operation about the issue
    await prisma.operation.update({
      where: { id: taskId },
      data: {
        notes: `ISSUE REPORTED: ${issueType} - ${description} [${severity} severity]\n\nPrevious notes: ${operation?.notes || ""}`,
        modifiedBy: session.user.id
      }
    });

    revalidatePath("/worker/tasks");
    revalidatePath("/worker/dashboard");

    return {
      taskId,
      issueType,
      description,
      severity,
      status: "OPEN",
      reportedAt: now
    };
  } catch (error) {
    console.error("Error reporting task issue:", error);
    throw new Error("Failed to report issue");
  }
} 