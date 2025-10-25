"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ============================================================================
// Type Definitions
// ============================================================================

export type ReportType =
  | "superadmin_activity"
  | "production"
  | "financial"
  | "user_access"
  | "data_modification"
  | "all_activity";

export interface AuditReportConfig {
  reportType: ReportType;
  startDate: Date;
  endDate: Date;
  filters?: {
    userId?: string;
    actionTypes?: string[];
    entityTypes?: string[];
    tenantId?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  actionType: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  metadata: any;
  ipAddress: string | null;
}

export interface AuditReportData {
  entries: AuditLogEntry[];
  summary: {
    totalEntries: number;
    period: string;
    generatedAt: Date;
    reportType: string;
    uniqueUsers: number;
    actionBreakdown: Record<string, number>;
  };
}

// ============================================================================
// Report Generation
// ============================================================================

export async function generateAuditReport(config: AuditReportConfig) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Build where clause based on report type and filters
    const where = buildWhereClause(config);

    // Fetch activity logs
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
      orderBy: { createdAt: "desc" },
      take: 10000, // Safety limit
    });

    // Transform to audit entries
    const entries: AuditLogEntry[] = logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      userId: log.userId,
      userName: log.user.profile
        ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
        : log.user.email,
      userEmail: log.user.email,
      userRole: log.user.role,
      actionType: log.type,
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      metadata: log.metadata,
      ipAddress: (log.metadata as any)?.ipAddress || null,
    }));

    // Calculate summary statistics
    const uniqueUsers = new Set(entries.map(e => e.userId)).size;

    const actionBreakdown: Record<string, number> = {};
    entries.forEach(entry => {
      actionBreakdown[entry.actionType] = (actionBreakdown[entry.actionType] || 0) + 1;
    });

    const reportData: AuditReportData = {
      entries,
      summary: {
        totalEntries: entries.length,
        period: `${config.startDate.toLocaleDateString()} - ${config.endDate.toLocaleDateString()}`,
        generatedAt: new Date(),
        reportType: getReportTypeName(config.reportType),
        uniqueUsers,
        actionBreakdown,
      },
    };

    return { success: true, data: reportData };
  } catch (error) {
    console.error("Error generating audit report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate audit report",
    };
  }
}

function buildWhereClause(config: AuditReportConfig): any {
  const where: any = {
    createdAt: {
      gte: config.startDate,
      lte: config.endDate,
    },
  };

  // Filter by user if specified
  if (config.filters?.userId) {
    where.userId = config.filters.userId;
  }

  // Filter by tenant if specified
  if (config.filters?.tenantId) {
    where.metadata = {
      path: ["tenantId"],
      equals: config.filters.tenantId,
    };
  }

  // Filter by report type
  switch (config.reportType) {
    case "superadmin_activity":
      where.user = {
        role: { in: ["SUPER_ADMIN"] },
      };
      break;

    case "production":
      where.OR = [
        { type: { contains: "PRODUCTION" } },
        { entityType: { in: ["ProductionOrder", "ProductionBOM", "Operation"] } },
      ];
      break;

    case "financial":
      where.OR = [
        { type: { contains: "BILLING" } },
        { type: { contains: "INVOICE" } },
        { type: { contains: "PAYMENT" } },
        { entityType: { in: ["BillingStatement", "SalesInvoice", "Transaction"] } },
      ];
      break;

    case "user_access":
      where.OR = [
        { type: { contains: "LOGIN" } },
        { type: { contains: "USER" } },
        { type: { contains: "ROLE" } },
        { type: { contains: "PASSWORD" } },
      ];
      break;

    case "data_modification":
      where.type = {
        in: ["CREATE", "UPDATE", "DELETE"],
      };
      break;

    case "all_activity":
      // No additional filters
      break;
  }

  // Filter by action types if specified
  if (config.filters?.actionTypes && config.filters.actionTypes.length > 0) {
    where.type = { in: config.filters.actionTypes };
  }

  // Filter by entity types if specified
  if (config.filters?.entityTypes && config.filters.entityTypes.length > 0) {
    where.entityType = { in: config.filters.entityTypes };
  }

  return where;
}

function getReportTypeName(type: ReportType): string {
  const names: Record<ReportType, string> = {
    superadmin_activity: "SuperAdmin Activity Report",
    production: "Production Audit Trail",
    financial: "Financial Audit Report",
    user_access: "User Access Report",
    data_modification: "Data Modification Report",
    all_activity: "Complete Activity Log",
  };
  return names[type];
}

// ============================================================================
// Available Options
// ============================================================================

export async function getAvailableUsers() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const users = await prisma.user.findMany({
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
      orderBy: { email: "asc" },
    });

    const userOptions = users.map(u => ({
      id: u.id,
      name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email,
      email: u.email,
      role: u.role,
    }));

    return { success: true, data: userOptions };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

export async function getAvailableActionTypes() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Get unique action types from activity logs
    const actionTypes = await prisma.activityLog.findMany({
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" },
    });

    return { success: true, data: actionTypes.map(a => a.type) };
  } catch (error) {
    console.error("Error fetching action types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch action types",
    };
  }
}

export async function getAvailableEntityTypes() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Get unique entity types from activity logs
    const entityTypes = await prisma.activityLog.findMany({
      where: { entityType: { not: null } },
      select: { entityType: true },
      distinct: ["entityType"],
      orderBy: { entityType: "asc" },
    });

    return {
      success: true,
      data: entityTypes.map(e => e.entityType).filter(Boolean) as string[],
    };
  } catch (error) {
    console.error("Error fetching entity types:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch entity types",
    };
  }
}

// ============================================================================
// Report Templates
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  config: AuditReportConfig;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function saveReportTemplate(name: string, description: string | null, config: AuditReportConfig) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Store as a saved report (reusing SavedReport model)
    const template = await prisma.savedReport.create({
      data: {
        name,
        description,
        createdBy: session.user.id,
        config: config as any,
        isPublic: true, // Audit templates are shared
      },
    });

    return { success: true, data: { id: template.id } };
  } catch (error) {
    console.error("Error saving report template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save report template",
    };
  }
}

export async function getReportTemplates() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const templates = await prisma.savedReport.findMany({
      where: {
        // Filter for audit report templates (could add a type field, but using naming convention for now)
        name: { contains: "Audit" },
      },
      include: {
        creator: {
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
      orderBy: { createdAt: "desc" },
    });

    const reportTemplates: ReportTemplate[] = templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      config: t.config as any,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return { success: true, data: reportTemplates };
  } catch (error) {
    console.error("Error fetching report templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch report templates",
    };
  }
}

export async function deleteReportTemplate(templateId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.savedReport.delete({
      where: { id: templateId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting report template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete report template",
    };
  }
}

// ============================================================================
// Statistics
// ============================================================================

export async function getAuditStatistics(days: number = 30) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const totalLogs = await prisma.activityLog.count({
      where: { createdAt: { gte: since } },
    });

    const superAdminLogs = await prisma.activityLog.count({
      where: {
        createdAt: { gte: since },
        user: { role: "SUPER_ADMIN" },
      },
    });

    const uniqueUsers = await prisma.activityLog.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ["userId"],
    });

    return {
      success: true,
      data: {
        totalLogs,
        superAdminLogs,
        uniqueUsers: uniqueUsers.length,
        period: `Last ${days} days`,
      },
    };
  } catch (error) {
    console.error("Error fetching audit statistics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch statistics",
    };
  }
}
