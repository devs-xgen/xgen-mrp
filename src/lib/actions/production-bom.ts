"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  CreateProductionBOMFromProductInput,
  CreateProductionBOMEntryInput,
  AdjustProductionBOMInput,
  BulkAdjustProductionBOMInput,
  UpdateProductionBOMEntryInput,
  ProductionBOMWithMaterial,
  ProductionBOMSummary,
  ProductionBOMForDisplay,
  ProductionBOMStats,
  ProductionBOMComparison,
} from "@/types/admin/production-bom";

// Create ProductionBOM from Product's BOM template
export async function createProductionBOMFromProduct(
  input: CreateProductionBOMFromProductInput
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { productionOrderId, productId, createdBy } = input;

    // Check if ProductionBOM already exists for this production order
    const existingProductionBOM = await prisma.productionBOM.findFirst({
      where: { productionOrderId },
    });

    if (existingProductionBOM) {
      throw new Error("ProductionBOM already exists for this production order");
    }

    // Get the product's BOM
    const productBOM = await prisma.bOM.findMany({
      where: { productId },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            costPerUnit: true,
            currentStock: true,
          },
        },
      },
    });

    if (productBOM.length === 0) {
      throw new Error("No BOM found for this product");
    }

    // Get production order details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      select: { quantity: true },
    });

    if (!productionOrder) {
      throw new Error("Production order not found");
    }

    // Create ProductionBOM entries from the product BOM
    const productionBOMEntries = productBOM.map((bomEntry) => {
      const baseQuantity =
        Number(bomEntry.quantityNeeded) * productionOrder.quantity;
      const wasteAmount =
        baseQuantity * (Number(bomEntry.wastePercentage) / 100);
      const totalQuantity = baseQuantity + wasteAmount;
      const unitCost = Number(bomEntry.material.costPerUnit);
      const totalCost = totalQuantity * unitCost;

      return {
        productionOrderId,
        materialId: bomEntry.materialId,
        originalBOMId: bomEntry.id,
        quantityNeeded: baseQuantity,
        wastePercentage: bomEntry.wastePercentage,
        unitCost,
        totalCost,
        createdBy: createdBy || session.user.id,
      };
    });

    // Create all ProductionBOM entries in a transaction
    const createdEntries = await prisma.$transaction(
      productionBOMEntries.map((entry) =>
        prisma.productionBOM.create({
          data: entry,
          include: {
            material: {
              include: {
                unitOfMeasure: true,
                type: true,
              },
            },
            originalBOM: true,
          },
        })
      )
    );

    // Update production order with calculated material cost
    const totalMaterialCost = productionBOMEntries.reduce(
      (sum, entry) => sum + Number(entry.totalCost),
      0
    );

    await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: { plannedMaterialCost: totalMaterialCost },
    });

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return {
      success: true,
      data: createdEntries,
      message: `Created ${createdEntries.length} ProductionBOM entries`,
    };
  } catch (error) {
    console.error("Error creating ProductionBOM:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create ProductionBOM",
    };
  }
}

// Get ProductionBOM for a specific production order
export async function getProductionBOM(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const productionBOM = await prisma.productionBOM.findMany({
      where: { productionOrderId },
      include: {
        material: {
          include: {
            unitOfMeasure: true,
            type: true,
          },
        },
        originalBOM: true,
      },
      orderBy: { material: { name: "asc" } },
    });

    return { success: true, data: productionBOM };
  } catch (error) {
    console.error("Error fetching ProductionBOM:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch ProductionBOM",
    };
  }
}

// Get ProductionBOM with enhanced display data
export async function getProductionBOMForDisplay(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const productionBOM = await prisma.productionBOM.findMany({
      where: { productionOrderId },
      include: {
        material: {
          include: {
            unitOfMeasure: true,
            type: true,
          },
        },
        originalBOM: true,
      },
      orderBy: { material: { name: "asc" } },
    });

    // Transform to display format with calculated fields
    const displayData: ProductionBOMForDisplay[] = productionBOM.map(
      (entry) => {
        const originalQuantity = entry.originalBOM
          ? Number(entry.originalBOM.quantityNeeded)
          : 0;
        const originalWastePercentage = entry.originalBOM
          ? Number(entry.originalBOM.wastePercentage)
          : 0;
        const originalTotalQuantity =
          originalQuantity + (originalQuantity * originalWastePercentage) / 100;

        const quantityNeeded = Number(entry.quantityNeeded);
        const wastePercentage = Number(entry.wastePercentage);
        const adjustedQuantity = entry.adjustedQuantity
          ? Number(entry.adjustedQuantity)
          : null;
        const finalQuantity = adjustedQuantity || quantityNeeded;
        const totalQuantityWithWaste =
          finalQuantity + (finalQuantity * wastePercentage) / 100;

        const unitCost = Number(entry.unitCost);
        const originalTotalCost = originalTotalQuantity * unitCost;
        const currentTotalCost = totalQuantityWithWaste * unitCost;
        const costVariance = currentTotalCost - originalTotalCost;

        const quantityVariance = finalQuantity - originalQuantity;
        const quantityVariancePercentage =
          originalQuantity > 0
            ? (quantityVariance / originalQuantity) * 100
            : 0;

        const currentStock = entry.material.currentStock;
        const stockShortage = currentStock - totalQuantityWithWaste;
        const isStockSufficient = stockShortage >= 0;

        return {
          id: entry.id,
          productionOrderId: entry.productionOrderId,
          materialId: entry.materialId,
          materialName: entry.material.name,
          materialSku: entry.material.sku,
          unitOfMeasure: entry.material.unitOfMeasure.symbol,
          materialType: entry.material.type.name,
          currentStock,
          minimumStockLevel: entry.material.minimumStockLevel,

          // Original BOM data
          originalQuantity,
          originalWastePercentage,
          originalTotalQuantity,

          // Production-specific data
          quantityNeeded,
          wastePercentage,
          adjustedQuantity,
          finalQuantity,
          totalQuantityWithWaste,

          // Cost data
          unitCost,
          originalTotalCost,
          currentTotalCost,
          costVariance,

          // Adjustment data
          isAdjusted: entry.isAdjusted,
          adjustmentReason: entry.adjustmentReason,
          quantityVariance,
          quantityVariancePercentage,

          // Stock availability
          isStockSufficient,
          stockShortage,

          // Timestamps
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        };
      }
    );

    return { success: true, data: displayData };
  } catch (error) {
    console.error("Error fetching ProductionBOM for display:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch ProductionBOM",
    };
  }
}

// Adjust ProductionBOM quantity
export async function adjustProductionBOMQuantity(
  input: AdjustProductionBOMInput
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { id, adjustedQuantity, adjustmentReason, modifiedBy } = input;

    // Get current entry to calculate new total cost
    const currentEntry = await prisma.productionBOM.findUnique({
      where: { id },
      select: {
        quantityNeeded: true,
        wastePercentage: true,
        unitCost: true,
        productionOrderId: true,
      },
    });

    if (!currentEntry) {
      throw new Error("ProductionBOM entry not found");
    }

    // Calculate new total cost with adjusted quantity
    const wasteAmount =
      adjustedQuantity * (Number(currentEntry.wastePercentage) / 100);
    const totalQuantity = adjustedQuantity + wasteAmount;
    const newTotalCost = totalQuantity * Number(currentEntry.unitCost);

    // Update the entry
    const updatedEntry = await prisma.productionBOM.update({
      where: { id },
      data: {
        adjustedQuantity,
        adjustmentReason,
        isAdjusted: true,
        totalCost: newTotalCost,
        modifiedBy: modifiedBy || session.user.id,
        updatedAt: new Date(),
      },
      include: {
        material: {
          include: {
            unitOfMeasure: true,
            type: true,
          },
        },
      },
    });

    // Recalculate production order material cost
    await updateProductionOrderMaterialCost(currentEntry.productionOrderId);

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${currentEntry.productionOrderId}`);

    return {
      success: true,
      data: updatedEntry,
      message: "ProductionBOM quantity adjusted successfully",
    };
  } catch (error) {
    console.error("Error adjusting ProductionBOM quantity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to adjust quantity",
    };
  }
}

// Bulk adjust ProductionBOM quantities
export async function bulkAdjustProductionBOM(
  input: BulkAdjustProductionBOMInput
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { productionOrderId, adjustments, modifiedBy } = input;

    // Perform bulk updates in a transaction
    const updates = await prisma.$transaction(
      adjustments.map(({ materialId, adjustedQuantity, adjustmentReason }) =>
        prisma.productionBOM.updateMany({
          where: {
            productionOrderId,
            materialId,
          },
          data: {
            adjustedQuantity,
            adjustmentReason,
            isAdjusted: true,
            modifiedBy: modifiedBy || session.user.id,
            updatedAt: new Date(),
          },
        })
      )
    );

    // Update total costs for adjusted entries
    const adjustedEntries = await prisma.productionBOM.findMany({
      where: {
        productionOrderId,
        isAdjusted: true,
      },
    });

    await prisma.$transaction(
      adjustedEntries.map((entry) => {
        const adjustedQty = Number(
          entry.adjustedQuantity || entry.quantityNeeded
        );
        const wasteAmount = adjustedQty * (Number(entry.wastePercentage) / 100);
        const totalQuantity = adjustedQty + wasteAmount;
        const newTotalCost = totalQuantity * Number(entry.unitCost);

        return prisma.productionBOM.update({
          where: { id: entry.id },
          data: { totalCost: newTotalCost },
        });
      })
    );

    // Recalculate production order material cost
    await updateProductionOrderMaterialCost(productionOrderId);

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return {
      success: true,
      data: updates,
      message: `Adjusted ${adjustments.length} ProductionBOM entries`,
    };
  } catch (error) {
    console.error("Error bulk adjusting ProductionBOM:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk adjust ProductionBOM",
    };
  }
}

// Get ProductionBOM summary with statistics
export async function getProductionBOMSummary(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const productionBOM = await prisma.productionBOM.findMany({
      where: { productionOrderId },
      include: {
        material: {
          include: {
            unitOfMeasure: true,
            type: true,
          },
        },
        originalBOM: true,
      },
    });

    // Calculate summary statistics
    const totalEntries = productionBOM.length;
    const totalAdjusted = productionBOM.filter(
      (entry) => entry.isAdjusted
    ).length;

    let originalTotalCost = 0;
    let adjustedTotalCost = 0;

    const entries: ProductionBOMForDisplay[] = productionBOM.map((entry) => {
      const originalQuantity = entry.originalBOM
        ? Number(entry.originalBOM.quantityNeeded)
        : Number(entry.quantityNeeded);
      const currentQuantity = entry.adjustedQuantity
        ? Number(entry.adjustedQuantity)
        : Number(entry.quantityNeeded);
      const unitCost = Number(entry.unitCost);

      originalTotalCost += originalQuantity * unitCost;
      adjustedTotalCost += Number(entry.totalCost);

      // Return simplified display data for summary
      return {
        id: entry.id,
        productionOrderId: entry.productionOrderId,
        materialId: entry.materialId,
        materialName: entry.material.name,
        materialSku: entry.material.sku,
        unitOfMeasure: entry.material.unitOfMeasure.symbol,
        materialType: entry.material.type.name,
        currentStock: entry.material.currentStock,
        minimumStockLevel: entry.material.minimumStockLevel,
        originalQuantity,
        originalWastePercentage: Number(
          entry.originalBOM?.wastePercentage || entry.wastePercentage
        ),
        originalTotalQuantity: originalQuantity,
        quantityNeeded: Number(entry.quantityNeeded),
        wastePercentage: Number(entry.wastePercentage),
        adjustedQuantity: entry.adjustedQuantity
          ? Number(entry.adjustedQuantity)
          : null,
        finalQuantity: currentQuantity,
        totalQuantityWithWaste:
          currentQuantity +
          (currentQuantity * Number(entry.wastePercentage)) / 100,
        unitCost,
        originalTotalCost: originalQuantity * unitCost,
        currentTotalCost: Number(entry.totalCost),
        costVariance: Number(entry.totalCost) - originalQuantity * unitCost,
        isAdjusted: entry.isAdjusted,
        adjustmentReason: entry.adjustmentReason,
        quantityVariance: currentQuantity - originalQuantity,
        quantityVariancePercentage:
          originalQuantity > 0
            ? ((currentQuantity - originalQuantity) / originalQuantity) * 100
            : 0,
        isStockSufficient: entry.material.currentStock >= currentQuantity,
        stockShortage: entry.material.currentStock - currentQuantity,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    });

    const costVariance = adjustedTotalCost - originalTotalCost;
    const costVariancePercentage =
      originalTotalCost > 0 ? (costVariance / originalTotalCost) * 100 : 0;

    const summary: ProductionBOMSummary = {
      productionOrderId,
      totalEntries,
      totalAdjusted,
      originalTotalCost,
      adjustedTotalCost,
      costVariance,
      costVariancePercentage,
      entries,
    };

    return { success: true, data: summary };
  } catch (error) {
    console.error("Error fetching ProductionBOM summary:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch ProductionBOM summary",
    };
  }
}

// Helper function to update production order material cost
async function updateProductionOrderMaterialCost(productionOrderId: string) {
  const productionBOM = await prisma.productionBOM.findMany({
    where: { productionOrderId },
    select: { totalCost: true },
  });

  const totalMaterialCost = productionBOM.reduce(
    (sum, entry) => sum + Number(entry.totalCost),
    0
  );

  await prisma.productionOrder.update({
    where: { id: productionOrderId },
    data: {
      plannedMaterialCost: totalMaterialCost,
      materialVariance: totalMaterialCost, // This will be updated with actual costs later
    },
  });
}

// Delete ProductionBOM (reset to product BOM)
export async function deleteProductionBOM(productionOrderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Delete all ProductionBOM entries for this production order
    await prisma.productionBOM.deleteMany({
      where: { productionOrderId },
    });

    // Reset production order material cost
    await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        plannedMaterialCost: 0,
        materialVariance: 0,
      },
    });

    revalidatePath("/admin/production");
    revalidatePath(`/admin/production/${productionOrderId}`);

    return {
      success: true,
      message: "ProductionBOM deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting ProductionBOM:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete ProductionBOM",
    };
  }
}
