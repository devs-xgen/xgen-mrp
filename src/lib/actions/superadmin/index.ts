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
          id: { in: userIds, not: session.user.id }, // Extra safety
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
          id: { in: userIds, not: session.user.id },
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

// Dashboard Analytics Types
export type ProductionOrderStatusData = {
  status: string;
  count: number;
  value: number;
};

export type InventoryHealthData = {
  category: string;
  materials: number;
  products: number;
};

export type RevenueData = {
  month: string;
  revenue: number;
  orders: number;
};

export type QualityMetricsData = {
  totalChecks: number;
  passed: number;
  failed: number;
  pending: number;
  passRate: number;
};

export type TopProductsData = {
  name: string;
  orders: number;
  revenue: number;
};

export type MaterialConsumptionData = {
  name: string;
  consumed: number;
  reserved: number;
};

export type DashboardAnalytics = {
  productionOrdersByStatus: ProductionOrderStatusData[];
  inventoryHealth: InventoryHealthData[];
  revenueByMonth: RevenueData[];
  qualityMetrics: QualityMetricsData;
  topProducts: TopProductsData[];
  materialConsumption: MaterialConsumptionData[];
  lowStockAlerts: {
    materials: number;
    products: number;
  };
  productionEfficiency: {
    onTime: number;
    delayed: number;
    total: number;
  };
};

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  await ensureSuperAdmin();

  // Get production orders by status
  const productionOrders = await prisma.productionOrder.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { actualMaterialCost: true, plannedMaterialCost: true },
  });

  const productionOrdersByStatus = productionOrders.map(order => ({
    status: order.status,
    count: order._count.id,
    value: Number(order._sum.actualMaterialCost || order._sum.plannedMaterialCost || 0),
  }));

  // Get inventory health data
  const materialsByType = await prisma.material.groupBy({
    by: ['typeId'],
    _count: { id: true },
    where: { status: 'ACTIVE' },
  });

  // Get material type names
  const materialTypes = await prisma.materialType.findMany({
    where: { id: { in: materialsByType.map(m => m.typeId) } },
    select: { id: true, name: true },
  });

  const materialTypeMap = Object.fromEntries(materialTypes.map(t => [t.id, t.name]));

  const productsByCategory = await prisma.product.groupBy({
    by: ['categoryId'],
    _count: { id: true },
    where: { status: 'ACTIVE', archivedAt: null },
  });

  // Get category names for products
  const categories = await prisma.productCategory.findMany({
    where: { id: { in: productsByCategory.map(p => p.categoryId) } },
    select: { id: true, name: true },
  });

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  const inventoryHealth: InventoryHealthData[] = [
    ...materialsByType.map(m => ({
      category: materialTypeMap[m.typeId] || 'Unknown',
      materials: m._count.id,
      products: 0,
    })),
    ...productsByCategory.map(p => ({
      category: categoryMap[p.categoryId] || 'Unknown',
      materials: 0,
      products: p._count.id,
    })),
  ];

  // Get revenue by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const billingStatements = await prisma.billingStatement.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo },
      status: { in: ['PAID', 'PARTIAL'] },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  const revenueByMonth: { [key: string]: { revenue: number; orders: number } } = {};
  billingStatements.forEach(statement => {
    const monthKey = new Date(statement.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    if (!revenueByMonth[monthKey]) {
      revenueByMonth[monthKey] = { revenue: 0, orders: 0 };
    }
    revenueByMonth[monthKey].revenue += Number(statement.totalAmount);
    revenueByMonth[monthKey].orders += 1;
  });

  const revenueData: RevenueData[] = Object.entries(revenueByMonth).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    orders: data.orders,
  }));

  // Get quality metrics
  const qualityChecks = await prisma.qualityCheck.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const totalChecks = qualityChecks.reduce((sum, q) => sum + q._count.id, 0);
  const passed = qualityChecks.find(q => q.status === 'APPROVED')?._count.id || 0;
  const failed = qualityChecks.find(q => q.status === 'REJECTED')?._count.id || 0;
  const pending = qualityChecks.find(q => q.status === 'PENDING')?._count.id || 0;

  const qualityMetrics: QualityMetricsData = {
    totalChecks,
    passed,
    failed,
    pending,
    passRate: totalChecks > 0 ? (passed / totalChecks) * 100 : 0,
  };

  // Get top products by order count - calculate revenue manually
  const topProductsRaw = await prisma.orderLine.groupBy({
    by: ['productId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const productIds = topProductsRaw.map(p => p.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  // Get revenue for these products
  const productRevenue: { [key: string]: number } = {};
  for (const productId of productIds) {
    const orderLines = await prisma.orderLine.findMany({
      where: { productId },
      select: { quantity: true, unitPrice: true },
    });
    productRevenue[productId] = orderLines.reduce(
      (sum, line) => sum + Number(line.unitPrice) * line.quantity,
      0
    );
  }

  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

  const topProducts: TopProductsData[] = topProductsRaw
    .filter(p => p.productId)
    .map(p => ({
      name: productMap[p.productId!] || 'Unknown',
      orders: p._count.id,
      revenue: productRevenue[p.productId!] || 0,
    }));

  // Get material consumption
  const materialConsumptionRaw = await prisma.productionMaterialConsumption.groupBy({
    by: ['materialId'],
    _sum: { actualQuantity: true },
    orderBy: { _sum: { actualQuantity: 'desc' } },
    take: 5,
  });

  const materialIds = materialConsumptionRaw.map(m => m.materialId);
  const materials = await prisma.material.findMany({
    where: { id: { in: materialIds } },
    select: { id: true, name: true, committedStock: true },
  });

  const materialMap = Object.fromEntries(materials.map(m => [m.id, { name: m.name, reserved: m.committedStock }]));

  const materialConsumption: MaterialConsumptionData[] = materialConsumptionRaw.map(m => ({
    name: materialMap[m.materialId]?.name || 'Unknown',
    consumed: Number(m._sum.actualQuantity || 0),
    reserved: materialMap[m.materialId]?.reserved || 0,
  }));

  // Get low stock alerts - using raw query for field comparison
  const lowStockMaterials = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM "Material"
    WHERE "status" = 'ACTIVE'
    AND "currentStock" <= "minimumStockLevel"
  `;

  const lowStockProducts = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM "Product"
    WHERE "status" = 'ACTIVE'
    AND "archivedAt" IS NULL
    AND "currentStock" <= "minimumStockLevel"
  `;

  // Get production efficiency (simplified - comparing due date vs completion date)
  const completedOrders = await prisma.productionOrder.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { not: null },
    },
    select: {
      dueDate: true,
      completedAt: true,
    },
  });

  let onTime = 0;
  let delayed = 0;

  completedOrders.forEach(order => {
    if (order.completedAt && order.dueDate) {
      if (order.completedAt <= order.dueDate) {
        onTime++;
      } else {
        delayed++;
      }
    }
  });

  return {
    productionOrdersByStatus,
    inventoryHealth,
    revenueByMonth: revenueData,
    qualityMetrics,
    topProducts,
    materialConsumption,
    lowStockAlerts: {
      materials: Number(lowStockMaterials[0]?.count || 0),
      products: Number(lowStockProducts[0]?.count || 0),
    },
    productionEfficiency: {
      onTime,
      delayed,
      total: completedOrders.length,
    },
  };
}

