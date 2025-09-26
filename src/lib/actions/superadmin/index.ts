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

