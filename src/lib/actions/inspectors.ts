// src/lib/actions/inspector.ts
'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// src/actions/inspector/getTasksByDepartment.ts
import { Task } from "@/types/inspector/task"; // Assuming you have a Task type defined
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

import { Inspector } from "@prisma/client";

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


export async function getLoggedInInspectorProductionOrderIds(): Promise<string[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return []; // Or handle unauthorized case as needed
    }

    const inspector = await prisma.user.findUnique({ // Assuming Inspector is linked via the User model
      where: { id: session.user.id },
      select: { id: true }, // Select the user ID
    });

    if (!inspector) {
      return [];
    }

    // Fetch ProductionOrder IDs where the logged-in user is associated as an inspector
    const productionOrderIdsFromQualityChecks = await prisma.qualityCheck.findMany({
      where: {
        inspectorId: inspector.id, // Use the user ID as inspectorId
      },
      select: {
        productionOrderId: true,
      },
    });

    // Fetch ProductionOrder IDs from Operations where the logged-in user is assigned
    const productionOrderIdsFromOperations = await prisma.operation.findMany({
      where: {
        assignedToId: inspector.id, // Use the user ID as assignedToId
      },
      select: {
        productionOrderId: true,
      },
    });

    // Extract the IDs from the result arrays
    const qcOrderIds = productionOrderIdsFromQualityChecks.map(qc => qc.productionOrderId);
    const opOrderIds = productionOrderIdsFromOperations.map(op => op.productionOrderId);

    // Combine and remove duplicates
    const allProductionOrderIds = [...new Set([...qcOrderIds, ...opOrderIds])];

    return allProductionOrderIds;
  } catch (error) {
    console.error('Error fetching production order IDs for inspector:', error);
    throw error;
  }
}

export async function markTaskAsComplete(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const task = await prisma.user.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedByUserId: session.user.id, // Optional: Record who completed the task
      },
    });

    if (task) {
      revalidatePath('/worker/profile'); // Adjust path as needed
      return { success: true };
    } else {
      return { success: false, error: 'Task not found or could not be updated.' };
    }
  } catch (error) {
    console.error('Error marking task as complete:', error);
    return { success: false, error: 'Failed to mark task as complete.' };
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