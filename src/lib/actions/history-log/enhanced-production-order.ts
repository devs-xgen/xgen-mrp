"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Status, type Priority } from "@prisma/client"
import type { UpdateProductionOrderInput } from "@/types/admin/production-order"
import {
  logProductionActivity,
  logProductionOrderStatusChange,
  logOperationStatusChange,
  logQualityCheckResult,
  logMaterialConsumption,
} from "./production-history-log"

export interface ProductionOrderFilters {
  status?: Status[]
  priority?: Priority[]
  startDateFrom?: Date
  startDateTo?: Date
  dueDateFrom?: Date
  dueDateTo?: Date
  productIds?: string[]
  workCenterIds?: string[]
  customerOrderIds?: string[]
  overdue?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface ProductionOrderSummary {
  totalOrders: number
  statusCounts: Record<Status, number>
  priorityCounts: Record<Priority, number>
  overdueCount: number
  completionRate: number
  avgEfficiency: number
  totalValue: number
}

// Enhanced updateProductionOrder with comprehensive logging
export async function updateProductionOrderWithLogging(data: UpdateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Get current production order for comparison
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: data.id },
    })

    if (!currentOrder) {
      throw new Error("Production order not found")
    }

    // Track all changes
    const changes: Array<{
      field: string
      oldValue: any
      newValue: any
    }> = []

    // Check each field for changes
    if (data.productId && data.productId !== currentOrder.productId) {
      changes.push({
        field: "productId",
        oldValue: currentOrder.productId,
        newValue: data.productId,
      })
    }

    if (data.quantity && data.quantity !== currentOrder.quantity) {
      changes.push({
        field: "quantity",
        oldValue: currentOrder.quantity,
        newValue: data.quantity,
      })
    }

    if (data.startDate && data.startDate.getTime() !== currentOrder.startDate.getTime()) {
      changes.push({
        field: "startDate",
        oldValue: currentOrder.startDate,
        newValue: data.startDate,
      })
    }

    if (data.dueDate && data.dueDate.getTime() !== currentOrder.dueDate.getTime()) {
      changes.push({
        field: "dueDate",
        oldValue: currentOrder.dueDate,
        newValue: data.dueDate,
      })
    }

    if (data.priority && data.priority !== currentOrder.priority) {
      changes.push({
        field: "priority",
        oldValue: currentOrder.priority,
        newValue: data.priority,
      })
    }

    if (data.status && data.status !== currentOrder.status) {
      changes.push({
        field: "status",
        oldValue: currentOrder.status,
        newValue: data.status,
      })
    }

    if (data.customerOrderId !== undefined && data.customerOrderId !== currentOrder.customerOrderId) {
      changes.push({
        field: "customerOrderId",
        oldValue: currentOrder.customerOrderId,
        newValue: data.customerOrderId,
      })
    }

    if (data.notes !== undefined && data.notes !== currentOrder.notes) {
      changes.push({
        field: "notes",
        oldValue: currentOrder.notes,
        newValue: data.notes,
      })
    }

    // Update the production order
    const order = await prisma.productionOrder.update({
      where: { id: data.id },
      data: {
        ...(data.productId && { productId: data.productId }),
        ...(data.quantity && { quantity: data.quantity }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.dueDate && { dueDate: data.dueDate }),
        ...(data.priority && { priority: data.priority }),
        ...(data.status && { status: data.status }),
        ...(data.customerOrderId !== undefined && {
          customerOrderId: data.customerOrderId || null,
        }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        modifiedBy: session.user.id,
      },
    })

    // Log all changes
    for (const change of changes) {
      await logProductionActivity({
        productionOrderId: data.id,
        activityType: change.field === "status" ? "PRODUCTION_ORDER_STATUS_CHANGED" : "PRODUCTION_ORDER_UPDATED",
        entityType: "ProductionOrder",
        entityId: data.id,
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        notes: `Updated ${change.field} from ${change.oldValue} to ${change.newValue}`,
      })
    }

    // Special logging for status changes
    if (data.status && data.status !== currentOrder.status) {
      await logProductionOrderStatusChange(
        data.id,
        currentOrder.status,
        data.status,
        `Status changed by ${session.user.email}`,
      )
    }

    revalidatePath("/admin/production")
    return order
  } catch (error) {
    console.error("Error updating production order:", error)
    throw error
  }
}

// Enhanced operation status update with logging
export async function updateOperationStatusWithLogging(operationId: string, status: Status, notes?: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Get current operation
    const currentOperation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: { workCenter: true },
    })

    if (!currentOperation) {
      throw new Error("Operation not found")
    }

    const oldStatus = currentOperation.status
    const actualStart = status === Status.IN_PROGRESS ? new Date() : undefined
    const actualEnd = status === Status.COMPLETED ? new Date() : undefined

    // Update operation
    const operation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        status,
        modifiedBy: session.user.id,
        ...(actualStart && { actualStartTime: actualStart }),
        ...(actualEnd && { actualEndTime: actualEnd }),
      },
      include: {
        productionOrder: true,
      },
    })

    // Log the status change
    await logOperationStatusChange(
      operation.productionOrderId,
      operationId,
      currentOperation.workCenterId,
      oldStatus,
      status,
      actualStart,
      actualEnd,
      notes || `Operation status changed by ${session.user.email}`,
    )

    revalidatePath(`/admin/production/${operation.productionOrderId}`)
    return operation
  } catch (error) {
    console.error("Error updating operation status:", error)
    throw error
  }
}

// Enhanced quality check completion with logging
export async function completeQualityCheckWithLogging(
  qualityCheckId: string,
  result: {
    status: "PASSED" | "FAILED"
    defectsFound: number
    actionTaken?: string
    notes?: string
  },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Get current quality check
    const currentCheck = await prisma.qualityCheck.findUnique({
      where: { id: qualityCheckId },
    })

    if (!currentCheck) {
      throw new Error("Quality check not found")
    }

    // Update quality check
    const qualityCheck = await prisma.qualityCheck.update({
      where: { id: qualityCheckId },
      data: {
        status: result.status,
        defectsFound: result.defectsFound,
        actionTaken: result.actionTaken,
        notes: result.notes,
        completedAt: new Date(),
        modifiedBy: session.user.id,
      },
    })

    // Log the quality check result
    await logQualityCheckResult(
      currentCheck.productionOrderId,
      qualityCheckId,
      session.user.id,
      result.status,
      result.defectsFound,
      result.notes || `Quality check completed by ${session.user.email}`,
    )

    revalidatePath(`/admin/production/${currentCheck.productionOrderId}`)
    return qualityCheck
  } catch (error) {
    console.error("Error completing quality check:", error)
    throw error
  }
}

// Enhanced material consumption logging
export async function recordMaterialConsumptionWithLogging(
  productionOrderId: string,
  materialConsumptions: Array<{
    materialId: string
    quantityConsumed: number
    unitCost: number
    notes?: string
  }>,
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const results = []

    for (const consumption of materialConsumptions) {
      // Record material consumption
      const materialConsumption = await prisma.productionMaterialConsumption.create({
        data: {
          productionOrderId,
          materialId: consumption.materialId,
          quantityConsumed: consumption.quantityConsumed,
          unitCost: consumption.unitCost,
          totalCost: consumption.quantityConsumed * consumption.unitCost,
          consumedAt: new Date(),
          consumedBy: session.user.id,
          notes: consumption.notes,
        },
      })

      // Log the material consumption
      await logMaterialConsumption(
        productionOrderId,
        consumption.materialId,
        consumption.quantityConsumed,
        consumption.quantityConsumed * consumption.unitCost,
        consumption.notes || `Material consumed by ${session.user.email}`,
      )

      results.push(materialConsumption)
    }

    revalidatePath(`/admin/production/${productionOrderId}`)
    return { success: true, data: results }
  } catch (error) {
    console.error("Error recording material consumption:", error)
    throw error
  }
}

/**
 * Enhanced function to get production orders with filtering, pagination, and statistics
 */
export async function getProductionOrdersEnhanced(filters: ProductionOrderFilters = {}) {
  try {
    const {
      status,
      priority,
      startDateFrom,
      startDateTo,
      dueDateFrom,
      dueDateTo,
      productIds,
      workCenterIds,
      customerOrderIds,
      overdue,
      search,
      limit = 50,
      offset = 0,
    } = filters

    // Build where clause
    const where: any = {}

    if (status && status.length > 0) {
      where.status = { in: status }
    }

    if (priority && priority.length > 0) {
      where.priority = { in: priority }
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {}
      if (startDateFrom) where.startDate.gte = startDateFrom
      if (startDateTo) where.startDate.lte = startDateTo
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {}
      if (dueDateFrom) where.dueDate.gte = dueDateFrom
      if (dueDateTo) where.dueDate.lte = dueDateTo
    }

    if (productIds && productIds.length > 0) {
      where.productId = { in: productIds }
    }

    if (customerOrderIds && customerOrderIds.length > 0) {
      where.customerOrderId = { in: customerOrderIds }
    }

    if (workCenterIds && workCenterIds.length > 0) {
      where.operations = {
        some: {
          workCenterId: { in: workCenterIds },
        },
      }
    }

    if (overdue) {
      where.AND = [{ status: { not: "COMPLETED" } }, { dueDate: { lt: new Date() } }]
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { sku: { contains: search, mode: "insensitive" } } },
        { productVariant: { displayName: { contains: search, mode: "insensitive" } } },
        { customerOrder: { orderNumber: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get orders with comprehensive data
    const [orders, totalCount] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unitCost: true,
              sellingPrice: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              sku: true,
              displayName: true,
              sizeName: true,
              colorName: true,
              styleName: true,
              materialName: true,
              unitCost: true,
              sellingPrice: true,
            },
          },
          customerOrder: {
            select: {
              id: true,
              orderNumber: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          operations: {
            include: {
              workCenter: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  type: true,
                  department: true,
                },
              },
              assignedTo: {
                select: {
                  id: true,
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
            orderBy: { startTime: "asc" },
          },
          qualityChecks: {
            select: {
              id: true,
              checkDate: true,
              status: true,
              defectsFound: true,
              inspector: {
                select: {
                  id: true,
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
            orderBy: { checkDate: "desc" },
          },
          materialReservations: {
            select: {
              id: true,
              material: {
                select: {
                  name: true,
                  sku: true,
                },
              },
              quantityReserved: true,
              status: true,
            },
          },
          materialConsumptions: {
            select: {
              id: true,
              material: {
                select: {
                  name: true,
                  sku: true,
                },
              },
              quantityConsumed: true,
              totalCost: true,
              consumedAt: true,
            },
          },
          delivery: {
            select: {
              id: true,
              status: true,
              scheduledDate: true,
              actualDate: true,
              assignedTo: {
                select: {
                  id: true,
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
          },
          createdByUser: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          modifiedByUser: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          // Include history logs count for quick reference
          _count: {
            select: {
              historyLogs: true,
            },
          },
        },
        orderBy: [{ priority: "desc" }, { status: "asc" }, { startDate: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.productionOrder.count({ where }),
    ])

    // Transform orders with calculated fields
    const transformedOrders = orders.map((order) => {
      // Calculate progress percentage
      const totalOperations = order.operations.length
      const completedOperations = order.operations.filter((op) => op.status === "COMPLETED").length
      const inProgressOperations = order.operations.filter((op) => op.status === "IN_PROGRESS").length

      const progress =
        totalOperations > 0 ? (completedOperations * 100 + inProgressOperations * 50) / totalOperations : 0

      // Calculate efficiency
      const completedOps = order.operations.filter((op) => op.status === "COMPLETED")
      const avgEfficiency =
        completedOps.length > 0
          ? completedOps.reduce((sum, op) => {
              const planned = new Date(op.endTime).getTime() - new Date(op.startTime).getTime()
              const actual =
                op.actualEndTime && op.actualStartTime
                  ? new Date(op.actualEndTime).getTime() - new Date(op.actualStartTime).getTime()
                  : planned
              return sum + (planned / actual) * 100
            }, 0) / completedOps.length
          : 0

      // Calculate total material cost consumed
      const totalMaterialCost = order.materialConsumptions.reduce(
        (sum, consumption) => sum + Number(consumption.totalCost),
        0,
      )

      // Calculate estimated value
      const unitPrice = order.productVariant?.sellingPrice || order.product.sellingPrice
      const estimatedValue = Number(unitPrice) * order.quantity

      // Check if overdue
      const isOverdue = order.status !== "COMPLETED" && new Date(order.dueDate) < new Date()

      // Get latest quality check
      const latestQualityCheck = order.qualityChecks[0]

      // Get current operation
      const currentOperation =
        order.operations.find((op) => op.status === "IN_PROGRESS") ||
        order.operations.find((op) => op.status === "PENDING")

      return {
        ...order,
        // Calculated fields
        progress: Math.round(progress),
        efficiency: Math.round(avgEfficiency),
        totalMaterialCost,
        estimatedValue,
        isOverdue,
        daysUntilDue: Math.ceil((new Date(order.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),

        // Summary fields
        totalOperations,
        completedOperations,
        inProgressOperations,
        pendingOperations: totalOperations - completedOperations - inProgressOperations,

        // Latest status info
        latestQualityCheck,
        currentOperation,

        // User-friendly names
        createdByName: order.createdByUser?.profile
          ? `${order.createdByUser.profile.firstName} ${order.createdByUser.profile.lastName}`
          : order.createdByUser?.email,
        modifiedByName: order.modifiedByUser?.profile
          ? `${order.modifiedByUser.profile.firstName} ${order.modifiedByUser.profile.lastName}`
          : order.modifiedByUser?.email,

        // History logs count
        historyLogsCount: order._count.historyLogs,
      }
    })

    return {
      orders: transformedOrders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    }
  } catch (error) {
    console.error("Error fetching enhanced production orders:", error)
    throw new Error("Failed to fetch production orders")
  }
}

/**
 * Get production order statistics and summary
 */
export async function getProductionOrderSummary(filters: ProductionOrderFilters = {}): Promise<ProductionOrderSummary> {
  try {
    // Build where clause (same as above but without pagination)
    const where: any = {}

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    // Add other filters as needed...

    const [totalOrders, statusCounts, priorityCounts, overdueCount, completedOrders, allOrders] = await Promise.all([
      // Total count
      prisma.productionOrder.count({ where }),

      // Status counts
      prisma.productionOrder.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),

      // Priority counts
      prisma.productionOrder.groupBy({
        by: ["priority"],
        where,
        _count: { id: true },
      }),

      // Overdue count
      prisma.productionOrder.count({
        where: {
          ...where,
          AND: [{ status: { not: "COMPLETED" } }, { dueDate: { lt: new Date() } }],
        },
      }),

      // Completed orders for completion rate
      prisma.productionOrder.count({
        where: {
          ...where,
          status: "COMPLETED",
        },
      }),

      // All orders for value calculation
      prisma.productionOrder.findMany({
        where,
        select: {
          quantity: true,
          product: {
            select: {
              sellingPrice: true,
            },
          },
          productVariant: {
            select: {
              sellingPrice: true,
            },
          },
          operations: {
            select: {
              status: true,
              startTime: true,
              endTime: true,
              actualStartTime: true,
              actualEndTime: true,
            },
          },
        },
      }),
    ])

    // Process status counts
    const statusCountsMap: Record<Status, number> = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      ACTIVE: 0,
      INACTIVE: 0,
      SUSPENDED: 0,
      ARCHIVED: 0,
    }

    statusCounts.forEach((item) => {
      statusCountsMap[item.status] = item._count.id
    })

    // Process priority counts
    const priorityCountsMap: Record<Priority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    }

    priorityCounts.forEach((item) => {
      priorityCountsMap[item.priority] = item._count.id
    })

    // Calculate completion rate
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    // Calculate average efficiency
    let totalEfficiency = 0
    let efficiencyCount = 0

    allOrders.forEach((order) => {
      order.operations.forEach((op) => {
        if (op.status === "COMPLETED" && op.actualStartTime && op.actualEndTime) {
          const planned = new Date(op.endTime).getTime() - new Date(op.startTime).getTime()
          const actual = new Date(op.actualEndTime).getTime() - new Date(op.actualStartTime).getTime()
          if (actual > 0) {
            totalEfficiency += (planned / actual) * 100
            efficiencyCount++
          }
        }
      })
    })

    const avgEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0

    // Calculate total value
    const totalValue = allOrders.reduce((sum, order) => {
      const unitPrice = order.productVariant?.sellingPrice || order.product.sellingPrice
      return sum + Number(unitPrice) * order.quantity
    }, 0)

    return {
      totalOrders,
      statusCounts: statusCountsMap,
      priorityCounts: priorityCountsMap,
      overdueCount,
      completionRate: Math.round(completionRate),
      avgEfficiency: Math.round(avgEfficiency),
      totalValue,
    }
  } catch (error) {
    console.error("Error fetching production order summary:", error)
    throw new Error("Failed to fetch production order summary")
  }
}

/**
 * Get production orders with minimal data for dropdowns/selects
 */
export async function getProductionOrdersMinimal() {
  try {
    const orders = await prisma.productionOrder.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        quantity: true,
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        productVariant: {
          select: {
            displayName: true,
          },
        },
        customerOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
    })

    return orders.map((order) => ({
      ...order,
      displayName: `${order.id} - ${order.product.name}${order.productVariant?.displayName ? ` (${order.productVariant.displayName})` : ""}`,
    }))
  } catch (error) {
    console.error("Error fetching minimal production orders:", error)
    throw new Error("Failed to fetch production orders")
  }
}

/**
 * Get production orders by work center
 */
export async function getProductionOrdersByWorkCenter(workCenterId: string) {
  try {
    const orders = await prisma.productionOrder.findMany({
      where: {
        operations: {
          some: {
            workCenterId,
          },
        },
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        operations: {
          where: {
            workCenterId,
          },
          include: {
            workCenter: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { startDate: "asc" }],
    })

    return orders
  } catch (error) {
    console.error("Error fetching production orders by work center:", error)
    throw new Error("Failed to fetch production orders")
  }
}
