"use server"

import { prisma } from "@/lib/db"
import { ensureSuperAdmin } from "@/lib/actions/superadmin"

export interface AuditLogFilters {
  type?: string
  userId?: string
  fromDate?: Date
  toDate?: Date
  search?: string
}

export interface ProductionHistoryFilters {
  productionOrderId?: string
  userId?: string
  changeType?: string
  fromDate?: Date
  toDate?: Date
  search?: string
}

/**
 * Get all activity logs with pagination and filtering
 */
export async function getActivityLogs(
  filters: AuditLogFilters = {},
  page: number = 1,
  pageSize: number = 50
) {
  try {
    await ensureSuperAdmin()

    const where: any = {}

    if (filters.type) {
      where.type = { contains: filters.type, mode: "insensitive" }
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {}
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate
      }
    }

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      logs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    throw new Error("Failed to fetch activity logs")
  }
}

/**
 * Get production order history logs with pagination and filtering
 */
export async function getProductionHistoryLogs(
  filters: ProductionHistoryFilters = {},
  page: number = 1,
  pageSize: number = 50
) {
  try {
    await ensureSuperAdmin()

    const where: any = {}

    if (filters.productionOrderId) {
      where.productionOrderId = filters.productionOrderId
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.changeType) {
      where.changeType = { contains: filters.changeType, mode: "insensitive" }
    }

    if (filters.fromDate || filters.toDate) {
      where.timestamp = {}
      if (filters.fromDate) {
        where.timestamp.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.timestamp.lte = filters.toDate
      }
    }

    const [total, logs] = await Promise.all([
      prisma.productionOrderHistoryLog.count({ where }),
      prisma.productionOrderHistoryLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          productionOrder: {
            select: {
              id: true,
              quantity: true,
              status: true,
              priority: true,
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      logs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching production history logs:", error)
    throw new Error("Failed to fetch production history logs")
  }
}

/**
 * Get unique activity log types for filtering
 */
export async function getActivityLogTypes() {
  try {
    await ensureSuperAdmin()

    const types = await prisma.activityLog.findMany({
      select: {
        type: true,
      },
      distinct: ["type"],
      orderBy: {
        type: "asc",
      },
    })

    return types.map((t) => t.type)
  } catch (error) {
    console.error("Error fetching activity log types:", error)
    throw new Error("Failed to fetch activity log types")
  }
}

/**
 * Get unique production history change types for filtering
 */
export async function getProductionChangeTypes() {
  try {
    await ensureSuperAdmin()

    const types = await prisma.productionOrderHistoryLog.findMany({
      select: {
        changeType: true,
      },
      distinct: ["changeType"],
      orderBy: {
        changeType: "asc",
      },
    })

    return types.map((t) => t.changeType)
  } catch (error) {
    console.error("Error fetching production change types:", error)
    throw new Error("Failed to fetch production change types")
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats() {
  try {
    await ensureSuperAdmin()

    const [
      totalActivityLogs,
      totalProductionLogs,
      activityLogsToday,
      productionLogsToday,
      activityLogsByType,
      topUsers,
    ] = await Promise.all([
      // Total activity logs
      prisma.activityLog.count(),

      // Total production logs
      prisma.productionOrderHistoryLog.count(),

      // Activity logs today
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Production logs today
      prisma.productionOrderHistoryLog.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Activity logs by type (top 10)
      prisma.activityLog.groupBy({
        by: ["type"],
        _count: {
          type: true,
        },
        orderBy: {
          _count: {
            type: "desc",
          },
        },
        take: 10,
      }),

      // Top users by activity
      prisma.activityLog.groupBy({
        by: ["userId"],
        _count: {
          userId: true,
        },
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 10,
      }),
    ])

    // Get user details for top users
    const userDetails = await prisma.user.findMany({
      where: {
        id: { in: topUsers.map((u) => u.userId) },
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    const topUsersWithDetails = topUsers.map((u) => {
      const user = userDetails.find((ud) => ud.id === u.userId)
      return {
        userId: u.userId,
        count: u._count.userId,
        user,
      }
    })

    return {
      totalActivityLogs,
      totalProductionLogs,
      activityLogsToday,
      productionLogsToday,
      activityLogsByType: activityLogsByType.map((t) => ({
        type: t.type,
        count: t._count.type,
      })),
      topUsers: topUsersWithDetails,
    }
  } catch (error) {
    console.error("Error fetching audit log stats:", error)
    throw new Error("Failed to fetch audit log stats")
  }
}

/**
 * Export activity logs to CSV
 */
export async function exportActivityLogsCSV(filters: AuditLogFilters = {}) {
  try {
    await ensureSuperAdmin()

    const where: any = {}

    if (filters.type) {
      where.type = { contains: filters.type, mode: "insensitive" }
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {}
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate
      }
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Build CSV
    const headers = [
      "ID",
      "Type",
      "User Email",
      "User Role",
      "User Name",
      "Details",
      "Created At",
    ]

    const rows = logs.map((log) => [
      log.id,
      log.type,
      log.user.email,
      log.user.role,
      log.user.profile
        ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
        : "N/A",
      JSON.stringify(log.details),
      log.createdAt.toISOString(),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell)
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          })
          .join(",")
      ),
    ].join("\n")

    return csvContent
  } catch (error) {
    console.error("Error exporting activity logs:", error)
    throw new Error("Failed to export activity logs")
  }
}

/**
 * Export production history logs to CSV
 */
export async function exportProductionHistoryCSV(
  filters: ProductionHistoryFilters = {}
) {
  try {
    await ensureSuperAdmin()

    const where: any = {}

    if (filters.productionOrderId) {
      where.productionOrderId = filters.productionOrderId
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.changeType) {
      where.changeType = { contains: filters.changeType, mode: "insensitive" }
    }

    if (filters.fromDate || filters.toDate) {
      where.timestamp = {}
      if (filters.fromDate) {
        where.timestamp.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.timestamp.lte = filters.toDate
      }
    }

    const logs = await prisma.productionOrderHistoryLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        productionOrder: {
          select: {
            quantity: true,
            status: true,
            priority: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    // Build CSV
    const headers = [
      "ID",
      "Production Order ID",
      "Product Name",
      "Product SKU",
      "Change Type",
      "Status",
      "User Email",
      "User Role",
      "User Name",
      "Notes",
      "Timestamp",
    ]

    const rows = logs.map((log) => [
      log.id,
      log.productionOrderId,
      log.productionOrder.product.name,
      log.productionOrder.product.sku,
      log.changeType,
      log.status || "N/A",
      log.user.email,
      log.user.role,
      log.user.profile
        ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
        : "N/A",
      log.notes || "",
      log.timestamp.toISOString(),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell)
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          })
          .join(",")
      ),
    ].join("\n")

    return csvContent
  } catch (error) {
    console.error("Error exporting production history logs:", error)
    throw new Error("Failed to export production history logs")
  }
}
