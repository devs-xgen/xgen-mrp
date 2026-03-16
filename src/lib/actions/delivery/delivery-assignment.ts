"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  DeliveryAssignmentInput,
  UpdateDeliveryAssignmentInput,
} from "@/types/admin/production-order";
import { DeliveryAssignment, Status } from "@prisma/client";
import { validateDeliveryStatusDependencies } from "@/lib/actions/production-order";

// Helper function to serialize Prisma Decimal values
function serializeDecimal(value: any) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && "toNumber" in value) {
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

// Get users with delivery role
export async function getDeliveryUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "DELIVERY",
        status: "ACTIVE",
      },
      include: {
        profile: true,
      },
      orderBy: {
        profile: {
          firstName: "asc",
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching delivery users:", error);
    throw new Error("Failed to fetch delivery users");
  }
}

// Get delivery assignments for a specific user
export async function getDeliveryAssignments(userId: string) {
  try {
    const assignments = await prisma.deliveryAssignment.findMany({
      where: {
        userId,
      },
      include: {
        productionOrder: {
          include: {
            product: true,
            customerOrder: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize the data to handle Decimal types
    return serializeObject(assignments);
  } catch (error) {
    console.error("Error fetching delivery assignments:", error);
    throw new Error("Failed to fetch delivery assignments");
  }
}

// Get delivery assignment for a production order
export async function getDeliveryAssignment(productionOrderId: string) {
  try {
    if (!productionOrderId) {
      console.error("No productionOrderId provided");
      return null;
    }

    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: {
        productionOrderId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        productionOrder: {
          include: {
            product: true,
            customerOrder: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    if (!deliveryAssignment) {
      // This is not an error case, just means no assignment exists yet
      return null;
    }

    // Create a formatted response with proper null handling
    return {
      id: deliveryAssignment.id,
      userId: deliveryAssignment.userId,
      userName: deliveryAssignment.user.profile
        ? `${deliveryAssignment.user.profile.firstName} ${deliveryAssignment.user.profile.lastName}`
        : deliveryAssignment.user.email,
      scheduledDate: deliveryAssignment.scheduledDate,
      status: deliveryAssignment.status,
      deliveryAddress: deliveryAssignment.deliveryAddress || null,
      notes: deliveryAssignment.notes || null,
      createdAt: deliveryAssignment.createdAt,
      updatedAt: deliveryAssignment.updatedAt,
      productionOrder: {
        id: deliveryAssignment.productionOrder.id,
        product: {
          id: deliveryAssignment.productionOrder.product.id,
          name: deliveryAssignment.productionOrder.product.name,
        },
        customerOrder: deliveryAssignment.productionOrder.customerOrder
          ? {
              id: deliveryAssignment.productionOrder.customerOrder.id,
              shippingAddress:
                deliveryAssignment.productionOrder.customerOrder
                  .shippingAddress || null,
              customer: {
                id: deliveryAssignment.productionOrder.customerOrder.customer
                  .id,
                name: deliveryAssignment.productionOrder.customerOrder.customer
                  .name,
              },
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Error fetching delivery assignment:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch delivery assignment");
  }
}

// Get delivery assignment details by ID
export async function getDeliveryAssignmentById(id: string) {
  try {
    const assignment = await prisma.deliveryAssignment.findUnique({
      where: {
        id,
      },
      include: {
        productionOrder: {
          include: {
            product: true,
            customerOrder: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new Error("Delivery assignment not found");
    }

    // Serialize the data to handle Decimal types
    return serializeObject(assignment);
  } catch (error) {
    console.error("Error fetching delivery assignment:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch delivery assignment");
  }
}

// Update delivery assignment status with dependency validation
export async function updateDeliveryAssignmentStatus(
  id: string,
  status: Status
) {
  try {
    // Validate status
    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    // Get the delivery assignment to validate dependencies
    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: { id },
      select: { productionOrderId: true, status: true },
    });

    if (!deliveryAssignment) {
      throw new Error("Delivery assignment not found");
    }

    // Validate delivery status dependencies
    const validation = await validateDeliveryStatusDependencies(
      deliveryAssignment.productionOrderId,
      status
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

    const assignment = await prisma.deliveryAssignment.update({
      where: {
        id,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        productionOrder: {
          include: {
            product: true,
            customerOrder: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/admin/production");
    revalidatePath("/delivery/tasks");
    revalidatePath(`/delivery/orders/${id}`);
    return serializeObject(assignment);
  } catch (error) {
    console.error("Error updating delivery assignment status:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update delivery assignment status"
    );
  }
}

// Assign delivery to a production order
export async function assignDeliveryToProductionOrder(data: {
  productionOrderId: string;
  userId: string;
  scheduledDate?: Date;
  deliveryAddress?: string;
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Check if there's already an assignment
    const existingAssignment = await prisma.deliveryAssignment.findUnique({
      where: {
        productionOrderId: data.productionOrderId,
      },
    });

    if (existingAssignment) {
      throw new Error(
        "This production order already has a delivery assignment"
      );
    }

    // Create new assignment
    const deliveryAssignment = await prisma.deliveryAssignment.create({
      data: {
        productionOrderId: data.productionOrderId,
        userId: data.userId,
        scheduledDate: data.scheduledDate,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        createdBy: session.user.id,
        modifiedBy: session.user.id,
      },
    });

    // Revalidate the production order page
    revalidatePath(`/admin/production/${data.productionOrderId}`);
    revalidatePath("/delivery/tasks");

    return { success: true, id: deliveryAssignment.id };
  } catch (error) {
    console.error("Error assigning delivery:", error);
    throw error;
  }
}

// Update a delivery assignment
export async function updateDeliveryAssignment(
  id: string,
  data: {
    userId?: string;
    scheduledDate?: Date;
    deliveryAddress?: string;
    notes?: string;
    modifiedBy: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get the assignment to validate it exists
    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: {
        id,
      },
      select: {
        productionOrderId: true,
      },
    });

    if (!deliveryAssignment) {
      throw new Error("Delivery assignment not found");
    }

    // Update the assignment using proper nested update syntax
    const updatedAssignment = await prisma.deliveryAssignment.update({
      where: {
        id,
      },
      data: {
        scheduledDate: data.scheduledDate,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        modifiedBy: data.modifiedBy,
        ...(data.userId && {
          user: {
            connect: {
              id: data.userId,
            },
          },
        }),
      },
    });

    // Revalidate the production order page
    revalidatePath(`/admin/production/${deliveryAssignment.productionOrderId}`);
    revalidatePath("/delivery/tasks");
    revalidatePath(`/delivery/orders/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating delivery assignment:", error);
    throw error;
  }
}

export async function createDeliveryAssignment(data: {
  productionOrderId: string;
  userId: string;
  scheduledDate?: Date;
  deliveryAddress?: string;
  notes?: string;
  createdBy: string;
}) {
  try {
    const assignment = await prisma.deliveryAssignment.create({
      data: {
        productionOrderId: data.productionOrderId,
        userId: data.userId,
        scheduledDate: data.scheduledDate,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        createdBy: data.createdBy,
        modifiedBy: data.createdBy,
      },
    });

    revalidatePath("/admin/production");
    revalidatePath("/delivery/tasks");
    return assignment;
  } catch (error) {
    console.error("Error creating delivery assignment:", error);
    throw new Error("Failed to create delivery assignment");
  }
}

export async function deleteDeliveryAssignment(id: string) {
  try {
    await prisma.deliveryAssignment.delete({
      where: {
        id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting delivery assignment:", error);
    throw new Error("Failed to delete delivery assignment");
  }
}
