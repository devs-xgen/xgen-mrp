// src/lib/worker/get-user-role.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface UserRoleInfo {
  userId: string;
  role: "ADMIN" | "WORKER" | "INSPECTOR" | "LOGISTICS" | "GUEST";
  workCenterId?: string;
  workCenterName?: string;
  email?: string;
  name?: string;
}

/**
 * Get the current authenticated user's role and permissions
 */
export async function getCurrentUserRole(): Promise<UserRoleInfo | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    // Fetch user from database with their role and assignments
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        // ❌ WRONG: UserWorkCenters (Plural)
        // ✅ CORRECT: UserWorkCenter (Singular)
        UserWorkCenter: { // <-- FIX: Changed to singular
          include: {
            workCenter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        userId: session.user.id,
        role: "GUEST",
        email: session.user.email || undefined,
      };
    }

    // Determine role based on your schema
    let role: "ADMIN" | "WORKER" | "INSPECTOR" | "LOGISTICS" | "GUEST" = "GUEST";
    let workCenterId: string | undefined = undefined;
    let workCenterName: string | undefined = undefined;

    // Check if user is admin
    if (user.role === "ADMIN") {
      role = "ADMIN";
    } 
    // Check if user is a worker with work center assignment
    else if (user.UserWorkCenter && user.UserWorkCenter.length > 0) {
      role = "WORKER";
      workCenterId = user.UserWorkCenter[0].workCenterId;
      workCenterName = user.UserWorkCenter[0].workCenter.name;
    }
    // Check if user is inspector
    else if (user.role === "INSPECTOR") {
      role = "INSPECTOR";
    }
    // Check if user is in logistics/delivery
    else if (user.role === "LOGISTICS" || user.role === "DELIVERY") {
      role = "LOGISTICS";
    }

    return {
      userId: user.id,
      role,
      workCenterId,
      workCenterName,
      email: user.email,
      name: user.name || undefined,
    };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

/**
 * Check if user can access a specific production order
 */
export async function canAccessProductionOrder(
  productionOrderId: string,
  userRole: UserRoleInfo
): Promise<boolean> {
  try {
    // Admins can access all orders
    if (userRole.role === "ADMIN") {
      return true;
    }

    // FIX APPLIED HERE: deliveryAssignment/DeliveryAssignment changed to 'delivery'
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        operations: {
          select: {
            workCenterId: true,
          },
        },
        qualityChecks: {
          select: {
            inspectorId: true,
          },
        },
        delivery: { // <--- FIXED: The correct field name from the Prisma model
          select: {
            userId: true,
          },
        },
      },
    });

    if (!productionOrder) {
      return false;
    }

   // Workers can access orders with operations in their work center
    if (userRole.role === "WORKER" && userRole.workCenterId) {
        
        // --- ADD DEBUG LOGGING HERE ---
        console.log(`WORKER Access Check for Order: ${productionOrderId}`);
        console.log(`User Work Center ID: ${userRole.workCenterId}`);
        console.log("Order Operations Work Center IDs:", 
            productionOrder.operations.map(op => op.workCenterId));
        // -------------------------------
        
        const hasWorkerAccess = productionOrder.operations.some(
            (op) => op.workCenterId === userRole.workCenterId
        );
        
        console.log(`Result of Worker Access Check: ${hasWorkerAccess}`);
        return hasWorkerAccess;
    }

    // Inspectors can access orders they're assigned to inspect
    if (userRole.role === "INSPECTOR") {
      return productionOrder.qualityChecks.some(
        (check) => check.inspectorId === userRole.userId
      );
    }

    // Logistics can access orders with delivery assignments or all orders
    if (userRole.role === "LOGISTICS") {
      return true; // Or add specific logic
    }

    return false;
  } catch (error) {
    console.error("Error checking production order access:", error);
    return false;
  }
}

/**
 * Check if user can modify a specific operation
 */
export async function canModifyOperation(
  operationId: string,
  userRole: UserRoleInfo
): Promise<boolean> {
  try {
    // Admins can modify all operations
    if (userRole.role === "ADMIN") {
      return true;
    }

    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: {
        workCenterId: true,
        status: true,
      },
    });

    if (!operation) {
      return false;
    }

    // Workers can only modify pending operations in their assigned work center
    if (userRole.role === "WORKER" && userRole.workCenterId) {
      return (
        operation.workCenterId === userRole.workCenterId &&
        operation.status === "PENDING"
      );
    }

    return false;
  } catch (error) {
    console.error("Error checking operation modification permission:", error);
    return false;
  }
}