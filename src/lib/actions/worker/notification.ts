// src/lib/actions/notifications.ts
// Using your existing ActivityLog table for notifications
"use server";

import { prisma } from "@/lib/db";

interface NotificationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Notify inspectors when work center operations are completed
 */
export async function notifyInspectorsWorkCenterCompleted(
  productionOrderId: string,
  completedByUserId: string
): Promise<NotificationResult> {
  try {
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: { select: { name: true, sku: true } },
        qualityChecks: { select: { inspectorId: true } },
      },
    });

    if (!productionOrder) {
      return { success: false, error: "Production order not found" };
    }

    const completedByUser = await prisma.user.findUnique({
      where: { id: completedByUserId },
      select: { email: true },
    });

    // Get unique inspector IDs
    const inspectorIds = [...new Set(productionOrder.qualityChecks.map(qc => qc.inspectorId))];

    let targetInspectors: string[] = inspectorIds;

    // If no inspectors assigned, notify all active inspectors
    if (inspectorIds.length === 0) {
      const allInspectors = await prisma.user.findMany({
        where: { role: "INSPECTOR", status: "ACTIVE" },
        select: { id: true },
      });
      targetInspectors = allInspectors.map(i => i.id);
    }

    // Create activity log for each inspector
    const activityLogPromises = targetInspectors.map((inspectorId) =>
      prisma.activityLog.create({
        data: {
          type: "NOTIFICATION_INSPECTION_READY",
          userId: inspectorId,
          details: {
            notificationType: "INSPECTION_READY",
            productionOrderId,
            productName: productionOrder.product.name,
            productSku: productionOrder.product.sku,
            completedBy: completedByUser?.email,
            message: `All work center operations for ${productionOrder.product.name} have been completed. Inspection can now begin.`,
            read: false,
          },
        },
      })
    );

    await Promise.all(activityLogPromises);

    return {
      success: true,
      message: `Notified ${targetInspectors.length} inspectors`,
    };
  } catch (error) {
    console.error("Error notifying inspectors:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Notify delivery personnel when inspections are completed
 */
export async function notifyDeliveryInspectionsCompleted(
  productionOrderId: string,
  completedByUserId: string
): Promise<NotificationResult> {
  try {
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: { select: { name: true, sku: true } },
        delivery: { select: { userId: true } },
      },
    });

    if (!productionOrder) {
      return { success: false, error: "Production order not found" };
    }

    const completedByUser = await prisma.user.findUnique({
      where: { id: completedByUserId },
      select: { email: true },
    });

    let targetUsers: string[] = [];

    // Notify assigned delivery user or all logistics personnel
    if (productionOrder.delivery) {
      targetUsers = [productionOrder.delivery.userId];
    } else {
      const allLogisticsUsers = await prisma.user.findMany({
        where: {
          role: { in: ["DELIVERY"] },
          status: "ACTIVE",
        },
        select: { id: true },
      });
      targetUsers = allLogisticsUsers.map(u => u.id);
    }

    // Create activity log for each delivery person
    const activityLogPromises = targetUsers.map((userId) =>
      prisma.activityLog.create({
        data: {
          type: "NOTIFICATION_DELIVERY_READY",
          userId: userId,
          details: {
            notificationType: "DELIVERY_READY",
            productionOrderId,
            productName: productionOrder.product.name,
            productSku: productionOrder.product.sku,
            completedBy: completedByUser?.email,
            message: `All inspections for ${productionOrder.product.name} have been completed. Delivery can now proceed.`,
            read: false,
          },
        },
      })
    );

    await Promise.all(activityLogPromises);

    return {
      success: true,
      message: `Notified ${targetUsers.length} delivery personnel`,
    };
  } catch (error) {
    console.error("Error notifying delivery personnel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Notify workers when production order is started
 */
export async function notifyWorkersProductionStarted(
  productionOrderId: string,
  startedByUserId: string
): Promise<NotificationResult> {
  try {
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: { select: { name: true, sku: true } },
        operations: {
          include: {
            workCenter: {
              include: {
                UserWorkCenter: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!productionOrder) {
      return { success: false, error: "Production order not found" };
    }

    // Get all unique workers from assigned work centers
    const workerIds = new Set<string>();
    productionOrder.operations.forEach((operation) => {
      operation.workCenter.UserWorkCenter.forEach((uwc) => {
        workerIds.add(uwc.userId);
      });
    });

    // Create activity log for each worker
    const activityLogPromises = Array.from(workerIds).map((workerId) =>
      prisma.activityLog.create({
        data: {
          type: "NOTIFICATION_TASK_ASSIGNED",
          userId: workerId,
          details: {
            notificationType: "TASK_ASSIGNED",
            productionOrderId,
            productName: productionOrder.product.name,
            productSku: productionOrder.product.sku,
            message: `Production has started for ${productionOrder.product.name}. Check your tasks.`,
            read: false,
          },
        },
      })
    );

    await Promise.all(activityLogPromises);

    return {
      success: true,
      message: `Notified ${workerIds.size} workers`,
    };
  } catch (error) {
    console.error("Error notifying workers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get unread notifications for a user (from ActivityLog)
 */
export async function getUserNotifications(userId: string) {
  try {
    const notifications = await prisma.activityLog.findMany({
      where: {
        userId,
        type: {
          in: [
            "NOTIFICATION_INSPECTION_READY",
            "NOTIFICATION_DELIVERY_READY",
            "NOTIFICATION_TASK_ASSIGNED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return notifications
      .filter((log) => {
        const details = log.details as any;
        return details?.read === false;
      })
      .map((log) => ({
        id: log.id,
        type: (log.details as any)?.notificationType || "UNKNOWN",
        message: (log.details as any)?.message || "",
        productionOrderId: (log.details as any)?.productionOrderId,
        read: false,
        createdAt: log.createdAt,
      }));
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(activityLogId: string) {
  try {
    const log = await prisma.activityLog.findUnique({
      where: { id: activityLogId },
    });

    if (!log) return { success: false };

    const details = log.details as any;
    await prisma.activityLog.update({
      where: { id: activityLogId },
      data: {
        details: {
          ...details,
          read: true,
          readAt: new Date(),
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }
}