"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get delivery dashboard data for a specific user
export async function getDeliveryDashboardData(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get delivery assignments with status counts
    const assignments = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
            customerOrder: {
              include: {
                customer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalAssignments = assignments.length;
    const pendingAssignments = assignments.filter(
      (a) => a.status === "PENDING"
    ).length;
    const inProgressAssignments = assignments.filter(
      (a) => a.status === "IN_PROGRESS"
    ).length;
    const completedAssignments = assignments.filter(
      (a) => a.status === "COMPLETED"
    ).length;

    // Get recent assignments (last 5)
    const recentAssignments = assignments.slice(0, 5);

    // Get overdue assignments (scheduled date passed but not completed)
    const now = new Date();
    const overdueAssignments = assignments.filter(
      (a) =>
        a.scheduledDate &&
        a.scheduledDate < now &&
        a.status !== "COMPLETED" &&
        a.status !== "CANCELLED"
    );

    // Get today's assignments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAssignments = assignments.filter(
      (a) =>
        a.scheduledDate &&
        a.scheduledDate >= today &&
        a.scheduledDate < tomorrow
    );

    return {
      statistics: {
        totalAssignments,
        pendingAssignments,
        inProgressAssignments,
        completedAssignments,
        overdueAssignments: overdueAssignments.length,
        todaysAssignments: todaysAssignments.length,
      },
      recentAssignments,
      overdueAssignments,
      todaysAssignments,
      allAssignments: assignments,
    };
  } catch (error) {
    console.error("Error fetching delivery dashboard data:", error);
    throw new Error("Failed to fetch delivery dashboard data");
  }
}

// Get delivery performance metrics for a user
export async function getDeliveryPerformanceMetrics(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get completed deliveries for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedDeliveries = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        productionOrder: {
          include: {
            customerOrder: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    // Calculate on-time delivery rate
    const onTimeDeliveries = completedDeliveries.filter((delivery) => {
      if (!delivery.scheduledDate) return true; // No schedule = on time
      return delivery.updatedAt <= delivery.scheduledDate;
    });

    const onTimeRate =
      completedDeliveries.length > 0
        ? (onTimeDeliveries.length / completedDeliveries.length) * 100
        : 0;

    // Calculate average delivery time (from assignment to completion)
    const deliveryTimes = completedDeliveries.map((delivery) => {
      const assignmentTime = delivery.createdAt;
      const completionTime = delivery.updatedAt;
      return completionTime.getTime() - assignmentTime.getTime();
    });

    const averageDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + time, 0) /
          deliveryTimes.length
        : 0;

    // Convert to hours
    const averageDeliveryHours = Math.round(
      averageDeliveryTime / (1000 * 60 * 60)
    );

    return {
      totalCompletedDeliveries: completedDeliveries.length,
      onTimeDeliveryRate: Math.round(onTimeRate),
      averageDeliveryTime: averageDeliveryHours,
      recentCompletedDeliveries: completedDeliveries.slice(0, 10),
    };
  } catch (error) {
    console.error("Error fetching delivery performance metrics:", error);
    throw new Error("Failed to fetch delivery performance metrics");
  }
}
