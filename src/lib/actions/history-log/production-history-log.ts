"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Types for production history logging
export interface ProductionHistoryLogEntry {
  id: string
  productionOrderId: string
  userId: string
  activityType: string
  entityType: string
  entityId?: string
  fieldName?: string
  oldValue?: string
  newValue?: string
  userRole: string
  userName?: string
  userDepartment?: string
  operationId?: string
  workCenterId?: string
  workCenterName?: string
  qualityCheckId?: string
  inspectorId?: string
  inspectorName?: string
  defectsFound?: number
  qualityStatus?: string
  materialId?: string
  materialName?: string
  materialSku?: string
  quantityAffected?: number
  unitOfMeasure?: string
  costImpact?: number
  productionPhase?: string
  batchNumber?: string
  shiftInfo?: string
  activityTimestamp: Date
  scheduledStart?: Date
  scheduledEnd?: Date
  actualStart?: Date
  actualEnd?: Date
  durationMinutes?: number
  notes?: string
  reason?: string
  priorityLevel?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  requiresApproval?: boolean
  approvedBy?: string
  approvedAt?: Date
  overrideReason?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export interface LogProductionActivityParams {
  productionOrderId: string
  activityType: string
  entityType: string
  entityId?: string
  fieldName?: string
  oldValue?: any
  newValue?: any
  operationId?: string
  workCenterId?: string
  qualityCheckId?: string
  inspectorId?: string
  defectsFound?: number
  qualityStatus?: string
  materialId?: string
  quantityAffected?: number
  costImpact?: number
  productionPhase?: string
  batchNumber?: string
  shiftInfo?: string
  scheduledStart?: Date
  scheduledEnd?: Date
  actualStart?: Date
  actualEnd?: Date
  durationMinutes?: number
  notes?: string
  reason?: string
  priorityLevel?: string
  requiresApproval?: boolean
  overrideReason?: string
  metadata?: any
}

/**
 * Core function to log any production-related activity
 */
export async function logProductionActivity(params: LogProductionActivityParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.warn("Attempted to log production activity without valid session")
      return { success: false, error: "No valid session" }
    }

    // Get user details
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
      console.warn("User not found for production activity logging")
      return { success: false, error: "User not found" }
    }

    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email

    // Get additional context based on entity type
    const additionalData: any = {}

    if (params.workCenterId) {
      const workCenter = await prisma.workCenter.findUnique({
        where: { id: params.workCenterId },
        select: { name: true, description: true },
      })
      additionalData.workCenterName = workCenter?.name
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
      additionalData.inspectorName = inspector?.profile
        ? `${inspector.profile.firstName} ${inspector.profile.lastName}`
        : inspector?.email
    }

    if (params.materialId) {
      const material = await prisma.material.findUnique({
        where: { id: params.materialId },
        select: { name: true, sku: true, unitOfMeasure: true },
      })
      additionalData.materialName = material?.name
      additionalData.materialSku = material?.sku
      additionalData.unitOfMeasure = material?.unitOfMeasure
    }

    // Create the log entry using raw SQL for better performance
    const logEntry = await prisma.$executeRaw`
      INSERT INTO production_history_log (
        id,
        production_order_id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        field_name,
        old_value,
        new_value,
        user_role,
        user_name,
        user_department,
        operation_id,
        work_center_id,
        work_center_name,
        quality_check_id,
        inspector_id,
        inspector_name,
        defects_found,
        quality_status,
        material_id,
        material_name,
        material_sku,
        quantity_affected,
        unit_of_measure,
        cost_impact,
        production_phase,
        batch_number,
        shift_info,
        activity_timestamp,
        scheduled_start,
        scheduled_end,
        actual_start,
        actual_end,
        duration_minutes,
        notes,
        reason,
        priority_level,
        requires_approval,
        override_reason,
        metadata
      ) VALUES (
        ${generateId()},
        ${params.productionOrderId},
        ${session.user.id},
        ${params.activityType},
        ${params.entityType},
        ${params.entityId || null},
        ${params.fieldName || null},
        ${params.oldValue ? JSON.stringify(params.oldValue) : null},
        ${params.newValue ? JSON.stringify(params.newValue) : null},
        ${user.role},
        ${userName},
        ${user.profile?.department || null},
        ${params.operationId || null},
        ${params.workCenterId || null},
        ${additionalData.workCenterName || null},
        ${params.qualityCheckId || null},
        ${params.inspectorId || null},
        ${additionalData.inspectorName || null},
        ${params.defectsFound || 0},
        ${params.qualityStatus || null},
        ${params.materialId || null},
        ${additionalData.materialName || null},
        ${additionalData.materialSku || null},
        ${params.quantityAffected || null},
        ${additionalData.unitOfMeasure || null},
        ${params.costImpact || 0},
        ${params.productionPhase || "PLANNING"},
        ${params.batchNumber || null},
        ${params.shiftInfo || null},
        ${new Date()},
        ${params.scheduledStart || null},
        ${params.scheduledEnd || null},
        ${params.actualStart || null},
        ${params.actualEnd || null},
        ${params.durationMinutes || null},
        ${params.notes || null},
        ${params.reason || null},
        ${params.priorityLevel || null},
        ${params.requiresApproval || false},
        ${params.overrideReason || null},
        ${params.metadata ? JSON.stringify(params.metadata) : null}
      )
    `

    return { success: true, message: "Production activity logged successfully" }
  } catch (error) {
    console.error("Error logging production activity:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get comprehensive production history for a production order
 */
export async function getProductionOrderHistory(
  productionOrderId: string,
  options: {
    limit?: number
    offset?: number
    activityTypes?: string[]
    userIds?: string[]
    startDate?: Date
    endDate?: Date
    entityTypes?: string[]
  } = {},
) {
  try {
    const { limit = 100, offset = 0, activityTypes, userIds, startDate, endDate, entityTypes } = options

    let whereClause = `WHERE production_order_id = '${productionOrderId}'`

    if (activityTypes && activityTypes.length > 0) {
      const types = activityTypes.map((t) => `'${t}'`).join(",")
      whereClause += ` AND activity_type IN (${types})`
    }

    if (userIds && userIds.length > 0) {
      const users = userIds.map((u) => `'${u}'`).join(",")
      whereClause += ` AND user_id IN (${users})`
    }

    if (entityTypes && entityTypes.length > 0) {
      const entities = entityTypes.map((e) => `'${e}'`).join(",")
      whereClause += ` AND entity_type IN (${entities})`
    }

    if (startDate) {
      whereClause += ` AND activity_timestamp >= '${startDate.toISOString()}'`
    }

    if (endDate) {
      whereClause += ` AND activity_timestamp <= '${endDate.toISOString()}'`
    }

    const history = (await prisma.$queryRaw`
      SELECT * FROM production_history_detailed
      ${whereClause}
      ORDER BY activity_timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as ProductionHistoryLogEntry[]

    const totalCount = (await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM production_history_log
      ${whereClause}
    `) as [{ count: number }]

    return {
      success: true,
      data: history,
      pagination: {
        total: totalCount[0].count,
        limit,
        offset,
        hasMore: totalCount[0].count > offset + limit,
      },
    }
  } catch (error) {
    console.error("Error fetching production order history:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get user activity summary for a production order
 */
export async function getUserActivitySummary(productionOrderId: string) {
  try {
    const summary = await prisma.$queryRaw`
      SELECT 
        user_id,
        user_name,
        user_role,
        user_department,
        COUNT(*) as activity_count,
        MIN(activity_timestamp) as first_activity,
        MAX(activity_timestamp) as last_activity,
        GROUP_CONCAT(DISTINCT activity_type) as activity_types
      FROM production_history_log
      WHERE production_order_id = ${productionOrderId}
      GROUP BY user_id, user_name, user_role, user_department
      ORDER BY activity_count DESC
    `

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error fetching user activity summary:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get inspector activity summary for quality checks
 */
export async function getInspectorActivitySummary(productionOrderId: string) {
  try {
    const summary = await prisma.$queryRaw`
      SELECT 
        inspector_id,
        inspector_name,
        COUNT(*) as inspection_count,
        SUM(defects_found) as total_defects_found,
        COUNT(CASE WHEN quality_status = 'PASSED' THEN 1 END) as passed_count,
        COUNT(CASE WHEN quality_status = 'FAILED' THEN 1 END) as failed_count,
        MIN(activity_timestamp) as first_inspection,
        MAX(activity_timestamp) as last_inspection
      FROM production_history_log
      WHERE production_order_id = ${productionOrderId}
        AND activity_type LIKE 'QUALITY_CHECK_%'
        AND inspector_id IS NOT NULL
      GROUP BY inspector_id, inspector_name
      ORDER BY inspection_count DESC
    `

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error fetching inspector activity summary:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get production timeline with key milestones
 */
export async function getProductionTimeline(productionOrderId: string) {
  try {
    const timeline = await prisma.$queryRaw`
      SELECT 
        activity_type,
        activity_timestamp,
        user_name,
        user_role,
        entity_type,
        notes,
        production_phase,
        work_center_name,
        inspector_name,
        material_name,
        quantity_affected,
        cost_impact
      FROM production_history_detailed
      WHERE production_order_id = ${productionOrderId}
        AND activity_type IN (
          'PRODUCTION_ORDER_CREATED',
          'PRODUCTION_ORDER_STATUS_CHANGED',
          'OPERATION_STARTED',
          'OPERATION_COMPLETED',
          'QUALITY_CHECK_COMPLETED',
          'MATERIAL_CONSUMED',
          'PRODUCTION_COMPLETED'
        )
      ORDER BY activity_timestamp ASC
    `

    return { success: true, data: timeline }
  } catch (error) {
    console.error("Error fetching production timeline:", error)
    return { success: false, error: String(error) }
  }
}

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Convenience functions for common logging scenarios
export async function logProductionOrderStatusChange(
  productionOrderId: string,
  oldStatus: string,
  newStatus: string,
  notes?: string,
) {
  return logProductionActivity({
    productionOrderId,
    activityType: "PRODUCTION_ORDER_STATUS_CHANGED",
    entityType: "ProductionOrder",
    entityId: productionOrderId,
    fieldName: "status",
    oldValue: oldStatus,
    newValue: newStatus,
    notes,
  })
}

export async function logOperationStatusChange(
  productionOrderId: string,
  operationId: string,
  workCenterId: string,
  oldStatus: string,
  newStatus: string,
  actualStart?: Date,
  actualEnd?: Date,
  notes?: string,
) {
  return logProductionActivity({
    productionOrderId,
    activityType: "OPERATION_STATUS_CHANGED",
    entityType: "Operation",
    entityId: operationId,
    operationId,
    workCenterId,
    fieldName: "status",
    oldValue: oldStatus,
    newValue: newStatus,
    actualStart,
    actualEnd,
    notes,
  })
}

export async function logQualityCheckResult(
  productionOrderId: string,
  qualityCheckId: string,
  inspectorId: string,
  qualityStatus: string,
  defectsFound: number,
  notes?: string,
) {
  return logProductionActivity({
    productionOrderId,
    activityType: "QUALITY_CHECK_COMPLETED",
    entityType: "QualityCheck",
    entityId: qualityCheckId,
    qualityCheckId,
    inspectorId,
    qualityStatus,
    defectsFound,
    notes,
  })
}

export async function logMaterialConsumption(
  productionOrderId: string,
  materialId: string,
  quantityConsumed: number,
  costImpact: number,
  notes?: string,
) {
  return logProductionActivity({
    productionOrderId,
    activityType: "MATERIAL_CONSUMED",
    entityType: "MaterialReservation",
    materialId,
    quantityAffected: quantityConsumed,
    costImpact,
    notes,
  })
}
