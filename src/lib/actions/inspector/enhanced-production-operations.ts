import prisma from "@/lib/db";
import type { ActivityLog } from "@prisma/client";

/**
 * Logs a production-related activity.
 * @param productionOrderId The ID of the production order related to the activity.
 * @param type The type of activity (e.g., "PRODUCTION_STATUS_CHANGE").
 * @param userId The ID of the user performing the action.
 * @param userName The name of the user performing the action.
 * @param details A JSON object containing specific details about the activity.
 * @param message A human-readable summary message for the activity.
 */
export async function logProductionActivity(
  productionOrderId: string,
  type: ActivityLog,
  userId: string,
  userName: string,
  details: Record<string, any>,
  message: string,
) {
  try {
    await prisma.activityLog.create({
      data: {
        productionOrderId: productionOrderId,
        type: type,
        userId: userId,
        userName: userName,
        timestamp: new Date(),
        details: JSON.stringify(details), // Store details as a JSON string
        message: message, // Store a summary message
      },
    })
  } catch (error) {
    console.error(`Failed to log activity for production order ${productionOrderId}, type ${type}:`, error)
    // Depending on criticality, you might re-throw or handle more gracefully
  }
}

/**
 * Fetches a production order along with its detailed activity logs.
 * This is a more comprehensive fetch for history/audit purposes.
 * @param id The ID of the production order.
 * @returns The production order with its activity logs.
 */
export async function getProductionOrderWithLogs(id: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        productVariant: true,
        customerOrder: true,
        operations: {
          include: {
            workCenter: true,
          },
        },
        qualityChecks: true,
        materialRequests: {
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
            requestedBy: {
              include: {
                profile: true,
              },
            },
            workCenter: true,
          },
        },
        productionBOM: true,
        delivery: {
          include: {
            deliveryAddress: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        activityLogs: {
          orderBy: {
            timestamp: "desc",
          },
        },
      },
    })

    if (!order) {
      return null
    }

    // Parse JSON details for activity logs
    const formattedLogs = order.activityLogs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details as string) : null,
    }))

    return { ...order, activityLogs: formattedLogs }
  } catch (error) {
    console.error(`Error fetching production order with logs for ID ${id}:`, error)
    throw new Error("Failed to fetch production order details with logs.")
  }
}
