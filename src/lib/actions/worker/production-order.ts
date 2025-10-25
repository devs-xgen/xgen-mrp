// Add this to your existing production-order actions file
// src/lib/actions/production-order.ts

"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";

// Types for worker tasks
export interface WorkerTask {
  id: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  status: Status;
  priority: string;
  notes: string | null;
  productionOrderId: string;
  workCenterId: string;
  workCenterName: string;
  quantity: number;
  productionStatus: Status;
  isActive: boolean;
  productName: string;
  productSku: string;
}

export interface WorkerTaskStatistics {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
  urgentTasks: number;
  completionRate: number;
  activeTasks: number;
  inactiveTasks: number;
}

export interface TaskUpdateInput {
  id: string;
  status: Status;
  notes?: string;
  timeSpent?: number;
}

// Get tasks assigned to the current worker
export async function getMyWorkerTasks(): Promise<WorkerTask[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Find the worker's assigned work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    if (workCenterIds.length === 0) {
      return []; // Worker has no assigned work centers
    }

    // Get operations for these work centers from active production orders
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS, Status.COMPLETED] },
        // Only include operations from production orders that are IN_PROGRESS
        productionOrder: {
          status: { in: [Status.IN_PROGRESS, Status.COMPLETED] },
        },
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                displayName: true,
                sku: true,
              },
            },
          },
        },
        workCenter: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startTime: "asc" }],
    });

    // Also get operations from PENDING production orders to show them as disabled
    const pendingOperations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: {
          status: Status.PENDING,
        },
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                displayName: true,
                sku: true,
              },
            },
          },
        },
        workCenter: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startTime: "asc" }],
    });

    // Transform active operations
    const activeTasks: WorkerTask[] = operations.map((op) => ({
      id: op.id,
      description: `${op.productionOrder.product.name}${op.productionOrder.productVariant ? ` - ${op.productionOrder.productVariant.displayName}` : ""} (${op.productionOrder.product.sku})`,
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
      isActive: true,
      productName: op.productionOrder.product.name,
      productSku: op.productionOrder.product.sku,
    }));

    // Transform pending operations
    const inactiveTasks: WorkerTask[] = pendingOperations.map((op) => ({
      id: op.id,
      description: `${op.productionOrder.product.name}${op.productionOrder.productVariant ? ` - ${op.productionOrder.productVariant.displayName}` : ""} (${op.productionOrder.product.sku})`,
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
      isActive: false,
      productName: op.productionOrder.product.name,
      productSku: op.productionOrder.product.sku,
    }));

    return [...activeTasks, ...inactiveTasks];
  } catch (error) {
    console.error("Error fetching worker tasks:", error);
    throw new Error("Failed to fetch tasks");
  }
}

// Get today's tasks for worker
export async function getTodaysWorkerTasks() {
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
      select: { workCenterId: true },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    // Get operations for these work centers that are due today
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        productionOrder: {
          status: Status.IN_PROGRESS,
        },
        OR: [
          { startTime: { gte: today, lt: tomorrow } },
          { endTime: { gte: today, lt: tomorrow } },
          { status: Status.IN_PROGRESS },
        ],
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        workCenter: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startTime: "asc" }],
      take: 5,
    });

    return operations.map((op) => ({
      id: op.id,
      description: `${op.productionOrder.product.name} (${op.productionOrder.product.sku})`,
      startDate: op.startTime,
      dueDate: op.endTime,
      status: op.status,
      priority: op.productionOrder.priority,
      workCenterName: op.workCenter.name,
      quantity: op.productionOrder.quantity,
    }));
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    throw new Error("Failed to fetch today's tasks");
  }
}

// Update worker task status
export async function updateWorkerTaskStatus(data: TaskUpdateInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get operation details before update
    const operation = await prisma.operation.findUnique({
      where: { id: data.id },
      include: {
        productionOrder: {
          select: {
            id: true,
            status: true,
          },
        },
        workCenter: true,
      },
    });

    if (!operation) {
      throw new Error("Operation not found");
    }

    // Check if worker has access to this work center
    const hasAccess = await prisma.userWorkCenter.findFirst({
      where: {
        userId: session.user.id,
        workCenterId: operation.workCenterId,
      },
    });

    if (!hasAccess) {
      throw new Error("You don't have permission to update this task");
    }

    const productionOrderId = operation.productionOrderId;
    const previousStatus = operation.status;

    // Validate production order is in progress
    if (operation.productionOrder.status !== Status.IN_PROGRESS) {
      throw new Error(
        "Cannot update task. Production order must be in progress."
      );
    }

    // Update the operation
    await prisma.operation.update({
      where: { id: data.id },
      data: {
        status: data.status,
        notes: data.notes,
        performedById: session.user.id,
        modifiedBy: session.user.id,
      },
    });

    // Check if all work center operations are complete
    let allWorkCenterOperationsComplete = false;
    let inspectionReadiness = false;

    if (data.status === "COMPLETED" && previousStatus !== "COMPLETED") {
      // Check if all work center operations are now complete
      const { checkWorkCenterCompletion } = await import(
        "@/lib/actions/production-order"
      );
      const workCenterStatus =
        await checkWorkCenterCompletion(productionOrderId);
      allWorkCenterOperationsComplete = workCenterStatus.allCompleted;

      if (allWorkCenterOperationsComplete) {
        // All work center operations complete - inspection can now start
        const { getProductionPhaseStatus } = await import(
          "@/lib/actions/production-order"
        );
        const phaseStatus = await getProductionPhaseStatus(productionOrderId);
        inspectionReadiness = phaseStatus.canStartInspection;

        // Log that worker task completion enabled inspection
        try {
          await prisma.activityLog.create({
            data: {
              type: "WORKER_TASK_ENABLED_INSPECTION",
              userId: session.user.id,
              details: {
                taskId: data.id,
                productionOrderId,
                workCenterStatus,
                inspectionReadiness,
                message: "Worker task completion triggered inspection readiness",
              },
            },
          });
        } catch (logError) {
          console.error("Failed to log worker task completion:", logError);
        }

        // Send notifications to inspectors
        try {
          const { notifyInspectorsWorkCenterCompleted } = await import(
            "@/lib/actions/notifications"
          );
          const notificationResult = await notifyInspectorsWorkCenterCompleted(
            productionOrderId,
            session.user.id
          );

          if (notificationResult.success) {
            console.log(
              "Successfully notified inspectors:",
              notificationResult.message
            );
          }
        } catch (notificationError) {
          console.error(
            "Error sending work center completion notifications:",
            notificationError
          );
        }
      }
    }

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          type: "WORKER_TASK_UPDATE",
          userId: session.user.id,
          details: {
            taskId: data.id,
            newStatus: data.status,
            previousStatus,
            timeSpent: data.timeSpent,
            inspectionReadiness,
            allWorkCenterOperationsComplete,
            productionOrderId,
            workCenterName: operation.workCenter.name,
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    revalidatePath("/worker/tasks");
    revalidatePath("/worker/dashboard");
    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return {
      success: true,
      inspectionReadiness,
      allWorkCenterOperationsComplete,
      message: inspectionReadiness
        ? "Worker task completed! All work center operations are done - inspection can now start."
        : "Worker task updated successfully.",
    };
  } catch (error) {
    console.error("Error updating worker task status:", error);
    throw error;
  }
}

// Update operation (edit operation details)
export async function updateOperation(
  operationId: string,
  data: {
    workCenterId: string;
    startTime: Date;
    endTime: Date;
    notes?: string | null;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Validate the operation exists
    const existingOperation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        productionOrder: true,
      },
    });

    if (!existingOperation) {
      throw new Error("Operation not found");
    }

    // Check if user has access to this work center
    const hasAccess = await prisma.userWorkCenter.findFirst({
      where: {
        userId: session.user.id,
        workCenterId: existingOperation.workCenterId,
      },
    });

    // Allow admins to edit, or workers who have access to the work center
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && !hasAccess) {
      throw new Error(
        "You don't have permission to edit this operation"
      );
    }

    // Only allow editing if status is PENDING
    if (existingOperation.status !== "PENDING") {
      throw new Error(
        "Only pending operations can be edited. Operations in progress or completed cannot be modified."
      );
    }

    // Validate the work center exists
    const workCenter = await prisma.workCenter.findUnique({
      where: { id: data.workCenterId },
    });

    if (!workCenter) {
      throw new Error("Work center not found");
    }

    // Validate dates
    if (data.endTime <= data.startTime) {
      throw new Error("End time must be after start time");
    }

    // Update the operation
    const updatedOperation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        workCenterId: data.workCenterId,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        modifiedBy: session.user.id,
      },
      include: {
        workCenter: true,
      },
    });

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          type: "OPERATION_UPDATED",
          userId: session.user.id,
          details: {
            operationId,
            productionOrderId: existingOperation.productionOrderId,
            changes: {
              workCenterId: data.workCenterId,
              startTime: data.startTime,
              endTime: data.endTime,
              notes: data.notes,
            },
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log operation update:", logError);
    }

    // Revalidate the production order page
    revalidatePath(`/production-orders/${existingOperation.productionOrderId}`);
    revalidatePath(`/worker/tasks/${existingOperation.productionOrderId}`);

    return updatedOperation;
  } catch (error) {
    console.error("Error updating operation:", error);
    throw error;
  }
}

// Get worker task statistics
export async function getWorkerTaskStatistics(): Promise<WorkerTaskStatistics> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Find the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    // Get counts for each status
    const pending = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: Status.PENDING,
        productionOrder: {
          status: Status.IN_PROGRESS,
        },
      },
    });

    const inProgress = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: Status.IN_PROGRESS,
      },
    });

    // Get today's completed tasks
    const completed = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: Status.COMPLETED,
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    // Count urgent tasks
    const urgentTasks = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: {
          priority: "URGENT",
          status: Status.IN_PROGRESS,
        },
      },
    });

    // Count active tasks (from IN_PROGRESS production orders)
    const activeTasks = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: {
          status: Status.IN_PROGRESS,
        },
      },
    });

    // Count inactive tasks (from PENDING production orders)
    const inactiveTasks = await prisma.operation.count({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: {
          status: Status.PENDING,
        },
      },
    });

    const total = pending + inProgress;
    const completionRate =
      total > 0 ? (completed / (total + completed)) * 100 : 0;

    return {
      pending,
      inProgress,
      completed,
      total: total + completed,
      urgentTasks,
      completionRate,
      activeTasks,
      inactiveTasks,
    };
  } catch (error) {
    console.error("Error getting worker task statistics:", error);
    return {
      pending: 0,
      inProgress: 0,
      completed: 0,
      total: 0,
      urgentTasks: 0,
      completionRate: 0,
      activeTasks: 0,
      inactiveTasks: 0,
    };
  }
}

// Get all worker-related operations (for admins)
export async function getAllWorkerTasks(): Promise<WorkerTask[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      throw new Error("Only admins can view all worker tasks");
    }

    const operations = await prisma.operation.findMany({
      where: {
        status: { in: [Status.PENDING, Status.IN_PROGRESS, Status.COMPLETED] },
        productionOrder: {
          status: {
            in: [Status.IN_PROGRESS, Status.COMPLETED, Status.PENDING],
          },
        },
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        workCenter: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startTime: "asc" }],
    });

    return operations.map((op) => ({
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
      isActive: op.productionOrder.status !== Status.PENDING,
      productName: op.productionOrder.product.name,
      productSku: op.productionOrder.product.sku,
    }));
  } catch (error) {
    console.error("Error fetching all worker tasks:", error);
    throw new Error("Failed to fetch all worker tasks");
  }
}


export async function updateOperation(
  operationId: string,
  data: {
    workCenterId: string;
    startTime: Date;
    endTime: Date;
    notes?: string | null;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Validate the operation exists
    const existingOperation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        productionOrder: true,
      },
    });

    if (!existingOperation) {
      throw new Error("Operation not found");
    }

    // Check if user has access to this work center
    const hasAccess = await prisma.userWorkCenter.findFirst({
      where: {
        userId: session.user.id,
        workCenterId: existingOperation.workCenterId,
      },
    });

    // Allow admins to edit, or workers who have access to the work center
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && !hasAccess) {
      throw new Error(
        "You don't have permission to edit this operation"
      );
    }

    // Only allow editing if status is PENDING
    if (existingOperation.status !== "PENDING") {
      throw new Error(
        "Only pending operations can be edited. Operations in progress or completed cannot be modified."
      );
    }

    // Validate the work center exists
    const workCenter = await prisma.workCenter.findUnique({
      where: { id: data.workCenterId },
    });

    if (!workCenter) {
      throw new Error("Work center not found");
    }

    // Validate dates
    if (data.endTime <= data.startTime) {
      throw new Error("End time must be after start time");
    }

    // Update the operation
    const updatedOperation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        workCenterId: data.workCenterId,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        modifiedBy: session.user.id,
      },
      include: {
        workCenter: true,
      },
    });

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          type: "OPERATION_UPDATED",
          userId: session.user.id,
          details: {
            operationId,
            productionOrderId: existingOperation.productionOrderId,
            changes: {
              workCenterId: data.workCenterId,
              startTime: data.startTime,
              endTime: data.endTime,
              notes: data.notes,
            },
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log operation update:", logError);
    }

    // Revalidate the production order page
    revalidatePath(`/production-orders/${existingOperation.productionOrderId}`);
    revalidatePath(`/worker/tasks/${existingOperation.productionOrderId}`);

    return updatedOperation;
  } catch (error) {
    console.error("Error updating operation:", error);
    throw error;
  }
}