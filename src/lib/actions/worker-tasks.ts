import { prisma } from "../db";
import { Prisma, Status, Operation } from "@prisma/client";

export interface Task {
  id: string;
  notes: string | null;
  status: Status;
  startTime: Date;
  endTime: Date;
  productionOrder: {
    id: string;
    status: Status;
  } | null;
}

export interface Stat {
  title: string;
  value: number;
  description: string;
  icon: "ClipboardList" | "Package" | "Clock" | "CheckCircle";
}

export async function getWorkerTasks(
  workerId: string
): Promise<{ tasks: Task[]; stats: Stat[] }> {
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch tasks for the worker
  const tasks = await prisma.operation.findMany({
    where: {
      assignedToId: workerId,
    },
    include: {
      productionOrder: true,
    },
  });

  // Calculate stats
  const totalTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
    },
  });

  const completedTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
      status: "COMPLETED",
    },
  });

  const inProgressTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
      status: "IN_PROGRESS",
    },
  });

  const urgentTasks = await prisma.operation.count({
    where: {
      assignedToId: workerId,
      status: Status.IN_PROGRESS,
    },
  });

  const stats: Stat[] = [
    {
      title: "Total Tasks",
      value: totalTasks,
      description: "All assigned tasks",
      icon: "ClipboardList",
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      description: "Currently working on",
      icon: "Clock",
    },
    {
      title: "Completed",
      value: completedTasks,
      description: "Successfully finished",
      icon: "CheckCircle",
    },
    {
      title: "Urgent",
      value: urgentTasks,
      description: "Requires immediate attention",
      icon: "Package",
    },
  ];

  return {
    tasks: tasks.map((task) => ({
      id: task.id,
      notes: task.notes,
      status: task.status,
      startTime: task.startTime,
      endTime: task.endTime,
      productionOrder: task.productionOrder
        ? {
            id: task.productionOrder.id,
            status: task.productionOrder.status,
          }
        : null,
    })),
    stats,
  };
}

export async function updateWorkerTask(
  taskId: string,
  workerId: string,
  data: {
    status?: Status;
    notes?: string;
    startTime?: Date;
    endTime?: Date;
  }
): Promise<Task> {
  // First verify that the task belongs to the worker
  const task = await prisma.operation.findFirst({
    where: {
      id: taskId,
      assignedToId: workerId,
    },
  });

  if (!task) {
    throw new Error("Task not found or not assigned to this worker");
  }

  // Update the task
  const updatedTask = await prisma.operation.update({
    where: {
      id: taskId,
    },
    data: {
      status: data.status,
      notes: data.notes,
      startTime: data.startTime,
      endTime: data.endTime,
      updatedAt: new Date(),
    },
    include: {
      productionOrder: true,
    },
  });

  return {
    id: updatedTask.id,
    notes: updatedTask.notes,
    status: updatedTask.status,
    startTime: updatedTask.startTime,
    endTime: updatedTask.endTime,
    productionOrder: updatedTask.productionOrder
      ? {
          id: updatedTask.productionOrder.id,
          status: updatedTask.productionOrder.status,
        }
      : null,
  };
}

/**
 * Get production orders that have operations in work centers assigned to the current worker
 */
export async function getWorkerProductionOrders() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Find the user's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: {
        userId: userId,
      },
      select: {
        workCenterId: true,
      },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    if (workCenterIds.length === 0) {
      return [];
    }

    // Fetch production orders that have operations in the user's work centers
    const orders = await prisma.productionOrder.findMany({
      where: {
        operations: {
          some: {
            workCenterId: {
              in: workCenterIds,
            },
          },
        },
      },
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
          select: {
            id: true,
            orderNumber: true,
          },
        },
        operations: {
          where: {
            workCenterId: {
              in: workCenterIds,
            },
          },
          include: {
            workCenter: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            startTime: "asc",
          },
        },
        qualityChecks: {
          select: {
            id: true,
            checkDate: true,
            status: true,
            defectsFound: true,
          },
          orderBy: {
            checkDate: "desc",
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { startDate: "asc" },
      ],
    });

    return orders;
  } catch (error) {
    console.error("Error fetching worker production orders:", error);
    throw new Error("Failed to fetch production orders");
  }
}

/**
 * Get a single production order with details if worker has access
 */
export async function getWorkerProductionOrderById(orderId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Find the user's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: {
        userId: userId,
      },
      select: {
        workCenterId: true,
      },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    if (workCenterIds.length === 0) {
      throw new Error("No work centers assigned to user");
    }

    // Fetch the production order
    const order = await prisma.productionOrder.findFirst({
      where: {
        id: orderId,
        operations: {
          some: {
            workCenterId: {
              in: workCenterIds,
            },
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
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
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
          },
        },
        operations: {
          where: {
            workCenterId: {
              in: workCenterIds,
            },
          },
          include: {
            workCenter: {
              select: {
                id: true,
                name: true,
                description: true,
                capacityPerHour: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            startTime: "asc",
          },
        },
        qualityChecks: {
          select: {
            id: true,
            checkDate: true,
            status: true,
            defectsFound: true,
            notes: true,
          },
          orderBy: {
            checkDate: "desc",
          },
        },
      },
    });

    if (!order) {
      throw new Error("Production order not found or access denied");
    }

    return order;
  } catch (error) {
    console.error("Error fetching worker production order:", error);
    throw new Error("Failed to fetch production order");
  }
}

/**
 * Get statistics for worker's production orders
 */
export async function getWorkerProductionOrderStats() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: {
        userId: userId,
      },
      select: {
        workCenterId: true,
      },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    if (workCenterIds.length === 0) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        pending: 0,
      };
    }

    const [total, active, completed, pending] = await Promise.all([
      prisma.productionOrder.count({
        where: {
          operations: {
            some: {
              workCenterId: {
                in: workCenterIds,
              },
            },
          },
        },
      }),
      prisma.productionOrder.count({
        where: {
          status: "ACTIVE",
          operations: {
            some: {
              workCenterId: {
                in: workCenterIds,
              },
            },
          },
        },
      }),
      prisma.productionOrder.count({
        where: {
          status: "COMPLETED",
          operations: {
            some: {
              workCenterId: {
                in: workCenterIds,
              },
            },
          },
        },
      }),
      prisma.productionOrder.count({
        where: {
          status: "PENDING",
          operations: {
            some: {
              workCenterId: {
                in: workCenterIds,
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      active,
      completed,
      pending,
    };
  } catch (error) {
    console.error("Error fetching worker production order stats:", error);
    throw new Error("Failed to fetch statistics");
  }
}

function auth(): { userId: any; } | PromiseLike<{ userId: any; }> {
  throw new Error("Function not implemented.");
}
