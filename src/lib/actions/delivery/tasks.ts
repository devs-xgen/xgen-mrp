"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { validateDeliveryStatusDependencies } from "@/lib/actions/production-order";

// Helper function to serialize Prisma Decimal values
function serializeDecimal(value: any) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return value.toNumber();
  }
  return value;
}

// Helper function to serialize an object with potential Decimal values
function serializeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeObject(item));
  }
  if (typeof obj === "object") {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null && "toNumber" in value) {
        serialized[key] = (value as any).toNumber();
      } else if (typeof value === "object") {
        serialized[key] = serializeObject(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  return obj;
}

// Get delivery tasks for a specific user
export async function getDeliveryTasks(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const tasks = await prisma.deliveryAssignment.findMany({
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

    return serializeObject(tasks);
  } catch (error) {
    console.error("Error fetching delivery tasks:", error);
    throw new Error("Failed to fetch delivery tasks");
  }
}

// Get pending delivery tasks
export async function getPendingDeliveryTasks(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const tasks = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
        status: "PENDING",
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
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    });

    return serializeObject(tasks);
  } catch (error) {
    console.error("Error fetching pending delivery tasks:", error);
    throw new Error("Failed to fetch pending delivery tasks");
  }
}

// Get in-progress delivery tasks
export async function getInProgressDeliveryTasks(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const tasks = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
        status: "IN_PROGRESS",
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
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    });

    return serializeObject(tasks);
  } catch (error) {
    console.error("Error fetching in-progress delivery tasks:", error);
    throw new Error("Failed to fetch in-progress delivery tasks");
  }
}

// Update delivery task status with dependency validation
export async function updateDeliveryTaskStatus(
  taskId: string,
  status: string,
  notes?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Validate status
    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    // Get the delivery assignment to validate dependencies
    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: {
        id: taskId,
        userId: session.user.id, // Ensure user can only update their own tasks
      },
      select: { productionOrderId: true, status: true },
    });

    if (!deliveryAssignment) {
      throw new Error("Delivery task not found or unauthorized");
    }

    // Validate delivery status dependencies
    const validation = await validateDeliveryStatusDependencies(
      deliveryAssignment.productionOrderId,
      status as any
    );

    if (!validation.isAllowed) {
      const errorMessage = [
        `Cannot update delivery status to ${status}.`,
        ...validation.blockingReasons,
        ...(validation.recommendations.length > 0
          ? ["Recommendations:", ...validation.recommendations]
          : []),
      ].join(" ");

      throw new Error(errorMessage);
    }

    const updatedTask = await prisma.deliveryAssignment.update({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      data: {
        status: status as any,
        notes: notes || undefined,
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/delivery/tasks");
    revalidatePath("/delivery/orders");
    revalidatePath("/delivery/dashboard");
    revalidatePath(`/delivery/orders/${taskId}`);

    return { success: true, task: serializeObject(updatedTask) };
  } catch (error) {
    console.error("Error updating delivery task status:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update delivery task status"
    );
  }
}

// Get today's delivery tasks
export async function getTodaysDeliveryTasks(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
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
      orderBy: [{ scheduledDate: "asc" }, { status: "asc" }],
    });

    return serializeObject(tasks);
  } catch (error) {
    console.error("Error fetching today's delivery tasks:", error);
    throw new Error("Failed to fetch today's delivery tasks");
  }
}

// Get overdue delivery tasks
export async function getOverdueDeliveryTasks(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const now = new Date();

    const tasks = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
        scheduledDate: {
          lt: now,
        },
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
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
      orderBy: [{ scheduledDate: "asc" }],
    });

    return serializeObject(tasks);
  } catch (error) {
    console.error("Error fetching overdue delivery tasks:", error);
    throw new Error("Failed to fetch overdue delivery tasks");
  }
}

// Update delivery task priority
export async function updateDeliveryTaskPriority(
  taskId: string,
  priority: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Validate priority
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    if (!validPriorities.includes(priority)) {
      throw new Error("Invalid priority");
    }

    // Update the production order priority since delivery tasks inherit from production orders
    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: { id: taskId },
      select: { productionOrderId: true, userId: true },
    });

    if (!deliveryAssignment || deliveryAssignment.userId !== session.user.id) {
      throw new Error("Delivery task not found or unauthorized");
    }

    const updatedProductionOrder = await prisma.productionOrder.update({
      where: {
        id: deliveryAssignment.productionOrderId,
      },
      data: {
        priority: priority as any,
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/delivery/tasks");
    revalidatePath("/delivery/orders");
    revalidatePath("/delivery/dashboard");

    return {
      success: true,
      productionOrder: serializeObject(updatedProductionOrder),
    };
  } catch (error) {
    console.error("Error updating delivery task priority:", error);
    throw new Error("Failed to update delivery task priority");
  }
}
