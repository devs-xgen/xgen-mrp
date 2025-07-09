"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Status } from "@prisma/client";
import {
  CreateQualityCheckInput,
  UpdateQualityCheckInput,
} from "@/types/admin/quality-checks";
import { getInspectorById } from "./inspector";

export async function getQualityChecks() {
  try {
    const checks = await prisma.qualityCheck.findMany({
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { checkDate: "desc" },
    });

    return checks;
  } catch (error) {
    console.error("Error fetching quality checks:", error);
    throw new Error("Failed to fetch quality checks");
  }
}

export async function getQualityCheck(id: string) {
  try {
    const check = await prisma.qualityCheck.findUnique({
      where: { id },
      include: {
        productionOrder: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!check) {
      throw new Error("Quality check not found");
    }

    return check;
  } catch (error) {
    console.error("Error fetching quality check:", error);
    throw error;
  }
}

export async function createQualityCheck(data: CreateQualityCheckInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    if (!data || !data.productionOrderId) {
      throw new Error("Production order ID is required");
    }

    if (!data || !data.inspectorId) {
      throw new Error("Inspector ID is required");
    }

    // Verify inspector exists
    const inspector = await getInspectorById(data.inspectorId);
    if (!inspector) {
      throw new Error("Selected inspector does not exist");
    }

    // SEQUENTIAL WORKFLOW VALIDATION: Check if work centers are complete before allowing inspection
    const { checkWorkCenterCompletion } = await import(
      "@/lib/actions/production-order"
    );
    const workCenterStatus = await checkWorkCenterCompletion(
      data.productionOrderId
    );

    if (!workCenterStatus.allCompleted) {
      const errorMessage = [
        "Cannot create quality check because work center operations are not yet complete.",
        `Progress: ${workCenterStatus.completedCount}/${workCenterStatus.totalOperations} (${workCenterStatus.completionPercentage}%)`,
        `Remaining operations: ${workCenterStatus.totalOperations - workCenterStatus.completedCount}`,
        "All work center operations must be completed before quality inspections can begin.",
      ].join(" ");

      throw new Error(errorMessage);
    }

    // Proceed with creation
    const check = await prisma.qualityCheck.create({
      data: {
        productionOrder: { connect: { id: data.productionOrderId } },
        inspector: { connect: { id: data.inspectorId } },
        checkDate: data.checkDate,
        status: Status.PENDING,
        defectsFound: data.defectsFound || null,
        actionTaken: data.actionTaken || null,
        notes: data.notes || null,
        createdBy: session.user.id,
      },
      include: {
        productionOrder: {
          include: {
            product: true,
          },
        },
      },
    });

    // Log that inspection was created after work center completion
    try {
      await prisma.activityLog.create({
        data: {
          type: "QUALITY_CHECK_CREATED_AFTER_WORKCENTERS",
          userId: session.user.id,
          details: {
            productionOrderId: data.productionOrderId,
            qualityCheckId: check.id,
            inspectorId: data.inspectorId,
            workCenterStatus,
            message: "Quality check created after all work centers completed",
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log quality check creation:", logError);
    }

    // Optional: refresh cache/pathing
    revalidatePath("/admin/quality-checks");
    revalidatePath(`/admin/production/${data.productionOrderId}`);
    return check;
  } catch (error) {
    console.error("Error creating quality check:", error);
    throw error;
  }
}

export async function updateQualityCheck(
  id: string,
  newStatus: string,
  data: UpdateQualityCheckInput
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const check = await prisma.qualityCheck.findUnique({
      where: { id: data.id },
      include: { productionOrder: true },
    });

    if (!check) {
      throw new Error("Quality check not found");
    }

    // SEQUENTIAL WORKFLOW VALIDATION: Ensure work centers are still complete
    if (data.status === "IN_PROGRESS" || data.status === "COMPLETED") {
      const { checkWorkCenterCompletion } = await import(
        "@/lib/actions/production-order"
      );
      const workCenterStatus = await checkWorkCenterCompletion(
        check.productionOrderId
      );

      if (!workCenterStatus.allCompleted) {
        const errorMessage = [
          `Cannot update quality check to ${data.status} because work center operations are incomplete.`,
          `Progress: ${workCenterStatus.completedCount}/${workCenterStatus.totalOperations} (${workCenterStatus.completionPercentage}%)`,
          "All work center operations must remain completed during quality inspections.",
        ].join(" ");

        throw new Error(errorMessage);
      }
    }

    const previousStatus = check.status;
    const productionOrderId = check.productionOrderId;

    const updatedCheck = await prisma.qualityCheck.update({
      where: { id: data.id },
      data: {
        status: data.status,
        defectsFound:
          data.defectsFound !== undefined
            ? data.defectsFound
            : check.defectsFound,
        actionTaken:
          data.actionTaken !== undefined ? data.actionTaken : check.actionTaken,
        notes: data.notes !== undefined ? data.notes : check.notes,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        productionOrder: {
          include: {
            product: true,
          },
        },
      },
    });

    // Check if this completion triggers delivery readiness
    let deliveryReadiness = false;
    let allInspectionsComplete = false;

    if (data.status === "COMPLETED" && previousStatus !== "COMPLETED") {
      // Import the phase checking functions
      const { checkInspectionCompletion, getProductionPhaseStatus } =
        await import("@/lib/actions/production-order");

      // Check if all inspections are now complete
      const inspectionStatus =
        await checkInspectionCompletion(productionOrderId);
      allInspectionsComplete = inspectionStatus.allCompleted;

      if (allInspectionsComplete) {
        // All inspections complete - delivery can now start
        deliveryReadiness = true;

        // Check overall production phase status
        const phaseStatus = await getProductionPhaseStatus(productionOrderId);

        // Log that inspections are complete and delivery can start
        try {
          await prisma.activityLog.create({
            data: {
              type: "INSPECTIONS_COMPLETED",
              userId: session.user.id,
              details: {
                productionOrderId,
                qualityCheckId: data.id,
                inspectionStatus,
                phaseStatus: phaseStatus.overallProgress,
                message:
                  "All quality inspections completed - delivery can now start",
              },
            },
          });
        } catch (logError) {
          console.error("Failed to log inspection completion:", logError);
        }
      }
    }

    // Log the quality check status update
    try {
      await prisma.activityLog.create({
        data: {
          type: "QUALITY_CHECK_STATUS_UPDATE",
          userId: session.user.id,
          details: {
            qualityCheckId: data.id,
            productionOrderId,
            previousStatus,
            newStatus: data.status,
            deliveryReadiness,
            allInspectionsComplete,
            message: deliveryReadiness
              ? "Quality check completed - all inspections done, delivery ready!"
              : "Quality check status updated",
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log quality check update:", logError);
    }

    revalidatePath("/admin/quality-checks");
    revalidatePath(`/admin/production/${check.productionOrderId}`);
    revalidatePath("/inspector/tasks");
    revalidatePath("/inspector/dashboard");

    return {
      ...updatedCheck,
      deliveryReadiness,
      allInspectionsComplete,
      message: deliveryReadiness
        ? "Quality check completed! All inspections are done - delivery can now start."
        : "Quality check updated successfully.",
    };
  } catch (error) {
    console.error("Error updating quality check:", error);
    throw error;
  }
}

export async function deleteQualityCheck(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const check = await prisma.qualityCheck.findUnique({
      where: { id },
    });

    if (!check) {
      throw new Error("Quality check not found");
    }

    await prisma.qualityCheck.delete({
      where: { id },
    });

    revalidatePath("/admin/quality-checks");
    revalidatePath(`/admin/production/${check.productionOrderId}`);
  } catch (error) {
    console.error("Error deleting quality check:", error);
    throw error;
  }
}

// Get available production orders for quality checks
export async function getAvailableProductionOrders() {
  try {
    const orders = await prisma.productionOrder.findMany({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      select: {
        id: true,
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        quantity: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  } catch (error) {
    console.error("Error fetching available production orders:", error);
    throw new Error("Failed to fetch available production orders");
  }
}

// Get quality metrics for dashboard
export async function getQualityMetrics() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const totalChecks = await prisma.qualityCheck.count();

    const pendingChecks = await prisma.qualityCheck.count({
      where: { status: "PENDING" },
    });

    const defectsFound = await prisma.qualityCheck.count({
      where: {
        defectsFound: { not: null },
        NOT: { defectsFound: "" },
      },
    });

    const passRate =
      totalChecks > 0
        ? ((totalChecks - defectsFound) / totalChecks) * 100
        : 100;

    const recentChecks = await prisma.qualityCheck.findMany({
      take: 5,
      orderBy: { checkDate: "desc" },
      include: {
        productionOrder: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return {
      totalChecks,
      pendingChecks,
      defectsFound,
      passRate,
      recentChecks,
    };
  } catch (error) {
    console.error("Error getting quality metrics:", error);
    throw error;
  }
}

// Use the imported getActiveInspectors function instead
