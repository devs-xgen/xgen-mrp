"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Status, Priority } from "@prisma/client"
import type { UpdateProductionOrderInput } from "@/types/admin/production-order"
import { logProductionActivity } from "./integrated-production-history" // Updated import path

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

/**
 * Placeholder for getBOMForProduct.
 * You should replace this with your actual BOM fetching logic.
 */
async function getBOMForProduct(productId: string) {
  // This is a placeholder. Replace with actual logic to fetch BOM for a product.
  // For example, it might return materials needed for the product.
  return {
    productId,
    materials: [
      { name: "Material A", quantity: 10 },
      { name: "Material B", quantity: 5 },
    ],
  }
}

/**
 * Get a single production order with its history logs and related details.
 */
export async function getProductionOrderWithLogs(id: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        customerOrder: true,
        operations: {
          include: {
            workCenter: true,
          },
        },
        qualityChecks: {
          include: {
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
        },
        historyLogs: {
          orderBy: {
            timestamp: "desc",
          },
          include: {
            user: {
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
      },
    })

    if (!order) {
      throw new Error("Production order not found")
    }

    // Fetch BOM/materials for the product
    const bom = await getBOMForProduct(order.productId)

    return { ...order, bom }
  } catch (error) {
    console.error("Error fetching production order with logs:", error)
    throw error
  }
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

    // Log the update
    let changeType = "PRODUCTION_ORDER_UPDATED"
    let notes = `Production order ${data.id} updated.`

    if (data.status && data.status !== currentOrder.status) {
      changeType = "PRODUCTION_ORDER_STATUS_CHANGED"
      notes = `Status changed from ${currentOrder.status} to ${data.status}.`
    } else if (data.quantity && data.quantity !== currentOrder.quantity) {
      changeType = "PRODUCTION_ORDER_QUANTITY_CHANGED"
      notes = `Quantity changed from ${currentOrder.quantity} to ${data.quantity}.`
    } else if (data.priority && data.priority !== currentOrder.priority) {
      changeType = "PRODUCTION_ORDER_PRIORITY_CHANGED"
      notes = `Priority changed from ${currentOrder.priority} to ${data.priority}.`
    } else if (data.notes !== undefined && data.notes !== currentOrder.notes) {
      changeType = "PRODUCTION_ORDER_NOTES_UPDATED"
      notes = `Notes updated.`
    }

    await logProductionActivity({
      productionOrderId: data.id,
      changeType: changeType,
      notes: notes,
      status: data.status, // Log the new status if it changed
    })

    revalidatePath("/admin/production")
    return order
  } catch (error) {
    console.error("Error updating production order:", error)
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
                  // Removed 'type' and 'department' as they are not in your WorkCenter schema
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
          // Removed _count.historyLogs as it's not directly supported by the simplified schema
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
      let avgEfficiency = 0
      const completedOps = order.operations.filter((op) => op.status === "COMPLETED")
      if (completedOps.length > 0) {
        avgEfficiency =
          completedOps.reduce((sum, op) => {
            const planned = new Date(op.endTime).getTime() - new Date(op.startTime).getTime()
            const actual =
              op.actualEndTime && op.actualStartTime
                ? new Date(op.actualEndTime).getTime() - new Date(op.actualStartTime).getTime()
                : planned
            return sum + (planned / actual) * 100
          }, 0) / completedOps.length
      }

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

        // History logs count (will need to be fetched separately if needed)
        historyLogsCount: 0, // Placeholder, as _count is removed
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
      // ON_HOLD: 0, // Include new statuses
      // FAILED: 0, // Include new statuses
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
      // CRITICAL: 0, // Include new priorities
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
