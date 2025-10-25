"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrganizationStatus } from "@prisma/client";

// ============================================================================
// Type Definitions
// ============================================================================

export interface OrganizationSettings {
  operatingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  defaults?: {
    productionPriority?: string;
    leadTimeDays?: number;
  };
  locale?: {
    currency?: string;
    language?: string;
  };
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export interface ResourceLimits {
  maxUsers?: number;
  maxActiveOrders?: number;
  storageQuotaMB?: number;
  apiRateLimit?: number;
}

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string | null;
  contactPerson: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: OrganizationStatus;
  settings: OrganizationSettings | null;
  resourceLimits: ResourceLimits | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  archivedAt: Date | null;
  archivedBy: string | null;
  archivedReason: string | null;
  creatorName: string;
}

export interface OrganizationStatistics {
  totalUsers: number;
  activeUsers: number;
  totalProductionOrders: number;
  activeProductionOrders: number;
  totalRevenue: number;
  completedOrders: number;
  averageOrderValue: number;
  lastActivityDate: Date | null;
}

export interface CreateOrganizationInput {
  name: string;
  contactEmail: string;
  contactPhone?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  country?: string;
  settings?: OrganizationSettings;
  resourceLimits?: ResourceLimits;
  notes?: string;
}

// ============================================================================
// Organization CRUD
// ============================================================================

export async function getAllOrganizations() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const organizations = await prisma.organization.findMany({
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

    const orgData: OrganizationData[] = organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      contactPerson: org.contactPerson,
      address: org.address,
      city: org.city,
      country: org.country,
      status: org.status,
      settings: org.settings as OrganizationSettings | null,
      resourceLimits: org.resourceLimits as ResourceLimits | null,
      notes: org.notes,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      createdBy: org.createdBy,
      archivedAt: org.archivedAt,
      archivedBy: org.archivedBy,
      archivedReason: org.archivedReason,
      creatorName: org.creator.profile
        ? `${org.creator.profile.firstName} ${org.creator.profile.lastName}`
        : org.creator.email,
    }));

    return { success: true, data: orgData };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch organizations",
    };
  }
}

export async function getOrganizationById(orgId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
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
    });

    if (!org) {
      return { success: false, error: "Organization not found" };
    }

    const orgData: OrganizationData = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      contactPerson: org.contactPerson,
      address: org.address,
      city: org.city,
      country: org.country,
      status: org.status,
      settings: org.settings as OrganizationSettings | null,
      resourceLimits: org.resourceLimits as ResourceLimits | null,
      notes: org.notes,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      createdBy: org.createdBy,
      archivedAt: org.archivedAt,
      archivedBy: org.archivedBy,
      archivedReason: org.archivedReason,
      creatorName: org.creator.profile
        ? `${org.creator.profile.firstName} ${org.creator.profile.lastName}`
        : org.creator.email,
    };

    return { success: true, data: orgData };
  } catch (error) {
    console.error("Error fetching organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch organization",
    };
  }
}

export async function createOrganization(input: CreateOrganizationInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Generate slug from name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      return { success: false, error: "Organization with this name already exists" };
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: input.name,
        slug,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        contactPerson: input.contactPerson || null,
        address: input.address || null,
        city: input.city || null,
        country: input.country || null,
        settings: input.settings || null,
        resourceLimits: input.resourceLimits || null,
        notes: input.notes || null,
        createdBy: session.user.id,
      },
    });

    return { success: true, data: { id: organization.id } };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create organization",
    };
  }
}

export async function updateOrganization(orgId: string, input: Partial<CreateOrganizationInput>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: input.name,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        contactPerson: input.contactPerson,
        address: input.address,
        city: input.city,
        country: input.country,
        notes: input.notes,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update organization",
    };
  }
}

export async function updateOrganizationSettings(orgId: string, settings: OrganizationSettings) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: { settings: settings as any },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

export async function updateResourceLimits(orgId: string, limits: ResourceLimits) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: { resourceLimits: limits as any },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating resource limits:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update resource limits",
    };
  }
}

export async function updateOrganizationStatus(orgId: string, status: OrganizationStatus) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: { status },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating organization status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

export async function archiveOrganization(orgId: string, reason: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!reason || reason.trim().length < 15) {
      return { success: false, error: "Archive reason must be at least 15 characters" };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        archivedBy: session.user.id,
        archivedReason: reason,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error archiving organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive organization",
    };
  }
}

export async function reactivateOrganization(orgId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: "ACTIVE",
        archivedAt: null,
        archivedBy: null,
        archivedReason: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error reactivating organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reactivate organization",
    };
  }
}

// ============================================================================
// Organization Statistics
// ============================================================================

export async function getOrganizationStatistics(orgId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Note: This is a simplified version since we don't have tenantId on entities
    // In a real multi-tenant system, these queries would filter by tenantId

    // Get total and active users (approximation - you'd filter by organization in real implementation)
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        status: "ACTIVE",
        lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    });

    // Production orders statistics
    const totalProductionOrders = await prisma.productionOrder.count();
    const activeProductionOrders = await prisma.productionOrder.count({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    });
    const completedOrders = await prisma.productionOrder.count({
      where: { status: "COMPLETED" },
    });

    // Revenue calculation (from billing statements)
    const billings = await prisma.billingStatement.findMany({
      where: { status: "PAID" },
      select: { totalAmount: true },
    });

    const totalRevenue = billings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Last activity (latest user login)
    const latestUser = await prisma.user.findFirst({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: "desc" },
      select: { lastLoginAt: true },
    });

    const statistics: OrganizationStatistics = {
      totalUsers,
      activeUsers,
      totalProductionOrders,
      activeProductionOrders,
      totalRevenue,
      completedOrders,
      averageOrderValue,
      lastActivityDate: latestUser?.lastLoginAt || null,
    };

    return { success: true, data: statistics };
  } catch (error) {
    console.error("Error fetching organization statistics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch statistics",
    };
  }
}

// ============================================================================
// Dashboard Statistics
// ============================================================================

export async function getOrganizationsDashboard() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const totalOrganizations = await prisma.organization.count();
    const activeOrganizations = await prisma.organization.count({
      where: { status: "ACTIVE" },
    });
    const trialOrganizations = await prisma.organization.count({
      where: { status: "TRIAL" },
    });
    const suspendedOrganizations = await prisma.organization.count({
      where: { status: "SUSPENDED" },
    });

    return {
      success: true,
      data: {
        totalOrganizations,
        activeOrganizations,
        trialOrganizations,
        suspendedOrganizations,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch dashboard statistics",
    };
  }
}
