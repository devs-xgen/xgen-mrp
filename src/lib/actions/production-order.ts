// src/lib/actions/production-order.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Status } from "@prisma/client";
import {
  CreateProductionOrderInput,
  UpdateProductionOrderInput,
} from "@/types/admin/production-order";
import { getBOMForProduct } from "@/lib/actions/bom";
import { updateMaterial, getMaterialById } from "@/lib/actions/materials";
import {
  checkProductionOrderMaterialRequirements,
  reserveMaterialsForProduction,
  releaseMaterialReservations,
} from "@/lib/actions/material-reservation";
import {
  createProductionBOMFromProduct,
  getProductionBOMForDisplay,
} from "@/lib/actions/production-bom";

export async function getProductionOrders() {
  try {
    const orders = await prisma.productionOrder.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        productVariant: {
          // 🆕 ADD: Include variant information
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
          include: {
            workCenter: {
              select: {
                name: true,
              },
            },
          },
        },
        qualityChecks: {
          select: {
            id: true,
            checkDate: true,
            status: true,
            defectsFound: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startDate: "asc" }],
    });

    return orders;
  } catch (error) {
    console.error("Error fetching production orders:", error);
    throw new Error("Failed to fetch production orders");
  }
}

export async function getProductionOrder(id: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        productVariant: {
          // 🆕 ADD: Include variant information
          select: {
            id: true,
            sku: true,
            displayName: true,
            sizeName: true,
            colorName: true,
          },
        },
        customerOrder: true,
        operations: {
          include: {
            workCenter: true,
          },
        },
        qualityChecks: true,
      },
    });

    if (!order) {
      throw new Error("Production order not found");
    }

    // Fetch ProductionBOM (working copy) for this production order
    let productionBOM = null;
    try {
      const productionBOMResult = await getProductionBOMForDisplay(id);
      if (productionBOMResult.success) {
        productionBOM = productionBOMResult.data;
      }
    } catch (bomError) {
      console.warn(`Failed to fetch ProductionBOM for order ${id}:`, bomError);
    }

    // If no ProductionBOM exists, fall back to Product BOM as template
    let bom = null;
    if (productionBOM && productionBOM.length > 0) {
      // Transform ProductionBOM to BOM format for compatibility
      bom = {
        productId: order.productId,
        productName: order.product.name,
        entries: productionBOM.map((entry) => ({
          id: entry.id,
          materialId: entry.materialId,
          materialName: entry.materialName,
          materialSku: entry.materialSku,
          unitOfMeasure: entry.unitOfMeasure,
          quantityNeeded: entry.finalQuantity, // Use adjusted quantity if available
          wastePercentage: entry.wastePercentage,
          costPerUnit: entry.unitCost,
          totalCost: entry.currentTotalCost,
        })),
        totalMaterialCost: productionBOM.reduce(
          (sum, entry) => sum + entry.currentTotalCost,
          0
        ),
      };
    } else {
      // Fall back to Product BOM template
      bom = await getBOMForProduct(order.productId);
    }

    return { ...order, bom, productionBOM };
  } catch (error) {
    console.error("Error fetching production order:", error);
    throw error;
  }
}

export async function getProductionOrdersByCustomerOrder(
  customerOrderId: string
) {
  try {
    const orders = await prisma.productionOrder.findMany({
      where: { customerOrderId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startDate: "asc" }],
    });

    return orders;
  } catch (error) {
    console.error("Error fetching production orders by customer order:", error);
    throw new Error("Failed to fetch production orders");
  }
}

export async function createProductionOrder(data: CreateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // First, check material availability for the production order
    const materialRequirements = await checkProductionOrderMaterialRequirements(
      data.productId,
      data.quantity
    );

    if (!materialRequirements.allMaterialsAvailable) {
      const shortageDetails = materialRequirements.materials
        .filter((m) => !m.isAvailable)
        .map(
          (m) =>
            `${m.materialName}: need ${m.quantityNeeded}, available ${m.quantityAvailable}`
        )
        .join("; ");

      throw new Error(
        `Cannot create production order due to insufficient materials: ${shortageDetails}`
      );
    }

    const order = await prisma.productionOrder.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        startDate: data.startDate,
        dueDate: data.dueDate,
        priority: data.priority,
        customerOrderId: data.customerOrderId,
        notes: data.notes || null,
        status: Status.PENDING,
        createdBy: session.user.id,
        // Include planned material cost from requirements check
        plannedMaterialCost: materialRequirements.totalMaterialCost,
        operations: {
          create: data.operations.map((op) => ({
            workCenterId: op.workCenterId,
            startTime: op.startTime,
            endTime: op.endTime,
            status: Status.PENDING,
            cost: op.cost || 0.0, // Add the required cost field with default value if not provided
          })),
        },
      },
      include: {
        product: true,
        operations: {
          include: {
            workCenter: true,
          },
        },
      },
    });

    // Create ProductionBOM from Product BOM template
    try {
      await createProductionBOMFromProduct({
        productionOrderId: order.id,
        productId: data.productId,
        createdBy: session.user.id,
      });
    } catch (bomError) {
      console.warn(
        `Failed to create ProductionBOM for production order ${order.id}:`,
        bomError
      );
      // Continue even if ProductionBOM creation fails - not critical for basic order creation
    }

    // Automatically reserve materials for the production order
    const reservationResult = await reserveMaterialsForProduction(order.id);

    if (!reservationResult.success) {
      // If material reservation fails, we should clean up the production order
      await prisma.productionOrder.delete({ where: { id: order.id } });
      throw new Error(
        `Production order created but material reservation failed: ${reservationResult.error}`
      );
    }

    revalidatePath("/admin/production");
    revalidatePath("/admin/materials");

    return {
      ...order,
      materialReservation: {
        success: true,
        message: reservationResult.message,
        totalMaterialCost: materialRequirements.totalMaterialCost,
      },
    };
  } catch (error) {
    console.error("Error creating production order:", error);
    throw error;
  }
}

export async function updateProductionOrder(data: UpdateProductionOrderInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const order = await prisma.productionOrder.update({
      where: { id: data.id },
      data: {
        ...(data.productId && { productId: data.productId }),
        ...(data.quantity && { quantity: data.quantity }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.dueDate && { dueDate: data.dueDate }),
        ...(data.priority && { priority: data.priority }),
        ...(data.status && { status: data.status }),
        ...(data.customerOrderId !== undefined && {
          customerOrderId: data.customerOrderId || null,
        }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/admin/production");
    return order;
  } catch (error) {
    console.error("Error updating production order:", error);
    throw error;
  }
}

export async function deleteProductionOrder(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // First, release any material reservations for this production order
    const releaseResult = await releaseMaterialReservations(
      id,
      "Production order deleted"
    );

    if (releaseResult.success) {
      console.log(
        `Released material reservations for production order ${id}: ${releaseResult.message}`
      );
    } else {
      console.warn(
        `Failed to release material reservations for production order ${id}: ${releaseResult.error}`
      );
      // Continue with deletion even if release fails
    }

    // Delete related operations and quality checks first
    await prisma.operation.deleteMany({
      where: { productionOrderId: id },
    });

    await prisma.qualityCheck.deleteMany({
      where: { productionOrderId: id },
    });

    // Delete material reservations (if any remain)
    await prisma.materialReservation.deleteMany({
      where: { productionOrderId: id },
    });

    // Delete material consumptions (if any)
    await prisma.productionMaterialConsumption.deleteMany({
      where: { productionOrderId: id },
    });

    // Delete production batches (if any)
    await prisma.productionBatch.deleteMany({
      where: { productionOrderId: id },
    });

    // Delete cost variances (if any)
    await prisma.costVariance.deleteMany({
      where: { productionOrderId: id },
    });

    // Delete inventory movements related to this production order
    await prisma.inventoryMovement.deleteMany({
      where: {
        referenceId: id,
        referenceType: "ProductionOrder",
      },
    });

    // Finally, delete the production order
    await prisma.productionOrder.delete({
      where: { id },
    });

    revalidatePath("/admin/production");
    revalidatePath("/admin/materials");
  } catch (error) {
    console.error("Error deleting production order:", error);
    throw error;
  }
}

// Helper function to get available products
export async function getAvailableProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching available products:", error);
    throw new Error("Failed to fetch available products");
  }
}

// Helper function to get work centers
export async function getAvailableWorkCenters() {
  try {
    return await prisma.workCenter.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        capacityPerHour: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching work centers:", error);
    throw error;
  }
}

// Fixed addOperation function for src/lib/actions/production-order.ts
export async function addOperation(
  productionOrderId: string,
  data: {
    workCenterId: string;
    startTime: Date;
    endTime: Date;
    cost: number; // Add the missing required cost field
    notes?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const operation = await prisma.operation.create({
      data: {
        workCenterId: data.workCenterId,
        productionOrderId,
        startTime: data.startTime,
        endTime: data.endTime,
        cost: data.cost, // Include cost in the creation data
        status: Status.PENDING,
        notes: data.notes || null,
        createdBy: session.user.id,
      },
      include: {
        workCenter: true,
      },
    });

    revalidatePath(`/admin/production/${productionOrderId}`);
    return operation;
  } catch (error) {
    console.error("Error creating operation:", error);
    throw error;
  }
}

export async function deleteOperation(operationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // First get the operation to find its production order ID
    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: { productionOrderId: true, status: true },
    });

    if (!operation) {
      throw new Error("Operation not found");
    }

    // Check if the operation is already in progress or completed
    if (
      operation.status === "IN_PROGRESS" ||
      operation.status === "COMPLETED"
    ) {
      throw new Error(
        "Cannot delete an operation that is in progress or completed"
      );
    }

    // Delete the operation
    await prisma.operation.delete({
      where: { id: operationId },
    });

    // Revalidate the path for the production order
    revalidatePath(`/admin/production/${operation.productionOrderId}`);
    return { success: true, productionOrderId: operation.productionOrderId };
  } catch (error) {
    console.error("Error deleting operation:", error);
    throw error;
  }
}

export async function updateOperationStatus(
  operationId: string,
  status: Status
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const operation = await prisma.operation.update({
      where: { id: operationId },
      data: {
        status,
        modifiedBy: session.user.id,
      },
      include: {
        productionOrder: true,
      },
    });

    revalidatePath(`/admin/production/${operation.productionOrderId}`);
    return operation;
  } catch (error) {
    console.error("Error updating operation status:", error);
    throw error;
  }
}

/**
 * Links a customer order to an existing production order
 * @param productionOrderId The ID of the production order to update
 * @param customerOrderId The ID of the customer order to link
 * @returns The updated production order
 */
export async function linkCustomerOrderToProduction(
  productionOrderId: string,
  customerOrderId: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Verify that both the production order and customer order exist
    const [productionOrder, customerOrder] = await Promise.all([
      prisma.productionOrder.findUnique({ where: { id: productionOrderId } }),
      prisma.customerOrder.findUnique({ where: { id: customerOrderId } }),
    ]);

    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    if (!customerOrder) {
      throw new Error("Customer order not found");
    }

    // Check if the production order already has a customer order linked
    if (productionOrder.customerOrderId) {
      throw new Error("Production order is already linked to a customer order");
    }

    // Update the production order with the customer order ID
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        customerOrderId,
        modifiedBy: session.user.id,
      },
      include: {
        product: true,
        customerOrder: true,
      },
    });

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return updatedOrder;
  } catch (error) {
    console.error("Error linking customer order to production order:", error);
    throw error;
  }
}

/**
 * Gets available customer orders for linking to a production order
 * @returns List of active customer orders that can be linked
 */
export async function getAvailableCustomerOrders() {
  try {
    return await prisma.customerOrder.findMany({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS", "ACTIVE"],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        customer: {
          select: {
            name: true,
          },
        },
        requiredDate: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching available customer orders:", error);
    throw new Error("Failed to fetch available customer orders");
  }
}

/**
 * Validates if a production order has all required role assignments before starting production
 * @param productionOrderId The ID of the production order to validate
 * @returns Validation result with readiness status and issues
 */
export async function validateProductionOrderReadiness(
  productionOrderId: string
) {
  try {
    const assignmentData =
      await getProductionOrderWithAssignments(productionOrderId);
    const issues: string[] = [];

    // Check work centers and workers
    if (assignmentData.workCenters.length === 0) {
      issues.push("No work centers assigned to this production order");
    } else {
      // Check if all work centers have assigned workers
      const workCentersWithoutWorkers = assignmentData.workCenters.filter(
        (wc) => wc.assignedUsers.length === 0
      );

      if (workCentersWithoutWorkers.length > 0) {
        issues.push(
          `${workCentersWithoutWorkers.length} work center(s) have no assigned workers: ${workCentersWithoutWorkers
            .map((wc) => wc.name)
            .join(", ")}`
        );
      }
    }

    // Check inspectors
    if (assignmentData.inspectors.length === 0) {
      issues.push(
        "No quality control inspectors assigned to this production order"
      );
    }

    // Check delivery assignment (optional but recommended)
    if (!assignmentData.delivery) {
      issues.push(
        "No delivery personnel assigned (recommended for order fulfillment tracking)"
      );
    }

    const isReady = issues.length === 0;

    return {
      isReady,
      issues,
      assignmentData,
      validation: {
        hasWorkCenters: assignmentData.workCenters.length > 0,
        hasWorkers: assignmentData.workCenters.every(
          (wc) => wc.assignedUsers.length > 0
        ),
        hasInspectors: assignmentData.inspectors.length > 0,
        hasDelivery: !!assignmentData.delivery,
        workCenterCount: assignmentData.workCenters.length,
        workerCount: assignmentData.workCenters.reduce(
          (acc, wc) => acc + wc.assignedUsers.length,
          0
        ),
        inspectorCount: assignmentData.inspectors.length,
      },
    };
  } catch (error) {
    console.error("Error validating production order readiness:", error);
    throw new Error("Failed to validate production order readiness");
  }
}

/**
 * Starts production for a production order with pre-validation of role assignments
 * @param productionOrderId The ID of the production order to start
 * @param notes Optional notes for the status change
 * @returns The updated production order
 */
export async function startProductionWithValidation(
  productionOrderId: string,
  notes?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // First, validate that the production order has all required assignments
    const validation =
      await validateProductionOrderReadiness(productionOrderId);

    if (!validation.isReady) {
      const errorMessage = `Cannot start production due to missing role assignments:\n${validation.issues.join(
        "\n"
      )}`;
      throw new Error(errorMessage);
    }

    // If validation passes, update the status to IN_PROGRESS
    const order = await updateProductionOrderStatus(
      productionOrderId,
      Status.IN_PROGRESS,
      notes || "Production started after role assignment validation"
    );

    // Log successful production start
    try {
      if (prisma.activityLog) {
        await prisma.activityLog.create({
          data: {
            type: "PRODUCTION_STARTED",
            userId: session.user.id,
            details: {
              productionOrderId,
              validation: validation.validation,
              notes: notes || null,
              startedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (logError) {
      console.error(
        "Failed to create production start activity log:",
        logError
      );
      // Continue even if logging fails
    }

    // Send notifications to all assigned personnel
    try {
      const { notifyProductionStarted } = await import(
        "@/lib/actions/notifications"
      );
      const notificationResult = await notifyProductionStarted(
        productionOrderId,
        session.user.id
      );

      if (notificationResult.success) {
        console.log(
          "Successfully notified production team:",
          notificationResult.message
        );
      } else {
        console.error(
          "Failed to notify production team:",
          notificationResult.error
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending production start notifications:",
        notificationError
      );
    }

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return {
      success: true,
      order,
      validation,
      message:
        "Production started successfully with all required roles assigned",
    };
  } catch (error) {
    console.error("Error starting production with validation:", error);
    throw error;
  }
}

// Update the updateProductionOrderStatus function to handle errors when creating ActivityLog entries
export async function updateProductionOrderStatus(
  productionOrderId: string,
  status: Status,
  notes?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get current production order
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
      },
    });

    if (!currentOrder) {
      throw new Error("Production order not found");
    }

    const oldStatus = currentOrder.status;
    const productionQty = currentOrder.quantity;

    // If cancelling production, release material reservations
    if (status === "CANCELLED" && oldStatus !== "CANCELLED") {
      const releaseResult = await releaseMaterialReservations(
        productionOrderId,
        "Production order cancelled"
      );

      if (!releaseResult.success) {
        console.error(
          "Failed to release material reservations:",
          releaseResult.error
        );
        // Continue with status update even if release fails
      }
    }

    // If completing production, increase product stock and update completion fields
    if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
      await prisma.product.update({
        where: { id: currentOrder.productId },
        data: {
          currentStock: currentOrder.product.currentStock + productionQty,
        },
      });

      // Update production order completion fields
      await prisma.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          completedQuantity: productionQty,
          completedAt: new Date(),
        },
      });

      // Log product stock increment
      if (prisma.activityLog) {
        await prisma.activityLog.create({
          data: {
            type: "PRODUCT_STOCK_INCREMENT",
            userId: session.user.id,
            details: {
              productId: currentOrder.productId,
              productName: currentOrder.product.name,
              change: productionQty,
              reason: `Production order ${productionOrderId} completed`,
            },
          },
        });
      }
    }

    // Update the production order status
    const order = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        status,
        modifiedBy: session.user.id,
        notes: notes || undefined,
      },
    });

    // Log the status change using the ActivityLog model
    try {
      if (prisma.activityLog) {
        await prisma.activityLog.create({
          data: {
            type: "PRODUCTION_STATUS_CHANGE",
            userId: session.user.id,
            details: {
              productionOrderId,
              oldStatus,
              newStatus: status,
              notes: notes || null,
            },
          },
        });
      }
    } catch (logError) {
      console.error("Failed to create activity log:", logError);
    }

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);
    revalidatePath("/admin/materials");

    return order;
  } catch (error) {
    console.error("Error updating production order status:", error);
    throw error;
  }
}

// Update the getProductionLogs function to handle errors
export async function getProductionLogs(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Check if ActivityLog model exists in prisma client
    if (!prisma.activityLog) {
      console.log("ActivityLog model not available in Prisma client");
      return []; // Return empty array if model is not available
    }

    // Fetch the activity logs related to this production order using Prisma
    const logs = await prisma.activityLog.findMany({
      where: {
        type: "PRODUCTION_STATUS_CHANGE",
        details: {
          path: ["productionOrderId"],
          equals: productionOrderId,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the logs for display
    const formattedLogs = logs.map((log) => {
      const details = log.details as any;

      // Get user name if available
      const userName = log.user.profile
        ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
        : log.user.email;

      return {
        id: log.id,
        action: `Status changed from ${details.oldStatus} to ${details.newStatus}`,
        details: details.notes || "",
        timestamp: log.createdAt,
        userId: log.userId,
        userName,
      };
    });

    return formattedLogs;
  } catch (error) {
    console.error("Error fetching production logs:", error);
    return []; // Return empty array on error
  }
}

// Update the createInitialProductionLog function to handle errors
export async function createInitialProductionLog(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get the production order
    const order = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
    });

    if (!order) throw new Error("Production order not found");

    // Check if ActivityLog model exists in prisma client
    if (!prisma.activityLog) {
      console.log("ActivityLog model not available in Prisma client");
      return { success: false, error: "ActivityLog model not available" };
    }

    // Create an initial log entry
    await prisma.activityLog.create({
      data: {
        type: "PRODUCTION_STATUS_CHANGE",
        userId: session.user.id,
        details: {
          productionOrderId,
          oldStatus: "PENDING",
          newStatus: order.status,
          notes: "Initial production order status",
        },
      },
    });

    revalidatePath(`/admin/production/${productionOrderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error creating initial production log:", error);
    return { success: false, error: String(error) };
  }
}

export async function getProductionOrderWithAssignments(id: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
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
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        // Work Center Operations with assigned workers
        operations: {
          include: {
            workCenter: {
              include: {
                userAssignments: {
                  include: {
                    user: {
                      include: {
                        profile: {
                          select: {
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                            department: true,
                            position: true,
                          },
                        },
                      },
                    },
                  },
                  where: {
                    status: "ACTIVE",
                  },
                },
                UserWorkCenter: {
                  include: {
                    user: {
                      include: {
                        profile: {
                          select: {
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                            department: true,
                            position: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            assignedTo: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
            performedBy: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
        // Quality Checks with Inspector assignments
        qualityChecks: {
          include: {
            inspector: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
        // Delivery Assignment
        delivery: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Production order not found");
    }

    // Get all inspectors assigned to this production order (through quality checks or operations)
    const inspectorAssignments = await prisma.user.findMany({
      where: {
        role: "INSPECTOR",
        OR: [
          {
            // Inspectors assigned through quality checks
            inspections: {
              some: {
                productionOrderId: id,
              },
            },
          },
          {
            // Inspectors assigned through operations
            assignedOperations: {
              some: {
                productionOrderId: id,
              },
            },
          },
        ],
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
            department: true,
            position: true,
          },
        },
        inspector: {
          select: {
            specialization: true,
            certificationLevel: true,
            yearsOfExperience: true,
          },
        },
      },
    });

    // Get work centers and their assigned users for this production order
    const workCenterAssignments = await prisma.workCenter.findMany({
      where: {
        operations: {
          some: {
            productionOrderId: id,
          },
        },
      },
      include: {
        userAssignments: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
          },
          where: {
            status: "ACTIVE",
          },
        },
        UserWorkCenter: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    department: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
        operations: {
          where: {
            productionOrderId: id,
          },
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            assignedTo: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Process and format the assignment data
    const assignmentData = {
      productionOrder: order,
      workCenters: workCenterAssignments.map((wc) => ({
        id: wc.id,
        name: wc.name,
        description: wc.description,
        capacityPerHour: wc.capacityPerHour,
        efficiencyRate: wc.efficiencyRate,
        status: wc.status,
        assignedUsers: [
          // From WorkCenterAssignment (newer model)
          ...wc.userAssignments.map((assignment) => ({
            id: assignment.user.id,
            email: assignment.user.email,
            role: assignment.user.role,
            name: assignment.user.profile
              ? `${assignment.user.profile.firstName} ${assignment.user.profile.lastName}`
              : assignment.user.email,
            phoneNumber: assignment.user.profile?.phoneNumber,
            department: assignment.user.profile?.department,
            position: assignment.user.profile?.position,
            isPrimary: assignment.isPrimary,
            assignmentType: "WorkCenterAssignment",
          })),
          // From UserWorkCenter (legacy model)
          ...wc.UserWorkCenter.map((userWorkCenter) => ({
            id: userWorkCenter.user.id,
            email: userWorkCenter.user.email,
            role: userWorkCenter.user.role,
            name: userWorkCenter.user.profile
              ? `${userWorkCenter.user.profile.firstName} ${userWorkCenter.user.profile.lastName}`
              : userWorkCenter.user.email,
            phoneNumber: userWorkCenter.user.profile?.phoneNumber,
            department: userWorkCenter.user.profile?.department,
            position: userWorkCenter.user.profile?.position,
            isResponsible: userWorkCenter.isResponsible,
            assignmentType: "UserWorkCenter",
          })),
        ],
        operations: wc.operations,
      })),
      inspectors: inspectorAssignments.map((inspector) => ({
        id: inspector.id,
        email: inspector.email,
        role: inspector.role,
        name: inspector.profile
          ? `${inspector.profile.firstName} ${inspector.profile.lastName}`
          : inspector.email,
        phoneNumber: inspector.profile?.phoneNumber,
        department: inspector.profile?.department,
        position: inspector.profile?.position,
        specialization: inspector.inspector?.specialization,
        certificationLevel: inspector.inspector?.certificationLevel,
        yearsOfExperience: inspector.inspector?.yearsOfExperience,
      })),
      delivery: order.delivery
        ? {
            id: order.delivery.id,
            userId: order.delivery.userId,
            scheduledDate: order.delivery.scheduledDate,
            status: order.delivery.status,
            deliveryAddress: order.delivery.deliveryAddress,
            notes: order.delivery.notes,
            user: {
              id: order.delivery.user.id,
              email: order.delivery.user.email,
              role: order.delivery.user.role,
              name: order.delivery.user.profile
                ? `${order.delivery.user.profile.firstName} ${order.delivery.user.profile.lastName}`
                : order.delivery.user.email,
              phoneNumber: order.delivery.user.profile?.phoneNumber,
              department: order.delivery.user.profile?.department,
              position: order.delivery.user.profile?.position,
            },
          }
        : null,
    };

    return assignmentData;
  } catch (error) {
    console.error("Error fetching production order with assignments:", error);
    throw error;
  }
}

/**
 * Checks if all work center operations are completed for a production order
 * @param productionOrderId The ID of the production order to check
 * @returns Object containing completion status and details
 */
export async function checkWorkCenterCompletion(productionOrderId: string) {
  try {
    const operations = await prisma.operation.findMany({
      where: { productionOrderId },
      include: {
        workCenter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalOperations = operations.length;
    const completedOperations = operations.filter(
      (op) => op.status === "COMPLETED"
    );
    const inProgressOperations = operations.filter(
      (op) => op.status === "IN_PROGRESS"
    );
    const pendingOperations = operations.filter(
      (op) => op.status === "PENDING"
    );

    const allCompleted =
      totalOperations > 0 && completedOperations.length === totalOperations;
    const completionPercentage =
      totalOperations > 0
        ? Math.round((completedOperations.length / totalOperations) * 100)
        : 0;

    return {
      allCompleted,
      totalOperations,
      completedCount: completedOperations.length,
      inProgressCount: inProgressOperations.length,
      pendingCount: pendingOperations.length,
      completionPercentage,
      operations: operations.map((op) => ({
        id: op.id,
        status: op.status,
        workCenterId: op.workCenterId,
        workCenterName: op.workCenter.name,
        startTime: op.startTime,
        endTime: op.endTime,
      })),
    };
  } catch (error) {
    console.error("Error checking work center completion:", error);
    throw new Error("Failed to check work center completion");
  }
}

/**
 * Checks if all quality checks/inspections are completed for a production order
 * @param productionOrderId The ID of the production order to check
 * @returns Object containing inspection completion status and details
 */
export async function checkInspectionCompletion(productionOrderId: string) {
  try {
    const qualityChecks = await prisma.qualityCheck.findMany({
      where: { productionOrderId },
      include: {
        inspector: {
          include: {
            profile: true,
          },
        },
      },
    });

    const totalChecks = qualityChecks.length;
    const completedChecks = qualityChecks.filter(
      (qc) => qc.status === "COMPLETED"
    );
    const inProgressChecks = qualityChecks.filter(
      (qc) => qc.status === "IN_PROGRESS"
    );
    const pendingChecks = qualityChecks.filter((qc) => qc.status === "PENDING");

    const allCompleted =
      totalChecks > 0 && completedChecks.length === totalChecks;
    const completionPercentage =
      totalChecks > 0
        ? Math.round((completedChecks.length / totalChecks) * 100)
        : 0;

    return {
      allCompleted,
      totalChecks,
      completedCount: completedChecks.length,
      inProgressCount: inProgressChecks.length,
      pendingCount: pendingChecks.length,
      completionPercentage,
      qualityChecks: qualityChecks.map((qc) => ({
        id: qc.id,
        status: qc.status,
        inspectorId: qc.inspectorId,
        inspectorName: qc.inspector.profile
          ? `${qc.inspector.profile.firstName} ${qc.inspector.profile.lastName}`
          : qc.inspector.email,
        checkDate: qc.checkDate,
        defectsFound: qc.defectsFound,
        actionTaken: qc.actionTaken,
        notes: qc.notes,
      })),
    };
  } catch (error) {
    console.error("Error checking inspection completion:", error);
    throw new Error("Failed to check inspection completion");
  }
}

/**
 * Gets comprehensive production phase completion status
 * @param productionOrderId The ID of the production order to check
 * @returns Object containing all phase completion statuses
 */
export async function getProductionPhaseStatus(productionOrderId: string) {
  try {
    const [workCenterStatus, inspectionStatus] = await Promise.all([
      checkWorkCenterCompletion(productionOrderId),
      checkInspectionCompletion(productionOrderId),
    ]);

    // Check if delivery can be started (both work centers and inspections must be complete)
    const canStartDelivery =
      workCenterStatus.allCompleted && inspectionStatus.allCompleted;

    // Determine current phase
    let currentPhase: "work_centers" | "inspection" | "delivery" | "completed";
    if (!workCenterStatus.allCompleted) {
      currentPhase = "work_centers";
    } else if (!inspectionStatus.allCompleted) {
      currentPhase = "inspection";
    } else {
      currentPhase = "delivery";
    }

    return {
      workCenters: workCenterStatus,
      inspections: inspectionStatus,
      canStartDelivery,
      currentPhase,
      overallProgress: {
        workCentersComplete: workCenterStatus.allCompleted,
        inspectionsComplete: inspectionStatus.allCompleted,
        readyForDelivery: canStartDelivery,
      },
    };
  } catch (error) {
    console.error("Error getting production phase status:", error);
    throw new Error("Failed to get production phase status");
  }
}

/**
 * Validates if delivery status can be updated based on production phase dependencies
 * @param productionOrderId The ID of the production order
 * @param newStatus The proposed new delivery status
 * @returns Validation result with allowed status and blocking issues
 */
export async function validateDeliveryStatusDependencies(
  productionOrderId: string,
  newStatus: Status
) {
  try {
    const phaseStatus = await getProductionPhaseStatus(productionOrderId);
    const issues: string[] = [];
    let isAllowed = true;

    // Get current delivery assignment
    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: { productionOrderId },
      select: { status: true },
    });

    const currentDeliveryStatus = deliveryAssignment?.status || "PENDING";

    // Define delivery status progression rules
    switch (newStatus) {
      case "IN_PROGRESS":
        // Can start delivery only if work centers and inspections are completed
        if (!phaseStatus.canStartDelivery) {
          isAllowed = false;
          if (!phaseStatus.workCenters.allCompleted) {
            issues.push(
              `Work center operations must be completed first. Progress: ${phaseStatus.workCenters.completedCount}/${phaseStatus.workCenters.totalOperations} (${phaseStatus.workCenters.completionPercentage}%)`
            );
          }
          if (!phaseStatus.inspections.allCompleted) {
            issues.push(
              `Quality inspections must be completed first. Progress: ${phaseStatus.inspections.completedCount}/${phaseStatus.inspections.totalChecks} (${phaseStatus.inspections.completionPercentage}%)`
            );
          }
        }
        break;

      case "COMPLETED":
        // Can complete delivery only if it was previously in progress AND dependencies are met
        if (currentDeliveryStatus !== "IN_PROGRESS") {
          isAllowed = false;
          issues.push(
            "Delivery must be in progress before it can be completed"
          );
        }
        if (!phaseStatus.canStartDelivery) {
          isAllowed = false;
          issues.push(
            "Cannot complete delivery while work centers or inspections are incomplete"
          );
        }
        break;

      case "PENDING":
        // Can always set back to pending (allows reset/reassignment)
        break;

      case "CANCELLED":
        // Can always cancel
        break;

      default:
        isAllowed = false;
        issues.push(`Invalid delivery status: ${newStatus}`);
    }

    return {
      isAllowed,
      issues,
      currentPhase: phaseStatus.currentPhase,
      phaseStatus,
      currentDeliveryStatus,
      proposedStatus: newStatus,
      blockingReasons: issues,
      recommendations: generateDeliveryRecommendations(phaseStatus, newStatus),
    };
  } catch (error) {
    console.error("Error validating delivery status dependencies:", error);
    throw new Error("Failed to validate delivery status dependencies");
  }
}

/**
 * Helper function to generate recommendations for delivery status updates
 */
function generateDeliveryRecommendations(
  phaseStatus: any,
  proposedStatus: Status
): string[] {
  const recommendations: string[] = [];

  if (proposedStatus === "IN_PROGRESS" && !phaseStatus.canStartDelivery) {
    if (!phaseStatus.workCenters.allCompleted) {
      recommendations.push(
        "Complete all work center operations before starting delivery"
      );
      recommendations.push(
        `Remaining operations: ${phaseStatus.workCenters.totalOperations - phaseStatus.workCenters.completedCount}`
      );
    }
    if (!phaseStatus.inspections.allCompleted) {
      recommendations.push(
        "Complete all quality inspections before starting delivery"
      );
      recommendations.push(
        `Remaining inspections: ${phaseStatus.inspections.totalChecks - phaseStatus.inspections.completedCount}`
      );
    }
  }

  if (phaseStatus.canStartDelivery && proposedStatus === "PENDING") {
    recommendations.push(
      "Production is ready for delivery - consider starting delivery process"
    );
  }

  return recommendations;
}

/**
 * Gets enhanced production order details with phase status for UI display
 * @param productionOrderId The ID of the production order
 * @returns Enhanced production order data with phase status
 */
export async function getProductionOrderWithPhaseStatus(
  productionOrderId: string
) {
  try {
    // Get basic production order data
    const productionOrder = await getProductionOrder(productionOrderId);
    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    // Get phase status
    const phaseStatus = await getProductionPhaseStatus(productionOrderId);

    // Get delivery assignment
    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: { productionOrderId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Enhanced delivery info
    const deliveryInfo = deliveryAssignment
      ? {
          id: deliveryAssignment.id,
          userId: deliveryAssignment.userId,
          userName: deliveryAssignment.user.profile
            ? `${deliveryAssignment.user.profile.firstName} ${deliveryAssignment.user.profile.lastName}`
            : deliveryAssignment.user.email,
          status: deliveryAssignment.status,
          scheduledDate: deliveryAssignment.scheduledDate,
          deliveryAddress: deliveryAssignment.deliveryAddress,
          notes: deliveryAssignment.notes,
          canStart:
            phaseStatus.canStartDelivery &&
            deliveryAssignment.status === "PENDING",
          canComplete:
            phaseStatus.canStartDelivery &&
            deliveryAssignment.status === "IN_PROGRESS",
          createdAt: deliveryAssignment.createdAt,
          updatedAt: deliveryAssignment.updatedAt,
        }
      : null;

    return {
      ...productionOrder,
      phaseStatus,
      deliveryInfo,
      workflowProgress: {
        currentPhase: phaseStatus.currentPhase,
        workCentersComplete: phaseStatus.workCenters.allCompleted,
        inspectionsComplete: phaseStatus.inspections.allCompleted,
        readyForDelivery: phaseStatus.canStartDelivery,
        deliveryStatus: deliveryAssignment?.status || "NOT_ASSIGNED",
      },
    };
  } catch (error) {
    console.error("Error getting production order with phase status:", error);
    throw new Error("Failed to get production order with phase status");
  }
}

/**
 * Admin override function to bypass workflow dependencies in exceptional cases
 * @param productionOrderId The ID of the production order
 * @param overrideType The type of override being performed
 * @param overrideReason Admin's reason for the override
 * @param targetStatus The status to set regardless of dependencies
 * @param adminUserId The admin performing the override
 * @returns Result of the override operation
 */
export async function adminWorkflowOverride(
  productionOrderId: string,
  overrideType:
    | "START_PRODUCTION"
    | "BYPASS_WORK_CENTERS"
    | "BYPASS_INSPECTIONS"
    | "FORCE_STATUS",
  overrideReason: string,
  targetStatus?: Status,
  adminUserId?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Verify admin role
    if (session.user.role !== "ADMIN") {
      throw new Error("Only administrators can perform workflow overrides");
    }

    const userId = adminUserId || session.user.id;

    // Get current production order and validation status
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
        operations: true,
        qualityChecks: true,
        deliveryAssignment: true,
      },
    });

    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    // Get current validation status for audit
    const validation =
      await validateProductionOrderReadiness(productionOrderId);
    const phaseStatus = await getProductionPhaseStatus(productionOrderId);

    let result: any = {};
    const overrideDetails: any = {
      type: overrideType,
      reason: overrideReason,
      timestamp: new Date().toISOString(),
      adminUserId: userId,
      productionOrderId,
      originalValidation: validation,
      originalPhaseStatus: phaseStatus,
      beforeStatus: productionOrder.status,
    };

    switch (overrideType) {
      case "START_PRODUCTION":
        // Force start production without role assignment validation
        if (targetStatus && targetStatus !== Status.IN_PROGRESS) {
          throw new Error(
            "START_PRODUCTION override can only set status to IN_PROGRESS"
          );
        }

        result = await prisma.productionOrder.update({
          where: { id: productionOrderId },
          data: {
            status: Status.IN_PROGRESS,
            modifiedBy: userId,
            notes: `Admin override: ${overrideReason}`,
          },
        });

        overrideDetails.afterStatus = Status.IN_PROGRESS;
        overrideDetails.bypassedValidations = validation.issues;
        break;

      case "BYPASS_WORK_CENTERS":
        // Allow inspections to start even if work centers aren't complete
        if (!targetStatus) {
          throw new Error(
            "Target status required for BYPASS_WORK_CENTERS override"
          );
        }

        result = await updateProductionOrderStatus(
          productionOrderId,
          targetStatus,
          `Admin override (bypass work centers): ${overrideReason}`
        );

        overrideDetails.afterStatus = targetStatus;
        overrideDetails.bypassedDependency = "work_center_completion";
        overrideDetails.workCenterStatus = phaseStatus.workCenters;
        break;

      case "BYPASS_INSPECTIONS":
        // Allow delivery to start even if inspections aren't complete
        if (!targetStatus) {
          throw new Error(
            "Target status required for BYPASS_INSPECTIONS override"
          );
        }

        result = await updateProductionOrderStatus(
          productionOrderId,
          targetStatus,
          `Admin override (bypass inspections): ${overrideReason}`
        );

        overrideDetails.afterStatus = targetStatus;
        overrideDetails.bypassedDependency = "inspection_completion";
        overrideDetails.inspectionStatus = phaseStatus.inspections;
        break;

      case "FORCE_STATUS":
        // Force any status change regardless of normal rules
        if (!targetStatus) {
          throw new Error("Target status required for FORCE_STATUS override");
        }

        result = await updateProductionOrderStatus(
          productionOrderId,
          targetStatus,
          `Admin override (force status): ${overrideReason}`
        );

        overrideDetails.afterStatus = targetStatus;
        overrideDetails.bypassedValidations = "all_status_validations";
        break;

      default:
        throw new Error(`Invalid override type: ${overrideType}`);
    }

    // Create comprehensive audit log
    try {
      await prisma.activityLog.create({
        data: {
          type: "ADMIN_WORKFLOW_OVERRIDE",
          userId,
          details: overrideDetails,
        },
      });
    } catch (logError) {
      console.error("Failed to create admin override audit log:", logError);
      // Don't fail the override if logging fails, but warn
    }

    // Create a separate critical audit entry for security
    try {
      await prisma.activityLog.create({
        data: {
          type: "SECURITY_ADMIN_ACTION",
          userId,
          details: {
            action: "WORKFLOW_OVERRIDE",
            resource: "ProductionOrder",
            resourceId: productionOrderId,
            severity: "HIGH",
            overrideType,
            reason: overrideReason,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (logError) {
      console.error("Failed to create security audit log:", logError);
    }

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return {
      success: true,
      result,
      overrideDetails,
      message: `Admin override completed: ${overrideType} for production order ${productionOrderId}`,
      warning:
        "This action bypassed normal workflow validations. Review audit logs for compliance.",
    };
  } catch (error) {
    console.error("Error performing admin workflow override:", error);
    throw error;
  }
}

/**
 * Get audit trail for workflow overrides on a production order
 * @param productionOrderId The ID of the production order
 * @returns List of override audit entries
 */
export async function getWorkflowOverrideAuditTrail(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Only admins can view override audit trails
    if (session.user.role !== "ADMIN") {
      throw new Error("Only administrators can view override audit trails");
    }

    const overrideLogs = await prisma.activityLog.findMany({
      where: {
        type: "ADMIN_WORKFLOW_OVERRIDE",
        details: {
          path: ["productionOrderId"],
          equals: productionOrderId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return overrideLogs.map((log) => ({
      id: log.id,
      type: log.details.type,
      reason: log.details.reason,
      timestamp: log.details.timestamp,
      adminUser: {
        id: log.user.id,
        email: log.user.email,
        name: log.user.profile
          ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
          : "Unknown",
      },
      overrideDetails: {
        beforeStatus: log.details.beforeStatus,
        afterStatus: log.details.afterStatus,
        bypassedValidations: log.details.bypassedValidations,
        bypassedDependency: log.details.bypassedDependency,
        originalValidation: log.details.originalValidation,
        originalPhaseStatus: log.details.originalPhaseStatus,
      },
      createdAt: log.createdAt,
    }));
  } catch (error) {
    console.error("Error getting workflow override audit trail:", error);
    throw error;
  }
}

/**
 * Admin function to check if a workflow override is recommended
 * @param productionOrderId The ID of the production order
 * @returns Recommendation for potential overrides
 */
export async function getWorkflowOverrideRecommendations(
  productionOrderId: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    if (session.user.role !== "ADMIN") {
      throw new Error("Only administrators can get override recommendations");
    }

    const validation =
      await validateProductionOrderReadiness(productionOrderId);
    const phaseStatus = await getProductionPhaseStatus(productionOrderId);

    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      select: {
        status: true,
        dueDate: true,
        priority: true,
        createdAt: true,
      },
    });

    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    const recommendations: any[] = [];
    const now = new Date();
    const isOverdue = productionOrder.dueDate < now;
    const isUrgent =
      productionOrder.priority === "URGENT" ||
      productionOrder.priority === "HIGH";
    const daysSinceCreated = Math.floor(
      (now.getTime() - productionOrder.createdAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Analyze issues and suggest overrides
    if (!validation.isReady && productionOrder.status === "PENDING") {
      if (isOverdue || isUrgent) {
        recommendations.push({
          type: "START_PRODUCTION",
          severity: isOverdue ? "HIGH" : "MEDIUM",
          reason: isOverdue
            ? "Production order is overdue - consider emergency start"
            : "High priority order - role assignments may be expedited during production",
          suggestedReason: isOverdue
            ? `Emergency start due to overdue status (due: ${productionOrder.dueDate.toISOString().split("T")[0]})`
            : `Priority production order requires immediate start`,
          blockedBy: validation.issues,
        });
      }

      if (daysSinceCreated >= 3) {
        recommendations.push({
          type: "START_PRODUCTION",
          severity: "MEDIUM",
          reason: "Production order has been pending for over 3 days",
          suggestedReason: `Long-pending order - expedite role assignments or override to prevent further delays`,
          blockedBy: validation.issues,
        });
      }
    }

    // Check for inspection bottlenecks
    if (
      phaseStatus.workCenters.allCompleted &&
      !phaseStatus.inspections.allCompleted
    ) {
      const daysSinceWorkCentersComplete = 1; // Simplified - would need actual completion date
      if (daysSinceWorkCentersComplete >= 1 && (isUrgent || isOverdue)) {
        recommendations.push({
          type: "BYPASS_INSPECTIONS",
          severity: isOverdue ? "HIGH" : "MEDIUM",
          reason:
            "Work centers complete but inspections delayed - consider expedited quality check",
          suggestedReason: `${isOverdue ? "Overdue" : "Priority"} order - approve for delivery with post-delivery quality verification`,
          blockedBy: ["Incomplete quality inspections"],
        });
      }
    }

    // Check for delivery bottlenecks
    if (
      phaseStatus.workCenters.allCompleted &&
      phaseStatus.inspections.allCompleted &&
      isOverdue
    ) {
      recommendations.push({
        type: "FORCE_STATUS",
        severity: "HIGH",
        reason: "All phases complete but delivery delayed",
        suggestedReason: `Force delivery completion for overdue order`,
        targetStatus: "COMPLETED",
      });
    }

    return {
      productionOrderId,
      currentStatus: productionOrder.status,
      isOverdue,
      isUrgent,
      daysSinceCreated,
      validation,
      phaseStatus,
      recommendations,
      warningMessage:
        recommendations.length > 0
          ? "Override recommendations available - use with caution and document thoroughly"
          : "No workflow overrides recommended at this time",
    };
  } catch (error) {
    console.error("Error getting workflow override recommendations:", error);
    throw error;
  }
}
