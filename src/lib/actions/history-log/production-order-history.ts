"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Types for history logging
export interface CreateHistoryLogParams {
  productionOrderId: string
  eventType: string
  eventCategory?: string
  operationId?: string
  qualityCheckId?: string
  workCenterId?: string
  materialId?: string
  inspectorId?: string
  previousStatus?: string
  newStatus?: string
  statusReason?: string
  operationSequence?: number
  workCenterType?: string
  shiftInfo?: string
  batchNumber?: string
  defectsFound?: number
  qualityScore?: number
  inspectionType?: string
  materialQuantity?: number
  materialUnit?: string
  materialCost?: number
  wasteQuantity?: number
  scheduledStart?: Date
  scheduledEnd?: Date
  actualStart?: Date
  actualEnd?: Date
  durationMinutes?: number
  setupTimeMinutes?: number
  quantityProduced?: number
  quantityRejected?: number
  efficiencyRate?: number
  fieldChanged?: string
  previousValue?: any
  newValue?: any
  notes?: string
  comments?: string
  reason?: string
  priority?: string
  requiresApproval?: boolean
  approvedBy?: string
  approvedAt?: Date
  isOverride?: boolean
  overrideReason?: string
  productionPhase?: string
  phaseSequence?: number
  laborCost?: number
  overheadCost?: number
  totalCostImpact?: number
  onTimeCompletion?: boolean
  qualityMet?: boolean
  targetMet?: boolean
  metadata?: any
  tags?: string[]
}

/**
 * Create a comprehensive production order history log entry
 */
export async function createProductionOrderHistoryLog(params: CreateHistoryLogParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.warn("Attempted to create history log without valid session")
      return { success: false, error: "No valid session" }
    }

    // Get user details for context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email

    // Get additional context data
    let workCenterName = null
    let inspectorName = null

    if (params.workCenterId) {
      const workCenter = await prisma.workCenter.findUnique({
        where: { id: params.workCenterId },
        select: { name: true },
      })
      workCenterName = workCenter?.name
    }

    if (params.inspectorId) {
      const inspector = await prisma.user.findUnique({
        where: { id: params.inspectorId },
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })
      inspectorName = inspector?.profile
        ? `${inspector.profile.firstName} ${inspector.profile.lastName}`
        : inspector?.email
    }

    // Create the history log entry
    const historyLog = await prisma.productionOrderHistoryLog.create({
      data: {
        productionOrderId: params.productionOrderId,
        userId: session.user.id,
        userRole: user.role,
        userName,
        userDepartment: user.profile?.department,
        operationId: params.operationId,
        qualityCheckId: params.qualityCheckId,
        workCenterId: params.workCenterId,
        workCenterName,
        materialId: params.materialId,
        inspectorId: params.inspectorId,
        inspectorName,
        eventType: params.eventType,
        eventCategory: params.eventCategory || "GENERAL",
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        statusReason: params.statusReason,
        operationSequence: params.operationSequence,
        workCenterType: params.workCenterType,
        shiftInfo: params.shiftInfo,
        batchNumber: params.batchNumber,
        defectsFound: params.defectsFound,
        qualityScore: params.qualityScore,
        inspectionType: params.inspectionType,
        materialQuantity: params.materialQuantity,
        materialUnit: params.materialUnit,
        materialCost: params.materialCost,
        wasteQuantity: params.wasteQuantity,
        scheduledStart: params.scheduledStart,
        scheduledEnd: params.scheduledEnd,
        actualStart: params.actualStart,
        actualEnd: params.actualEnd,
        durationMinutes: params.durationMinutes,
        setupTimeMinutes: params.setupTimeMinutes,
        quantityProduced: params.quantityProduced,
        quantityRejected: params.quantityRejected,
        efficiencyRate: params.efficiencyRate,
        fieldChanged: params.fieldChanged,
        previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        notes: params.notes,
        comments: params.comments,
        reason: params.reason,
        priority: params.priority,
        requiresApproval: params.requiresApproval || false,
        approvedBy: params.approvedBy,
        approvedAt: params.approvedAt,
        isOverride: params.isOverride || false,
        overrideReason: params.overrideReason,
        productionPhase: params.productionPhase || "PLANNING",
        phaseSequence: params.phaseSequence,
        laborCost: params.laborCost,
        overheadCost: params.overheadCost,
        totalCostImpact: params.totalCostImpact,
        onTimeCompletion: params.onTimeCompletion,
        qualityMet: params.qualityMet,
        targetMet: params.targetMet,
        metadata: params.metadata,
        tags: params.tags || [],
        timestamp: new Date(),
      },
    })

    return { success: true, data: historyLog }
  } catch (error) {
    console.error("Error creating production order history log:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get comprehensive production order history
 */
export async function getProductionOrderHistory(
  productionOrderId: string,
  options: {
    limit?: number
    offset?: number
    eventTypes?: string[]
    eventCategories?: string[]
    userIds?: string[]
    workCenterIds?: string[]
    startDate?: Date
    endDate?: Date
    productionPhases?: string[]
  } = {},
) {
  try {
    const {
      limit = 100,
      offset = 0,
      eventTypes,
      eventCategories,
      userIds,
      workCenterIds,
      startDate,
      endDate,
      productionPhases,
    } = options

    const where: any = {
      productionOrderId,
    }

    if (eventTypes && eventTypes.length > 0) {
      where.eventType = { in: eventTypes }
    }

    if (eventCategories && eventCategories.length > 0) {
      where.eventCategory = { in: eventCategories }
    }

    if (userIds && userIds.length > 0) {
      where.userId = { in: userIds }
    }

    if (workCenterIds && workCenterIds.length > 0) {
      where.workCenterId = { in: workCenterIds }
    }

    if (productionPhases && productionPhases.length > 0) {
      where.productionPhase = { in: productionPhases }
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = startDate
      if (endDate) where.timestamp.lte = endDate
    }

    const [history, totalCount] = await Promise.all([
      prisma.productionOrderHistoryLog.findMany({
        where,
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
          // operation: {
          //   select: {
          //     id: true,
          //     status: true,
          //     workCenter: {
          //       select: {
          //         name: true,
          //         type: true,
          //       },
          //     },
          //   },
          // },
          // qualityCheck: {
          //   select: {
          //     id: true,
          //     status: true,
          //     checkDate: true,
          //   },
          // },
          // workCenter: {
          //   select: {
          //     name: true,
          //     type: true,
          //     department: true,
          //   },
          // },
          // material: {
          //   select: {
          //     name: true,
          //     sku: true,
          //     unitOfMeasure: true,
          //   },
          // },
          // inspector: {
          //   select: {
          //     email: true,
          //     profile: {
          //       select: {
          //         firstName: true,
          //         lastName: true,
          //       },
          //     },
          //   },
          // },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.productionOrderHistoryLog.count({ where }),
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

/**
 * Get operation history for a specific work center
 */
export async function getWorkCenterOperationHistory(
  productionOrderId: string,
  workCenterId: string,
  workCenterType?: string,
) {
  try {
    const where: any = {
      productionOrderId,
      workCenterId,
      eventCategory: "OPERATION",
    }

    if (workCenterType) {
      where.workCenterType = workCenterType
    }

    const history = await prisma.productionOrderHistoryLog.findMany({
      where,
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
        operation: {
          select: {
            id: true,
            status: true,
            sequence: true,
          },
        },
      },
      orderBy: [{ operationSequence: "asc" }, { timestamp: "asc" }],
    })

    // Calculate work center performance metrics
    const metrics = {
      totalOperations: history.filter((h) => h.eventType === "OPERATION_CREATED").length,
      completedOperations: history.filter((h) => h.eventType === "OPERATION_COMPLETED").length,
      totalDuration: history.reduce((sum, h) => sum + (h.durationMinutes || 0), 0),
      averageEfficiency: history
        .filter((h) => h.efficiencyRate)
        .reduce((sum, h, _, arr) => sum + (h.efficiencyRate || 0) / arr.length, 0),
      totalQuantityProduced: history.reduce((sum, h) => sum + (h.quantityProduced || 0), 0),
      totalQuantityRejected: history.reduce((sum, h) => sum + (h.quantityRejected || 0), 0),
      onTimeCompletionRate:
        history.filter((h) => h.onTimeCompletion === true).length /
        Math.max(history.filter((h) => h.onTimeCompletion !== null).length, 1),
    }

    return {
      success: true,
      data: history,
      metrics,
    }
  } catch (error) {
    console.error("Error fetching work center operation history:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get quality inspection history
 */
export async function getQualityInspectionHistory(productionOrderId: string, inspectorId?: string) {
  try {
    const where: any = {
      productionOrderId,
      eventCategory: "QUALITY",
    }

    if (inspectorId) {
      where.inspectorId = inspectorId
    }

    const history = await prisma.productionOrderHistoryLog.findMany({
      where,
      include: {
        inspector: {
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
        qualityCheck: {
          select: {
            id: true,
            status: true,
            checkDate: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    })

    // Calculate quality metrics
    const metrics = {
      totalInspections: history.filter((h) => h.eventType === "QUALITY_CHECK_COMPLETED").length,
      passedInspections: history.filter((h) => h.eventType === "QUALITY_CHECK_PASSED").length,
      failedInspections: history.filter((h) => h.eventType === "QUALITY_CHECK_FAILED").length,
      totalDefectsFound: history.reduce((sum, h) => sum + (h.defectsFound || 0), 0),
      averageQualityScore: history
        .filter((h) => h.qualityScore)
        .reduce((sum, h, _, arr) => sum + (h.qualityScore || 0) / arr.length, 0),
      reworkRequired: history.filter((h) => h.eventType === "QUALITY_CHECK_REWORK_REQUIRED").length,
    }

    return {
      success: true,
      data: history,
      metrics,
    }
  } catch (error) {
    console.error("Error fetching quality inspection history:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get user activity summary for a production order
 */
export async function getUserActivitySummary(productionOrderId: string) {
  try {
    const summary = await prisma.productionOrderHistoryLog.groupBy({
      by: ["userId", "userRole", "userName"],
      where: {
        productionOrderId,
        userId: { not: null },
      },
      _count: {
        id: true,
      },
      _min: {
        timestamp: true,
      },
      _max: {
        timestamp: true,
      },
    })

    const detailedSummary = await Promise.all(
      summary.map(async (userSummary) => {
        const eventTypes = await prisma.productionOrderHistoryLog.groupBy({
          by: ["eventType"],
          where: {
            productionOrderId,
            userId: userSummary.userId,
          },
          _count: {
            id: true,
          },
        })

        return {
          userId: userSummary.userId,
          userRole: userSummary.userRole,
          userName: userSummary.userName,
          totalActivities: userSummary._count.id,
          firstActivity: userSummary._min.timestamp,
          lastActivity: userSummary._max.timestamp,
          eventTypes: eventTypes.map((et) => ({
            eventType: et.eventType,
            count: et._count.id,
          })),
        }
      }),
    )

    return {
      success: true,
      data: detailedSummary,
    }
  } catch (error) {
    console.error("Error fetching user activity summary:", error)
    return { success: false, error: String(error) }
  }
}

// Convenience functions for common logging scenarios
export async function logOperationStatusChange(
  productionOrderId: string,
  operationId: string,
  workCenterId: string,
  previousStatus: string,
  newStatus: string,
  options: {
    workCenterType?: string
    actualStart?: Date
    actualEnd?: Date
    durationMinutes?: number
    quantityProduced?: number
    efficiencyRate?: number
    notes?: string
  } = {},
) {
  return createProductionOrderHistoryLog({
    productionOrderId,
    operationId,
    workCenterId,
    eventType: "OPERATION_STATUS_CHANGED",
    eventCategory: "OPERATION",
    previousStatus,
    newStatus,
    workCenterType: options.workCenterType,
    actualStart: options.actualStart,
    actualEnd: options.actualEnd,
    durationMinutes: options.durationMinutes,
    quantityProduced: options.quantityProduced,
    efficiencyRate: options.efficiencyRate,
    notes: options.notes,
    productionPhase:
      options.workCenterType === "CUTTING" ? "CUTTING" : options.workCenterType === "SEWING" ? "SEWING" : "PRODUCTION",
  })
}

export async function logQualityCheckResult(
  productionOrderId: string,
  qualityCheckId: string,
  inspectorId: string,
  result: {
    status: string
    defectsFound: number
    qualityScore?: number
    inspectionType?: string
    notes?: string
  },
) {
  return createProductionOrderHistoryLog({
    productionOrderId,
    qualityCheckId,
    inspectorId,
    eventType: result.status === "PASSED" ? "QUALITY_CHECK_PASSED" : "QUALITY_CHECK_FAILED",
    eventCategory: "QUALITY",
    newStatus: result.status,
    defectsFound: result.defectsFound,
    qualityScore: result.qualityScore,
    inspectionType: result.inspectionType,
    notes: result.notes,
    qualityMet: result.status === "PASSED",
    productionPhase: "QUALITY_CONTROL",
  })
}

export async function logMaterialConsumption(
  productionOrderId: string,
  materialId: string,
  quantity: number,
  cost: number,
  options: {
    unit?: string
    wasteQuantity?: number
    operationId?: string
    notes?: string
  } = {},
) {
  return createProductionOrderHistoryLog({
    productionOrderId,
    materialId,
    operationId: options.operationId,
    eventType: "MATERIAL_CONSUMED",
    eventCategory: "MATERIAL",
    materialQuantity: quantity,
    materialUnit: options.unit,
    materialCost: cost,
    wasteQuantity: options.wasteQuantity,
    totalCostImpact: cost,
    notes: options.notes,
  })
}
