"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { format, subDays, differenceInDays, differenceInHours } from "date-fns";

/**
 * SuperAdmin User Analytics Server Actions
 * User activity, worker performance, inspector productivity tracking
 */

// Helper to ensure SuperAdmin access
async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/superadmin/login");
  }
  return session;
}

// Helper to serialize Decimal fields
function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Decimal) return Number(obj);
  if (Array.isArray(obj)) return obj.map(serializeDecimals);
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeDecimals(value)])
    );
  }
  return obj;
}

// Types
export interface UserAnalyticsFilters {
  startDate: Date;
  endDate: Date;
  role?: string;
  tenantId?: string;
}

export interface ActiveUsersMetrics {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}

export interface InactiveAccount {
  userId: string;
  name: string;
  email: string;
  role: string;
  tenantName: string | null;
  lastLoginAt: Date | null;
  daysSinceLogin: number | null;
}

export interface LoginActivity {
  date: string;
  loginCount: number;
  uniqueUsers: number;
}

export interface UsersByRole {
  role: string;
  count: number;
  active: number;
  inactive: number;
}

export interface WorkerPerformance {
  workerId: string;
  name: string;
  email: string;
  tenantName: string | null;
  tasksCompleted: number;
  operationsCompleted: number;
  materialsConsumed: number;
  avgTaskTime: number;
  efficiencyScore: number;
}

export interface InspectorPerformance {
  inspectorId: string;
  name: string;
  email: string;
  tenantName: string | null;
  inspectionsCompleted: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  avgInspectionTime: number;
  defectsIdentified: number;
}

export interface UserAnalyticsData {
  activeUsers: ActiveUsersMetrics;
  inactiveAccounts: InactiveAccount[];
  loginActivity: LoginActivity[];
  usersByRole: UsersByRole[];
  workerPerformance: WorkerPerformance[];
  inspectorPerformance: InspectorPerformance[];
}

/**
 * Get comprehensive user analytics
 */
export async function getUserAnalytics(
  filters: UserAnalyticsFilters
): Promise<{ success: boolean; data?: UserAnalyticsData; error?: string }> {
  try {
    await ensureSuperAdmin();

    const { startDate, endDate, role, tenantId } = filters;

    // Calculate all analytics in parallel
    const [
      activeUsers,
      inactiveAccounts,
      loginActivity,
      usersByRole,
      workerPerformance,
      inspectorPerformance,
    ] = await Promise.all([
      calculateActiveUsers(startDate, endDate, role, tenantId),
      calculateInactiveAccounts(role, tenantId),
      calculateLoginActivity(startDate, endDate, role, tenantId),
      calculateUsersByRole(tenantId),
      calculateWorkerPerformance(startDate, endDate, tenantId),
      calculateInspectorPerformance(startDate, endDate, tenantId),
    ]);

    const analyticsData: UserAnalyticsData = {
      activeUsers,
      inactiveAccounts,
      loginActivity,
      usersByRole,
      workerPerformance,
      inspectorPerformance,
    };

    return {
      success: true,
      data: serializeDecimals(analyticsData),
    };
  } catch (error: any) {
    console.error("Error fetching user analytics:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user analytics",
    };
  }
}

/**
 * Calculate active users metrics
 */
async function calculateActiveUsers(
  startDate: Date,
  endDate: Date,
  role?: string,
  tenantId?: string
): Promise<ActiveUsersMetrics> {
  const now = new Date();
  const oneDayAgo = subDays(now, 1);
  const oneWeekAgo = subDays(now, 7);
  const oneMonthAgo = subDays(now, 30);

  const whereClause = {
    ...(role && { role }),
    ...(tenantId && { tenantId }),
  };

  // Daily active users
  const daily = await prisma.user.count({
    where: {
      ...whereClause,
      lastLoginAt: { gte: oneDayAgo },
    },
  });

  // Weekly active users
  const weekly = await prisma.user.count({
    where: {
      ...whereClause,
      lastLoginAt: { gte: oneWeekAgo },
    },
  });

  // Monthly active users
  const monthly = await prisma.user.count({
    where: {
      ...whereClause,
      lastLoginAt: { gte: oneMonthAgo },
    },
  });

  // Total users
  const total = await prisma.user.count({ where: whereClause });

  return {
    daily,
    weekly,
    monthly,
    total,
  };
}

/**
 * Calculate inactive accounts
 */
async function calculateInactiveAccounts(
  role?: string,
  tenantId?: string
): Promise<InactiveAccount[]> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const whereClause = {
    ...(role && { role }),
    ...(tenantId && { tenantId }),
    OR: [
      { lastLoginAt: { lt: thirtyDaysAgo } },
      { lastLoginAt: null },
    ],
  };

  const inactiveUsers = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      role: true,
      lastLoginAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      tenant: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      lastLoginAt: "asc",
    },
    take: 100, // Limit to top 100 inactive accounts
  });

  return inactiveUsers.map((user) => {
    const daysSinceLogin = user.lastLoginAt
      ? differenceInDays(now, user.lastLoginAt)
      : null;

    return {
      userId: user.id,
      name: user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
        : "No Name",
      email: user.email,
      role: user.role,
      tenantName: user.tenant?.name || null,
      lastLoginAt: user.lastLoginAt,
      daysSinceLogin,
    };
  });
}

/**
 * Calculate login activity over time
 */
async function calculateLoginActivity(
  startDate: Date,
  endDate: Date,
  role?: string,
  tenantId?: string
): Promise<LoginActivity[]> {
  const whereClause = {
    createdAt: { gte: startDate, lte: endDate },
    type: "USER_LOGIN",
    ...(role && { details: { path: ["role"], equals: role } }),
    ...(tenantId && { details: { path: ["tenantId"], equals: tenantId } }),
  };

  const loginLogs = await prisma.activityLog.findMany({
    where: whereClause,
    select: {
      createdAt: true,
      userId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by date
  const activityMap = new Map<string, { count: number; users: Set<string> }>();

  loginLogs.forEach((log) => {
    const dateKey = format(log.createdAt, "yyyy-MM-dd");
    const existing = activityMap.get(dateKey) || { count: 0, users: new Set<string>() };
    existing.count++;
    if (log.userId) {
      existing.users.add(log.userId);
    }
    activityMap.set(dateKey, existing);
  });

  return Array.from(activityMap.entries()).map(([date, data]) => ({
    date,
    loginCount: data.count,
    uniqueUsers: data.users.size,
  }));
}

/**
 * Calculate users by role
 */
async function calculateUsersByRole(tenantId?: string): Promise<UsersByRole[]> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const whereClause = {
    ...(tenantId && { tenantId }),
  };

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    where: whereClause,
    _count: {
      role: true,
    },
  });

  const rolesData: UsersByRole[] = [];

  for (const roleGroup of usersByRole) {
    const activeCount = await prisma.user.count({
      where: {
        ...whereClause,
        role: roleGroup.role,
        lastLoginAt: { gte: thirtyDaysAgo },
      },
    });

    rolesData.push({
      role: roleGroup.role,
      count: roleGroup._count.role,
      active: activeCount,
      inactive: roleGroup._count.role - activeCount,
    });
  }

  return rolesData;
}

/**
 * Calculate worker performance metrics
 */
async function calculateWorkerPerformance(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<WorkerPerformance[]> {
  const workers = await prisma.user.findMany({
    where: {
      role: "WORKER",
      ...(tenantId && { tenantId }),
    },
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      tenant: {
        select: {
          name: true,
        },
      },
    },
  });

  const performanceData: WorkerPerformance[] = [];

  for (const worker of workers) {
    // Count completed operations
    const completedOperations = await prisma.operation.count({
      where: {
        assignedWorkerId: worker.id,
        status: "COMPLETED",
        updatedAt: { gte: startDate, lte: endDate },
      },
    });

    // Get operation completion times
    const operations = await prisma.operation.findMany({
      where: {
        assignedWorkerId: worker.id,
        status: "COMPLETED",
        updatedAt: { gte: startDate, lte: endDate },
        startedAt: { not: null },
      },
      select: {
        startedAt: true,
        updatedAt: true,
      },
    });

    let avgTaskTime = 0;
    if (operations.length > 0) {
      const totalHours = operations.reduce((sum, op) => {
        if (op.startedAt) {
          return sum + differenceInHours(op.updatedAt, op.startedAt);
        }
        return sum;
      }, 0);
      avgTaskTime = Math.round(totalHours / operations.length);
    }

    // Count material consumption records
    const materialsConsumed = await prisma.productionMaterialConsumption.count({
      where: {
        consumedBy: worker.id,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Calculate efficiency score (simple formula: completed operations per day)
    const daysInPeriod = Math.max(1, differenceInDays(endDate, startDate));
    const efficiencyScore = Math.round((completedOperations / daysInPeriod) * 10);

    performanceData.push({
      workerId: worker.id,
      name: worker.profile
        ? `${worker.profile.firstName} ${worker.profile.lastName}`.trim()
        : "No Name",
      email: worker.email,
      tenantName: worker.tenant?.name || null,
      tasksCompleted: completedOperations,
      operationsCompleted: completedOperations,
      materialsConsumed,
      avgTaskTime,
      efficiencyScore: Math.min(100, efficiencyScore), // Cap at 100
    });
  }

  return performanceData.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
}

/**
 * Calculate inspector performance metrics
 */
async function calculateInspectorPerformance(
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<InspectorPerformance[]> {
  const inspectors = await prisma.inspector.findMany({
    where: {
      ...(tenantId && { tenantId }),
    },
    select: {
      id: true,
      user: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          tenant: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const performanceData: InspectorPerformance[] = [];

  for (const inspector of inspectors) {
    // Get quality checks performed
    const qualityChecks = await prisma.qualityCheck.findMany({
      where: {
        inspectorId: inspector.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
        defectsFound: true,
      },
    });

    const inspectionsCompleted = qualityChecks.length;
    const approvedCount = qualityChecks.filter((qc) => qc.status === "APPROVED").length;
    const rejectedCount = qualityChecks.filter((qc) => qc.status === "REJECTED").length;
    const approvalRate =
      inspectionsCompleted > 0 ? Math.round((approvedCount / inspectionsCompleted) * 100) : 0;

    // Calculate average inspection time
    let avgInspectionTime = 0;
    if (qualityChecks.length > 0) {
      const totalHours = qualityChecks.reduce((sum, qc) => {
        return sum + differenceInHours(qc.updatedAt, qc.createdAt);
      }, 0);
      avgInspectionTime = Math.round(totalHours / qualityChecks.length);
    }

    // Count defects identified
    const defectsIdentified = qualityChecks.reduce((sum, qc) => {
      return sum + (qc.defectsFound || 0);
    }, 0);

    performanceData.push({
      inspectorId: inspector.id,
      name: inspector.user.profile
        ? `${inspector.user.profile.firstName} ${inspector.user.profile.lastName}`.trim()
        : "No Name",
      email: inspector.user.email,
      tenantName: inspector.user.tenant?.name || null,
      inspectionsCompleted,
      approvedCount,
      rejectedCount,
      approvalRate,
      avgInspectionTime,
      defectsIdentified,
    });
  }

  return performanceData.sort((a, b) => b.inspectionsCompleted - a.inspectionsCompleted);
}
