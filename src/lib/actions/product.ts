// src/lib/actions/product.ts
"use server";

import { prisma } from "@/lib/db";
import { ProductForOrder } from "@/types/admin/product";
import { Status, Prisma } from "@prisma/client";
import { convertDecimals } from "../convertDecimals";

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
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
export async function deleteProduct(productId: string) {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete all product variants first
      await tx.productVariant.deleteMany({
        where: { productId },
      });

      // Delete the product
      await tx.product.delete({
        where: { id: productId },
      });
    });

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error: any) {
    console.error("Product deletion error:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Product not found",
      };
    }

    return {
      success: false,
      error: "Error deleting product",
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
