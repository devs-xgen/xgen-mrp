import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createSampleProducts() {
  try {
    console.log("Creating sample product categories...");

    // Create categories first
    const category1 = await prisma.productCategory.upsert({
      where: { name: "Clothing" },
      update: {},
      create: {
        name: "Clothing",
        description: "Apparel and clothing items",
        status: "ACTIVE",
      },
    });

    const category2 = await prisma.productCategory.upsert({
      where: { name: "Accessories" },
      update: {},
      create: {
        name: "Accessories",
        description: "Fashion accessories",
        status: "ACTIVE",
      },
    });

    console.log("Creating sample products...");

    // Create sample products
    const products = await Promise.all([
      prisma.product.upsert({
        where: { sku: "T-SHIRT-001" },
        update: {},
        create: {
          sku: "T-SHIRT-001",
          name: "Basic Cotton T-Shirt",
          description: "Comfortable cotton t-shirt in various sizes",
          categoryId: category1.id,
          sizeRange: ["XS", "S", "M", "L", "XL"],
          colorOptions: ["White", "Black", "Navy", "Red"],
          unitCost: 25.0,
          sellingPrice: 49.99,
          minimumStockLevel: 20,
          currentStock: 100,
          leadTime: 7,
          hasVariants: true,
          status: "ACTIVE",
        },
      }),

      prisma.product.upsert({
        where: { sku: "JEANS-001" },
        update: {},
        create: {
          sku: "JEANS-001",
          name: "Classic Denim Jeans",
          description: "Comfortable denim jeans with classic fit",
          categoryId: category1.id,
          sizeRange: ["28", "30", "32", "34", "36", "38"],
          colorOptions: ["Blue", "Black", "Gray"],
          unitCost: 45.0,
          sellingPrice: 89.99,
          minimumStockLevel: 15,
          currentStock: 75,
          leadTime: 10,
          hasVariants: true,
          status: "ACTIVE",
        },
      }),

      prisma.product.upsert({
        where: { sku: "HAT-001" },
        update: {},
        create: {
          sku: "HAT-001",
          name: "Baseball Cap",
          description: "Adjustable baseball cap with logo",
          categoryId: category2.id,
          sizeRange: ["One Size"],
          colorOptions: ["Black", "Navy", "Red", "White"],
          unitCost: 12.0,
          sellingPrice: 24.99,
          minimumStockLevel: 30,
          currentStock: 150,
          leadTime: 5,
          hasVariants: false,
          status: "ACTIVE",
        },
      }),

      prisma.product.upsert({
        where: { sku: "HOODIE-001" },
        update: {},
        create: {
          sku: "HOODIE-001",
          name: "Premium Hoodie",
          description: "Premium quality hoodie with fleece lining",
          categoryId: category1.id,
          sizeRange: ["S", "M", "L", "XL", "XXL"],
          colorOptions: ["Black", "Gray", "Navy", "Maroon"],
          unitCost: 35.0,
          sellingPrice: 69.99,
          minimumStockLevel: 10,
          currentStock: 50,
          leadTime: 12,
          hasVariants: true,
          status: "ACTIVE",
        },
      }),

      prisma.product.upsert({
        where: { sku: "BELT-001" },
        update: {},
        create: {
          sku: "BELT-001",
          name: "Leather Belt",
          description: "Genuine leather belt with metal buckle",
          categoryId: category2.id,
          sizeRange: ["32", "34", "36", "38", "40", "42"],
          colorOptions: ["Black", "Brown", "Tan"],
          unitCost: 18.0,
          sellingPrice: 39.99,
          minimumStockLevel: 25,
          currentStock: 80,
          leadTime: 8,
          hasVariants: true,
          status: "ACTIVE",
        },
      }),
    ]);

    console.log("Sample products created successfully!");
    console.log(`Created ${products.length} products`);

    // Log the products for verification
    products.forEach((product) => {
      console.log(`- ${product.name} (${product.sku})`);
    });
  } catch (error) {
    console.error("Error creating sample products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleProducts().catch(console.error);
