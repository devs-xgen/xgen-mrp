// src/lib/actions/product.ts
"use server";

import { prisma } from "@/lib/db";
import { ProductForOrder } from "@/types/admin/product";
import { Status } from "@prisma/client";
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
    return products.map((product) => ({
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
