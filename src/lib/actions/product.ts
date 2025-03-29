"use server";

import { prisma } from "@/lib/db";

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        // Include brief information about production orders for this product
        productionOrders: {
          select: {
            id: true,
            status: true,
            quantity: true,
            dueDate: true
          },
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          },
          take: 5, // Limit to recent orders
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    return products;
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function getProductsForOrders(): Promise<ProductForOrder[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE' // Only include active products for ordering
      },
      select: {
        id: true,
        name: true,
        sellingPrice: true, // This will be mapped to unitPrice
      },
      orderBy: {
        name: "asc",
      },
    });

    // Map to expected format with unitPrice
    return products.map(product => ({
      id: product.id,
      name: product.name,
      unitPrice: Number(product.sellingPrice) // Convert Decimal to number if needed
    }));
  } catch (error) {
    console.error("❌ Error fetching products for orders:", error);
    throw new Error("Failed to fetch products for orders");
  }
}


// src/lib/actions/product.ts
// Add this function to your existing product.ts file

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id
      },
      include: {
        category: true,
        boms: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                costPerUnit: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return null;
    }

    return product;
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
        productId
      },
      include: {
        operations: {
          include: {
            workCenter: true
          }
        },
        qualityChecks: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return orders;
  } catch (error) {
    console.error("❌ Error fetching production orders for product:", error);
    throw new Error("Failed to fetch production orders");
  }
}