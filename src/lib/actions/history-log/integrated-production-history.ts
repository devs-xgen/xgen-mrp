"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"

// Simplified logging function
export async function logProductionActivity(params: {
  productionOrderId: string
  changeType: string // e.g., "status_update", "quantity_update", "operation_started"
  notes?: string // Optional description of the change
  status?: Status // New status after update (optional)
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.warn("Attempted to log production activity without valid session")
      return { success: false, error: "No valid session" }
    }

    // Create the history log entry
    const historyLog = await prisma.productionOrderHistoryLog.create({
      data: {
        productionOrderId: params.productionOrderId,
        userId: session.user.id,
        timestamp: new Date(),
        changeType: params.changeType,
        notes: params.notes,
        status: params.status,
      },
    })

    return { success: true, data: historyLog }
  } catch (error) {
    console.error("Error creating production order history log:", error)
    return { success: false, error: String(error) }
  }
}

// Enhanced operation status update with simplified logging
export async function updateOperationStatusWithLogging(
  operationId: string,
  status: Status,
  options: {
    notes?: string
    quantityProduced?: number
    quantityRejected?: number
    efficiencyRate?: number
    setupTimeMinutes?: number
    actualStart?: Date
    actualEnd?: Date
  } = {},
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const currentOperation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        workCenter: true,
        productionOrder: true,
      },
    })

    if (!currentOperation) {
      throw new Error("Operation not found")
    }

    const previousStatus = currentOperation.status

    // Update operation
    const operation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        status,
        modifiedBy: session.user.id,
        // Add these fields if they exist in your Operation model
        // actualStartTime: options.actualStart,
        // actualEndTime: options.actualEnd,
      },
    })

    // Log the operation status change
    await logProductionActivity({
      productionOrderId: currentOperation.productionOrderId,
      changeType: `OPERATION_STATUS_CHANGED`,
      notes:
        options.notes ||
        `Operation status changed from ${previousStatus} to ${status} for ${currentOperation.workCenter.name}`,
      status: status,
    })

    // Additional logging for completion
    if (status === Status.COMPLETED) {
      await logProductionActivity({
        productionOrderId: currentOperation.productionOrderId,
        changeType: "OPERATION_COMPLETED",
        notes: `Operation completed at ${currentOperation.workCenter.name}. Quantity produced: ${options.quantityProduced || "N/A"}`,
        status: status,
      })
    }

    revalidatePath(`/admin/production/${currentOperation.productionOrderId}`)
    return operation
  } catch (error) {
    console.error("Error updating operation status:", error)
    throw error
  }
}

// Simplified function to get production order history
export async function getProductionOrderHistory(
  productionOrderId: string,
  options: {
    limit?: number
    offset?: number
  } = {},
) {
  try {
    const { limit = 100, offset = 0 } = options

    const [history, totalCount] = await Promise.all([
      prisma.productionOrderHistoryLog.findMany({
        where: {
          productionOrderId,
        },
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.productionOrderHistoryLog.count({
        where: {
          productionOrderId,
        },
      }),
    ])

    return {
      success: true,
      data: history,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit,
      },
    }
  } catch (error) {
    console.error("Error fetching production order history:", error)
    return { success: false, error: String(error) }
  }
}

// Convenience functions for common logging scenarios (simplified)
export async function logOperationStart(
  productionOrderId: string,
  operationId: string,
  workCenterId: string,
  notes?: string,
) {
  return logProductionActivity({
    productionOrderId,
    changeType: "OPERATION_STARTED",
    notes: notes || "Operation started by worker",
    status: Status.IN_PROGRESS,
  })
}

export async function logQualityCheckCompletion(
  productionOrderId: string,
  qualityCheckId: string,
  inspectorId: string,
  result: {
    status: "PASSED" | "CANCELLED"
    defectsFound: number
    notes?: string
  },
) {
  return logProductionActivity({
    productionOrderId,
    changeType: `QUALITY_CHECK_${result.status}`,
    notes: result.notes || `Quality check ${result.status.toLowerCase()} with ${result.defectsFound} defects.`,
    status: result.status === "PASSED" ? Status.COMPLETED : Status.CANCELLED
  })
}

export async function logMaterialConsumption(
  productionOrderId: string,
  materialId: string,
  quantity: number,
  cost: number,
  notes?: string,
) {
  return logProductionActivity({
    productionOrderId,
    changeType: "MATERIAL_CONSUMED",
    notes: notes || `Consumed ${quantity} units of material for a cost of $${cost}.`,
  })
}
