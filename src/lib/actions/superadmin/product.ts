"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { Status } from "@prisma/client";

/**
 * Ensure user has SUPER_ADMIN role
 */
async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized - no active session");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden - SUPER_ADMIN role required");
  }

  return session;
}

/**
 * Get all products across all tenants with advanced filtering
 */
export async function getAllProductsSuperadmin(filters?: {
  search?: string;
  categoryId?: string;
  status?: Status;
  hasVariants?: boolean;
  minStock?: number;
  maxStock?: number;
}) {
  const session = await ensureSuperAdmin();

  try {
    const where: any = {
      archivedAt: null, // Only non-archived by default
    };

    // Search filter
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // Status filter
    if (filters?.status) {
      where.status = filters.status;
    }

    // Has variants filter
    if (filters?.hasVariants !== undefined) {
      where.hasVariants = filters.hasVariants;
    }

    // Stock range filter
    if (filters?.minStock !== undefined || filters?.maxStock !== undefined) {
      where.currentStock = {};
      if (filters.minStock !== undefined) where.currentStock.gte = new Decimal(filters.minStock);
      if (filters.maxStock !== undefined) where.currentStock.lte = new Decimal(filters.maxStock);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            displayName: true,
            currentStock: true,
            sellingPrice: true,
            unitCost: true,
            sizeName: true,
            colorName: true,
            styleName: true,
            boms: {
              include: {
                material: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
            _count: {
              select: {
                boms: true,
              },
            },
          },
        },
        boms: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        _count: {
          select: {
            variants: true,
            boms: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Serialize Decimals
    return products.map(product => ({
      ...product,
      unitCost: product.unitCost instanceof Decimal ? product.unitCost.toNumber() : Number(product.unitCost || 0),
      sellingPrice: product.sellingPrice instanceof Decimal ? product.sellingPrice.toNumber() : Number(product.sellingPrice || 0),
      currentStock: product.currentStock instanceof Decimal ? product.currentStock.toNumber() : Number(product.currentStock || 0),
      expectedStock: product.expectedStock instanceof Decimal ? product.expectedStock.toNumber() : Number(product.expectedStock || 0),
      committedStock: product.committedStock instanceof Decimal ? product.committedStock.toNumber() : Number(product.committedStock || 0),
      minimumStockLevel: product.minimumStockLevel instanceof Decimal ? product.minimumStockLevel.toNumber() : Number(product.minimumStockLevel || 0),
      variants: product.variants.map(v => ({
        ...v,
        currentStock: v.currentStock instanceof Decimal ? v.currentStock.toNumber() : Number(v.currentStock || 0),
        sellingPrice: v.sellingPrice instanceof Decimal ? v.sellingPrice.toNumber() : Number(v.sellingPrice || 0),
        unitCost: v.unitCost instanceof Decimal ? v.unitCost.toNumber() : Number(v.unitCost || 0),
        boms: v.boms?.map(b => ({
          ...b,
          quantityNeeded: b.quantityNeeded instanceof Decimal ? b.quantityNeeded.toNumber() : Number(b.quantityNeeded || 0),
          wastePercentage: b.wastePercentage instanceof Decimal ? b.wastePercentage.toNumber() : Number(b.wastePercentage || 0),
        })) || [],
      })),
      boms: product.boms?.map(b => ({
        ...b,
        quantityRequired: b.quantityRequired instanceof Decimal ? b.quantityRequired.toNumber() : Number(b.quantityRequired || 0),
      })) || [],
    }));
  } catch (error) {
    console.error("[SuperAdmin] Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

/**
 * Get product statistics
 */
export async function getProductStatsSuperadmin() {
  const session = await ensureSuperAdmin();

  try {
    const [total, byStatus, byCategory, lowStock] = await Promise.all([
      // Total products
      prisma.product.count({
        where: { archivedAt: null },
      }),

      // Products by status
      prisma.product.groupBy({
        by: ["status"],
        where: { archivedAt: null },
        _count: true,
      }),

      // Products by category (top 5)
      prisma.product.groupBy({
        by: ["categoryId"],
        where: { archivedAt: null },
        _count: true,
        orderBy: {
          _count: {
            categoryId: "desc",
          },
        },
        take: 5,
      }),

      // Low stock products
      prisma.product.count({
        where: {
          archivedAt: null,
          AND: [
            {
              currentStock: {
                lte: prisma.product.fields.minimumStockLevel,
              },
            },
          ],
        },
      }),
    ]);

    const statusCounts = byStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus: statusCounts,
      topCategories: byCategory.map(c => ({
        categoryId: c.categoryId,
        count: c._count,
      })),
      lowStock,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error fetching product stats:", error);
    throw new Error("Failed to fetch product statistics");
  }
}

/**
 * Archive products in bulk
 */
export async function bulkArchiveProducts(
  productIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    // Validation
    if (productIds.length === 0) {
      return {
        success: false,
        error: "No products selected",
      };
    }

    if (productIds.length > 100) {
      return {
        success: false,
        error: "Cannot archive more than 100 products at once",
      };
    }

    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Archive products
      const updated = await tx.product.updateMany({
        where: { id: { in: productIds } },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          archivedReason: reason,
        },
      });

      // Archive variants
      await tx.productVariant.updateMany({
        where: { productId: { in: productIds } },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          archivedReason: reason,
        },
      });

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_PRODUCT_ARCHIVE",
          description: `Archived ${updated.count} products`,
          metadata: {
            productIds,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/products");
    revalidatePath("/admin/products");

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error archiving products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive products",
    };
  }
}

/**
 * Activate (un-archive) products in bulk
 */
export async function bulkActivateProducts(
  productIds: string[],
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    // Validation
    if (productIds.length === 0) {
      return {
        success: false,
        error: "No products selected",
      };
    }

    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Activate products
      const updated = await tx.product.updateMany({
        where: { id: { in: productIds } },
        data: {
          archivedAt: null,
          archivedBy: null,
          archivedReason: null,
          status: Status.ACTIVE,
        },
      });

      // Activate variants
      await tx.productVariant.updateMany({
        where: { productId: { in: productIds } },
        data: {
          archivedAt: null,
          archivedBy: null,
          archivedReason: null,
        },
      });

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_PRODUCT_ACTIVATE",
          description: `Activated ${updated.count} products`,
          metadata: {
            productIds,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updated.count };
    });

    revalidatePath("/superadmin/products");
    revalidatePath("/admin/products");

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error activating products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to activate products",
    };
  }
}

/**
 * Bulk update product pricing
 */
export async function bulkUpdateProductPricing(
  productIds: string[],
  pricingData: {
    sellingPrice?: number;
    unitCost?: number;
    adjustmentType?: "SET" | "INCREASE" | "DECREASE";
    adjustmentValue?: number; // Percentage or absolute value
  },
  reason: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    // Validation
    if (productIds.length === 0) {
      return {
        success: false,
        error: "No products selected",
      };
    }

    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      let updateCount = 0;

      for (const productId of productIds) {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { sellingPrice: true, unitCost: true },
        });

        if (!product) continue;

        const updates: any = {};

        // Handle selling price update
        if (pricingData.sellingPrice !== undefined) {
          updates.sellingPrice = new Decimal(pricingData.sellingPrice);
        } else if (pricingData.adjustmentType && pricingData.adjustmentValue !== undefined) {
          const currentPrice = product.sellingPrice instanceof Decimal
            ? product.sellingPrice.toNumber()
            : Number(product.sellingPrice);

          let newPrice = currentPrice;

          if (pricingData.adjustmentType === "INCREASE") {
            newPrice = currentPrice + pricingData.adjustmentValue;
          } else if (pricingData.adjustmentType === "DECREASE") {
            newPrice = Math.max(0, currentPrice - pricingData.adjustmentValue);
          } else if (pricingData.adjustmentType === "SET") {
            newPrice = pricingData.adjustmentValue;
          }

          updates.sellingPrice = new Decimal(newPrice);
        }

        // Handle unit cost update
        if (pricingData.unitCost !== undefined) {
          updates.unitCost = new Decimal(pricingData.unitCost);
        }

        if (Object.keys(updates).length > 0) {
          await tx.product.update({
            where: { id: productId },
            data: updates,
          });
          updateCount++;
        }
      }

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_BULK_PRODUCT_PRICING_UPDATE",
          description: `Updated pricing for ${updateCount} products`,
          metadata: {
            productIds,
            pricingData,
            reason,
          },
          performedBy: session.user.id,
        },
      });

      return { count: updateCount };
    });

    revalidatePath("/superadmin/products");
    revalidatePath("/admin/products");

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    console.error("[SuperAdmin] Error updating product pricing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update pricing",
    };
  }
}

/**
 * Update product BOM
 */
export async function updateProductBOM(
  productId: string,
  bomItems: Array<{
    materialId: string;
    quantityRequired: number;
    unit: string;
  }>,
  reason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await ensureSuperAdmin();

  try {
    if (!reason || reason.length < 15) {
      return {
        success: false,
        error: "Audit reason must be at least 15 characters",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing BOMs
      await tx.bOM.deleteMany({
        where: { productId },
      });

      // Create new BOMs
      for (const item of bomItems) {
        await tx.bOM.create({
          data: {
            productId,
            materialId: item.materialId,
            quantityRequired: new Decimal(item.quantityRequired),
            unit: item.unit,
            createdBy: session.user.id,
          },
        });
      }

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_PRODUCT_BOM_UPDATED",
          description: `Updated BOM for product ${productId}`,
          metadata: {
            productId,
            bomItemsCount: bomItems.length,
            reason,
          },
          performedBy: session.user.id,
        },
      });
    });

    revalidatePath("/superadmin/products");
    revalidatePath(`/superadmin/products/${productId}`);

    return { success: true };
  } catch (error) {
    console.error("[SuperAdmin] Error updating product BOM:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update BOM",
    };
  }
}
