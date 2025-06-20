"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { convertDecimals } from "@/lib/convertDecimals";
import {
  BulkVariantCreationRequest,
  BulkVariantCreationResult,
  GroupedProductForDisplay,
} from "@/types/admin/product-variants";

// =============================================
// ENHANCED BULK VARIANT CREATION WITH BOM INHERITANCE
// =============================================

export async function createBulkProductVariants(
  request: BulkVariantCreationRequest
): Promise<BulkVariantCreationResult> {
  try {
    // Get base product with its BOMs
    const baseProduct = await prisma.product.findUnique({
      where: { id: request.productId },
      include: {
        boms: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!baseProduct) {
      return {
        success: false,
        createdVariants: [],
        createdBOMs: 0,
        skippedVariants: [],
        totalCreated: 0,
        message: "Base product not found",
        errors: ["Product not found"],
      };
    }

    const createdVariants: any[] = [];
    const skippedVariants: any[] = [];
    let totalBOMsCreated = 0;

    // Create variants for each size + color combination
    for (const size of request.sizes) {
      for (const color of request.colors) {
        try {
          // Generate unique SKU
          const sku = `${baseProduct.sku}-${size.code}-${color.code}`;

          // Check if variant already exists
          const existingVariant = await prisma.productVariant.findUnique({
            where: { sku },
          });

          if (existingVariant) {
            skippedVariants.push({
              sizeName: size.name,
              colorName: color.name,
              reason: "Variant with this SKU already exists",
            });
            continue;
          }

          // Calculate variant pricing
          const sizeModifier = size.priceModifier ?? 1;
          const colorModifier = color.priceModifier ?? 1;
          const sizeCostModifier = size.costModifier ?? 1;
          const colorCostModifier = color.costModifier ?? 1;

          const variantCost =
            Number(baseProduct.unitCost) * sizeCostModifier * colorCostModifier;
          const variantPrice =
            Number(baseProduct.sellingPrice) * sizeModifier * colorModifier;

          // Create variant
          const variant = await prisma.productVariant.create({
            data: {
              productId: request.productId,
              sku,
              sizeName: size.name,
              sizeCode: size.code,
              colorName: color.name,
              colorCode: color.code,
              displayName: `${size.name} ${color.name}`,
              unitCost: new Decimal(variantCost),
              sellingPrice: new Decimal(variantPrice),
              minimumStockLevel: request.baseSettings.minimumStockLevel,
              currentStock: request.baseSettings.initialStock ?? 0,
              sortOrder: size.sortOrder ?? 0,
            },
          });

          // Create variant-specific BOMs if inheritance is enabled
          if (request.inheritBOM && baseProduct.boms.length > 0) {
            const bomCount = await createVariantBOMsFromParent(
              variant.id,
              baseProduct.boms,
              size.name,
              color.name,
              request.bomModifications
            );
            totalBOMsCreated += bomCount;
          }

          createdVariants.push(variant);
        } catch (error: any) {
          console.error(
            `Error creating variant ${size.name} ${color.name}:`,
            error
          );
          skippedVariants.push({
            sizeName: size.name,
            colorName: color.name,
            reason: error.message,
          });
        }
      }
    }

    // Update product to indicate it has variants
    if (createdVariants.length > 0) {
      await prisma.product.update({
        where: { id: request.productId },
        data: { hasVariants: true },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${request.productId}`);

    return {
      success: true,
      createdVariants: convertDecimals(createdVariants),
      createdBOMs: totalBOMsCreated,
      skippedVariants,
      totalCreated: createdVariants.length,
      message: `Successfully created ${createdVariants.length} variants with ${totalBOMsCreated} BOM entries`,
    };
  } catch (error: any) {
    console.error("Error in bulk variant creation:", error);
    return {
      success: false,
      createdVariants: [],
      createdBOMs: 0,
      skippedVariants: [],
      totalCreated: 0,
      message: "Failed to create variants",
      errors: [error.message],
    };
  }
}

// =============================================
// BOM INHERITANCE FUNCTIONALITY
// =============================================

async function createVariantBOMsFromParent(
  variantId: string,
  parentBOMs: any[],
  sizeName: string,
  colorName: string,
  bomModifications?: BulkVariantCreationRequest["bomModifications"]
): Promise<number> {
  let createdCount = 0;

  for (const parentBOM of parentBOMs) {
    try {
      let adjustedQuantity = Number(parentBOM.quantityNeeded);
      const wastePercentage = Number(parentBOM.wastePercentage);

      // Apply BOM modifications if provided
      if (bomModifications) {
        const modification = bomModifications.find(
          (mod) => mod.materialId === parentBOM.materialId
        );

        if (modification) {
          // Apply general quantity modifier
          adjustedQuantity *= modification.quantityModifier;

          // Apply size-specific modifiers
          if (modification.sizeSpecific?.[sizeName]) {
            adjustedQuantity *= modification.sizeSpecific[sizeName];
          }

          // Handle color-specific material substitutions
          if (modification.colorSpecific?.[colorName]) {
            const substituteMaterialId = modification.colorSpecific[colorName];
            // Use substitute material if different from original
            if (substituteMaterialId !== parentBOM.materialId) {
              parentBOM.materialId = substituteMaterialId;
            }
          }
        }
      }

      // Create variant BOM entry
      await prisma.productVariantBOM.create({
        data: {
          productVariantId: variantId,
          materialId: parentBOM.materialId,
          quantityNeeded: new Decimal(adjustedQuantity),
          wastePercentage: new Decimal(wastePercentage),
          notes: `Inherited from parent product (${sizeName} ${colorName})`,
        },
      });

      createdCount++;
    } catch (error: any) {
      console.error(`Error creating BOM for variant ${variantId}:`, error);
    }
  }

  return createdCount;
}

// =============================================
// GROUPED PRODUCT DISPLAY
// =============================================

export async function getGroupedProductsWithVariants(): Promise<
  GroupedProductForDisplay[]
> {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          include: {
            boms: {
              include: {
                material: true,
              },
            },
          },
        },
      },
      orderBy: [{ hasVariants: "desc" }, { name: "asc" }],
    });

    return products.map((product) => {
      const variants = product.variants.map((variant) => {
        const totalMaterialCost = variant.boms.reduce(
          (sum, bom) =>
            sum + Number(bom.quantityNeeded) * Number(bom.material.costPerUnit),
          0
        );

        return {
          id: variant.id,
          productId: variant.productId,
          sku: variant.sku,
          sizeName: variant.sizeName,
          sizeCode: variant.sizeCode,
          colorName: variant.colorName,
          colorCode: variant.colorCode,
          styleName: variant.styleName,
          materialName: variant.materialName,
          unitCost: Number(variant.unitCost),
          sellingPrice: Number(variant.sellingPrice),
          currentStock: variant.currentStock,
          minimumStockLevel: variant.minimumStockLevel,
          expectedStock: variant.expectedStock,
          committedStock: variant.committedStock,
          displayName: variant.displayName,
          isActive: variant.isActive,
          sortOrder: variant.sortOrder,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
          createdBy: variant.createdBy,
          modifiedBy: variant.modifiedBy,
          boms: variant.boms.map((bom) => ({
            id: bom.id,
            materialId: bom.materialId,
            materialName: bom.material.name,
            materialSku: bom.material.sku,
            quantityNeeded: Number(bom.quantityNeeded),
            wastePercentage: Number(bom.wastePercentage),
            unitCost: Number(bom.material.costPerUnit),
            totalCost:
              Number(bom.quantityNeeded) * Number(bom.material.costPerUnit),
            notes: bom.notes,
          })),
          totalMaterialCost,
          availableStock: variant.currentStock - variant.committedStock,
          stockStatus:
            variant.currentStock <= 0
              ? ("OUT_OF_STOCK" as const)
              : variant.currentStock <= variant.minimumStockLevel
                ? ("LOW_STOCK" as const)
                : ("IN_STOCK" as const),
        };
      });

      const totalStock = variants.reduce((sum, v) => sum + v.currentStock, 0);
      const totalValue = variants.reduce(
        (sum, v) => sum + v.currentStock * v.unitCost,
        0
      );
      const lowStockVariants = variants.filter(
        (v) => v.stockStatus === "LOW_STOCK" || v.stockStatus === "OUT_OF_STOCK"
      ).length;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description ?? undefined,
        hasVariants: product.hasVariants,
        variantCount: variants.length,
        totalStock,
        totalValue,
        lowStockVariants,
        category: {
          id: product.category.id,
          name: product.category.name,
        },
        variants,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });
  } catch (error: any) {
    console.error("Error fetching grouped products:", error);
    return [];
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export async function getProductBOMsForInheritance(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        boms: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!product) return null;

    return {
      productId: product.id,
      productName: product.name,
      boms: product.boms.map((bom) => ({
        id: bom.id,
        materialId: bom.materialId,
        materialName: bom.material.name,
        materialSku: bom.material.sku,
        quantityNeeded: Number(bom.quantityNeeded),
        wastePercentage: Number(bom.wastePercentage),
        unitCost: Number(bom.material.costPerUnit),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching product BOMs:", error);
    return null;
  }
}
