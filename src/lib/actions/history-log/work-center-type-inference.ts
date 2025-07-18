"use server"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"


// Helper function to infer work center type from work center name or context
export function inferWorkCenterType(workCenterName: string): string {
  const name = workCenterName.toLowerCase()

  if (name.includes("cut") || name.includes("cutting")) {
    return "CUTTING"
  } else if (name.includes("sew") || name.includes("sewing") || name.includes("stitch")) {
    return "SEWING"
  } else if (name.includes("finish") || name.includes("finishing") || name.includes("iron") || name.includes("press")) {
    return "FINISHING"
  } else if (name.includes("quality") || name.includes("inspection") || name.includes("qc")) {
    return "QUALITY_CONTROL"
  } else if (name.includes("pack") || name.includes("packaging")) {
    return "PACKAGING"
  } else if (name.includes("maintenance") || name.includes("repair")) {
    return "MAINTENANCE"
  } else if (name.includes("storage") || name.includes("warehouse") || name.includes("store")) {
    return "STORAGE"
  } else {
    return "OTHER"
  }
}

// Enhanced logging function that infers work center type
export async function logProductionActivityWithInference(params: {
  productionOrderId: string
  eventType: string
  eventCategory?: string
  operationId?: string
  qualityCheckId?: string
  workCenterId?: string
  materialId?: string
  inspectorId?: string
  previousStatus?: any
  newStatus?: any
  statusReason?: string
  operationSequence?: number
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
  priority?: any
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
}) {
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
      return { success: false, error: "User not found" }
    }

    const userName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email

    // Get work center details and infer type
    let workCenterName = null
    let workCenterType = null

    if (params.workCenterId) {
      const workCenter = await prisma.workCenter.findUnique({
        where: { id: params.workCenterId },
        select: { name: true, description: true },
      })
      if (workCenter) {
        workCenterName = workCenter.name
        workCenterType = inferWorkCenterType(workCenter.name)
      }
    }

    // Get inspector details
    let inspectorName = null
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

    // Infer production phase from work center type if not provided
    let productionPhase = params.productionPhase
    if (!productionPhase && workCenterType) {
      switch (workCenterType) {
        case "CUTTING":
          productionPhase = "CUTTING"
          break
        case "SEWING":
          productionPhase = "SEWING"
          break
        case "FINISHING":
          productionPhase = "FINISHING"
          break
        case "QUALITY_CONTROL":
          productionPhase = "QUALITY_CONTROL"
          break
        case "PACKAGING":
          productionPhase = "PACKAGING"
          break
        default:
          productionPhase = "PLANNING"
      }
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
        eventType: params.eventType as any,
        eventCategory: (params.eventCategory as any) || "GENERAL",
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        statusReason: params.statusReason,
        operationSequence: params.operationSequence,
        workCenterType: workCenterType as any, // Inferred from work center name
        shiftInfo: params.shiftInfo,
        batchNumber: params.batchNumber,
        defectsFound: params.defectsFound,
        qualityScore: params.qualityScore,
        inspectionType: params.inspectionType as any,
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
        productionPhase: (productionPhase as any) || "PLANNING",
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
