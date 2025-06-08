"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CreateProductVariantInput,
  CreateProductVariantBOMInput,
  BulkCreateVariantsInput,
  ProductVariantForDisplay,
  VariantStatsResponse,
  VariantAPIResponse,
} from "@/types/admin/product-variants";

// =============================================
// PRODUCT VARIANT CREATION
// =============================================

export async function createProductVariant(
  data: CreateProductVariantInput
): Promise<VariantAPIResponse> {
  try {
    const sku = await generateVariantSKU(
      data.productId,
      data.sizeName,
      data.colorName
    );

    const variant = await prisma.productVariant.create({
      data: {
        ...data,
        sku,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${data.productId}`);

    return {
      success: true,
      data: variant,
      message: "Product variant created successfully",
    };
  } catch (error: any) {
    console.error("Error creating product variant:", error);
    return {
      success: false,
      message: "Failed to create product variant",
      errors: [error.message],
    };
  }
}

export async function bulkCreateVariants(
  data: BulkCreateVariantsInput
): Promise<VariantAPIResponse> {
  try {
    const variants = [];

    // Create variant for each size + color combination
    for (const size of data.sizes) {
      for (const color of data.colors) {
        const sku = await generateVariantSKU(
          data.productId,
          size.sizeName,
          color.colorName
        );
        const displayName = `${size.sizeName} ${color.colorName}`;

        const variant = await prisma.productVariant.create({
          data: {
            productId: data.productId,
            sku,
            sizeName: size.sizeName,
            sizeCode: size.sizeCode,
            colorName: color.colorName,
            colorCode: color.colorCode,
            unitCost: size.unitCost,
            sellingPrice: size.sellingPrice,
            displayName,
            sortOrder: size.sortOrder,
            minimumStockLevel: 0,
            currentStock: 0,
            expectedStock: 0,
            committedStock: 0,
          },
        });

        // Create BOMs if base materials provided
        if (data.baseMaterials && data.baseMaterials.length > 0) {
          await createVariantBOMs(variant.id, data.baseMaterials);
        }

        variants.push(variant);
      }
    }

    // Update product to indicate it has variants
    await prisma.product.update({
      where: { id: data.productId },
      data: { hasVariants: true },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${data.productId}`);

    return {
      success: true,
      variants,
      message: `Successfully created ${variants.length} product variants`,
    };
  } catch (error: any) {
    console.error("Error bulk creating variants:", error);
    return {
      success: false,
      message: "Failed to create product variants",
      errors: [error.message],
    };
  }
}

// =============================================
// BOM MANAGEMENT
// =============================================

export async function createProductVariantBOM(
  data: CreateProductVariantBOMInput
): Promise<VariantAPIResponse> {
  try {
    const bomEntry = await prisma.productVariantBOM.create({
      data,
      include: {
        material: true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/product-variants/${data.productVariantId}`);

    return {
      success: true,
      data: bomEntry,
      message: "BOM entry created successfully",
    };
  } catch (error: any) {
    console.error("Error creating variant BOM:", error);
    return {
      success: false,
      message: "Failed to create BOM entry",
      errors: [error.message],
    };
  }
}

export async function updateProductVariantBOM(
  bomId: string,
  data: Partial<CreateProductVariantBOMInput>
): Promise<VariantAPIResponse> {
  try {
    const bomEntry = await prisma.productVariantBOM.update({
      where: { id: bomId },
      data,
      include: {
        material: true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/product-variants/${bomEntry.productVariantId}`);

    return {
      success: true,
      data: bomEntry,
      message: "BOM entry updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating variant BOM:", error);
    return {
      success: false,
      message: "Failed to update BOM entry",
      errors: [error.message],
    };
  }
}

export async function deleteProductVariantBOM(
  bomId: string
): Promise<VariantAPIResponse> {
  try {
    const bomEntry = await prisma.productVariantBOM.findUnique({
      where: { id: bomId },
    });

    if (!bomEntry) {
      return {
        success: false,
        message: "BOM entry not found",
      };
    }

    await prisma.productVariantBOM.delete({
      where: { id: bomId },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/product-variants/${bomEntry.productVariantId}`);

    return {
      success: true,
      message: "BOM entry deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting variant BOM:", error);
    return {
      success: false,
      message: "Failed to delete BOM entry",
      errors: [error.message],
    };
  }
}

// =============================================
// VARIANT RETRIEVAL
// =============================================

export async function getProductVariants(productId: string) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        isActive: true,
      },
      include: {
        boms: {
          include: {
            material: true,
          },
        },
        product: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { sizeName: "asc" },
        { colorName: "asc" },
      ],
    });

    return variants;
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}

export async function getProductVariantForDisplay(
  variantId: string
): Promise<ProductVariantForDisplay | null> {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        boms: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!variant) return null;

    // Calculate total material cost and format for display
    const bomsForDisplay = variant.boms.map((bom) => ({
      id: bom.id,
      materialId: bom.materialId,
      materialName: bom.material.name,
      materialSku: bom.material.sku,
      quantityNeeded: Number(bom.quantityNeeded),
      wastePercentage: Number(bom.wastePercentage),
      unitCost: Number(bom.material.costPerUnit),
      totalCost: Number(bom.quantityNeeded) * Number(bom.material.costPerUnit),
      notes: bom.notes,
    }));

    const totalMaterialCost = bomsForDisplay.reduce(
      (sum, bom) => sum + bom.totalCost,
      0
    );
    const availableStock = variant.currentStock - variant.committedStock;

    let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    if (availableStock <= 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (availableStock <= variant.minimumStockLevel) {
      stockStatus = "LOW_STOCK";
    } else {
      stockStatus = "IN_STOCK";
    }

    return {
      ...variant,
      unitCost: Number(variant.unitCost),
      sellingPrice: Number(variant.sellingPrice),
      boms: bomsForDisplay,
      totalMaterialCost,
      availableStock,
      stockStatus,
    };
  } catch (error) {
    console.error("Error fetching variant for display:", error);
    return null;
  }
}

export async function getVariantMatrix(productId: string) {
  try {
    const [product, variants] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true },
      }),
      prisma.productVariant.findMany({
        where: {
          productId,
          isActive: true,
        },
        include: {
          boms: {
            include: {
              material: true,
            },
          },
        },
      }),
    ]);

    if (!product) return null;

    // Extract unique sizes and colors
    const sizes = [
      ...new Set(variants.map((v) => v.sizeName).filter(Boolean)),
    ].sort();
    const colors = [
      ...new Set(variants.map((v) => v.colorName).filter(Boolean)),
    ].sort();

    // Build variant matrix
    const variantMap: any = {};

    for (const variant of variants) {
      const key = `${variant.sizeName || "default"}-${variant.colorName || "default"}`;
      const totalCost = variant.boms.reduce(
        (sum, bom) =>
          sum + Number(bom.quantityNeeded) * Number(bom.material.costPerUnit),
        0
      );

      let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
      const availableStock = variant.currentStock - variant.committedStock;

      if (availableStock <= 0) {
        stockStatus = "OUT_OF_STOCK";
      } else if (availableStock <= variant.minimumStockLevel) {
        stockStatus = "LOW_STOCK";
      } else {
        stockStatus = "IN_STOCK";
      }

      variantMap[key] = {
        variant,
        hasBOM: variant.boms.length > 0,
        totalCost,
        stockStatus,
      };
    }

    return {
      productId: product.id,
      productName: product.name,
      sizes,
      colors,
      variants: variantMap,
    };
  } catch (error) {
    console.error("Error fetching variant matrix:", error);
    return null;
  }
}

// =============================================
// VARIANT STATISTICS
// =============================================

export async function getVariantStats(
  productId?: string
): Promise<VariantStatsResponse> {
  try {
    const whereClause = productId ? { productId } : {};

    const [
      totalVariants,
      activeVariants,
      variantsWithBOM,
      lowStockVariants,
      outOfStockVariants,
      variants,
    ] = await Promise.all([
      prisma.productVariant.count({ where: whereClause }),
      prisma.productVariant.count({
        where: { ...whereClause, isActive: true },
      }),
      prisma.productVariant.count({
        where: {
          ...whereClause,
          boms: { some: {} },
        },
      }),
      prisma.productVariant.count({
        where: {
          ...whereClause,
          currentStock: { lte: prisma.productVariant.fields.minimumStockLevel },
          currentStock: { gt: 0 },
        },
      }),
      prisma.productVariant.count({
        where: {
          ...whereClause,
          currentStock: { lte: 0 },
        },
      }),
      prisma.productVariant.findMany({
        where: whereClause,
        select: {
          currentStock: true,
          unitCost: true,
        },
      }),
    ]);

    const totalValue = variants.reduce(
      (sum, variant) => sum + variant.currentStock * Number(variant.unitCost),
      0
    );

    return {
      totalVariants,
      activeVariants,
      variantsWithBOM,
      lowStockVariants,
      outOfStockVariants,
      totalValue,
    };
  } catch (error) {
    console.error("Error fetching variant stats:", error);
    return {
      totalVariants: 0,
      activeVariants: 0,
      variantsWithBOM: 0,
      lowStockVariants: 0,
      outOfStockVariants: 0,
      totalValue: 0,
    };
  }
}

// =============================================
// VARIANT MANAGEMENT
// =============================================

export async function updateProductVariant(
  variantId: string,
  data: Partial<CreateProductVariantInput>
): Promise<VariantAPIResponse> {
  try {
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/product-variants/${variantId}`);

    return {
      success: true,
      data: variant,
      message: "Product variant updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating product variant:", error);
    return {
      success: false,
      message: "Failed to update product variant",
      errors: [error.message],
    };
  }
}

export async function deleteProductVariant(
  variantId: string
): Promise<VariantAPIResponse> {
  try {
    // First delete all BOMs
    await prisma.productVariantBOM.deleteMany({
      where: { productVariantId: variantId },
    });

    // Then delete the variant
    const variant = await prisma.productVariant.delete({
      where: { id: variantId },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${variant.productId}`);

    return {
      success: true,
      message: "Product variant deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting product variant:", error);
    return {
      success: false,
      message: "Failed to delete product variant",
      errors: [error.message],
    };
  }
}

export async function adjustVariantStock(
  variantId: string,
  adjustment: number,
  reason?: string
): Promise<VariantAPIResponse> {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return {
        success: false,
        message: "Product variant not found",
      };
    }

    const newStock = Math.max(0, variant.currentStock + adjustment);

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        currentStock: newStock,
        updatedAt: new Date(),
      },
    });

    // TODO: Create inventory movement record for audit trail
    // This would be part of the full inventory management system

    revalidatePath("/admin/products");
    revalidatePath(`/admin/product-variants/${variantId}`);

    return {
      success: true,
      data: updatedVariant,
      message: `Stock adjusted by ${adjustment}. New stock: ${newStock}`,
    };
  } catch (error: any) {
    console.error("Error adjusting variant stock:", error);
    return {
      success: false,
      message: "Failed to adjust stock",
      errors: [error.message],
    };
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

async function generateVariantSKU(
  productId: string,
  sizeName?: string | null,
  colorName?: string | null
): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sku: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  let sku = product.sku;

  if (sizeName) {
    sku += `-${sizeName.toUpperCase()}`;
  }

  if (colorName) {
    sku += `-${colorName.toUpperCase().replace(/\s+/g, "")}`;
  }

  // Ensure uniqueness
  let counter = 1;
  let finalSku = sku;

  while (await prisma.productVariant.findUnique({ where: { sku: finalSku } })) {
    finalSku = `${sku}-${counter}`;
    counter++;
  }

  return finalSku;
}

async function createVariantBOMs(
  variantId: string,
  materials: {
    materialId: string;
    quantityNeeded: number;
    wastePercentage: number;
  }[]
): Promise<void> {
  for (const material of materials) {
    await prisma.productVariantBOM.create({
      data: {
        productVariantId: variantId,
        materialId: material.materialId,
        quantityNeeded: material.quantityNeeded,
        wastePercentage: material.wastePercentage,
      },
    });
  }
}

// =============================================
// MIGRATION HELPERS
// =============================================

export async function migrateProductSizeVariantsToVariants(productId?: string) {
  try {
    const whereClause = productId ? { productId } : {};

    const sizeVariants = await prisma.productSizeVariant.findMany({
      where: {
        ...whereClause,
        isDeprecated: false,
      },
      include: {
        boms: true,
      },
    });

    for (const sizeVariant of sizeVariants) {
      // Create new ProductVariant
      const variant = await prisma.productVariant.create({
        data: {
          productId: sizeVariant.productId,
          sku: `${sizeVariant.productId}-${sizeVariant.sizeName}`,
          sizeName: sizeVariant.sizeName,
          sizeCode: sizeVariant.sizeCode,
          unitCost: sizeVariant.unitCost,
          sellingPrice: sizeVariant.sellingPrice,
          currentStock: sizeVariant.currentStock,
          minimumStockLevel: sizeVariant.minimumStockLevel,
          displayName: sizeVariant.sizeName,
          sortOrder: sizeVariant.sortOrder,
          isActive: sizeVariant.isActive,
        },
      });

      // Migrate BOMs
      for (const bom of sizeVariant.boms) {
        await prisma.productVariantBOM.create({
          data: {
            productVariantId: variant.id,
            materialId: bom.materialId,
            quantityNeeded: bom.quantityNeeded,
            wastePercentage: bom.wastePercentage,
          },
        });
      }

      // Mark old records as deprecated
      await prisma.productSizeVariant.update({
        where: { id: sizeVariant.id },
        data: { isDeprecated: true },
      });

      await prisma.productSizeVariantBOM.updateMany({
        where: { productSizeVariantId: sizeVariant.id },
        data: { isDeprecated: true },
      });
    }

    return {
      success: true,
      migratedCount: sizeVariants.length,
    };
  } catch (error) {
    console.error("Error migrating size variants:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
