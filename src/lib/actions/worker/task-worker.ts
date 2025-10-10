// src/lib/actions/worker/task-worker.ts

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache"; // Import for cache invalidation
// 🚨 IMPORTANT: You MUST import your server-side session utility here.
// ----------------------------------------------------------------------
// Option 1: If using NextAuth v4 (with App Router):
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // 👈 ADJUST THIS PATH

// Option 2: If using NextAuth v5 (Auth.js), replace the above two lines with:
// import { auth } from "@/auth"; // 👈 ADJUST THIS PATH
// ----------------------------------------------------------------------

// --- Helper Types ---
type OperationStatus = "PENDING" | "STARTED" | "COMPLETED" | "FAILED";

/**
 * 🛠️ FIX #1: Implements the actual authentication logic using NextAuth.
 * This function fetches the current user's session and extracts the userId.
 */
async function auth(): Promise<{ userId: string }> {
    // Example using getServerSession (NextAuth v4):
    const session = await getServerSession(authOptions); 
    
    // Example using Auth.js (NextAuth v5) if you switched:
    // const session = await auth(); 

    if (!session || !session.user || !session.user.id) {
        console.warn("Authentication failed: No active worker session found.");
        throw new Error("UNAUTHORIZED"); 
    }
    
    // Assuming your session user object has an 'id' field which matches your Prisma User ID.
    return { userId: session.user.id as string }; 
}

/**
 * Helper to get all work center IDs assigned to the current worker.
 */
async function getWorkerWorkCenterIds(userId: string): Promise<string[]> {
    const userWorkCenters = await prisma.userWorkCenter.findMany({
        where: { userId: userId },
        select: { workCenterId: true },
    });
    return userWorkCenters.map((uwc) => uwc.workCenterId);
}

/**
 * Get production order IDs that have operations in work centers assigned to the current worker
 */
async function getWorkerProductionOrderIds(userId: string) {
    // Find the user's work centers
    const workCenterIds = await getWorkerWorkCenterIds(userId);

    if (workCenterIds.length === 0) {
        return [];
    }

    // Get unique production order IDs from operations in these work centers
    const operations = await prisma.operation.findMany({
        where: {
            workCenterId: {
                in: workCenterIds,
            },
        },
        select: {
            productionOrderId: true,
        },
        distinct: ['productionOrderId'],
    });

    return operations.map(op => op.productionOrderId);
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
        // Step 1: Get production order IDs
        const productionOrderIds = await getWorkerProductionOrderIds(userId);

        if (productionOrderIds.length === 0) {
            return [];
        }

        // Step 2: Get user's work center IDs for filtering operations
        const workCenterIds = await getWorkerWorkCenterIds(userId);

        // Step 3: Fetch full production order details
        const orders = await prisma.productionOrder.findMany({
            where: {
                id: {
                    in: productionOrderIds,
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
                            // 🚨 FIX #2: Removed firstName and lastName, added email
                            select: {
                                id: true,
                                email: true, 
                            },
                        },
                        performedBy: {
                            // 🚨 FIX #2: Removed firstName and lastName, added email
                            select: {
                                id: true,
                                email: true,
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
        // The catch block re-throws a general error, which is caught by the page component
        throw new Error("Failed to fetch production orders");
    }
}

function sanitizeProductionOrderData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    // Handle array case
    if (Array.isArray(data)) {
        return data.map(item => sanitizeProductionOrderData(item));
    }

    // Handle object case
    const cleanData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];

            // Check if the value is a Decimal object (Prisma client exposes it via .d property)
            // We use value.d to check for the internal Decimal structure
            if (value && typeof value === 'object' && 'd' in value && Array.isArray(value.d)) {
                // Convert Decimal to standard number (using toString() then Number() is safe)
                cleanData[key] = Number(value.toString());
            } else if (value instanceof Date) {
                // Keep Date objects as they serialize correctly
                cleanData[key] = value;
            } else if (typeof value === 'object' && value !== null) {
                // Recursively sanitize nested objects/arrays
                cleanData[key] = sanitizeProductionOrderData(value);
            } else {
                // Keep primitive types (string, number, boolean, null)
                cleanData[key] = value;
            }
        }
    }
    return cleanData;
}
// ------------------------------------------------------------------


/**
 * Get a single production order with details if worker has access
 */
export async function getWorkerProductionOrderById(orderId: string) {
    // Assuming auth() is defined elsewhere and returns { userId: string }
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        // Step 1: Check if this production order ID is accessible to the worker
        const productionOrderIds = await getWorkerProductionOrderIds(userId);

        if (!productionOrderIds.includes(orderId)) {
            throw new Error("Access denied: Production order not found in your assigned work centers");
        }

        // Step 2: Get user's work center IDs for filtering operations
        const workCenterIds = await getWorkerWorkCenterIds(userId);

        // Step 3: Fetch the production order with full details
        const order = await prisma.productionOrder.findUnique({
            where: {
                id: orderId,
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
                            // Already fixed to use 'email'
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                        performedBy: {
                            // Already fixed to use 'email'
                            select: {
                                id: true,
                                email: true,
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
            throw new Error("Production order not found");
        }

        // 🚀 FIX: Sanitize the order object to convert Decimals to numbers
        return sanitizeProductionOrderData(order); 

    } catch (error) {
        console.error("Error fetching worker production order:", error);
        throw new Error("Failed to fetch production order");
    }
}

/**
 * ----------------------------------------------------------------
 * 🎯 UPDATED SERVER ACTION: Update Operation Status
 * ----------------------------------------------------------------
 * Allows a worker to start, complete, or fail an operation they are authorized to perform.
 * Now includes optional 'notes' for logging information during the process.
 * * @param operationId - The ID of the operation to update.
 * @param newStatus - The status to set (STARTED, COMPLETED, FAILED).
 * @param actualQuantity - The quantity produced, required for COMPLETED/FAILED.
 * @param notes - Optional text notes to save with the operation update.
 */
export async function updateOperationStatus({
    operationId,
    newStatus,
    actualQuantity,
    notes, // 💡 NEW: Accept optional notes
}: {
    operationId: string;
    newStatus: OperationStatus;
    actualQuantity?: number;
    notes?: string; // 💡 NEW: Notes parameter
}) {
    // 1. Authenticate and get worker ID
    const { userId } = await auth();

    // 2. Input Validation (Checks quantity for completion/failure)
    if ((newStatus === "COMPLETED" || newStatus === "FAILED") && (actualQuantity === undefined || actualQuantity === null)) {
        return {
            error: "Actual quantity is required when completing or failing an operation.",
        };
    }
    
    try {
        // 3. Find operation and check authorization
        const operation = await prisma.operation.findUnique({
            where: { id: operationId },
            select: { id: true, workCenterId: true, productionOrderId: true, status: true },
        });

        if (!operation) {
            return { error: "Operation not found." };
        }

        const workerWorkCenters = await getWorkerWorkCenterIds(userId);

        if (!workerWorkCenters.includes(operation.workCenterId)) {
            return { error: "Access denied: You are not authorized to perform operations at this work center." };
        }
        
        // 4. Update data based on status transition and include notes
        let updateData: any = {
            status: newStatus,
            performedById: userId, // Record who performed the action
        };
        
        // 💡 NEW: Add notes if provided
        if (notes !== undefined && notes !== null) {
            updateData.notes = notes; 
        }


        if (newStatus === "STARTED" && operation.status !== "STARTED") {
            // Set start time only if transitioning from PENDING/null
            updateData.startTime = new Date();
        }
        
        if (newStatus === "COMPLETED" || newStatus === "FAILED") {
            // Set end time and actual quantity for finished operations
            updateData.endTime = new Date();
            if (actualQuantity !== undefined && actualQuantity !== null) {
                // Ensure quantity is not less than zero
                updateData.actualQuantity = Math.max(0, actualQuantity); 
            }
        }

        // Prevent invalid transitions (e.g., re-starting a finished job)
        if (newStatus === "STARTED" && (operation.status === "COMPLETED" || operation.status === "FAILED")) {
            return { error: "Cannot start an operation that is already finished." };
        }

        // 5. Perform the update
        await prisma.operation.update({
            where: { id: operationId },
            data: updateData,
        });

        // 6. Revalidate the path to force a refresh on the page component
        revalidatePath(`/worker/tasks/${operation.productionOrderId}`);
        revalidatePath(`/worker/tasks`); // Also revalidate the job list page

        return { success: true };

    } catch (error) {
        console.error("Error updating operation status:", error);
        return { error: "Failed to update operation status due to a server error." };
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
        // Step 1: Get production order IDs
        const productionOrderIds = await getWorkerProductionOrderIds(userId);

        if (productionOrderIds.length === 0) {
            return {
                total: 0,
                active: 0,
                completed: 0,
                pending: 0,
            };
        }

        // Step 2: Get counts for each status
        const [total, active, completed, pending] = await Promise.all([
            prisma.productionOrder.count({
                where: {
                    id: {
                        in: productionOrderIds,
                    },
                },
            }),
            prisma.productionOrder.count({
                where: {
                    id: {
                        in: productionOrderIds,
                    },
                    status: "ACTIVE",
                },
            }),
            prisma.productionOrder.count({
                where: {
                    id: {
                        in: productionOrderIds,
                    },
                    status: "COMPLETED",
                },
            }),
            prisma.productionOrder.count({
                where: {
                    id: {
                        in: productionOrderIds,
                    },
                    status: "PENDING",
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

/**
 * Check if worker has access to a specific production order
 */
export async function hasAccessToProductionOrder(orderId: string) {
    const { userId } = await auth();

    if (!userId) {
        return false;
    }

    try {
        const productionOrderIds = await getWorkerProductionOrderIds(userId);
        return productionOrderIds.includes(orderId);
    } catch (error) {
        console.error("Error checking production order access:", error);
        return false;
    }
}
