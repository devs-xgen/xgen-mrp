"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"
import { logProductionActivityWithInference, inferWorkCenterType } from "./work-center-type-inference"

// Enhanced operation status update that works with your existing WorkCenter model
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

    // Get current operation with work center info
    const currentOperation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        workCenter: true, // This will only include the fields you have in your WorkCenter model
        productionOrder: true,
      },
    })

    if (!currentOperation) {
      throw new Error("Operation not found")
    }

    const previousStatus = currentOperation.status
    const actualStart = status === Status.IN_PROGRESS ? new Date() : options.actualStart
    const actualEnd = status === Status.COMPLETED ? new Date() : options.actualEnd

    // Calculate duration
    let durationMinutes = options.setupTimeMinutes || 0
    if (actualStart && actualEnd) {
      durationMinutes += Math.round((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60))
    }

    // Update operation
    const operation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        status,
        modifiedBy: session.user.id,
        // Note: Only add these fields if they exist in your Operation model
        // ...(actualStart && { actualStartTime: actualStart }),
        // ...(actualEnd && { actualEndTime: actualEnd }),
      },
    })

    // Infer work center type from the work center name
    const workCenterType = inferWorkCenterType(currentOperation.workCenter.name)

    // Log the operation status change with inferred work center type
    await logProductionActivityWithInference({
      productionOrderId: currentOperation.productionOrderId,
      operationId,
      workCenterId: currentOperation.workCenterId,
      eventType: "OPERATION_STATUS_CHANGED",
      eventCategory: "OPERATION",
      previousStatus,
      newStatus: status,
      actualStart,
      actualEnd,
      durationMinutes,
      quantityProduced: options.quantityProduced,
      quantityRejected: options.quantityRejected,
      efficiencyRate: options.efficiencyRate,
      setupTimeMinutes: options.setupTimeMinutes,
      notes: options.notes || `Operation ${status.toLowerCase()} by ${session.user.email}`,
      onTimeCompletion: actualEnd ? actualEnd <= currentOperation.endTime : null,
      // workCenterType will be inferred automatically from work center name
    })

    // Additional logging for completion
    if (status === Status.COMPLETED) {
      await logProductionActivityWithInference({
        productionOrderId: currentOperation.productionOrderId,
        operationId,
        workCenterId: currentOperation.workCenterId,
        eventType: "OPERATION_COMPLETED",
        eventCategory: "OPERATION",
        newStatus: status,
        quantityProduced: options.quantityProduced,
        quantityRejected: options.quantityRejected,
        efficiencyRate: options.efficiencyRate,
        durationMinutes,
        setupTimeMinutes: options.setupTimeMinutes,
        onTimeCompletion: actualEnd ? actualEnd <= currentOperation.endTime : null,
        notes: options.notes,
        // workCenterType will be inferred from work center name
      })
    }

    revalidatePath(`/admin/production/${currentOperation.productionOrderId}`)
    return operation
  } catch (error) {
    console.error("Error updating operation status:", error)
    throw error
  }
}

// Simple usage example that works with your existing schema
export async function logOperationStarted(
  productionOrderId: string,
  operationId: string,
  workCenterId: string,
  notes?: string,
) {
  return logProductionActivityWithInference({
    productionOrderId,
    operationId,
    workCenterId,
    eventType: "OPERATION_STARTED",
    eventCategory: "OPERATION",
    newStatus: Status.IN_PROGRESS,
    actualStart: new Date(),
    notes: notes || "Operation started by worker",
    // workCenterType will be automatically inferred from the work center name
  })
}

// Example usage that matches your original pattern
export async function createSimpleOperationLog(
  productionOrderId: string,
  operationId: string,
  userId: string,
  eventType: string,
  notes: string,
  status?: Status,
) {
  return prisma.productionOrderHistoryLog.create({
    data: {
      productionOrderId,
      userId,
      operationId,
      eventType: eventType as any,
      notes,
      newStatus: status,
      timestamp: new Date(),
    },
  })
}
