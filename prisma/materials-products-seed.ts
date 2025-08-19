import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting materials and products seeding...");

  try {
    // 1. Create Material Types
    console.log("📦 Creating Material Types...");
    const materialTypes = await Promise.all([
      prisma.materialType.upsert({
        where: { name: "Raw Materials" },
        update: {},
        create: {
          name: "Raw Materials",
          description: "Basic raw materials used in production",
          status: Status.ACTIVE,
        },
      }),
      prisma.materialType.upsert({
        where: { name: "Components" },
        update: {},
        create: {
          name: "Components",
          description: "Pre-fabricated components and parts",
          status: Status.ACTIVE,
        },
      }),
      prisma.materialType.upsert({
        where: { name: "Fabrics" },
        update: {},
        create: {
          name: "Fabrics",
          description: "Textile materials and fabrics",
          status: Status.ACTIVE,
        },
      }),
      prisma.materialType.upsert({
        where: { name: "Hardware" },
        update: {},
        create: {
          name: "Hardware",
          description: "Hardware components like buttons, zippers",
          status: Status.ACTIVE,
        },
      }),
      prisma.materialType.upsert({
        where: { name: "Packaging" },
        update: {},
        create: {
          name: "Packaging",
          description: "Packaging materials and supplies",
          status: Status.ACTIVE,
        },
      }),
    ]);

    // 2. Create Units of Measure
    console.log("📏 Creating Units of Measure...");
    const unitsOfMeasure = await Promise.all([
      prisma.unitOfMeasure.upsert({
        where: { name: "Meters" },
        update: {},
        create: {
          name: "Meters",
          symbol: "m",
          description: "Linear measurement in meters",
          status: Status.ACTIVE,
        },
      }),
      prisma.unitOfMeasure.upsert({
        where: { name: "Pieces" },
        update: {},
        create: {
          name: "Pieces",
          symbol: "pcs",
          description: "Count in pieces",
          status: Status.ACTIVE,
        },
      }),
      prisma.unitOfMeasure.upsert({
        where: { name: "Kilograms" },
        update: {},
        create: {
          name: "Kilograms",
          symbol: "kg",
          description: "Weight in kilograms",
          status: Status.ACTIVE,
        },
      }),
      prisma.unitOfMeasure.upsert({
        where: { name: "Square Meters" },
        update: {},
        create: {
          name: "Square Meters",
          symbol: "sqm",
          description: "Area measurement in square meters",
          status: Status.ACTIVE,
        },
      }),
      prisma.unitOfMeasure.upsert({
        where: { name: "Rolls" },
        update: {},
        create: {
          name: "Rolls",
          symbol: "roll",
          description: "Material in roll format",
          status: Status.ACTIVE,
        },
      }),
    ]);

    // 3. Create Product Categories
    console.log("🏷️ Creating Product Categories...");
    const productCategories = await Promise.all([
      prisma.productCategory.upsert({
        where: { name: "Apparel" },
        update: {},
        create: {
          name: "Apparel",
          description: "Clothing and fashion items",
          status: Status.ACTIVE,
        },
      }),
      prisma.productCategory.upsert({
        where: { name: "Accessories" },
        update: {},
        create: {
          name: "Accessories",
          description: "Fashion accessories and add-ons",
          status: Status.ACTIVE,
        },
      }),
      prisma.productCategory.upsert({
        where: { name: "Footwear" },
        update: {},
        create: {
          name: "Footwear",
          description: "Shoes and sandals",
          status: Status.ACTIVE,
        },
      }),
      prisma.productCategory.upsert({
        where: { name: "Home & Living" },
        update: {},
        create: {
          name: "Home & Living",
          description: "Home textiles and living items",
          status: Status.ACTIVE,
        },
      }),
      prisma.productCategory.upsert({
        where: { name: "Sports & Active" },
        update: {},
        create: {
          name: "Sports & Active",
          description: "Sportswear and active lifestyle products",
          status: Status.ACTIVE,
        },
      }),
    ]);

    // 4. Create Suppliers
    console.log("🏭 Creating Suppliers...");
    const suppliers = await Promise.all([
      prisma.supplier.upsert({
        where: { code: "SUP001" },
        update: {},
        create: {
          name: "Manila Textile Co.",
          code: "SUP001",
          contactPerson: "Juan Dela Cruz",
          email: "juan@manilatextile.com",
          phone: "+63 2 123 4567",
          address: "123 Textile St.",
          city: "Manila",
          country: "Philippines",
          leadTime: 7,
          paymentTerms: "Net 30",
          status: Status.ACTIVE,
        },
      }),
      prisma.supplier.upsert({
        where: { code: "SUP002" },
        update: {},
        create: {
          name: "Pacific Components Ltd.",
          code: "SUP002",
          contactPerson: "Maria Santos",
          email: "maria@pacificcomponents.com",
          phone: "+63 2 234 5678",
          address: "456 Industrial Ave.",
          city: "Quezon City",
          country: "Philippines",
          leadTime: 14,
          paymentTerms: "Net 45",
          status: Status.ACTIVE,
        },
      }),
      prisma.supplier.upsert({
        where: { code: "SUP003" },
        update: {},
        create: {
          name: "Global Hardware Inc.",
          code: "SUP003",
          contactPerson: "Robert Tan",
          email: "robert@globalhardware.com",
          phone: "+63 2 345 6789",
          address: "789 Hardware Blvd.",
          city: "Makati",
          country: "Philippines",
          leadTime: 10,
          paymentTerms: "Net 30",
          status: Status.ACTIVE,
        },
      }),
    ]);

    // 5. Create 5 Sample Materials
    console.log("🧵 Creating Materials...");
    const materials = await Promise.all([
      prisma.material.upsert({
        where: { sku: "MAT001" },
        update: {},
        create: {
          sku: "MAT001",
          name: "Cotton Fabric - Blue Denim",
          typeId: materialTypes[2].id, // Fabrics
          unitOfMeasureId: unitsOfMeasure[0].id, // Meters
          costPerUnit: 250.0,
          currentStock: 500,
          minimumStockLevel: 50,
          leadTime: 7,
          supplierId: suppliers[0].id,
          status: Status.ACTIVE,
          notes: "High-quality cotton denim fabric for jeans production",
        },
      }),
      prisma.material.upsert({
        where: { sku: "MAT002" },
        update: {},
        create: {
          sku: "MAT002",
          name: "Metal Buttons - Silver",
          typeId: materialTypes[3].id, // Hardware
          unitOfMeasureId: unitsOfMeasure[1].id, // Pieces
          costPerUnit: 5.5,
          currentStock: 2000,
          minimumStockLevel: 200,
          leadTime: 14,
          supplierId: suppliers[2].id,
          status: Status.ACTIVE,
          notes: "Premium silver-plated metal buttons for garments",
        },
      }),
      prisma.material.upsert({
        where: { sku: "MAT003" },
        update: {},
        create: {
          sku: "MAT003",
          name: "Polyester Thread - Black",
          typeId: materialTypes[0].id, // Raw Materials
          unitOfMeasureId: unitsOfMeasure[4].id, // Rolls
          costPerUnit: 45.0,
          currentStock: 150,
          minimumStockLevel: 20,
          leadTime: 10,
          supplierId: suppliers[1].id,
          status: Status.ACTIVE,
          notes: "Strong polyester thread for sewing operations",
        },
      }),
      prisma.material.upsert({
        where: { sku: "MAT004" },
        update: {},
        create: {
          sku: "MAT004",
          name: "YKK Zipper - 12 inch",
          typeId: materialTypes[1].id, // Components
          unitOfMeasureId: unitsOfMeasure[1].id, // Pieces
          costPerUnit: 25.0,
          currentStock: 800,
          minimumStockLevel: 100,
          leadTime: 21,
          supplierId: suppliers[1].id,
          status: Status.ACTIVE,
          notes: "High-quality YKK zippers for jackets and bags",
        },
      }),
      prisma.material.upsert({
        where: { sku: "MAT005" },
        update: {},
        create: {
          sku: "MAT005",
          name: "Leather - Brown Genuine",
          typeId: materialTypes[0].id, // Raw Materials
          unitOfMeasureId: unitsOfMeasure[3].id, // Square Meters
          costPerUnit: 1200.0,
          currentStock: 75,
          minimumStockLevel: 10,
          leadTime: 28,
          supplierId: suppliers[0].id,
          status: Status.ACTIVE,
          notes: "Premium genuine leather for bags and accessories",
        },
      }),
    ]);

    // 6. Create 5 Sample Products
    console.log("👕 Creating Products...");
    const products = await Promise.all([
      prisma.product.upsert({
        where: { sku: "PROD001" },
        update: {},
        create: {
          sku: "PROD001",
          name: "Classic Denim Jeans",
          description: "Premium quality denim jeans with classic cut",
          categoryId: productCategories[0].id, // Apparel
          sizeRange: ["XS", "S", "M", "L", "XL", "XXL"],
          colorOptions: ["Blue", "Black", "Dark Blue"],
          unitCost: 450.0,
          sellingPrice: 1200.0,
          minimumStockLevel: 20,
          currentStock: 100,
          leadTime: 5,
          status: Status.ACTIVE,
        },
      }),
      prisma.product.upsert({
        where: { sku: "PROD002" },
        update: {},
        create: {
          sku: "PROD002",
          name: "Leather Handbag",
          description: "Elegant brown leather handbag for everyday use",
          categoryId: productCategories[1].id, // Accessories
          sizeRange: ["One Size"],
          colorOptions: ["Brown", "Black", "Tan"],
          unitCost: 1800.0,
          sellingPrice: 3500.0,
          minimumStockLevel: 10,
          currentStock: 25,
          leadTime: 10,
          status: Status.ACTIVE,
        },
      }),
      prisma.product.upsert({
        where: { sku: "PROD003" },
        update: {},
        create: {
          sku: "PROD003",
          name: "Casual T-Shirt",
          description: "Comfortable cotton t-shirt for casual wear",
          categoryId: productCategories[0].id, // Apparel
          sizeRange: ["XS", "S", "M", "L", "XL"],
          colorOptions: ["White", "Black", "Navy", "Gray"],
          unitCost: 120.0,
          sellingPrice: 350.0,
          minimumStockLevel: 50,
          currentStock: 200,
          leadTime: 3,
          status: Status.ACTIVE,
        },
      }),
      prisma.product.upsert({
        where: { sku: "PROD004" },
        update: {},
        create: {
          sku: "PROD004",
          name: "Sports Jacket",
          description: "Water-resistant sports jacket for active lifestyle",
          categoryId: productCategories[4].id, // Sports & Active
          sizeRange: ["S", "M", "L", "XL", "XXL"],
          colorOptions: ["Black", "Navy", "Red", "Green"],
          unitCost: 800.0,
          sellingPrice: 1800.0,
          minimumStockLevel: 15,
          currentStock: 45,
          leadTime: 7,
          status: Status.ACTIVE,
        },
      }),
      prisma.product.upsert({
        where: { sku: "PROD005" },
        update: {},
        create: {
          sku: "PROD005",
          name: "Canvas Sneakers",
          description: "Comfortable canvas sneakers for daily wear",
          categoryId: productCategories[2].id, // Footwear
          sizeRange: ["36", "37", "38", "39", "40", "41", "42", "43"],
          colorOptions: ["White", "Black", "Red", "Blue"],
          unitCost: 550.0,
          sellingPrice: 1250.0,
          minimumStockLevel: 30,
          currentStock: 80,
          leadTime: 6,
          status: Status.ACTIVE,
        },
      }),
    ]);

    // 7. Create Bills of Materials (BOM) - Linking Materials to Products
    console.log("📋 Creating Bills of Materials (BOMs)...");

    // BOM for Classic Denim Jeans (PROD001)
    await prisma.bOM.createMany({
      data: [
        {
          productId: products[0].id,
          materialId: materials[0].id, // Cotton Fabric - Blue Denim
          quantityNeeded: 1.5, // 1.5 meters of fabric per jean
          wastePercentage: 5.0,
        },
        {
          productId: products[0].id,
          materialId: materials[1].id, // Metal Buttons - Silver
          quantityNeeded: 5.0, // 5 buttons per jean
          wastePercentage: 2.0,
        },
        {
          productId: products[0].id,
          materialId: materials[2].id, // Polyester Thread - Black
          quantityNeeded: 0.1, // 0.1 roll of thread per jean
          wastePercentage: 3.0,
        },
        {
          productId: products[0].id,
          materialId: materials[3].id, // YKK Zipper - 12 inch
          quantityNeeded: 1.0, // 1 zipper per jean
          wastePercentage: 1.0,
        },
      ],
      skipDuplicates: true,
    });

    // BOM for Leather Handbag (PROD002)
    await prisma.bOM.createMany({
      data: [
        {
          productId: products[1].id,
          materialId: materials[4].id, // Leather - Brown Genuine
          quantityNeeded: 0.8, // 0.8 sqm of leather per bag
          wastePercentage: 8.0,
        },
        {
          productId: products[1].id,
          materialId: materials[2].id, // Polyester Thread - Black
          quantityNeeded: 0.05, // 0.05 roll of thread per bag
          wastePercentage: 2.0,
        },
        {
          productId: products[1].id,
          materialId: materials[3].id, // YKK Zipper - 12 inch
          quantityNeeded: 2.0, // 2 zippers per bag
          wastePercentage: 1.0,
        },
        {
          productId: products[1].id,
          materialId: materials[1].id, // Metal Buttons - Silver (for decorative hardware)
          quantityNeeded: 4.0, // 4 decorative buttons/hardware per bag
          wastePercentage: 1.0,
        },
      ],
      skipDuplicates: true,
    });

    // BOM for Casual T-Shirt (PROD003) - simplified
    await prisma.bOM.createMany({
      data: [
        {
          productId: products[2].id,
          materialId: materials[0].id, // Cotton Fabric (reusing for t-shirt)
          quantityNeeded: 0.8, // 0.8 meters of fabric per t-shirt
          wastePercentage: 4.0,
        },
        {
          productId: products[2].id,
          materialId: materials[2].id, // Polyester Thread - Black
          quantityNeeded: 0.03, // 0.03 roll of thread per t-shirt
          wastePercentage: 2.0,
        },
      ],
      skipDuplicates: true,
    });

    // BOM for Sports Jacket (PROD004)
    await prisma.bOM.createMany({
      data: [
        {
          productId: products[3].id,
          materialId: materials[0].id, // Cotton Fabric (technical fabric)
          quantityNeeded: 2.0, // 2 meters of fabric per jacket
          wastePercentage: 6.0,
        },
        {
          productId: products[3].id,
          materialId: materials[3].id, // YKK Zipper - 12 inch
          quantityNeeded: 2.0, // 2 zippers per jacket (main + pockets)
          wastePercentage: 1.0,
        },
        {
          productId: products[3].id,
          materialId: materials[2].id, // Polyester Thread - Black
          quantityNeeded: 0.15, // 0.15 roll of thread per jacket
          wastePercentage: 3.0,
        },
      ],
      skipDuplicates: true,
    });

    // BOM for Canvas Sneakers (PROD005) - simplified
    await prisma.bOM.createMany({
      data: [
        {
          productId: products[4].id,
          materialId: materials[0].id, // Cotton Fabric (canvas material)
          quantityNeeded: 0.5, // 0.5 meters of canvas per pair
          wastePercentage: 7.0,
        },
        {
          productId: products[4].id,
          materialId: materials[2].id, // Polyester Thread - Black
          quantityNeeded: 0.08, // 0.08 roll of thread per pair
          wastePercentage: 3.0,
        },
      ],
      skipDuplicates: true,
    });

    console.log("✅ Materials and Products seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   📦 Material Types: ${materialTypes.length}`);
    console.log(`   📏 Units of Measure: ${unitsOfMeasure.length}`);
    console.log(`   🏷️ Product Categories: ${productCategories.length}`);
    console.log(`   🏭 Suppliers: ${suppliers.length}`);
    console.log(`   🧵 Materials: ${materials.length}`);
    console.log(`   👕 Products: ${products.length}`);
    console.log(`   📋 BOM Entries: Multiple combinations created`);

    console.log("\n🎯 Sample Materials Created:");
    materials.forEach((material, index) => {
      console.log(`   ${index + 1}. ${material.name} (${material.sku})`);
    });

    console.log("\n🎯 Sample Products Created:");
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.sku})`);
    });
  } catch (error) {
    console.error("❌ Error during materials and products seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Database connection closed.");
  });
