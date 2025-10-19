"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * SUPERADMIN Material Reservation Actions
 * Bulk release operations with audit trail
 */

// ==================== READ OPERATIONS ====================

/**
 * Get ALL material reservations (no restrictions) with filters
 */
export async function getAllMaterialReservationsSuperadmin(filters?: {
  status?: string;
  productionOrderStatus?: string;
  materialId?: string;
  productionOrderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const where: any = {};

    // Filter by reservation status
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    // Filter by production order status
    if (filters?.productionOrderStatus && filters.productionOrderStatus !== "ALL") {
      where.productionOrder = {
        status: filters.productionOrderStatus,
      };
    }

    // Filter by material
    if (filters?.materialId) {
      where.materialId = filters.materialId;
    }

    // Filter by production order
    if (filters?.productionOrderId) {
      where.productionOrderId = filters.productionOrderId;
    }

    // Filter by date range
    if (filters?.dateFrom || filters?.dateTo) {
      where.reservedAt = {};
      if (filters.dateFrom) where.reservedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.reservedAt.lte = filters.dateTo;
    }

    // Search
    if (filters?.search) {
      where.OR = [
        { material: { name: { contains: filters.search, mode: "insensitive" } } },
        { material: { sku: { contains: filters.search, mode: "insensitive" } } },
        { productionOrder: { id: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const reservations = await prisma.materialReservation.findMany({
      where,
      include: {
        material: {
          select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
            committedStock: true,
            unitOfMeasure: {
              select: {
                abbreviation: true,
              },
            },
          },
        },
        productionOrder: {
          select: {
            id: true,
            status: true,
            priority: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        reservedAt: "desc",
      },
    });

    return reservations;
  } catch (error) {
    console.error("[SUPERADMIN_GET_ALL_MATERIAL_RESERVATIONS]", error);
    throw error;
  }
}

/**
 * Get material reservation statistics
 */
export async function getMaterialReservationStatsSuperadmin() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const [total, byStatus, totalReservedQuantity, partiallyConsumed] = await Promise.all([
      // Total reservations
      prisma.materialReservation.count(),

      // By status
      prisma.materialReservation.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Total reserved quantity
      prisma.materialReservation.aggregate({
        _sum: {
          quantityReserved: true,
          quantityConsumed: true,
          quantityReleased: true,
        },
      }),

      // Partially consumed reservations
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM "MaterialReservation"
        WHERE "quantityConsumed" > 0
        AND "quantityConsumed" < "quantityReserved"
        AND status = 'ACTIVE'
      `,
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      totalReservedQuantity: totalReservedQuantity._sum.quantityReserved || 0,
      totalConsumedQuantity: totalReservedQuantity._sum.quantityConsumed || 0,
      totalReleasedQuantity: totalReservedQuantity._sum.quantityReleased || 0,
      partiallyConsumed: Number(partiallyConsumed[0]?.count || 0),
    };
  } catch (error) {
    console.error("[SUPERADMIN_GET_MATERIAL_RESERVATION_STATS]", error);
    throw error;
  }
}

// ==================== BULK RELEASE OPERATIONS ====================

/**
 * OVERRIDE: Bulk release material reservations
 * Transaction-safe release of multiple reservations with audit trail
 */
export async function bulkReleaseMaterialReservations(
  reservationIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
  materialsSummary: Array<{
    materialId: string;
    materialName: string;
    materialSku: string;
    totalReleased: number;
    reservationCount: number;
    unit: string;
  }>;
  skipped: Array<{
    reservationId: string;
    reason: string;
  }>;
} | {
  success: false;
  error: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized: SUPER_ADMIN access required" };
    }

    // Validation
    if (!reservationIds || reservationIds.length === 0) {
      return { success: false, error: "No reservations selected" };
    }

    if (reservationIds.length > 500) {
      return { success: false, error: "Maximum 500 reservations can be released at once" };
    }

    if (!reason || reason.length < 15) {
      return { success: false, error: "Reason must be at least 15 characters" };
    }

    // Perform bulk release in transaction
    const result = await prisma.$transaction(async (tx) => {
      const releasedReservations: any[] = [];
      const skipped: Array<{ reservationId: string; reason: string }> = [];
      const materialUpdates = new Map<string, {
        material: any;
        totalRelease: number;
        reservationCount: number;
      }>();

      // Process each reservation
      for (const reservationId of reservationIds) {
        const reservation = await tx.materialReservation.findUnique({
          where: { id: reservationId },
          include: {
            material: {
              include: {
                unitOfMeasure: {
                  select: {
                    abbreviation: true,
                  },
                },
              },
            },
            productionOrder: {
              select: {
                id: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!reservation) {
          skipped.push({
            reservationId,
            reason: "Reservation not found",
          });
          continue;
        }

        // Skip if already released
        if (reservation.status === "RELEASED") {
          skipped.push({
            reservationId,
            reason: "Already released",
          });
          continue;
        }

        // Skip if fully consumed
        const releaseQty = Number(reservation.quantityReserved) - Number(reservation.quantityConsumed);
        if (releaseQty <= 0) {
          skipped.push({
            reservationId,
            reason: "Fully consumed - nothing to release",
          });
          continue;
        }

        // Update reservation status to RELEASED
        const updatedReservation = await tx.materialReservation.update({
          where: { id: reservationId },
          data: {
            status: "RELEASED",
            quantityReleased: releaseQty,
            releasedAt: new Date(),
            releasedBy: session.user.id,
            releasedReason: reason,
            modifiedBy: session.user.id,
            updatedAt: new Date(),
          },
        });

        // Track material updates
        if (materialUpdates.has(reservation.materialId)) {
          const existing = materialUpdates.get(reservation.materialId)!;
          existing.totalRelease += releaseQty;
          existing.reservationCount++;
        } else {
          materialUpdates.set(reservation.materialId, {
            material: reservation.material,
            totalRelease: releaseQty,
            reservationCount: 1,
          });
        }

        releasedReservations.push(updatedReservation);
      }

      // Update material committed stock for each material
      for (const [materialId, data] of materialUpdates) {
        const previousStock = Number(data.material.committedStock);
        const newStock = previousStock - data.totalRelease;

        await tx.material.update({
          where: { id: materialId },
          data: {
            committedStock: Math.max(0, newStock), // Ensure not negative
          },
        });

        // Create inventory movement record
        await tx.inventoryMovement.create({
          data: {
            movementType: "MATERIAL_RESERVATION_RELEASE",
            materialId,
            quantity: -data.totalRelease, // Negative for release
            previousStock,
            newStock: Math.max(0, newStock),
            referenceType: "BULK_RELEASE",
            referenceId: session.user.id,
            performedBy: session.user.id,
            timestamp: new Date(),
          },
        });
      }

      // Create comprehensive audit log
      const materialsSummary = Array.from(materialUpdates.entries()).map(([id, data]) => ({
        materialId: id,
        materialName: data.material.name,
        materialSku: data.material.sku,
        totalReleased: data.totalRelease,
        reservationCount: data.reservationCount,
        unit: data.material.unitOfMeasure?.abbreviation || "units",
      }));

      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_MATERIAL_RELEASE",
          userId: session.user.id,
          details: {
            reservationIds: releasedReservations.map(r => r.id),
            totalRequested: reservationIds.length,
            totalReleased: releasedReservations.length,
            totalSkipped: skipped.length,
            reason,
            materialsSummary,
            skipped,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        count: releasedReservations.length,
        materialsSummary,
        skipped,
      };
    });

    // Revalidate relevant paths
    revalidatePath("/superadmin/materials/reservations");
    revalidatePath("/superadmin/materials");
    revalidatePath("/superadmin/production");
    revalidatePath("/admin/materials");
    revalidatePath("/admin/production");

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error("[SUPERADMIN_BULK_RELEASE_MATERIAL_RESERVATIONS]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk release reservations",
    };
  }
}

/**
 * Get releasable reservations count (for UI display)
 */
export async function getReleasableReservationsCount(reservationIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: SUPER_ADMIN access required");
    }

    const count = await prisma.materialReservation.count({
      where: {
        id: { in: reservationIds },
        status: { in: ["ACTIVE", "PARTIALLY_CONSUMED"] },
        quantityReserved: {
          gt: prisma.materialReservation.fields.quantityConsumed,
        },
      },
    });

    return count;
  } catch (error) {
    console.error("[SUPERADMIN_GET_RELEASABLE_COUNT]", error);
    throw error;
  }
}
