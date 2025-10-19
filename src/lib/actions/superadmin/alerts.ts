"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================================
// Type Definitions
// ============================================================================

export interface AlertCondition {
  metric: string;
  operator: ">" | "<" | ">=" | "<=";
  threshold: number;
  duration: number; // seconds
}

export interface AlertRuleInput {
  name: string;
  description?: string;
  condition: AlertCondition;
  enabled: boolean;
  channels: string[];
  recipients: string[];
}

export interface AlertRuleData {
  id: string;
  name: string;
  description: string | null;
  condition: AlertCondition;
  enabled: boolean;
  channels: string[];
  recipients: string[];
  createdAt: Date;
  updatedAt: Date;
  creatorName: string;
}

export interface AlertHistoryData {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  resolvedAt: Date | null;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  metricValue: number | null;
  isActive: boolean;
}

// ============================================================================
// Alert Rule Management
// ============================================================================

export async function createAlertRule(input: AlertRuleInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const alertRule = await prisma.alertRule.create({
      data: {
        name: input.name,
        description: input.description || null,
        condition: input.condition as any,
        enabled: input.enabled,
        channels: input.channels,
        recipients: input.recipients,
        createdBy: session.user.id,
      },
    });

    return { success: true, data: { id: alertRule.id } };
  } catch (error) {
    console.error("Error creating alert rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create alert rule",
    };
  }
}

export async function updateAlertRule(ruleId: string, input: Partial<AlertRuleInput>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.alertRule.update({
      where: { id: ruleId },
      data: {
        name: input.name,
        description: input.description,
        condition: input.condition as any,
        enabled: input.enabled,
        channels: input.channels,
        recipients: input.recipients,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating alert rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update alert rule",
    };
  }
}

export async function deleteAlertRule(ruleId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.alertRule.delete({
      where: { id: ruleId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete alert rule",
    };
  }
}

export async function toggleAlertRule(ruleId: string, enabled: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.alertRule.update({
      where: { id: ruleId },
      data: { enabled },
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling alert rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle alert rule",
    };
  }
}

export async function getAlertRules() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const rules = await prisma.alertRule.findMany({
      include: {
        creator: {
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
      orderBy: { createdAt: "desc" },
    });

    const alertRules: AlertRuleData[] = rules.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      condition: r.condition as AlertCondition,
      enabled: r.enabled,
      channels: r.channels,
      recipients: r.recipients,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      creatorName: r.creator.profile
        ? `${r.creator.profile.firstName} ${r.creator.profile.lastName}`
        : r.creator.email,
    }));

    return { success: true, data: alertRules };
  } catch (error) {
    console.error("Error getting alert rules:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get alert rules",
    };
  }
}

// ============================================================================
// Alert History Management
// ============================================================================

export async function getAlertHistory(limit: number = 50, activeOnly: boolean = false) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const history = await prisma.alertHistory.findMany({
      where: activeOnly ? { resolvedAt: null } : undefined,
      include: {
        rule: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { triggeredAt: "desc" },
      take: limit,
    });

    const alertHistory: AlertHistoryData[] = history.map(h => ({
      id: h.id,
      ruleId: h.ruleId,
      ruleName: h.rule.name,
      triggeredAt: h.triggeredAt,
      resolvedAt: h.resolvedAt,
      acknowledged: h.acknowledged,
      acknowledgedBy: h.acknowledgedBy,
      acknowledgedAt: h.acknowledgedAt,
      metricValue: h.metricValue,
      isActive: h.resolvedAt === null,
    }));

    return { success: true, data: alertHistory };
  } catch (error) {
    console.error("Error getting alert history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get alert history",
    };
  }
}

export async function acknowledgeAlert(alertId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.alertHistory.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy: session.user.id,
        acknowledgedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to acknowledge alert",
    };
  }
}

export async function resolveAlert(alertId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.alertHistory.update({
      where: { id: alertId },
      data: {
        resolvedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resolving alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resolve alert",
    };
  }
}

// ============================================================================
// Metric Options (for alert configuration)
// ============================================================================

export const AVAILABLE_METRICS = [
  { value: "errorRate", label: "Error Rate (%)", unit: "%" },
  { value: "avgResponseTime", label: "Average Response Time", unit: "ms" },
  { value: "p95ResponseTime", label: "P95 Response Time", unit: "ms" },
  { value: "requestsPerMinute", label: "Requests Per Minute", unit: "req/min" },
  { value: "dbResponseTime", label: "Database Response Time", unit: "ms" },
  { value: "memoryUsage", label: "Memory Usage", unit: "%" },
  { value: "diskUsage", label: "Disk Usage", unit: "%" },
  { value: "activeUsers", label: "Active Users", unit: "users" },
];

export const ALERT_CHANNELS = [
  { value: "email", label: "Email", icon: "Mail" },
  { value: "slack", label: "Slack", icon: "MessageSquare" },
  { value: "sms", label: "SMS", icon: "Phone" },
];
