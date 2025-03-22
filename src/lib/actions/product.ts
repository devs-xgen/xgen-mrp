"use server";

import { prisma } from "@/lib/db";

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        sellingPrice: true, // ✅ This exists in your model
        description: true,
        categoryId: true,
        sizeRange: true,
        colorOptions: true,
        unitCost: true,
        minimumStockLevel: true,
        currentStock: true, // ✅ Fixed: Your model uses `currentStock`, not `stock`
        leadTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        modifiedBy: true,
      },
      orderBy: {
        name: "asc",
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