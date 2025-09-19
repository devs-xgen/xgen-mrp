"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Status } from "@prisma/client";

export interface AssignedWorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

export interface UpcomingOperationItem {
  id: string;
  workCenterName: string;
  productName: string;
  productSku: string;
  startTime: Date;
  endTime: Date;
  status: Status;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  createdAt: Date;
  details: any;
}

export async function getAssignedWorkCenters(): Promise<AssignedWorkCenter[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const rows = await prisma.userWorkCenter.findMany({
    where: { userId: session.user.id },
    include: {
      workCenter: { select: { id: true, name: true, capacityPerHour: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.workCenter.id,
    name: r.workCenter.name,
    capacityPerHour: Number(r.workCenter.capacityPerHour),
  }));
}

export async function getUpcomingOperations(): Promise<UpcomingOperationItem[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const userWorkCenters = await prisma.userWorkCenter.findMany({
    where: { userId: session.user.id },
    select: { workCenterId: true },
  });
  const workCenterIds = userWorkCenters.map((r) => r.workCenterId);

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const ops = await prisma.operation.findMany({
    where: {
      workCenterId: { in: workCenterIds },
      status: { in: [Status.PENDING, Status.IN_PROGRESS] },
      OR: [
        { endTime: { gte: now, lte: nextWeek } },
        { startTime: { gte: now, lte: nextWeek } },
      ],
    },
    include: {
      productionOrder: {
        select: {
          product: { select: { name: true, sku: true } },
        },
      },
      workCenter: { select: { name: true } },
    },
    orderBy: [{ endTime: "asc" }],
    take: 5,
  });

  return ops.map((op) => ({
    id: op.id,
    workCenterName: op.workCenter.name,
    productName: op.productionOrder.product.name,
    productSku: op.productionOrder.product.sku,
    startTime: op.startTime,
    endTime: op.endTime,
    status: op.status,
  }));
}

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const logs = await prisma.activityLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return logs.map((l) => ({
    id: l.id,
    type: l.type,
    createdAt: l.createdAt,
    details: l.details,
  }));
}
