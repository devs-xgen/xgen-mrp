import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Status } from "@prisma/client";

// Types for notifications
export interface WorkflowNotification {
  id: string;
  type:
    | "WORK_CENTERS_COMPLETED"
    | "INSPECTIONS_COMPLETED"
    | "DELIVERY_READY"
    | "PRODUCTION_STARTED";
  title: string;
  message: string;
  productionOrderId: string;
  recipientRole: "WORKER" | "INSPECTOR" | "DELIVERY" | "ADMIN";
  recipientId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  metadata: any;
  createdAt: Date;
  isRead: boolean;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  notificationIds?: string[];
  error?: string;
}

/**
 * Send notification when work centers are completed to enable inspections
 * @param productionOrderId The production order ID
 * @param completedByUserId The user who completed the last work center operation
 * @returns Notification result
 */
export async function notifyInspectorsWorkCentersCompleted(
  productionOrderId: string,
  completedByUserId: string
): Promise<NotificationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get production order details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: { select: { name: true, sku: true } },
        qualityChecks: {
          include: {
            inspector: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
        operations: {
          include: {
            workCenter: { select: { name: true } },
          },
        },
      },
    });

    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    // Get all inspectors assigned to this production order
    const assignedInspectors = productionOrder.qualityChecks
      .map((qc) => qc.inspector?.user)
      .filter(Boolean)
      .filter(
        (user, index, self) =>
          self.findIndex((u) => u?.id === user?.id) === index
      ); // Remove duplicates

    // If no specific inspectors assigned, get all active inspectors
    const inspectors =
      assignedInspectors.length > 0
        ? assignedInspectors
        : await prisma.user.findMany({
            where: {
              role: "INSPECTOR",
              status: "ACTIVE",
            },
            select: { id: true, email: true },
          });

    if (inspectors.length === 0) {
      return {
        success: false,
        message: "No inspectors found to notify",
        error: "No active inspectors available",
      };
    }

    // Create notifications for each inspector
    const notificationPromises = inspectors.map(async (inspector) => {
      return await prisma.activityLog.create({
        data: {
          type: "WORKFLOW_NOTIFICATION",
          userId: inspector!.id,
          details: {
            notificationType: "WORK_CENTERS_COMPLETED",
            title: "Work Centers Completed - Inspection Ready",
            message: `All work center operations for ${productionOrder.product.name} (${productionOrder.product.sku}) have been completed. Quality inspection can now begin.`,
            productionOrderId,
            productName: productionOrder.product.name,
            productSku: productionOrder.product.sku,
            completedByUserId,
            priority: "HIGH",
            actionRequired: true,
            actionUrl: `/inspector/production/${productionOrderId}`,
            workCenterOperations: productionOrder.operations.map((op) => ({
              workCenter: op.workCenter.name,
              status: op.status,
            })),
            metadata: {
              canStartInspection: true,
              totalOperations: productionOrder.operations.length,
              completedOperations: productionOrder.operations.filter(
                (op) => op.status === "COMPLETED"
              ).length,
            },
          },
        },
      });
    });

    const notifications = await Promise.all(notificationPromises);
    const notificationIds = notifications.map((n) => n.id);

    // Log the broadcast event
    await prisma.activityLog.create({
      data: {
        type: "NOTIFICATION_BROADCAST",
        userId: session.user.id,
        details: {
          event: "WORK_CENTERS_COMPLETED_NOTIFICATION",
          productionOrderId,
          recipientRole: "INSPECTOR",
          recipientCount: inspectors.length,
          notificationIds,
          triggeredBy: completedByUserId,
          message: `Notified ${inspectors.length} inspector(s) that work centers are completed for production order ${productionOrderId}`,
        },
      },
    });

    return {
      success: true,
      message: `Successfully notified ${inspectors.length} inspector(s) that work centers are completed`,
      notificationIds,
    };
  } catch (error) {
    console.error("Error notifying inspectors:", error);
    return {
      success: false,
      message: "Failed to notify inspectors",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification when inspections are completed to enable delivery
 * @param productionOrderId The production order ID
 * @param completedByInspectorId The inspector who completed the last quality check
 * @returns Notification result
 */
export async function notifyDeliveryInspectionsCompleted(
  productionOrderId: string,
  completedByInspectorId: string
): Promise<NotificationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get production order details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: { select: { name: true, sku: true } },
        customerOrder: {
          include: {
            customer: { select: { name: true, address: true } },
          },
        },
        deliveryAssignment: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        qualityChecks: {
          include: {
            inspector: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    // Get assigned delivery personnel or all delivery role users
    const deliveryUsers = productionOrder.deliveryAssignment?.user
      ? [productionOrder.deliveryAssignment.user]
      : await prisma.user.findMany({
          where: {
            role: "DELIVERY",
            status: "ACTIVE",
          },
          select: { id: true, email: true },
        });

    if (deliveryUsers.length === 0) {
      return {
        success: false,
        message: "No delivery personnel found to notify",
        error: "No active delivery personnel available",
      };
    }

    // Create notifications for delivery personnel
    const notificationPromises = deliveryUsers.map(async (deliveryUser) => {
      return await prisma.activityLog.create({
        data: {
          type: "WORKFLOW_NOTIFICATION",
          userId: deliveryUser.id,
          details: {
            notificationType: "INSPECTIONS_COMPLETED",
            title: "Quality Inspections Completed - Ready for Delivery",
            message: `All quality inspections for ${productionOrder.product.name} (${productionOrder.product.sku}) have been completed successfully. Order is ready for delivery.`,
            productionOrderId,
            productName: productionOrder.product.name,
            productSku: productionOrder.product.sku,
            customerName: productionOrder.customerOrder?.customer.name,
            customerAddress: productionOrder.customerOrder?.customer.address,
            completedByInspectorId,
            priority: "HIGH",
            actionRequired: true,
            actionUrl: `/delivery/orders/${productionOrder.deliveryAssignment?.id || productionOrderId}`,
            qualityChecks: productionOrder.qualityChecks.map((qc) => ({
              inspector: qc.inspector?.user?.email,
              status: qc.status,
              checkDate: qc.checkDate,
            })),
            metadata: {
              canStartDelivery: true,
              totalChecks: productionOrder.qualityChecks.length,
              completedChecks: productionOrder.qualityChecks.filter(
                (qc) => qc.status === "COMPLETED"
              ).length,
              quantity: productionOrder.quantity,
            },
          },
        },
      });
    });

    const notifications = await Promise.all(notificationPromises);
    const notificationIds = notifications.map((n) => n.id);

    // Log the broadcast event
    await prisma.activityLog.create({
      data: {
        type: "NOTIFICATION_BROADCAST",
        userId: session.user.id,
        details: {
          event: "INSPECTIONS_COMPLETED_NOTIFICATION",
          productionOrderId,
          recipientRole: "DELIVERY",
          recipientCount: deliveryUsers.length,
          notificationIds,
          triggeredBy: completedByInspectorId,
          message: `Notified ${deliveryUsers.length} delivery personnel that inspections are completed for production order ${productionOrderId}`,
        },
      },
    });

    return {
      success: true,
      message: `Successfully notified ${deliveryUsers.length} delivery personnel that inspections are completed`,
      notificationIds,
    };
  } catch (error) {
    console.error("Error notifying delivery personnel:", error);
    return {
      success: false,
      message: "Failed to notify delivery personnel",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification when production starts to inform all roles
 * @param productionOrderId The production order ID
 * @param startedByAdminId The admin who started production
 * @returns Notification result
 */
export async function notifyProductionStarted(
  productionOrderId: string,
  startedByAdminId: string
): Promise<NotificationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get production order details with all assignments
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: { select: { name: true, sku: true } },
        operations: {
          include: {
            workCenter: {
              include: {
                userAssignments: {
                  include: {
                    user: { select: { id: true, email: true, role: true } },
                  },
                },
              },
            },
            assignedTo: { select: { id: true, email: true } },
          },
        },
        qualityChecks: {
          include: {
            inspector: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
        deliveryAssignment: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    // Collect all users to notify
    const usersToNotify = new Map<
      string,
      { id: string; email: string; role: string }
    >();

    // Add workers from work center assignments
    productionOrder.operations.forEach((operation) => {
      operation.workCenter.userAssignments.forEach((assignment) => {
        if (assignment.user.role === "WORKER") {
          usersToNotify.set(assignment.user.id, {
            id: assignment.user.id,
            email: assignment.user.email,
            role: assignment.user.role,
          });
        }
      });

      // Add specifically assigned worker
      if (operation.assignedTo) {
        usersToNotify.set(operation.assignedTo.id, {
          id: operation.assignedTo.id,
          email: operation.assignedTo.email,
          role: "WORKER",
        });
      }
    });

    // Add inspectors
    productionOrder.qualityChecks.forEach((qc) => {
      if (qc.inspector?.user) {
        usersToNotify.set(qc.inspector.user.id, {
          id: qc.inspector.user.id,
          email: qc.inspector.user.email,
          role: "INSPECTOR",
        });
      }
    });

    // Add delivery personnel
    if (productionOrder.deliveryAssignment?.user) {
      usersToNotify.set(productionOrder.deliveryAssignment.user.id, {
        id: productionOrder.deliveryAssignment.user.id,
        email: productionOrder.deliveryAssignment.user.email,
        role: "DELIVERY",
      });
    }

    if (usersToNotify.size === 0) {
      return {
        success: false,
        message: "No assigned personnel found to notify",
        error: "No role assignments found for production order",
      };
    }

    // Create role-specific notifications
    const notificationPromises = Array.from(usersToNotify.values()).map(
      async (user) => {
        const roleSpecificMessage = getRoleSpecificStartMessage(
          user.role as any,
          productionOrder
        );

        return await prisma.activityLog.create({
          data: {
            type: "WORKFLOW_NOTIFICATION",
            userId: user.id,
            details: {
              notificationType: "PRODUCTION_STARTED",
              title: "Production Started",
              message: roleSpecificMessage,
              productionOrderId,
              productName: productionOrder.product.name,
              productSku: productionOrder.product.sku,
              startedByAdminId,
              userRole: user.role,
              priority: "MEDIUM",
              actionRequired: user.role === "WORKER", // Workers need to start immediately
              actionUrl: getRoleActionUrl(user.role as any, productionOrderId),
              metadata: {
                quantity: productionOrder.quantity,
                dueDate: productionOrder.dueDate,
                priority: productionOrder.priority,
                totalOperations: productionOrder.operations.length,
                totalInspections: productionOrder.qualityChecks.length,
              },
            },
          },
        });
      }
    );

    const notifications = await Promise.all(notificationPromises);
    const notificationIds = notifications.map((n) => n.id);

    // Log the broadcast event
    await prisma.activityLog.create({
      data: {
        type: "NOTIFICATION_BROADCAST",
        userId: session.user.id,
        details: {
          event: "PRODUCTION_STARTED_NOTIFICATION",
          productionOrderId,
          recipientCount: usersToNotify.size,
          notificationIds,
          triggeredBy: startedByAdminId,
          roleBreakdown: {
            workers: Array.from(usersToNotify.values()).filter(
              (u) => u.role === "WORKER"
            ).length,
            inspectors: Array.from(usersToNotify.values()).filter(
              (u) => u.role === "INSPECTOR"
            ).length,
            delivery: Array.from(usersToNotify.values()).filter(
              (u) => u.role === "DELIVERY"
            ).length,
          },
          message: `Notified ${usersToNotify.size} personnel that production has started for order ${productionOrderId}`,
        },
      },
    });

    return {
      success: true,
      message: `Successfully notified ${usersToNotify.size} personnel that production has started`,
      notificationIds,
    };
  } catch (error) {
    console.error("Error notifying production start:", error);
    return {
      success: false,
      message: "Failed to notify personnel of production start",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user notifications for the current logged-in user
 * @param limit Number of notifications to retrieve
 * @param unreadOnly Whether to retrieve only unread notifications
 * @returns List of notifications
 */
export async function getUserNotifications(
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<WorkflowNotification[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const notifications = await prisma.activityLog.findMany({
      where: {
        userId: session.user.id,
        type: "WORKFLOW_NOTIFICATION",
        ...(unreadOnly && {
          details: {
            path: ["isRead"],
            equals: false,
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return notifications.map((log) => ({
      id: log.id,
      type: log.details.notificationType,
      title: log.details.title,
      message: log.details.message,
      productionOrderId: log.details.productionOrderId,
      recipientRole: session.user.role as any,
      recipientId: session.user.id,
      priority: log.details.priority || "MEDIUM",
      metadata: log.details.metadata || {},
      createdAt: log.createdAt,
      isRead: log.details.isRead || false,
    }));
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param notificationId The notification ID to mark as read
 * @returns Success result
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    await prisma.activityLog.update({
      where: {
        id: notificationId,
        userId: session.user.id, // Ensure user can only update their own notifications
        type: "WORKFLOW_NOTIFICATION",
      },
      data: {
        details: {
          ...(await prisma.activityLog
            .findUnique({
              where: { id: notificationId },
              select: { details: true },
            })
            .then((log) => log?.details || {})),
          isRead: true,
          readAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      message: "Failed to mark notification as read",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper functions
function getRoleSpecificStartMessage(
  role: "WORKER" | "INSPECTOR" | "DELIVERY",
  productionOrder: any
): string {
  const productInfo = `${productionOrder.product.name} (${productionOrder.product.sku})`;

  switch (role) {
    case "WORKER":
      return `Production has started for ${productInfo}. Begin work center operations immediately. Your completion enables the next phase of production.`;
    case "INSPECTOR":
      return `Production has started for ${productInfo}. Quality inspections will be available once all work center operations are completed.`;
    case "DELIVERY":
      return `Production has started for ${productInfo}. Delivery will be available once work centers and quality inspections are completed.`;
    default:
      return `Production has started for ${productInfo}.`;
  }
}

function getRoleActionUrl(
  role: "WORKER" | "INSPECTOR" | "DELIVERY",
  productionOrderId: string
): string {
  switch (role) {
    case "WORKER":
      return `/worker/production/${productionOrderId}`;
    case "INSPECTOR":
      return `/inspector/production/${productionOrderId}`;
    case "DELIVERY":
      return `/delivery/orders/${productionOrderId}`;
    default:
      return `/production/${productionOrderId}`;
  }
}
