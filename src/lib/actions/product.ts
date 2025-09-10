// src/lib/actions/product.ts
"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ProductForOrder } from "@/types/admin/product";
import { Status, Prisma } from "@prisma/client";
import { convertDecimals } from "../convertDecimals";
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";


// --- Helper Functions ---

async function createVariantBOMsFromParent(
  variantId: string,
  parentBOMs: any[],
  sizeName: string,
  colorName: string,
  modifications: any
): Promise<number> {
    console.log(`Skipping BOM creation for variant ${variantId}. Implementation needed.`);
    return 0;
}

// Get archived products for admin listing
export async function getArchivedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ARCHIVED" as Status },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return convertDecimals(products);
  } catch (error) {
    console.error("❌ Error fetching archived products:", error);
    throw new Error("Failed to fetch archived products");
  }
}

async function createAndLinkVariants(
  productId: string,
  sizes: string[],
  colors: string[],
  formData: {
    sku: string;
    name: string;
    unitCost: number;
    sellingPrice: number;
    minimumStockLevel: number;
  },
  tx: Prisma.TransactionClient
): Promise<any[]> {
  const createdVariants = [];
  const sizesForPrisma = sizes.map((size, index) => ({ name: size, code: size.toUpperCase(), sortOrder: index }));
  const colorsForPrisma = colors.map(color => ({ name: color, code: color.replace(/\s/g, '').toUpperCase() }));

  for (const size of sizesForPrisma) {
    for (const color of colorsForPrisma) {
      const sku = `${formData.sku}-${size.code}-${color.code}`;
      const displayName = `${formData.name} - ${size.name} ${color.name}`;

      // Create a variant for each size and color combination
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku,
          sizeName: size.name,
          sizeCode: size.code,
          colorName: color.name,
          colorCode: color.code,
          displayName,
          unitCost: new Decimal(formData.unitCost),
          sellingPrice: new Decimal(formData.sellingPrice),
          minimumStockLevel: formData.minimumStockLevel,
          currentStock: 0,
          isActive: true,
          sortOrder: size.sortOrder,
        },
      });

      createdVariants.push(variant);
    }
  }

  return createdVariants;
}

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { status: { not: "ARCHIVED" as Status } },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        // Include product variants for expandable table
        variants: {
          select: {
            id: true,
            sku: true,
            sizeName: true,
            sizeCode: true,
            colorName: true,
            colorCode: true,
            currentStock: true,
            minimumStockLevel: true,
            unitCost: true,
            sellingPrice: true,
            displayName: true,
            isActive: true,
            sortOrder: true,
          },
          where: {
            isActive: true,
          },
          orderBy: [
            { sortOrder: "asc" },
            { sizeName: "asc" },
            { colorName: "asc" },
          ],
        },
        // Include brief information about production orders for this product
        productionOrders: {
          select: {
            id: true,
            status: true,
            quantity: true,
            dueDate: true,
          },
          where: {
            status: {
              in: ["PENDING", "IN_PROGRESS", "ACTIVE"],
            },
          },
          take: 5, // Limit to recent orders
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return convertDecimals(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

// Unarchive Product Server Action
export async function unarchiveProduct(productId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "system";

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Reactivate all product variants
      await tx.productVariant.updateMany({
        where: { productId },
        data: { isActive: true, updatedAt: new Date() },
      });

      // Unarchive product
      await tx.product.update({
        where: { id: productId },
        data: {
          status: "ACTIVE" as Status,
          archivedAt: null,
          archivedBy: null,
          archivedReason: null,
          modifiedBy: userId,
          updatedAt: new Date(),
        },
      });
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/products/archived");
    revalidatePath(`/admin/products/${productId}`);

    return { success: true, message: "Product unarchived successfully" };
  } catch (error: any) {
    console.error("Product unarchive error:", error);
    if (error.code === "P2025") {
      return { success: false, error: "Product not found" };
    }
    return { success: false, error: "Error unarchiving product" };
  }
}

export async function getProductsForOrders(): Promise<ProductForOrder[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE", // Only include active products for ordering
      },
      select: {
        id: true,
        name: true,
        sku: true,
        sellingPrice: true, // This will be mapped to unitPrice
        currentStock: true,
        minimumStockLevel: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Map to expected format with unitPrice
    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: Number(product.sellingPrice), // Convert Decimal to number
      currentStock: product.currentStock,
      minimumStockLevel: product.minimumStockLevel,
    }));
  } catch (error) {
    console.error("❌ Error fetching products for orders:", error);
    throw new Error("Failed to fetch products for orders");
  }
}

export async function getProductsWithVariantsForOrders() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE", // Only include active products for ordering
      },
      select: {
        id: true,
        name: true,
        sku: true,
        sellingPrice: true,
        currentStock: true,
        minimumStockLevel: true,
        hasVariants: true,
        variants: {
          where: {
            isActive: true, // Only include active variants
          },
          select: {
            id: true,
            productId: true,
            sku: true,
            displayName: true,
            sizeName: true,
            sizeCode: true,
            colorName: true,
            colorCode: true,
            sellingPrice: true,
            currentStock: true,
            minimumStockLevel: true,
          },
          orderBy: [{ sizeName: "asc" }, { colorName: "asc" }],
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 100, // Limit results to prevent performance issues
    });

    // Map to expected format with variants
    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: Number(product.sellingPrice),
      currentStock: product.currentStock,
      minimumStockLevel: product.minimumStockLevel,
      hasVariants: product.hasVariants && product.variants.length > 0,
      variants: product.variants.map((variant: any) => ({
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        displayName: variant.displayName,
        sizeName: variant.sizeName,
        sizeCode: variant.sizeCode,
        colorName: variant.colorName,
        colorCode: variant.colorCode,
        unitPrice: Number(variant.sellingPrice),
        currentStock: variant.currentStock,
        minimumStockLevel: variant.minimumStockLevel,
      })),
    }));
  } catch (error) {
    console.error(
      "❌ Error fetching products with variants for orders:",
      error
    );
    throw new Error("Failed to fetch products with variants for orders");
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        boms: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                costPerUnit: true,
              },
            },
          },
        },
        // Include product variants for enhanced UI
        variants: {
          include: {
            boms: {
              include: {
                material: {
                  select: {
                    id: true,
                    name: true,
                    costPerUnit: true,
                  },
                },
              },
            },
          },
          orderBy: [{ sizeName: "asc" }, { colorName: "asc" }],
        },
        // Include production orders too for consistency
        productionOrders: {
          select: {
            id: true,
            status: true,
            quantity: true,
            dueDate: true,
          },
          where: {
            status: {
              in: [Status.PENDING, Status.IN_PROGRESS, Status.ACTIVE],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return convertDecimals(product);
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    throw new Error("Failed to fetch product details");
  }
}

// Function to get production orders for a product
export async function getProductionOrdersByProductId(productId: string) {
  try {
    const orders = await prisma.productionOrder.findMany({
      where: {
        productId,
      },
      select: {
        id: true,
        status: true,
        quantity: true,
        dueDate: true,
        startDate: true,
        priority: true,
        createdAt: true,
        operations: {
          include: {
            workCenter: true,
          },
        },
        qualityChecks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return convertDecimals(orders);
  } catch (error) {
    console.error("❌ Error fetching production orders for product:", error);
    throw new Error("Failed to fetch production orders");
  }
}

// Function to adjust product stock
export async function adjustProductStock(
  productId: string,
  adjustment: {
    type: "ADD" | "REMOVE";
    quantity: number;
    reason: string;
  }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const newStock =
      adjustment.type === "ADD"
        ? product.currentStock + adjustment.quantity
        : product.currentStock - adjustment.quantity;

    if (newStock < 0) {
      throw new Error("Cannot reduce stock below zero");
    }

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
        updatedAt: new Date(),
      },
    });

    // TODO: Add inventory movement record for audit trail
    // This would be implemented when the inventory tracking system is enhanced

    return { success: true, newStock };
  } catch (error) {
    console.error("❌ Error adjusting product stock:", error);
    throw new Error("Failed to adjust product stock");
  }
}

// Function to adjust variant stock
export async function adjustVariantStock(
  variantId: string,
  adjustment: {
    type: "ADD" | "REMOVE";
    quantity: number;
    reason: string;
  }
) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new Error("Product variant not found");
    }

    const newStock =
      adjustment.type === "ADD"
        ? variant.currentStock + adjustment.quantity
        : variant.currentStock - adjustment.quantity;

    if (newStock < 0) {
      throw new Error("Cannot reduce stock below zero");
    }

    // Update variant stock
    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        currentStock: newStock,
        updatedAt: new Date(),
      },
    });

    // TODO: Add inventory movement record for audit trail

    return { success: true, newStock };
  } catch (error) {
    console.error("❌ Error adjusting variant stock:", error);
    throw new Error("Failed to adjust variant stock");
  }
}


// Create Product Server Action (replaces API route)
export async function createProduct(formData: {
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  sizeRange?: string[];
  colorOptions?: string[];
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  leadTime: number;
  hasVariants?: boolean;
  sizeVariants?: Array<{
    sizeName: string;
    sizeCode: string;
    unitCost: number;
    sellingPrice: number;
    minimumStockLevel: number;
    sortOrder?: number;
  }>;
}) {
  try {
    // Debug: Log the received data
    console.log("Server Action received data:", {
      name: formData.name,
      hasVariants: formData.hasVariants,
      sizeRange: formData.sizeRange,
      colorOptions: formData.colorOptions,
      sizeVariants: formData.sizeVariants,
    });

    // Create product with size variants in a transaction
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create the main product
        const product = await tx.product.create({
          data: {
            name: formData.name,
            sku: formData.sku,
            description: formData.description,
            categoryId: formData.categoryId,
            sizeRange: formData.sizeRange || [],
            colorOptions: formData.colorOptions || [],
            unitCost: formData.unitCost,
            sellingPrice: formData.sellingPrice,
            minimumStockLevel: formData.minimumStockLevel,
            currentStock: 0, // Initial stock is 0
            leadTime: formData.leadTime,
            hasVariants: formData.hasVariants || false,
            status: "ACTIVE" as Status,
          },
        });

        // Create variants if specified
        const variants = [];
        if (
          formData.hasVariants &&
          formData.sizeVariants &&
          formData.sizeVariants.length > 0
        ) {
          // Create product variants for each size
          for (const sizeVariant of formData.sizeVariants) {
            const variant = await tx.productVariant.create({
              data: {
                productId: product.id,
                sku: `${product.sku}-${sizeVariant.sizeCode}`,
                sizeName: sizeVariant.sizeName,
                sizeCode: sizeVariant.sizeCode,
                unitCost: sizeVariant.unitCost,
                sellingPrice: sizeVariant.sellingPrice,
                minimumStockLevel: sizeVariant.minimumStockLevel,
                displayName: `${product.name} - ${sizeVariant.sizeName}`,
                sortOrder: sizeVariant.sortOrder || 0,
                isActive: true,
              },
            });
            variants.push(variant);
          }
        }

        return { product, variants };
      }
    );

    return {
      success: true,
      data: convertDecimals(result.product),
      variants: convertDecimals(result.variants),
      message: `Product created successfully${result.variants.length > 0 ? ` with ${result.variants.length} variants` : ""}`,
    };
  } catch (error: any) {
    console.error("Product creation error:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        error: "A product with this SKU already exists",
      };
    }

    return {
      success: false,
      error: "Error creating product",
    };
  }
}

export async function createProduct2(formData: {
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  currentStock: number;
  leadTime: number;
  hasVariants?: boolean;
  sizes?: string[]; // The simple string arrays from the form
  colors?: string[]; // The simple string arrays from the form
}) {
  try {
    console.log("createProduct server action received data:", {
      name: formData.name,
      hasVariants: formData.hasVariants,
      sizes: formData.sizes,
      colors: formData.colors,
    });

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create the main product
        const product = await tx.product.create({
          data: {
            name: formData.name,
            sku: formData.sku,
            description: formData.description,
            categoryId: formData.categoryId,
            unitCost: formData.unitCost,
            sellingPrice: formData.sellingPrice,
            minimumStockLevel: formData.minimumStockLevel,
            currentStock: formData.currentStock,
            leadTime: formData.leadTime,
            hasVariants: formData.hasVariants || false,
            status: "ACTIVE" as Status,
            // Store the sizes and colors on the product model for easy reference
            sizeRange: formData.sizes || [],
            colorOptions: formData.colors || [],
          },
        });

        let createdVariants = [];

        // If variants are enabled and we have sizes and colors, create them
        if (formData.hasVariants && formData.sizes && formData.colors) {
          createdVariants = await createAndLinkVariants(
            product.id,
            formData.sizes,
            formData.colors,
            {
              sku: formData.sku,
              name: formData.name,
              unitCost: formData.unitCost,
              sellingPrice: formData.sellingPrice,
              minimumStockLevel: formData.minimumStockLevel,
            },
            tx // Pass the transaction client to the helper function
          );
        }
        
        return { product, createdVariants };
      }
    );

    // Revalidate cache paths to show the new product
    revalidatePath("/admin/products");

    return {
      success: true,
      data: convertDecimals(result.product),
      variants: convertDecimals(result.createdVariants),
      message: `Product created successfully with ${result.createdVariants.length} variants.`,
    };
  } catch (error: any) {
    console.error("Product creation error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        error: "A product with this SKU already exists. Please choose a different one.",
      };
    }

    return {
      success: false,
      error: "Error creating product",
    };
  }
}


// Update Product Server Action
export async function updateProduct(
  productId: string,
  formData: {
    name?: string;
    sku?: string;
    description?: string;
    categoryId?: string;
    sizeRange?: string[];
    colorOptions?: string[];
    unitCost?: number;
    sellingPrice?: number;
    minimumStockLevel?: number;
    leadTime?: number;
    status?: Status;
  }
) {
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...formData,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        variants: true,
      },
    });

    return {
      success: true,
      data: convertDecimals(product),
      message: "Product updated successfully",
    };
  } catch (error: any) {
    console.error("Product update error:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        error: "A product with this SKU already exists",
      };
    }

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Product not found",
      };
    }

    return {
      success: false,
      error: "Error updating product",
    };
  }
}

// Delete Product Server Action
export async function deleteProduct(productId: string, reason?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "system";

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deactivate all product variants (soft)
      await tx.productVariant.updateMany({
        where: { productId },
        data: { isActive: false, updatedAt: new Date() },
      });

      // Archive the product (soft-delete)
      await tx.product.update({
        where: { id: productId },
        data: ({
          status: "ARCHIVED" as Status,
          archivedAt: new Date(),
          archivedBy: userId,
          archivedReason: reason ?? "Archived via admin UI",
          updatedAt: new Date(),
        } as any),
      });
    });

    // Revalidate listings and specific product page
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      message: "Product archived successfully",
    };
  } catch (error: any) {
    console.error("Product archive error:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Product not found",
      };
    }

    return {
      success: false,
      error: "Error archiving product",
    };
  }
}

// Get Categories Server Action
export async function getCategories() {
  try {
    const categories = await prisma.productCategory.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
    });
    return convertDecimals(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

// Create Category Server Action
export async function createCategory(formData: {
  name: string;
  description?: string;
}) {
  try {
    const category = await prisma.productCategory.create({
      data: {
        name: formData.name,
        description: formData.description,
        status: "ACTIVE" as Status,
      },
    });

    return {
      success: true,
      data: convertDecimals(category),
      message: "Category created successfully",
    };
  } catch (error: any) {
    console.error("Category creation error:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        error: "A category with this name already exists",
      };
    }

    return {
      success: false,
      error: "Error creating category",
    };
  }
}

// Update Category Server Action
export async function updateCategory(
  categoryId: string,
  formData: {
    name?: string;
    description?: string;
  }
) {
  try {
    const category = await prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        ...formData,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: convertDecimals(category),
      message: "Category updated successfully",
    };
  } catch (error: any) {
    console.error("Category update error:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        error: "A category with this name already exists",
      };
    }

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Category not found",
      };
    }

    return {
      success: false,
      error: "Error updating category",
    };
  }
}

// Delete Category Server Action
export async function deleteCategory(categoryId: string) {
  try {
    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productsCount > 0) {
      return {
        success: false,
        error: `Cannot delete category. It has ${productsCount} product(s) associated with it.`,
      };
    }

    await prisma.productCategory.delete({
      where: { id: categoryId },
    });

    return {
      success: true,
      message: "Category deleted successfully",
    };
  } catch (error: any) {
    console.error("Category deletion error:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Category not found",
      };
    }

    return {
      success: false,
      error: "Error deleting category",
    };
  }
}

// ---------------- Variant Management Actions ----------------

// Update a single product variant
export async function updateProductVariant(
  variantId: string,
  data: {
    sku?: string;
    displayName?: string;
    sizeName?: string | null;
    sizeCode?: string | null;
    colorName?: string | null;
    colorCode?: string | null;
    unitCost?: number;
    sellingPrice?: number;
    minimumStockLevel?: number;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  try {
    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: { ...data, updatedAt: new Date() },
      select: {
        id: true,
        productId: true,
        sku: true,
        displayName: true,
        sizeName: true,
        sizeCode: true,
        colorName: true,
        colorCode: true,
        unitCost: true,
        sellingPrice: true,
        minimumStockLevel: true,
        sortOrder: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/admin/products");
    if (updated.productId) {
      revalidatePath(`/admin/products/${updated.productId}`);
    }

    return {
      success: true,
      data: convertDecimals(updated),
      message: "Variant updated successfully",
    };
  } catch (error: any) {
    console.error("Variant update error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A variant with this SKU already exists" };
    }
    if (error.code === "P2025") {
      return { success: false, error: "Variant not found" };
    }
    return { success: false, error: "Error updating variant" };
  }
}

// Toggle active status for a variant
export async function toggleVariantActive(variantId: string, isActive: boolean) {
  try {
    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive, updatedAt: new Date() },
      select: { id: true, productId: true, isActive: true },
    });
    revalidatePath("/admin/products");
    if (updated.productId) {
      revalidatePath(`/admin/products/${updated.productId}`);
    }
    return { success: true, data: convertDecimals(updated) };
  } catch (error: any) {
    console.error("Toggle variant active error:", error);
    if (error.code === "P2025") {
      return { success: false, error: "Variant not found" };
    }
    return { success: false, error: "Error updating variant status" };
  }
}

// Delete a variant
export async function deleteVariant(variantId: string) {
  try {
    // Get productId before delete for revalidation
    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });
    await prisma.productVariant.delete({ where: { id: variantId } });
    revalidatePath("/admin/products");
    if (existing?.productId) {
      revalidatePath(`/admin/products/${existing.productId}`);
    }
    return { success: true, message: "Variant deleted successfully" };
  } catch (error: any) {
    console.error("Variant deletion error:", error);
    if (error.code === "P2025") {
      return { success: false, error: "Variant not found" };
    }
    return { success: false, error: "Error deleting variant" };
  }
}

// Add a single variant to an existing product
export async function addProductVariant(
  productId: string,
  payload: {
    sku: string;
    displayName?: string;
    sizeName?: string | null;
    sizeCode?: string | null;
    colorName?: string | null;
    colorCode?: string | null;
    styleName?: string | null;
    materialName?: string | null;
    unitCost: number;
    sellingPrice: number;
    minimumStockLevel: number;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, error: "Parent product not found" };

    const created = await prisma.productVariant.create({
      data: {
        productId,
        sku: payload.sku,
        displayName:
          payload.displayName || `${product.name}${payload.sizeName ? ` - ${payload.sizeName}` : ""}${payload.colorName ? ` ${payload.colorName}` : ""}`,
        sizeName: payload.sizeName ?? null,
        sizeCode: payload.sizeCode ?? null,
        colorName: payload.colorName ?? null,
        colorCode: payload.colorCode ?? null,
        styleName: payload.styleName ?? null,
        materialName: payload.materialName ?? null,
        unitCost: payload.unitCost,
        sellingPrice: payload.sellingPrice,
        minimumStockLevel: payload.minimumStockLevel,
        currentStock: 0,
        sortOrder: payload.sortOrder ?? 0,
        isActive: payload.isActive ?? true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true, data: convertDecimals(created), message: "Variant created" };
  } catch (error: any) {
    console.error("Add variant error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A variant with this SKU already exists" };
    }
    return { success: false, error: "Error creating variant" };
  }
}

// Bulk update helper for variants of a product
export async function bulkUpdateProductVariants(
  updates: Array<{
    id: string;
    data: Parameters<typeof updateProductVariant>[1];
  }>
) {
  try {
    const results = await prisma.$transaction(
      updates.map((u) =>
        prisma.productVariant.update({
          where: { id: u.id },
          data: { ...u.data, updatedAt: new Date() },
          select: { id: true, productId: true },
        })
      )
    );
    revalidatePath("/admin/products");
    // Revalidate all affected product detail pages
    const productIds = Array.from(new Set(results.map((r: any) => r.productId).filter(Boolean)));
    for (const pid of productIds) {
      revalidatePath(`/admin/products/${pid}`);
    }
    return { success: true, data: convertDecimals(results) };
  } catch (error) {
    console.error("Bulk update variants error:", error);
    return { success: false, error: "Error bulk updating variants" };
  }
}
