"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Get delivery orders for a specific user
export async function getDeliveryOrders(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const orders = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
              },
            },
            customerOrder: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                    postalCode: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { scheduledDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return orders;
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    throw new Error("Failed to fetch delivery orders");
  }
}

// Get delivery orders by status
export async function getDeliveryOrdersByStatus(
  userId: string,
  status: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const orders = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
        status: status as any,
      },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
              },
            },
            customerOrder: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                    postalCode: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
    });

    return orders;
  } catch (error) {
    console.error("Error fetching delivery orders by status:", error);
    throw new Error("Failed to fetch delivery orders by status");
  }
}

// Update delivery order notes
export async function updateDeliveryOrderNotes(orderId: string, notes: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const updatedOrder = await prisma.deliveryAssignment.update({
      where: {
        id: orderId,
        userId: session.user.id, // Ensure user can only update their own orders
      },
      data: {
        notes,
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/delivery/orders");
    revalidatePath(`/delivery/orders/${orderId}`);
    revalidatePath("/delivery/tasks");

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error updating delivery order notes:", error);
    throw new Error("Failed to update delivery order notes");
  }
}

// Mark delivery order as started
export async function startDeliveryOrder(orderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const updatedOrder = await prisma.deliveryAssignment.update({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      data: {
        status: "IN_PROGRESS",
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/delivery/orders");
    revalidatePath(`/delivery/orders/${orderId}`);
    revalidatePath("/delivery/tasks");
    revalidatePath("/delivery/dashboard");

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error starting delivery order:", error);
    throw new Error("Failed to start delivery order");
  }
}

// Complete delivery order
export async function completeDeliveryOrder(
  orderId: string,
  completionNotes?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const updatedOrder = await prisma.deliveryAssignment.update({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      data: {
        status: "COMPLETED",
        notes: completionNotes ? completionNotes : undefined,
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/delivery/orders");
    revalidatePath(`/delivery/orders/${orderId}`);
    revalidatePath("/delivery/tasks");
    revalidatePath("/delivery/dashboard");
    revalidatePath("/admin/production");

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error completing delivery order:", error);
    throw new Error("Failed to complete delivery order");
  }
}

// Get delivery order statistics
export async function getDeliveryOrderStatistics(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const orders = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
      },
      select: {
        status: true,
        scheduledDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
    const inProgressOrders = orders.filter(
      (o) => o.status === "IN_PROGRESS"
    ).length;
    const completedOrders = orders.filter(
      (o) => o.status === "COMPLETED"
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === "CANCELLED"
    ).length;

    // Calculate overdue orders
    const now = new Date();
    const overdueOrders = orders.filter(
      (o) =>
        o.scheduledDate &&
        o.scheduledDate < now &&
        o.status !== "COMPLETED" &&
        o.status !== "CANCELLED"
    ).length;

    return {
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      overdueOrders,
    };
  } catch (error) {
    console.error("Error fetching delivery order statistics:", error);
    throw new Error("Failed to fetch delivery order statistics");
  }
}
