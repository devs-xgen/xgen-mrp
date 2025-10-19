"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import type { UserData } from "@/types/admin/user";

export async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Super Admin access required");
  }
  return session;
}

export type SuperAdminMetrics = {
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  totalCustomerOrders: number;
  totalProductionOrders: number;
  totalMaterials: number;
  totalProducts: number;
  openSupportTickets: number;
};

export async function getSystemMetrics(): Promise<SuperAdminMetrics> {
  await ensureSuperAdmin();

  const [
    totalUsers,
    activeUsers,
    totalCustomers,
    totalCustomerOrders,
    totalProductionOrders,
    totalMaterials,
    totalProducts,
    openSupportTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.customer.count(),
    prisma.customerOrder.count(),
    prisma.productionOrder.count(),
    prisma.material.count(),
    prisma.product.count(),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalCustomers,
    totalCustomerOrders,
    totalProductionOrders,
    totalMaterials,
    totalProducts,
    openSupportTickets,
  };
}

export async function getGlobalUsers(): Promise<UserData[]> {
  await ensureSuperAdmin();

  const users = await prisma.user.findMany({
    include: {
      profile: true,
      inspector: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map(({ password, inspector, ...rest }) => {
    return {
      ...rest,
      inspector: inspector
        ? {
            inspectorId: inspector.inspectorId,
            phoneNumber: inspector.phoneNumber,
            department: inspector.department,
            specialization: inspector.specialization,
            certificationLevel: inspector.certificationLevel,
            yearsOfExperience: inspector.yearsOfExperience,
            isActive: inspector.isActive,
            notes: inspector.notes,
          }
        : null,
      profile: rest.profile,
    } as UserData;
  });
}

export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const session = await ensureSuperAdmin();

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const hashedPassword = await hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/superadmin/users");
  revalidatePath("/admin/users");
  revalidatePath("/developer/users");
}

/**
 * Bulk suspend users
 */
export async function bulkSuspendUsers(
  userIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (userIds.length === 0) {
      return { success: false, error: "No users selected" };
    }

    if (userIds.length > 100) {
      return { success: false, error: "Cannot suspend more than 100 users at once" };
    }

    if (!reason || reason.length < 15) {
      return { success: false, error: "Audit reason must be at least 15 characters" };
    }

    // Cannot suspend yourself
    if (userIds.includes(session.user.id)) {
      return { success: false, error: "Cannot suspend your own account" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: { in: userIds },
          id: { not: session.user.id }, // Extra safety
        },
        data: {
          status: "INACTIVE",
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_USER_SUSPEND",
          description: `Suspended ${updated.count} user accounts`,
          metadata: {
            userIds,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/users");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[SuperAdmin] Error suspending users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to suspend users",
    };
  }
}

/**
 * Bulk activate users
 */
export async function bulkActivateUsers(
  userIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (userIds.length === 0) {
      return { success: false, error: "No users selected" };
    }

    if (!reason || reason.length < 15) {
      return { success: false, error: "Audit reason must be at least 15 characters" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          status: "ACTIVE",
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_USER_ACTIVATE",
          description: `Activated ${updated.count} user accounts`,
          metadata: {
            userIds,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/users");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[SuperAdmin] Error activating users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to activate users",
    };
  }
}

/**
 * Bulk change user roles
 */
export async function bulkChangeUserRoles(
  userIds: string[],
  newRole: string,
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (userIds.length === 0) {
      return { success: false, error: "No users selected" };
    }

    if (!reason || reason.length < 15) {
      return { success: false, error: "Audit reason must be at least 15 characters" };
    }

    // Cannot change own role
    if (userIds.includes(session.user.id)) {
      return { success: false, error: "Cannot change your own role" };
    }

    const validRoles = ["ADMIN", "WORKER", "INSPECTOR", "DELIVERY", "SUPER_ADMIN", "DEVELOPER"];
    if (!validRoles.includes(newRole)) {
      return { success: false, error: "Invalid role specified" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: { in: userIds },
          id: { not: session.user.id },
        },
        data: {
          role: newRole as any,
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_ROLE_CHANGE",
          description: `Changed role for ${updated.count} users to ${newRole}`,
          metadata: {
            userIds,
            newRole,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/users");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[SuperAdmin] Error changing user roles:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change roles",
    };
  }
}

/**
 * Force password reset for users
 */
export async function bulkResetPasswords(
  userIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (userIds.length === 0) {
      return { success: false, error: "No users selected" };
    }

    if (!reason || reason.length < 15) {
      return { success: false, error: "Audit reason must be at least 15 characters" };
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await hash(tempPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          password: hashedPassword,
          modifiedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_PASSWORD_RESET",
          description: `Reset passwords for ${updated.count} users`,
          metadata: {
            userIds,
            reason,
            tempPassword, // In production, this should be removed or encrypted
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/users");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[SuperAdmin] Error resetting passwords:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset passwords",
    };
  }
}

