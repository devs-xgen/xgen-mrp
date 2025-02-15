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
