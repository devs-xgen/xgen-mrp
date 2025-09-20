"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function ensureSuperAdmin() {
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

