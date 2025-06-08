"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Fetches variant-specific BOM entries for a product variant
 */
export async function getVariantBOM(variantId: string) {
  try {
    const bomEntries = await prisma.productVariantBOM.findMany({
      where: {
        productVariantId: variantId,
      },
      include: {
        material: {
          include: {
            unitOfMeasure: true,
            type: true,
          },
        },
      },
      orderBy: {
        material: {
          name: "asc",
        },
      },
    });

    return bomEntries.map((entry) => ({
      id: entry.id,
      productVariantId: entry.productVariantId,
      materialId: entry.materialId,
      quantityNeeded: Number(entry.quantityNeeded),
      wastePercentage: Number(entry.wastePercentage),
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      material: {
        id: entry.material.id,
        name: entry.material.name,
        sku: entry.material.sku,
        costPerUnit: Number(entry.material.costPerUnit),
        currentStock: entry.material.currentStock,
        minimumStockLevel: entry.material.minimumStockLevel,
        unitOfMeasure: {
          symbol: entry.material.unitOfMeasure.symbol,
          name: entry.material.unitOfMeasure.name,
        },
        type: {
          name: entry.material.type.name,
        },
      },
    }));
  } catch (error) {
    console.error("Error fetching variant BOM:", error);
    throw new Error("Failed to fetch variant bill of materials");
  }
}

/**
 * Gets combined BOM for a variant (base BOM + variant overrides)
 */
export async function getCombinedVariantBOM(variantId: string) {
  try {
    // Get the variant to find the product
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true, displayName: true },
    });

    if (!variant) {
      throw new Error("Product variant not found");
    }

    // Get base product BOM
    const baseBOM = await prisma.bOM.findMany({
      where: { productId: variant.productId },
      include: {
        material: {
          include: {
            unitOfMeasure: true,
            type: true,
          },
        },
      },
    });

    // Get variant-specific BOM
    const variantBOM = await getVariantBOM(variantId);

    // Combine BOMs (variant overrides base)
    const combinedBOM = [...baseBOM];
    const variantMaterialIds = new Set(variantBOM.map((v) => v.materialId));

    // Add/override with variant-specific entries
    variantBOM.forEach((variantEntry) => {
      const existingIndex = combinedBOM.findIndex(
        (baseEntry) => baseEntry.materialId === variantEntry.materialId
      );

      if (existingIndex >= 0) {
        // Override base entry with variant-specific data
        combinedBOM[existingIndex] = {
          ...combinedBOM[existingIndex],
          quantityNeeded: variantEntry.quantityNeeded,
          wastePercentage: variantEntry.wastePercentage,
          notes: variantEntry.notes,
          isVariantSpecific: true,
        } as any;
      } else {
        // Add new variant-specific material
        combinedBOM.push({
          id: variantEntry.id,
          productId: variant.productId,
          materialId: variantEntry.materialId,
          quantityNeeded: variantEntry.quantityNeeded,
          wastePercentage: variantEntry.wastePercentage,
          material: variantEntry.material,
          isVariantSpecific: true,
        } as any);
      }
    });

    // Calculate total cost
    const totalCost = combinedBOM.reduce((total, entry) => {
      const materialCost = Number(entry.material.costPerUnit);
      const quantity = Number(entry.quantityNeeded);
      const waste = Number(entry.wastePercentage);
      const totalQuantity = quantity * (1 + waste / 100);
      return total + materialCost * totalQuantity;
    }, 0);

    return {
      variantId,
      variantName: variant.displayName,
      entries: combinedBOM,
      totalMaterialCost: totalCost,
      baseMaterialCount: baseBOM.length,
      variantMaterialCount: variantBOM.length,
      hasVariantOverrides: variantBOM.length > 0,
    };
  } catch (error) {
    console.error("Error fetching combined variant BOM:", error);
    throw new Error("Failed to fetch combined variant BOM");
  }
}

/**
 * Copies base product BOM to a variant with optional quantity adjustments
 */
export async function copyBaseBOMToVariant(
  variantId: string,
  adjustments?: {
    [materialId: string]: { quantityNeeded?: number; wastePercentage?: number };
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get the variant to find the product
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true, displayName: true },
    });

    if (!variant) {
      throw new Error("Product variant not found");
    }

    // Get base product BOM
    const baseBOM = await prisma.bOM.findMany({
      where: { productId: variant.productId },
    });

    if (baseBOM.length === 0) {
      throw new Error("No base BOM found to copy");
    }

    // Delete existing variant BOM entries
    await prisma.productVariantBOM.deleteMany({
      where: { productVariantId: variantId },
    });

    // Create variant BOM entries
    const createdEntries = [];
    for (const baseEntry of baseBOM) {
      const adjustment = adjustments?.[baseEntry.materialId];

      const entry = await prisma.productVariantBOM.create({
        data: {
          productVariantId: variantId,
          materialId: baseEntry.materialId,
          quantityNeeded:
            adjustment?.quantityNeeded ?? baseEntry.quantityNeeded,
          wastePercentage:
            adjustment?.wastePercentage ?? baseEntry.wastePercentage,
          notes: `Copied from base product BOM${adjustment ? " with adjustments" : ""}`,
          createdBy: session.user.id,
        },
        include: {
          material: {
            include: {
              unitOfMeasure: true,
            },
          },
        },
      });

      createdEntries.push(entry);
    }

    revalidatePath(`/admin/products/${variant.productId}`);

    return {
      success: true,
      message: `Copied ${createdEntries.length} materials to ${variant.displayName}`,
      entriesCreated: createdEntries.length,
    };
  } catch (error) {
    console.error("Error copying base BOM to variant:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to copy base BOM to variant");
  }
}

/**
 * Updates a variant BOM entry
 */
export async function updateVariantBOMEntry(
  entryId: string,
  data: {
    quantityNeeded?: number;
    wastePercentage?: number;
    notes?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const entry = await prisma.productVariantBOM.update({
      where: { id: entryId },
      data: {
        ...data,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        productVariant: {
          select: { productId: true },
        },
        material: {
          include: {
            unitOfMeasure: true,
          },
        },
      },
    });

    revalidatePath(`/admin/products/${entry.productVariant.productId}`);

    return entry;
  } catch (error) {
    console.error("Error updating variant BOM entry:", error);
    throw new Error("Failed to update variant BOM entry");
  }
}

/**
 * Deletes a variant BOM entry
 */
export async function deleteVariantBOMEntry(entryId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const entry = await prisma.productVariantBOM.findUnique({
      where: { id: entryId },
      include: {
        productVariant: {
          select: { productId: true },
        },
      },
    });

    if (!entry) {
      throw new Error("Variant BOM entry not found");
    }

    await prisma.productVariantBOM.delete({
      where: { id: entryId },
    });

    revalidatePath(`/admin/products/${entry.productVariant.productId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting variant BOM entry:", error);
    throw new Error("Failed to delete variant BOM entry");
  }
}

/**
 * Gets BOM comparison between base product and variant
 */
export async function getBOMComparison(variantId: string) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true, displayName: true },
    });

    if (!variant) {
      throw new Error("Product variant not found");
    }

    const [baseBOM, variantBOM] = await Promise.all([
      prisma.bOM.findMany({
        where: { productId: variant.productId },
        include: {
          material: {
            include: { unitOfMeasure: true },
          },
        },
      }),
      getVariantBOM(variantId),
    ]);

    const comparison = {
      baseBOM: baseBOM.map((entry) => ({
        materialId: entry.materialId,
        materialName: entry.material.name,
        quantityNeeded: Number(entry.quantityNeeded),
        wastePercentage: Number(entry.wastePercentage),
        unitCost: Number(entry.material.costPerUnit),
        totalCost:
          Number(entry.quantityNeeded) *
          Number(entry.material.costPerUnit) *
          (1 + Number(entry.wastePercentage) / 100),
      })),
      variantBOM: variantBOM.map((entry) => ({
        materialId: entry.materialId,
        materialName: entry.material.name,
        quantityNeeded: entry.quantityNeeded,
        wastePercentage: entry.wastePercentage,
        unitCost: entry.material.costPerUnit,
        totalCost:
          entry.quantityNeeded *
          entry.material.costPerUnit *
          (1 + entry.wastePercentage / 100),
      })),
      differences: [] as any[],
    };

    // Calculate differences
    const allMaterialIds = new Set([
      ...comparison.baseBOM.map((b) => b.materialId),
      ...comparison.variantBOM.map((v) => v.materialId),
    ]);

    allMaterialIds.forEach((materialId) => {
      const baseEntry = comparison.baseBOM.find(
        (b) => b.materialId === materialId
      );
      const variantEntry = comparison.variantBOM.find(
        (v) => v.materialId === materialId
      );

      if (!baseEntry && variantEntry) {
        comparison.differences.push({
          materialId,
          materialName: variantEntry.materialName,
          type: "ADDED",
          variantQuantity: variantEntry.quantityNeeded,
          costDifference: variantEntry.totalCost,
        });
      } else if (baseEntry && !variantEntry) {
        comparison.differences.push({
          materialId,
          materialName: baseEntry.materialName,
          type: "REMOVED",
          baseQuantity: baseEntry.quantityNeeded,
          costDifference: -baseEntry.totalCost,
        });
      } else if (baseEntry && variantEntry) {
        if (
          baseEntry.quantityNeeded !== variantEntry.quantityNeeded ||
          baseEntry.wastePercentage !== variantEntry.wastePercentage
        ) {
          comparison.differences.push({
            materialId,
            materialName: baseEntry.materialName,
            type: "MODIFIED",
            baseQuantity: baseEntry.quantityNeeded,
            variantQuantity: variantEntry.quantityNeeded,
            baseWaste: baseEntry.wastePercentage,
            variantWaste: variantEntry.wastePercentage,
            costDifference: variantEntry.totalCost - baseEntry.totalCost,
          });
        }
      }
    });

    return comparison;
  } catch (error) {
    console.error("Error getting BOM comparison:", error);
    throw new Error("Failed to get BOM comparison");
  }
}
