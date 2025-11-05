"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface LoginHistoryRecord {
  id: string;
  userId: string;
  user: {
    email: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  device: string | null;
  deviceType: string | null;
  os: string | null;
  osVersion: string | null;
  portal: string;
  loginAt: Date;
  successful: boolean;
  failureReason: string | null;
  location: string | null;
}

/**
 * Get login history for all users (Developer and SuperAdmin only)
 */
export async function getLoginHistory(params?: {
  limit?: number;
  offset?: number;
  userId?: string;
  successful?: boolean;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const session = await getServerSession(authOptions);

    // Only DEVELOPER and SUPER_ADMIN roles can access this
    if (!session?.user || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return {
        success: false,
        error: "Unauthorized. Developer or SuperAdmin access required.",
      };
    }

    const limit = params?.limit || 100;
    const offset = params?.offset || 0;

    // Build where clause
    const where: any = {};

    if (params?.userId) {
      where.userId = params.userId;
    }

    if (params?.successful !== undefined) {
      where.successful = params.successful;
    }

    if (params?.startDate || params?.endDate) {
      where.loginAt = {};
      if (params.startDate) {
        where.loginAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.loginAt.lte = params.endDate;
      }
    }

    const [records, totalCount] = await Promise.all([
      prisma.loginHistory.findMany({
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
          loginAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.loginHistory.count({ where }),
    ]);

    return {
      success: true,
      data: records,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  } catch (error) {
    console.error("Error fetching login history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch login history",
    };
  }
}

/**
 * Get login history for the current user
 */
export async function getMyLoginHistory(params?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;

    const [records, totalCount] = await Promise.all([
      prisma.loginHistory.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          loginAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.loginHistory.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    return {
      success: true,
      data: records,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  } catch (error) {
    console.error("Error fetching my login history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch login history",
    };
  }
}

/**
 * Get login statistics (Developer and SuperAdmin only)
 */
export async function getLoginStats(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const session = await getServerSession(authOptions);

    // Only DEVELOPER and SUPER_ADMIN roles can access this
    if (!session?.user || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return {
        success: false,
        error: "Unauthorized. Developer or SuperAdmin access required.",
      };
    }

    // Build where clause
    const where: any = {};

    if (params?.startDate || params?.endDate) {
      where.loginAt = {};
      if (params.startDate) {
        where.loginAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.loginAt.lte = params.endDate;
      }
    }

    const [
      totalLogins,
      successfulLogins,
      failedLogins,
      uniqueUsers,
      uniqueIPs,
      browserStats,
      osStats,
      deviceTypeStats,
    ] = await Promise.all([
      prisma.loginHistory.count({ where }),
      prisma.loginHistory.count({ where: { ...where, successful: true } }),
      prisma.loginHistory.count({ where: { ...where, successful: false } }),
      prisma.loginHistory.findMany({
        where,
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.loginHistory.findMany({
        where: { ...where, ipAddress: { not: null } },
        select: { ipAddress: true },
        distinct: ["ipAddress"],
      }),
      prisma.loginHistory.groupBy({
        by: ["browser"],
        where,
        _count: true,
      }),
      prisma.loginHistory.groupBy({
        by: ["os"],
        where,
        _count: true,
      }),
      prisma.loginHistory.groupBy({
        by: ["deviceType"],
        where,
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        totalLogins,
        successfulLogins,
        failedLogins,
        successRate: totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0,
        uniqueUsers: uniqueUsers.length,
        uniqueIPs: uniqueIPs.length,
        browserStats: browserStats.map((stat) => ({
          browser: stat.browser,
          count: stat._count,
        })),
        osStats: osStats.map((stat) => ({
          os: stat.os,
          count: stat._count,
        })),
        deviceTypeStats: deviceTypeStats.map((stat) => ({
          deviceType: stat.deviceType,
          count: stat._count,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching login stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch login statistics",
    };
  }
}

/**
 * Delete old login history records (Developer and SuperAdmin only)
 * @param daysToKeep - Number of days of history to keep (default: 90)
 */
export async function cleanupLoginHistory(daysToKeep: number = 90) {
  try {
    const session = await getServerSession(authOptions);

    // Only DEVELOPER and SUPER_ADMIN roles can access this
    if (!session?.user || !["DEVELOPER", "SUPER_ADMIN"].includes(session.user.role)) {
      return {
        success: false,
        error: "Unauthorized. Developer or SuperAdmin access required.",
      };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.loginHistory.deleteMany({
      where: {
        loginAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      success: true,
      data: {
        deletedCount: result.count,
        cutoffDate,
      },
      message: `Deleted ${result.count} login history records older than ${daysToKeep} days`,
    };
  } catch (error) {
    console.error("Error cleaning up login history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cleanup login history",
    };
  }
}
