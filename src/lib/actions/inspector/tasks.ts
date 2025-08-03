"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import {
  TaskUpdateInput,
  TaskStatistics,
  TaskTimeTracking,
  TaskReport,
  InspectorsTask,
} from "@/types/inspector/task";

// Get tasks assigned to the current inspector
export async function getMyTasks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Find the inspector's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    // Get operations for these work centers
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS, Status.COMPLETED] },
        // Only include operations from production orders that are IN_PROGRESS or COMPLETED
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

    // Also get operations from PENDING/PAUSED production orders to show them as disabled
    const pausedOperations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        // Only include operations from production orders that are PENDING (not started yet) or PAUSED
        productionOrder: {
          status: { in: [Status.PENDING] },
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

    // Transform active operations
    const activeTasks = operations.map((op) => ({
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
      isActive: true,
    }));

    // Transform paused/pending operations
    const pausedTasks = pausedOperations.map((op) => ({
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
      isActive: false,
    }));

    // Return both active and paused tasks
    return [...activeTasks, ...pausedTasks];
  } catch (error) {
    console.error("Error fetching inspector tasks:", error);
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

    // Find the inspector's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    // Get operations for these work centers that are due today
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
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
      take: 5, // Limit to top 5 for dashboard
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

// Update task status with sequential workflow validation
export async function updateTaskStatus(data: TaskUpdateInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get operation details before update to track dependency validation
    const operation = await prisma.operation.findUnique({
      where: { id: data.id },
      include: {
        productionOrder: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!operation) {
      throw new Error("Operation not found");
    }

    const productionOrderId = operation.productionOrderId;
    const previousStatus = operation.status;

    // SEQUENTIAL WORKFLOW VALIDATION: Check if work centers are complete before allowing inspector operations
    if (data.status === "IN_PROGRESS" || data.status === "COMPLETED") {
      const { checkWorkCenterCompletion } = await import(
        "@/lib/actions/production-order"
      );
      const workCenterStatus =
        await checkWorkCenterCompletion(productionOrderId);

      if (!workCenterStatus.allCompleted) {
        const errorMessage = [
          `Cannot update inspector task to ${data.status} because work center operations are not complete.`,
          `Progress: ${workCenterStatus.completedCount}/${workCenterStatus.totalOperations} (${workCenterStatus.completionPercentage}%)`,
          "All work center operations must be completed before inspection tasks can begin.",
          `Remaining operations: ${workCenterStatus.totalOperations - workCenterStatus.completedCount}`,
        ].join(" ");

        throw new Error(errorMessage);
      }
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

    // Check if this completion affects delivery readiness
    let deliveryReadiness = false;
    let allInspectionsComplete = false;
    const automaticTransitions = [];

    if (data.status === "COMPLETED" && previousStatus !== "COMPLETED") {
      // Check if all inspections are now complete for this production order
      const { checkInspectionCompletion, getProductionPhaseStatus } =
        await import("@/lib/actions/production-order");

      const inspectionStatus =
        await checkInspectionCompletion(productionOrderId);
      allInspectionsComplete = inspectionStatus.allCompleted;

      if (allInspectionsComplete) {
        // All inspections complete - delivery can now start
        const phaseStatus = await getProductionPhaseStatus(productionOrderId);
        deliveryReadiness = phaseStatus.canStartDelivery;

        // Log that inspector task completion enabled delivery
        try {
          await prisma.activityLog.create({
            data: {
              type: "INSPECTOR_TASK_ENABLED_DELIVERY",
              userId: session.user.id,
              details: {
                taskId: data.id,
                productionOrderId,
                inspectionStatus,
                deliveryReadiness,
                message:
                  "Inspector task completion triggered delivery readiness",
              },
            },
          });
        } catch (logError) {
          console.error("Failed to log inspector task completion:", logError);
        }

        // Send notifications to delivery personnel
        try {
          const { notifyDeliveryInspectionsCompleted } = await import(
            "@/lib/actions/notifications"
          );
          const notificationResult = await notifyDeliveryInspectionsCompleted(
            productionOrderId,
            session.user.id
          );

          if (notificationResult.success) {
            console.log(
              "Successfully notified delivery personnel:",
              notificationResult.message
            );
            automaticTransitions.push({
              type: "NOTIFICATION_SENT",
              target: "DELIVERY_PERSONNEL",
              message: notificationResult.message,
            });
          } else {
            console.error(
              "Failed to notify delivery personnel:",
              notificationResult.error
            );
          }
        } catch (notificationError) {
          console.error(
            "Error sending inspection completion notifications:",
            notificationError
          );
        }

        // Automatically create delivery assignment if it doesn't exist
        try {
          const existingDelivery = await prisma.deliveryAssignment.findUnique({
            where: { productionOrderId },
          });

          if (!existingDelivery) {
            // Find available delivery personnel
            const availableDeliveryUsers = await prisma.user.findMany({
              where: {
                role: "DELIVERY",
                status: "ACTIVE",
              },
              include: {
                profile: true,
              },
            });

            if (availableDeliveryUsers.length > 0) {
              // Auto-assign to the first available delivery person or use round-robin logic
              const selectedDeliveryUser = availableDeliveryUsers[0];

              // Get production order details for delivery address
              const productionOrderDetails =
                await prisma.productionOrder.findUnique({
                  where: { id: productionOrderId },
                  include: {
                    customerOrder: {
                      include: {
                        customer: true,
                      },
                    },
                    product: {
                      select: { name: true, sku: true },
                    },
                  },
                });

              const newDeliveryAssignment =
                await prisma.deliveryAssignment.create({
                  data: {
                    productionOrderId,
                    userId: selectedDeliveryUser.id,
                    status: "PENDING",
                    deliveryAddress:
                      productionOrderDetails?.customerOrder?.customer
                        ?.address || "Address to be confirmed",
                    notes: `Auto-created delivery assignment after inspection completion by ${session.user.email}`,
                    createdBy: session.user.id,
                  },
                });

              automaticTransitions.push({
                type: "DELIVERY_ASSIGNMENT_CREATED",
                target: "DELIVERY_PHASE",
                deliveryAssignmentId: newDeliveryAssignment.id,
                assignedDeliveryUser: selectedDeliveryUser.email,
                message:
                  "Delivery assignment automatically created and assigned",
              });

              console.log(
                `Auto-created delivery assignment ${newDeliveryAssignment.id} for production order ${productionOrderId}`
              );
            } else {
              console.warn(
                "No available delivery personnel found for auto-assignment"
              );
              automaticTransitions.push({
                type: "DELIVERY_ASSIGNMENT_CREATION_FAILED",
                target: "DELIVERY_PHASE",
                reason: "No available delivery personnel",
                message: "Manual delivery assignment required",
              });
            }
          } else {
            // Update existing delivery assignment to PENDING if it's not already active
            if (existingDelivery.status === "PENDING") {
              automaticTransitions.push({
                type: "DELIVERY_ASSIGNMENT_READY",
                target: "DELIVERY_PHASE",
                deliveryAssignmentId: existingDelivery.id,
                message: "Existing delivery assignment is now ready to proceed",
              });
            }
          }
        } catch (deliveryAssignmentError) {
          console.error(
            "Error managing delivery assignment:",
            deliveryAssignmentError
          );
          automaticTransitions.push({
            type: "DELIVERY_ASSIGNMENT_ERROR",
            target: "DELIVERY_PHASE",
            error: deliveryAssignmentError.message,
            message: "Failed to auto-create delivery assignment",
          });
        }
      }
    }

    // Log the activity manually in your database
    try {
      const details = JSON.stringify({
        taskId: data.id,
        newStatus: data.status,
        previousStatus,
        timeSpent: data.timeSpent,
        deliveryReadiness,
        allInspectionsComplete,
        productionOrderId,
      });

      await prisma.$executeRaw`
        INSERT INTO "ActivityLog" (type, "userId", details, "createdAt")
        VALUES ('INSPECTOR_TASK_UPDATE', ${session.user.id}, ${details}, NOW())
      `;
    } catch (logError) {
      console.error("Failed to log activity but task was updated:", logError);
    }

    revalidatePath("/inspector/tasks");
    revalidatePath("/inspector/dashboard");
    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return {
      success: true,
      deliveryReadiness,
      allInspectionsComplete,
      automaticTransitions,
      message: deliveryReadiness
        ? "Inspector task completed! All inspections are done - delivery can now start."
        : "Inspector task updated successfully.",
    };
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

    // Find the inspector's work centers
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
    console.error("Error getting task statistics:", error);
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

// Start tracking time for a task - simplified version
export async function startTaskTimer(
  taskId: string
): Promise<TaskTimeTracking> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const startTime = new Date();

    // Update operation status to IN_PROGRESS if it's PENDING
    await prisma.operation.updateMany({
      where: {
        id: taskId,
        status: Status.PENDING,
      },
      data: {
        status: Status.IN_PROGRESS,
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/inspector/tasks");
    revalidatePath("/inspector/dashboard");
    revalidatePath("/inspector/production/tracking");

    return {
      taskId,
      startTime,
      isActive: true,
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
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/inspector/tasks");
    revalidatePath("/inspector/dashboard");
    revalidatePath("/inspector/production/tracking");

    return {
      taskId,
      startTime,
      endTime,
      duration: durationMinutes,
      isActive: false,
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
      select: { notes: true },
    });

    // Add a note to the operation about the issue
    await prisma.operation.update({
      where: { id: taskId },
      data: {
        notes: `ISSUE REPORTED: ${issueType} - ${description} [${severity} severity]\n\nPrevious notes: ${operation?.notes || ""}`,
        modifiedBy: session.user.id,
      },
    });
    // Create activity log for task issue report
    try {
      await prisma.activityLog.create({
        data: {
          type: "TASK_ISSUE_REPORTED",
          userId: session.user.id,
          details: {
            taskId,
            issueType,
            description,
            severity,
            reportedAt: now,
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log activity for task issue report:", logError);
    }

    revalidatePath("/inspector/tasks");
    revalidatePath("/inspector/dashboard");

    return {
      taskId,
      issueType,
      description,
      severity,
      status: "OPEN",
      reportedAt: now,
    };
  } catch (error) {
    console.error("Error reporting task issue:", error);
    throw new Error("Failed to report issue");
  }
}

// Get all production tasks
export async function getProductionTasks(): Promise<InspectorsTask[]> {
  try {
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
      title: op.productionOrder.product.name,
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
    }));
  } catch (error) {
    console.error("Error fetching production tasks:", error);
    throw new Error("Failed to fetch production tasks");
  }
}

// Get production task statistics
export async function getProductionTaskStatistics(): Promise<TaskStatistics> {
  try {
    const pending = await prisma.operation.count({
      where: { status: Status.PENDING },
    });

    const inProgress = await prisma.operation.count({
      where: { status: Status.IN_PROGRESS },
    });

    const completed = await prisma.operation.count({
      where: {
        status: Status.COMPLETED,
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const urgentTasks = await prisma.operation.count({
      where: {
        status: { in: [Status.PENDING, Status.IN_PROGRESS] },
        productionOrder: { priority: "URGENT" },
      },
    });

    const activeTasks = await prisma.operation.count({
      where: {
        productionOrder: { status: Status.IN_PROGRESS },
      },
    });

    const inactiveTasks = await prisma.operation.count({
      where: {
        productionOrder: { status: Status.PENDING },
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
    console.error("Error getting production task statistics:", error);
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

// Get single production task by ID
export async function getProductionTaskById(
  id: string
): Promise<InspectorsTask> {
  try {
    const operation = await prisma.operation.findUnique({
      where: { id },
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
    });

    if (!operation) throw new Error("Task not found");

    return {
      id: operation.id,
      title: operation.productionOrder.product.name,
      description: `${operation.productionOrder.product.name} (${operation.productionOrder.product.sku})`,
      startDate: operation.startTime,
      dueDate: operation.endTime,
      status: operation.status,
      priority: operation.productionOrder.priority,
      notes: operation.notes,
      productionOrderId: operation.productionOrderId,
      workCenterId: operation.workCenterId,
      workCenterName: operation.workCenter.name,
      quantity: operation.productionOrder.quantity,
      productionStatus: operation.productionOrder.status,
      isActive: operation.productionOrder.status !== Status.PENDING,
    };
  } catch (error) {
    console.error("Error fetching production task:", error);
    throw new Error("Failed to fetch production task");
  }
}

// Check if inspector can start working on quality checks for a production order
export async function canStartInspection(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Import the phase checking functions
    const { checkWorkCenterCompletion, getProductionPhaseStatus } =
      await import("@/lib/actions/production-order");

    // Check if work centers are complete
    const workCenterStatus = await checkWorkCenterCompletion(productionOrderId);
    const phaseStatus = await getProductionPhaseStatus(productionOrderId);

    return {
      canStart: workCenterStatus.allCompleted,
      workCenterStatus,
      currentPhase: phaseStatus.currentPhase,
      blockingReasons: workCenterStatus.allCompleted
        ? []
        : [
            `Work center operations incomplete: ${workCenterStatus.completedCount}/${workCenterStatus.totalOperations} (${workCenterStatus.completionPercentage}%)`,
            `Remaining operations: ${workCenterStatus.totalOperations - workCenterStatus.completedCount}`,
          ],
      recommendations: workCenterStatus.allCompleted
        ? ["All work centers complete - you can start inspections"]
        : [
            "Complete all work center operations before starting quality inspections",
          ],
    };
  } catch (error) {
    console.error("Error checking inspection readiness:", error);
    throw new Error("Failed to check inspection readiness");
  }
}

// Get inspector tasks with dependency status
export async function getInspectorTasksWithDependencies() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get assigned quality checks
    const qualityChecks = await prisma.qualityCheck.findMany({
      where: {
        inspectorId: session.user.id,
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
      },
      orderBy: [{ status: "asc" }, { checkDate: "asc" }],
    });

    // Get operations assigned to inspector
    const operations = await prisma.operation.findMany({
      where: {
        assignedToId: session.user.id,
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

    // Import the dependency checking functions
    const { checkWorkCenterCompletion, getProductionPhaseStatus } =
      await import("@/lib/actions/production-order");

    // Enhance tasks with dependency information
    const enhancedQualityChecks = await Promise.all(
      qualityChecks.map(async (qc) => {
        const workCenterStatus = await checkWorkCenterCompletion(
          qc.productionOrderId
        );
        const phaseStatus = await getProductionPhaseStatus(
          qc.productionOrderId
        );

        return {
          id: qc.id,
          type: "quality_check" as const,
          description: `Quality Check: ${qc.productionOrder.product.name} (${qc.productionOrder.product.sku})`,
          status: qc.status,
          dueDate: qc.checkDate,
          productionOrderId: qc.productionOrderId,
          quantity: qc.productionOrder.quantity,
          canStart: workCenterStatus.allCompleted,
          dependencyStatus: workCenterStatus,
          currentPhase: phaseStatus.currentPhase,
          blocked: !workCenterStatus.allCompleted,
          blockingReason: workCenterStatus.allCompleted
            ? null
            : `Work centers incomplete: ${workCenterStatus.completionPercentage}%`,
        };
      })
    );

    const enhancedOperations = await Promise.all(
      operations.map(async (op) => {
        const workCenterStatus = await checkWorkCenterCompletion(
          op.productionOrderId
        );
        const phaseStatus = await getProductionPhaseStatus(
          op.productionOrderId
        );

        return {
          id: op.id,
          type: "operation" as const,
          description: `${op.productionOrder.product.name} - ${op.workCenter.name}`,
          status: op.status,
          dueDate: op.endTime,
          productionOrderId: op.productionOrderId,
          quantity: op.productionOrder.quantity,
          canStart: workCenterStatus.allCompleted,
          dependencyStatus: workCenterStatus,
          currentPhase: phaseStatus.currentPhase,
          blocked: !workCenterStatus.allCompleted,
          blockingReason: workCenterStatus.allCompleted
            ? null
            : `Work centers incomplete: ${workCenterStatus.completionPercentage}%`,
        };
      })
    );

    return {
      qualityChecks: enhancedQualityChecks,
      operations: enhancedOperations,
      totalTasks: enhancedQualityChecks.length + enhancedOperations.length,
      blockedTasks: [...enhancedQualityChecks, ...enhancedOperations].filter(
        (task) => task.blocked
      ).length,
    };
  } catch (error) {
    console.error("Error fetching inspector tasks with dependencies:", error);
    throw new Error("Failed to fetch inspector tasks with dependencies");
  }
}


export async function getInspectorTasks() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Find the inspector's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true },
    })

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId)

    // Get operations for these work centers that are due today
    const operations = await prisma.operation.findMany({
      where: {
        workCenterId: { in: workCenterIds },
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
      take: 5, // Limit to top 5 for dashboard
    })

    return operations.map((op) => ({
      id: op.id,
      title: op.productionOrder.product.name,
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
      isActive: true, // Default to true for simplicity
    }))
  } catch (error) {
    console.error("Error fetching inspector tasks:", error)
    throw new Error("Failed to fetch inspector tasks")
  }
}


// Update task status function
export async function updatesTaskStatus({
  id,
  status,
  notes,
}: {
  id: string
  status: Status
  notes?: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Update the operation status
    const updatedOperation = await prisma.operation.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        // Update timestamps based on status
        ...(status === Status.IN_PROGRESS && {
          actualStartTime: new Date(),
        }),
        ...(status === Status.COMPLETED && {
          actualEndTime: new Date(),
        }),
      },
      include: {
        productionOrder: true,
      },
    })

    // If operation is completed, check if we should update production order status
    if (status === Status.COMPLETED) {
      // Check if all operations for this production order are completed
      const allOperations = await prisma.operation.findMany({
        where: {
          productionOrderId: updatedOperation.productionOrderId,
        },
      })

      const allCompleted = allOperations.every((op) => op.status === Status.COMPLETED)

      if (allCompleted) {
        // Update production order status to completed
        await prisma.productionOrder.update({
          where: { id: updatedOperation.productionOrderId },
          data: {
            status: Status.COMPLETED,
            actualEndDate: new Date(),
          },
        })
      } else {
        // If at least one operation is in progress, update production order to in progress
        const hasInProgress = allOperations.some((op) => op.status === Status.IN_PROGRESS)
        if (hasInProgress && updatedOperation.productionOrder.status === Status.PENDING) {
          await prisma.productionOrder.update({
            where: { id: updatedOperation.productionOrderId },
            data: {
              status: Status.IN_PROGRESS,
              actualStartDate: new Date(),
            },
          })
        }
      }
    }

    // If operation is started, update production order to in progress if it's still pending
    if (status === Status.IN_PROGRESS && updatedOperation.productionOrder.status === Status.PENDING) {
      await prisma.productionOrder.update({
        where: { id: updatedOperation.productionOrderId },
        data: {
          status: Status.IN_PROGRESS,
          actualStartDate: new Date(),
        },
      })
    }

    return { success: true, operation: updatedOperation }
  } catch (error) {
    console.error("Error updating task status:", error)
    return { success: false, error: "Failed to update task status" }
  }
}
