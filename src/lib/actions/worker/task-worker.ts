// src/lib/actions/worker/task-worker.ts
"use server"; 

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// --- Helper Types ---
type OperationStatus = "PENDING" | "STARTED" | "COMPLETED" | "FAILED";

// Define the shape of the raw Operation data from Prisma (only fields needed for transformation)
interface RawOperation {
    id: string;
    name: string;
    status: OperationStatus;
    startTime: Date | null;
    endTime: Date | null;
    // Include the relations for type safety if needed, but omitted here for simplicity
}

// Define the shape expected by the frontend component
interface TransformedPhase {
    id: string;
    name: string;
    isCompleted: boolean;
    startDate: string | null;
    completionDate: string | null;
    status: OperationStatus; // Added status for detailed display in component
}


/**
 * Implements the actual authentication logic using NextAuth.
 */
async function auth(): Promise<{ userId: string }> {
    const session = await getServerSession(authOptions); 
    
    if (!session || !session.user || !session.user.id) {
        console.warn("Authentication failed: No active worker session found.");
        throw new Error("UNAUTHORIZED"); 
    }
    
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
    const workCenterIds = await getWorkerWorkCenterIds(userId);

    if (workCenterIds.length === 0) {
        return [];
    }

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
 * 🎯 CORE TRANSFORMATION: Maps raw Operation data to the expected Phase structure.
 */
function transformOperationsToPhases(operations: any[]): TransformedPhase[] {
    // Assuming 'operations' here is the array returned by Prisma's query
    return operations
        .map(op => ({
            id: op.id,
            name: op.name,
            // Operations are considered 'completed' if their status is COMPLETED or FAILED
            isCompleted: op.status === "COMPLETED" || op.status === "FAILED", 
            // Convert Dates to ISO strings (or keep as Date, but string is safer for props)
            startDate: op.startTime ? op.startTime.toISOString() : null,
            completionDate: op.endTime ? op.endTime.toISOString() : null,
            status: op.status, // Pass the detailed status
        }))
        // Ensure steps are ordered, potentially by a sequence number if not by startTime
        .sort((a, b) => {
            if (a.startDate && b.startDate) return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            if (a.startDate) return -1; // Put started operations first
            if (b.startDate) return 1;
            return 0; // Maintain existing order if neither has a start date
        });
}


/**
 * Helper function to handle Prisma Decimal type conversion (as provided previously)
 */
function sanitizeProductionOrderData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map(item => sanitizeProductionOrderData(item));
    }

    const cleanData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];

            // Specific check for Prisma Decimal type { d: [number, number, number, number], e: number, s: number }
            if (value && typeof value === 'object' && 'd' in value && Array.isArray(value.d)) {
                cleanData[key] = Number(value.toString());
            } else if (value instanceof Date) {
                cleanData[key] = value;
            } else if (typeof value === 'object' && value !== null && key !== 'operations') {
                // Recursively clean objects, but handle 'operations' separately later
                cleanData[key] = sanitizeProductionOrderData(value);
            } else {
                cleanData[key] = value;
            }
        }
    }
    return cleanData;
}


/**
 * Get a single production order with details if worker has access
 * ⭐ UPDATED: Now performs the operations-to-phases transformation.
 */
export async function getWorkerProductionOrderById(orderId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        const productionOrderIds = await getWorkerProductionOrderIds(userId);

        if (!productionOrderIds.includes(orderId)) {
            throw new Error("Access denied: Production order not found in your assigned work centers");
        }

        const workCenterIds = await getWorkerWorkCenterIds(userId);

        const order = await prisma.productionOrder.findUnique({
            where: {
                id: orderId,
            },
            include: {
                product: { select: { id: true, name: true, sku: true, description: true } },
                productVariant: { select: { id: true, sku: true, displayName: true, sizeName: true, colorName: true } },
                
                // 🚨 FIX IS HERE: Correcting the selection on CustomerOrder
                customerOrder: {
                    select: {
                        id: true,
                        orderNumber: true,
                        // Assuming CustomerOrder has a relation named 'customer'
                        customer: { 
                            select: {
                                name: true, // Assuming the customer's name field is 'name'
                            }
                        },
                        // Removed the invalid 'customerName' field
                    },
                },
                
                operations: {
                    // ... (rest of the operations include block remains the same)
                    include: {
                        workCenter: { 
                            include: { userAssignments: { include: { user: { select: { id: true, email: true } } } } },
                        },
                        assignedTo: { select: { id: true, email: true } },
                        performedBy: { select: { id: true, email: true } },
                    },
                    orderBy: {
                        startTime: "asc",
                    },
                },
                
                qualityChecks: { select: { id: true, checkDate: true, status: true, defectsFound: true, notes: true }, orderBy: { checkDate: "desc" } },
                productionHistoryLogs: { 
                    include: { user: { select: { id: true, email: true } } }, 
                    orderBy: { timestamp: "desc" }, 
                    take: 10 
                },
            },
        });

        if (!order) {
            throw new Error("Production order not found");
        }

        // 1. Sanitize the raw order data
        const sanitizedOrder: any = sanitizeProductionOrderData(order); 

        // 2. Transform the 'operations' array into 'productionPhases'
        const productionPhases = transformOperationsToPhases(sanitizedOrder.operations);
        
        // 3. Return the final order object with the correctly named array
        return {
            ...sanitizedOrder,
            productionPhases: productionPhases,
            operations: undefined, 
        };

    } catch (error) {
        console.error("Error fetching worker production order:", error);
        // The original error handling throws a generic message, which is fine
        throw new Error("Failed to fetch production order");
    }
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
        const productionOrderIds = await getWorkerProductionOrderIds(userId);

        if (productionOrderIds.length === 0) {
            return [];
        }

        const workCenterIds = await getWorkerWorkCenterIds(userId);

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
                            include: {
                                userAssignments: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                email: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        assignedTo: {
                            select: {
                                id: true,
                                email: true, 
                            },
                        },
                        performedBy: {
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
                productionHistoryLogs: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        timestamp: "desc",
                    },
                    take: 10,
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
 * Update Operation Status
 */
export async function updateOperationStatus({
    operationId,
    newStatus,
    actualQuantity,
    notes,
}: {
    operationId: string;
    newStatus: OperationStatus;
    actualQuantity?: number;
    notes?: string;
}) {
    const { userId } = await auth();

    // 1. Initial validation for COMPLETED/FAILED
    if ((newStatus === "COMPLETED" || newStatus === "FAILED") && (actualQuantity === undefined || actualQuantity === null)) {
        return {
            error: "Actual quantity is required when completing or failing an operation.",
        };
    }
    
    try {
        const operation = await prisma.operation.findUnique({
            where: { id: operationId },
            select: { 
                id: true, 
                workCenterId: true, 
                productionOrderId: true, 
                status: true,
                productionOrder: { select: { quantity: true } } // Get order quantity for log context
            },
        });

        if (!operation) {
            return { error: "Operation not found." };
        }

        const workerWorkCenters = await getWorkerWorkCenterIds(userId);

        if (!workerWorkCenters.includes(operation.workCenterId)) {
            return { error: "Access denied: You are not authorized to perform operations at this work center." };
        }
        
        // Prevent starting an already finished operation
        if (newStatus === "STARTED" && (operation.status === "COMPLETED" || operation.status === "FAILED")) {
            return { error: "Cannot start an operation that is already finished." };
        }

        // --- Prepare Update Data ---
        let updateData: any = {
            status: newStatus,
            performedById: userId,
        };
        
        // This is correct: apply user notes to the operation itself
        if (notes !== undefined && notes !== null) {
            updateData.notes = notes; 
        }

        if (newStatus === "STARTED" && operation.status !== "STARTED") {
            updateData.startTime = new Date();
        }
        
        if (newStatus === "COMPLETED" || newStatus === "FAILED") {
            updateData.endTime = new Date();
            if (actualQuantity !== undefined && actualQuantity !== null) {
                updateData.actualQuantity = Math.max(0, actualQuantity); 
            }
        }
        
        // --- Transaction: Update Operation and Create Log ---
        
        // Prepare Log Message details
        const operationIdShort = operation.id.substring(0, 8);
        const quantityInfo = (actualQuantity !== undefined && operation.productionOrder.quantity !== undefined)
            ? `Qty: ${actualQuantity}/${operation.productionOrder.quantity}.` 
            : '';
            
        // Prepare Log Notes
        const logMessage = [
            `Operation '${operationIdShort}...' status changed to ${newStatus}.`,
            quantityInfo,
            notes ? `User notes: "${notes}".` : ''
        ].filter(Boolean).join(' ').trim();
        
        await prisma.$transaction([
            // 1. Update the Operation
            prisma.operation.update({
                where: { id: operationId },
                data: updateData,
            }),

            // 2. Create a Production History Log entry
            prisma.productionOrderHistoryLog.create({
                data: {
                    productionOrderId: operation.productionOrderId,
                    userId: userId,
                    status: newStatus, // Log the new status
                    changeType: `OPERATION_STATUS_UPDATE`,
                    notes: logMessage, // Use the prepared, robust log message
                },
            }),
        ]);
        
        // --- Revalidation ---
        revalidatePath(`/worker/tasks/${operation.productionOrderId}`);
        revalidatePath(`/worker/tasks`);

        return { success: true };

    } catch (error) {
        console.error("Error updating operation status:", error);
        // RETURN A GENERIC ERROR MESSAGE to the client component, but log the detailed error on the server.
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
        const productionOrderIds = await getWorkerProductionOrderIds(userId);

        if (productionOrderIds.length === 0) {
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