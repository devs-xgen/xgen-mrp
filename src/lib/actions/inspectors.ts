// src/lib/actions/inspector.ts
'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// src/actions/inspector/getTasksByDepartment.ts
import { Task } from "@/types/inspector/task"; // Assuming you have a Task type defined
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

import { Inspector, Status } from "@prisma/client";

// Re-export your Inspector type for convenience if needed elsewhere
export type InspectorType = Inspector;

// Type for the form data when an inspector edits their own profile
export type OwnInspectorFormData = Omit<
  Inspector,
  'inspectorId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'modifiedBy' | 'isActive' // Prevent editing of these
>;

// Function to get the logged-in inspector's data along with related production orders
export async function getLoggedInInspectorWithProductionOrders() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }

    const inspector = await prisma.inspector.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        checks: {
          include: {
            productionOrder: true,
          },
        },
        assignedOperations: {
          include: {
            productionOrder: true,
          },
        },
      },
    });

    if (!inspector) {
      return null;
    }

    return inspector;
  } catch (error) {
    console.error('Error fetching logged-in inspector with production orders:', error);
    throw error;
  }
}

// Function to update the logged-in inspector's own data
export async function updateOwnInspectorProfile(data: OwnInspectorFormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const updatedInspector = await prisma.inspector.update({
      where: {
        userId: session.user.id,
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        department: data.department,
        specialization: data.specialization,
        certificationLevel: data.certificationLevel,
        yearsOfExperience: data.yearsOfExperience,
        notes: data.notes,
        modifiedBy: session.user.id,
      },
    });

    revalidatePath('/worker/profile'); // Adjust the path to the inspector's profile page
    return { success: true, data: updatedInspector };
  } catch (error) {
    console.error('Error updating own inspector profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function getTasksByDepartment(): Promise<Task[]> {
  try {
    const res = await fetch('/api/tasks-by-department');

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData?.message || 'Failed to fetch tasks');
    }

    const data: Task[] = await res.json();
    return data;

  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    throw error; // Re-throw the error for the component to handle
  }
}

// src/lib/actions/inspector.ts
export async function getLoggedInInspectorData() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }

    const inspector = await prisma.inspector.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return inspector;
  } catch (error) {
    console.error('Error fetching logged-in inspector data:', error);
    throw error;
  }
}


export async function getLoggedInInspectorProductionOrderIds() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return []; // Or handle unauthorized case as needed
    }

    const inspector = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!inspector) {
      return [];
    }

    // Fetch production order IDs from quality checks
    const qcChecks = await prisma.qualityCheck.findMany({
      where: {
        inspectorId: inspector.id,
      },
      select: { productionOrderId: true },
    });

    // Fetch production order IDs from operations
    const operations = await prisma.operation.findMany({
      where: {
        assignedToId: inspector.id,
      },
      select: { productionOrderId: true },
    });

    // Extract unique productionOrderIds
    const orderIds = Array.from(
      new Set([
        ...qcChecks.map(qc => qc.productionOrderId),
        ...operations.map(op => op.productionOrderId),
      ])
    );

    // Fetch full production order data for these IDs, including quality checks and operations
    const productionOrders = await prisma.productionOrder.findMany({
      where: { id: { in: orderIds } },
      include: {
        customerOrder: {
          select: {
            orderNumber: true,
          },
        },
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        operations: {
          select: {
            workCenter: {
              select: {
                name: true,
              },
            },
            status: true, // Ensure to include status for operations as well
          },
        },
        qualityChecks: {
          select: {
            id: true,
            checkDate: true,
            status: true,
            defectsFound: true,
            notes: true, // Include any additional fields from quality checks
          },
        },
      },
    });

    // Check if the production order is complete (both quality checks and operations)
    const updatedOrders = productionOrders.map((order) => {
      const allQualityChecksCompleted = order.qualityChecks.every(qc => qc.status === 'COMPLETED');
      const allOperationsCompleted = order.operations.every(op => op.status === 'COMPLETED'); // Assuming there's a status on operations

      // Determine if the production order is complete
      const isCompleted = allQualityChecksCompleted && allOperationsCompleted;

      return {
        ...order,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      };
    });

    return updatedOrders;
  } catch (error) {
    console.error('Error fetching production orders:', error);
    throw error;
  }
}



export async function markQualityCheckAsComplete(
productionId: string, defectsFound: string, actionTaken: string, notes: string, p0: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Find the existing quality check record for this production ID
    const existingQualityCheck = await prisma.qualityCheck.findFirst({
      where: { productionOrderId: productionId },
    });

    if (!existingQualityCheck) {
      return {
        success: false,
        error: `Quality check not found for productionId: ${productionId}`,
      };
    }

    // Update the quality check record
    const qualityCheck = await prisma.qualityCheck.update({
      where: { id: existingQualityCheck.id },
      data: {
        status: 'COMPLETED',
        checkDate: new Date(),
        inspectorId: session.user.id,
        productionOrderId: productionId,
        defectsFound: defectsFound,
        actionTaken: actionTaken,
        notes: notes,
      },
    });

    if (qualityCheck) {
      // Optional: Trigger revalidation or other actions
      revalidatePath('/worker/profile');
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Quality Check not found or could not be updated.',
      };
    }
  } catch (error) {
    console.error('Error marking quality check as complete:', error);
    return { success: false, error: 'Failed to mark quality check as complete.' };
  }
}



export async function getLoggedInInspectorAverageQualityChecks() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null; // Or handle unauthorized case
    }

    const inspector = await prisma.inspector.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        qualityChecks: true, // Assuming the relation from Inspector to QualityCheck is named 'qualityChecks'
      },
    });

    if (!inspector) {
      return null;
    }

    const numberOfQualityChecks = inspector.qualityChecks.length;

    // You might want to calculate the average based on a specific criteria
    // (e.g., average number of defects found, average time spent, etc.).
    // Since the prompt is generic, we'll just return the number of checks.
    // Adapt this part based on what "average quality checks work" means in your context.

    return {
      inspectorId: inspector.inspectorId,
      firstName: inspector.firstName,
      lastName: inspector.lastName,
      numberOfQualityChecks,
      // Add other relevant inspector info here
    };
  } catch (error) {
    console.error('Error fetching logged-in inspector with average quality checks:', error);
    throw error;
  }
}

// src/lib/actions/inspectors.ts (corrected)
export async function updateInspector(id: string, updates: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  department?: string | null;
  specialization?: string | null;
  certificationLevel?: string | null;
  yearsOfExperience?: number | null;
  notes?: string | null;
}) {
  try {
    const updatedInspector = await prisma.inspector.update({
      where: { inspectorId: id },
      data: updates,
    });
    return updatedInspector;
  } catch (error) {
    console.error('Error updating inspector:', error);
    throw new Error('Failed to update inspector');
  }
}


export async function getProductionOrdersForInspector() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("User not authenticated.");
  }

  // Find the Inspector related to the current User
  const inspector = await prisma.inspector.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          id: true,
          createdProductionOrders: {
            include: {
              workCenter: true,
            },
          },
          modifiedProductionOrders: {
            include: {
              workCenter: true,
            },
          },
        },
      },
    },
  });

  if (!inspector || !inspector.user) {
    return [];
  }

  const productionOrders = [
    ...inspector.user.createdProductionOrders,
    ...inspector.user.modifiedProductionOrders,
  ];

  return productionOrders;
}
// export async function getProductionOrdersByInspector(inspectorId: string) {
//   try {
//     const inspector = await prisma.inspector.findUnique({
//       where: { inspectorId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             createdProductionOrders: true,
//             modifiedProductionOrders: true,
//           },
//         },
//       },
//     });

//     if (!inspector || !inspector.user) {
//       throw new Error('Inspector or linked user not found.');
//     }

//     // Combine created and modified production orders
//     const productionOrders = [
//       ...inspector.user.createdProductionOrders,
//       ...inspector.user.modifiedProductionOrders,
//     ];

//     return productionOrders;
//   } catch (error) {
//     console.error('Error fetching production orders for inspector:', error);
//     throw error;
//   }
// }
// export async function getLoggedInInspectorData() {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return null; // No logged-in user
//     }

//     const inspector = await prisma.inspector.findUnique({
//       where: {
//         userId: session.user.id,
//       },
//       include: {
//         user: {
//           include: {
//             profile: true,
//           },
//         },
//         inspections: {
//           include: {
//             productionOrder: true,
//           },
//           orderBy: {
//             checkDate: 'desc',
//           },
//         },
//         assignedOperations: {
//           include: {
//             productionOrder: true,
//           },
//           orderBy: {
//             startTime: 'desc',
//           },
//         },
//       },
//     });

//     return inspector;
//   } catch (error) {
//     console.error('Error fetching logged-in inspector data:', error);
//     throw error;
//   }
// }
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

export async function updateTask(
taskId: string, workerId: string, data: {
  status?: Status;
  notes?: string;
  startTime?: Date;
  endTime?: Date;
}): Promise<Task> {
  // Find the task by ID (no assignment check)
  const task = await prisma.operation.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Update the task
  const updatedTask = await prisma.operation.update({
    where: { id: taskId },
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