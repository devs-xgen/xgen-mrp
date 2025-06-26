import {
  PrismaClient,
  Status,
  Priority,
  Role,
  UserStatus,
  Gender,
} from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seeding...");

  // Clear existing data (optional - comment out if you want to preserve existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.productionBOM.deleteMany();
  await prisma.productVariantBOM.deleteMany();
  await prisma.productSizeVariantBOM.deleteMany();
  await prisma.bOM.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productSizeVariant.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.customerOrder.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.qualityCheck.deleteMany();
  await prisma.product.deleteMany();
  await prisma.material.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.materialType.deleteMany();
  await prisma.unitOfMeasure.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  console.log("👥 Creating users...");
  const hashedPassword = await hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@xgenmrp.com",
      password: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "Admin",
          lastName: "User",
          phoneNumber: "+1234567890",
          department: "Management",
          position: "System Administrator",
        },
      },
    },
  });

  const workerUser = await prisma.user.create({
    data: {
      email: "worker@xgenmrp.com",
      password: hashedPassword,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "John",
          lastName: "Worker",
          phoneNumber: "+1234567891",
          department: "Production",
          position: "Production Worker",
        },
      },
    },
  });

  const inspectorUser = await prisma.user.create({
    data: {
      email: "inspector@xgenmrp.com",
      password: hashedPassword,
      role: Role.INSPECTOR,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: "Jane",
          lastName: "Inspector",
          phoneNumber: "+1234567892",
          department: "Quality Control",
          position: "Quality Inspector",
        },
      },
    },
  });

  // 2. Create Unit of Measures
  console.log("📏 Creating units of measure...");
  const pieces = await prisma.unitOfMeasure.create({
    data: {
      name: "Pieces",
      symbol: "pcs",
      description: "Individual pieces or items",
      createdBy: adminUser.id,
    },
  });

  const meters = await prisma.unitOfMeasure.create({
    data: {
      name: "Meters",
      symbol: "m",
      description: "Length measurement in meters",
      createdBy: adminUser.id,
    },
  });

  const kilograms = await prisma.unitOfMeasure.create({
    data: {
      name: "Kilograms",
      symbol: "kg",
      description: "Weight measurement in kilograms",
      createdBy: adminUser.id,
    },
  });

  const liters = await prisma.unitOfMeasure.create({
    data: {
      name: "Liters",
      symbol: "L",
      description: "Volume measurement in liters",
      createdBy: adminUser.id,
    },
  });

  // 3. Create Material Types
  console.log("🧱 Creating material types...");
  const fabricType = await prisma.materialType.create({
    data: {
      name: "Fabric",
      description: "Textile materials for clothing production",
      createdBy: adminUser.id,
    },
  });

  const threadType = await prisma.materialType.create({
    data: {
      name: "Thread",
      description: "Sewing threads and yarns",
      createdBy: adminUser.id,
    },
  });

  const accessoryType = await prisma.materialType.create({
    data: {
      name: "Accessories",
      description: "Buttons, zippers, labels, etc.",
      createdBy: adminUser.id,
    },
  });

  const packagingType = await prisma.materialType.create({
    data: {
      name: "Packaging",
      description: "Packaging materials",
      createdBy: adminUser.id,
    },
  });

  // 4. Create Product Categories
  console.log("📂 Creating product categories...");
  const clothingCategory = await prisma.productCategory.create({
    data: {
      name: "Clothing",
      description: "Apparel and clothing items",
      createdBy: adminUser.id,
    },
  });

  const accessoriesCategory = await prisma.productCategory.create({
    data: {
      name: "Accessories",
      description: "Fashion accessories",
      createdBy: adminUser.id,
    },
  });

  // 5. Create Suppliers
  console.log("🏭 Creating suppliers...");
  const fabricSupplier = await prisma.supplier.create({
    data: {
      name: "Premium Fabrics Inc.",
      code: "FAB001",
      contactPerson: "Michael Johnson",
      email: "orders@premiumfabrics.com",
      phone: "+1555-0101",
      address: "123 Textile Avenue",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
      paymentTerms: "Net 30",
      leadTime: 14,
      createdBy: adminUser.id,
    },
  });

  const accessorySupplier = await prisma.supplier.create({
    data: {
      name: "Fashion Components Ltd.",
      code: "ACC001",
      contactPerson: "Sarah Wilson",
      email: "supply@fashioncomponents.com",
      phone: "+1555-0202",
      address: "456 Component Street",
      city: "Los Angeles",
      state: "CA",
      country: "USA",
      postalCode: "90001",
      paymentTerms: "Net 15",
      leadTime: 7,
      createdBy: adminUser.id,
    },
  });

  // 6. Create Materials
  console.log("🧵 Creating materials...");
  const cottonFabric = await prisma.material.create({
    data: {
      name: "Cotton Fabric - White",
      sku: "MAT-COT-WHT-001",
      typeId: fabricType.id,
      unitOfMeasureId: meters.id,
      costPerUnit: 12.5,
      currentStock: 500,
      minimumStockLevel: 100,
      committedStock: 50,
      availableStock: 450,
      leadTime: 14,
      supplierId: fabricSupplier.id,
      notes: "High-quality 100% cotton fabric",
      createdBy: adminUser.id,
    },
  });

  const polyesterFabric = await prisma.material.create({
    data: {
      name: "Polyester Fabric - Blue",
      sku: "MAT-POL-BLU-001",
      typeId: fabricType.id,
      unitOfMeasureId: meters.id,
      costPerUnit: 8.75,
      currentStock: 300,
      minimumStockLevel: 80,
      committedStock: 30,
      availableStock: 270,
      leadTime: 10,
      supplierId: fabricSupplier.id,
      notes: "Durable polyester blend fabric",
      createdBy: adminUser.id,
    },
  });

  const sewingThread = await prisma.material.create({
    data: {
      name: "Polyester Thread - White",
      sku: "MAT-THR-WHT-001",
      typeId: threadType.id,
      unitOfMeasureId: meters.id,
      costPerUnit: 0.05,
      currentStock: 10000,
      minimumStockLevel: 2000,
      committedStock: 500,
      availableStock: 9500,
      leadTime: 7,
      supplierId: accessorySupplier.id,
      notes: "Strong polyester sewing thread",
      createdBy: adminUser.id,
    },
  });

  const buttons = await prisma.material.create({
    data: {
      name: "Plastic Buttons - White",
      sku: "MAT-BUT-WHT-001",
      typeId: accessoryType.id,
      unitOfMeasureId: pieces.id,
      costPerUnit: 0.25,
      currentStock: 5000,
      minimumStockLevel: 1000,
      committedStock: 200,
      availableStock: 4800,
      leadTime: 5,
      supplierId: accessorySupplier.id,
      notes: "Standard 15mm plastic buttons",
      createdBy: adminUser.id,
    },
  });

  const labels = await prisma.material.create({
    data: {
      name: "Brand Labels",
      sku: "MAT-LBL-BRD-001",
      typeId: accessoryType.id,
      unitOfMeasureId: pieces.id,
      costPerUnit: 0.15,
      currentStock: 2000,
      minimumStockLevel: 500,
      committedStock: 100,
      availableStock: 1900,
      leadTime: 10,
      supplierId: accessorySupplier.id,
      notes: "Company brand labels",
      createdBy: adminUser.id,
    },
  });

  // 7. Create Work Centers
  console.log("🏭 Creating work centers...");
  const cuttingCenter = await prisma.workCenter.create({
    data: {
      name: "Cutting Station",
      description: "Fabric cutting and pattern preparation",
      capacityPerHour: 20,
      operatingHours: 8,
      efficiencyRate: 85.5,
      createdBy: adminUser.id,
    },
  });

  const sewingCenter = await prisma.workCenter.create({
    data: {
      name: "Sewing Line A",
      description: "Main garment assembly line",
      capacityPerHour: 15,
      operatingHours: 8,
      efficiencyRate: 92.0,
      createdBy: adminUser.id,
    },
  });

  const finishingCenter = await prisma.workCenter.create({
    data: {
      name: "Finishing Department",
      description: "Final inspection and packaging",
      capacityPerHour: 25,
      operatingHours: 8,
      efficiencyRate: 88.5,
      createdBy: adminUser.id,
    },
  });

  const qualityCenter = await prisma.workCenter.create({
    data: {
      name: "Quality Control",
      description: "Quality inspection and testing",
      capacityPerHour: 30,
      operatingHours: 8,
      efficiencyRate: 95.0,
      createdBy: adminUser.id,
    },
  });

  // 8. Create Products
  console.log("👕 Creating products...");
  const tshirtProduct = await prisma.product.create({
    data: {
      sku: "PROD-TSH-001",
      name: "Classic T-Shirt",
      description: "Comfortable cotton t-shirt for everyday wear",
      categoryId: clothingCategory.id,
      unitCost: 8.5,
      sellingPrice: 19.99,
      minimumStockLevel: 50,
      currentStock: 0,
      expectedStock: 0,
      committedStock: 0,
      calculatedStock: 0,
      leadTime: 5,
      hasVariants: true,
      isVariantTemplate: true,
      createdBy: adminUser.id,
    },
  });

  const poloShirtProduct = await prisma.product.create({
    data: {
      sku: "PROD-POL-001",
      name: "Polo Shirt",
      description: "Classic polo shirt with collar",
      categoryId: clothingCategory.id,
      unitCost: 12.0,
      sellingPrice: 29.99,
      minimumStockLevel: 30,
      currentStock: 0,
      expectedStock: 0,
      committedStock: 0,
      calculatedStock: 0,
      leadTime: 6,
      hasVariants: true,
      isVariantTemplate: true,
      createdBy: adminUser.id,
    },
  });

  // 9. Create Product Variants
  console.log("🎨 Creating product variants...");
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = [
    { name: "White", code: "#FFFFFF" },
    { name: "Black", code: "#000000" },
    { name: "Navy", code: "#000080" },
    { name: "Red", code: "#FF0000" },
    { name: "Blue", code: "#0000FF" },
  ];

  const tshirtVariants = [];
  const poloVariants = [];

  // T-Shirt Variants
  for (const size of sizes) {
    for (const color of colors) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: tshirtProduct.id,
          sku: `${tshirtProduct.sku}-${size}-${color.name.toUpperCase()}`,
          sizeName: size,
          colorName: color.name,
          colorCode: color.code,
          displayName: `${size} ${color.name}`,
          unitCost: tshirtProduct.unitCost + (size === "XXL" ? 1.0 : 0),
          sellingPrice: tshirtProduct.sellingPrice + (size === "XXL" ? 2.0 : 0),
          currentStock: Math.floor(Math.random() * 20) + 5,
          minimumStockLevel: 10,
          sortOrder: sizes.indexOf(size),
          createdBy: adminUser.id,
        },
      });
      tshirtVariants.push(variant);
    }
  }

  // Polo Shirt Variants
  for (const size of sizes.slice(1, 5)) {
    // Only S, M, L, XL for polo shirts
    for (const color of colors.slice(0, 3)) {
      // Only White, Black, Navy
      const variant = await prisma.productVariant.create({
        data: {
          productId: poloShirtProduct.id,
          sku: `${poloShirtProduct.sku}-${size}-${color.name.toUpperCase()}`,
          sizeName: size,
          colorName: color.name,
          colorCode: color.code,
          displayName: `${size} ${color.name}`,
          unitCost: poloShirtProduct.unitCost + (size === "XL" ? 1.5 : 0),
          sellingPrice:
            poloShirtProduct.sellingPrice + (size === "XL" ? 3.0 : 0),
          currentStock: Math.floor(Math.random() * 15) + 3,
          minimumStockLevel: 8,
          sortOrder: sizes.indexOf(size),
          createdBy: adminUser.id,
        },
      });
      poloVariants.push(variant);
    }
  }

  // 10. Create BOMs (Bill of Materials)
  console.log("📋 Creating BOMs...");

  // Base T-Shirt BOM
  await prisma.bOM.createMany({
    data: [
      {
        productId: tshirtProduct.id,
        materialId: cottonFabric.id,
        quantityNeeded: 1.2,
        wastePercentage: 5.0,
        createdBy: adminUser.id,
      },
      {
        productId: tshirtProduct.id,
        materialId: sewingThread.id,
        quantityNeeded: 25.0,
        wastePercentage: 2.0,
        createdBy: adminUser.id,
      },
      {
        productId: tshirtProduct.id,
        materialId: labels.id,
        quantityNeeded: 1.0,
        wastePercentage: 1.0,
        createdBy: adminUser.id,
      },
    ],
  });

  // Base Polo Shirt BOM
  await prisma.bOM.createMany({
    data: [
      {
        productId: poloShirtProduct.id,
        materialId: polyesterFabric.id,
        quantityNeeded: 1.5,
        wastePercentage: 6.0,
        createdBy: adminUser.id,
      },
      {
        productId: poloShirtProduct.id,
        materialId: sewingThread.id,
        quantityNeeded: 35.0,
        wastePercentage: 3.0,
        createdBy: adminUser.id,
      },
      {
        productId: poloShirtProduct.id,
        materialId: buttons.id,
        quantityNeeded: 3.0,
        wastePercentage: 2.0,
        createdBy: adminUser.id,
      },
      {
        productId: poloShirtProduct.id,
        materialId: labels.id,
        quantityNeeded: 1.0,
        wastePercentage: 1.0,
        createdBy: adminUser.id,
      },
    ],
  });

  // 11. Create Variant-Specific BOMs (for size adjustments)
  console.log("🔧 Creating variant-specific BOMs...");

  // T-Shirt size-specific material adjustments
  for (const variant of tshirtVariants) {
    const sizeMultiplier =
      variant.sizeName === "XS"
        ? 0.8
        : variant.sizeName === "S"
          ? 0.9
          : variant.sizeName === "M"
            ? 1.0
            : variant.sizeName === "L"
              ? 1.1
              : variant.sizeName === "XL"
                ? 1.2
                : 1.3;

    await prisma.productVariantBOM.createMany({
      data: [
        {
          productVariantId: variant.id,
          materialId: cottonFabric.id,
          quantityNeeded: 1.2 * sizeMultiplier,
          wastePercentage: 5.0,
          notes: `Size ${variant.sizeName} adjustment`,
          createdBy: adminUser.id,
        },
        {
          productVariantId: variant.id,
          materialId: sewingThread.id,
          quantityNeeded: 25.0 * sizeMultiplier,
          wastePercentage: 2.0,
          createdBy: adminUser.id,
        },
        {
          productVariantId: variant.id,
          materialId: labels.id,
          quantityNeeded: 1.0,
          wastePercentage: 1.0,
          createdBy: adminUser.id,
        },
      ],
    });
  }

  // 12. Create Customers
  console.log("👥 Creating customers...");
  const customer1 = await prisma.customer.create({
    data: {
      name: "Fashion Forward Retail",
      code: "CUS-001",
      contactPerson: "Emma Thompson",
      email: "orders@fashionforward.com",
      phone: "+1555-1001",
      address: "789 Retail Plaza",
      city: "Chicago",
      state: "IL",
      country: "USA",
      postalCode: "60601",
      tinNumber: "TIN-123456789",
      creditLimit: 50000.0,
      paymentTerms: "Net 30",
      createdBy: adminUser.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Urban Style Boutique",
      code: "CUS-002",
      contactPerson: "David Rodriguez",
      email: "purchasing@urbanstyle.com",
      phone: "+1555-1002",
      address: "456 Fashion Avenue",
      city: "Miami",
      state: "FL",
      country: "USA",
      postalCode: "33101",
      tinNumber: "TIN-987654321",
      creditLimit: 75000.0,
      paymentTerms: "Net 15",
      createdBy: adminUser.id,
    },
  });

  // 13. Create Customer Orders
  console.log("🛒 Creating customer orders...");
  const order1 = await prisma.customerOrder.create({
    data: {
      orderNumber: "ORD-2024-001",
      customerId: customer1.id,
      orderDate: new Date(),
      requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      totalAmount: 599.5,
      shippingAddress: "789 Retail Plaza, Chicago, IL 60601",
      billingAddress: "789 Retail Plaza, Chicago, IL 60601",
      notes: "Urgent order for spring collection",
      createdBy: adminUser.id,
    },
  });

  const order2 = await prisma.customerOrder.create({
    data: {
      orderNumber: "ORD-2024-002",
      customerId: customer2.id,
      orderDate: new Date(),
      requiredDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
      totalAmount: 899.75,
      shippingAddress: "456 Fashion Avenue, Miami, FL 33101",
      billingAddress: "456 Fashion Avenue, Miami, FL 33101",
      notes: "Regular monthly order",
      createdBy: adminUser.id,
    },
  });

  // 14. Create Order Lines with Variants
  console.log("📦 Creating order lines...");

  // Order 1 Lines - T-Shirts
  await prisma.orderLine.create({
    data: {
      orderId: order1.id,
      productId: tshirtProduct.id,
      productVariantId: tshirtVariants.find(
        (v) => v.sizeName === "M" && v.colorName === "White"
      )?.id,
      quantity: 10,
      unitPrice: 19.99,
      createdBy: adminUser.id,
    },
  });

  await prisma.orderLine.create({
    data: {
      orderId: order1.id,
      productId: tshirtProduct.id,
      productVariantId: tshirtVariants.find(
        (v) => v.sizeName === "L" && v.colorName === "Black"
      )?.id,
      quantity: 15,
      unitPrice: 19.99,
      createdBy: adminUser.id,
    },
  });

  // Order 2 Lines - Polo Shirts
  await prisma.orderLine.create({
    data: {
      orderId: order2.id,
      productId: poloShirtProduct.id,
      productVariantId: poloVariants.find(
        (v) => v.sizeName === "M" && v.colorName === "Navy"
      )?.id,
      quantity: 12,
      unitPrice: 29.99,
      createdBy: adminUser.id,
    },
  });

  await prisma.orderLine.create({
    data: {
      orderId: order2.id,
      productId: poloShirtProduct.id,
      productVariantId: poloVariants.find(
        (v) => v.sizeName === "L" && v.colorName === "White"
      )?.id,
      quantity: 18,
      unitPrice: 29.99,
      createdBy: adminUser.id,
    },
  });

  // 15. Create Sample Production Orders
  console.log("🏭 Creating production orders...");

  const productionOrder1 = await prisma.productionOrder.create({
    data: {
      productId: tshirtProduct.id,
      productVariantId: tshirtVariants.find(
        (v) => v.sizeName === "M" && v.colorName === "White"
      )?.id,
      quantity: 10,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      status: Status.IN_PROGRESS,
      priority: Priority.HIGH,
      customerOrderId: order1.id,
      notes: "Urgent production for Fashion Forward",
      plannedMaterialCost: 85.0,
      createdBy: adminUser.id,
    },
  });

  const productionOrder2 = await prisma.productionOrder.create({
    data: {
      productId: poloShirtProduct.id,
      productVariantId: poloVariants.find(
        (v) => v.sizeName === "L" && v.colorName === "Navy"
      )?.id,
      quantity: 12,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: Status.PENDING,
      priority: Priority.MEDIUM,
      customerOrderId: order2.id,
      notes: "Standard production order",
      plannedMaterialCost: 144.0,
      createdBy: adminUser.id,
    },
  });

  // 16. Create Operations for Production Orders
  console.log("⚙️ Creating operations...");

  // Operations for Production Order 1
  await prisma.operation.create({
    data: {
      workCenterId: cuttingCenter.id,
      productionOrderId: productionOrder1.id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      status: Status.COMPLETED,
      cost: 25.0,
      assignedToId: workerUser.id,
      performedById: workerUser.id,
      notes: "Pattern cutting completed",
      createdBy: adminUser.id,
    },
  });

  await prisma.operation.create({
    data: {
      workCenterId: sewingCenter.id,
      productionOrderId: productionOrder1.id,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 4 hours
      status: Status.IN_PROGRESS,
      cost: 40.0,
      assignedToId: workerUser.id,
      notes: "Sewing in progress",
      createdBy: adminUser.id,
    },
  });

  // 17. Create Quality Checks
  console.log("🔍 Creating quality checks...");

  await prisma.qualityCheck.create({
    data: {
      productionOrderId: productionOrder1.id,
      inspectorId: inspectorUser.id,
      checkDate: new Date(),
      status: Status.COMPLETED,
      defectsFound: "Minor stitching irregularity on 2 units",
      actionTaken: "Rework completed, units passed secondary inspection",
      notes: "Overall quality good, minor issues resolved",
      createdBy: adminUser.id,
    },
  });

  // 18. Create Purchase Orders
  console.log("📄 Creating purchase orders...");

  const purchaseOrder1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2024-001",
      supplierId: fabricSupplier.id,
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      totalAmount: 2500.0,
      notes: "Monthly fabric replenishment",
      createdBy: adminUser.id,
    },
  });

  await prisma.purchaseOrderLine.create({
    data: {
      poId: purchaseOrder1.id,
      materialId: cottonFabric.id,
      quantity: 200,
      unitPrice: 12.5,
      notes: "White cotton fabric for t-shirt production",
      createdBy: adminUser.id,
    },
  });

  console.log("✅ Database seeding completed successfully!");
  console.log("\n📊 Summary of created records:");
  console.log(`👥 Users: 3 (admin, worker, inspector)`);
  console.log(`📏 Units of Measure: 4`);
  console.log(`🧱 Material Types: 4`);
  console.log(`📂 Product Categories: 2`);
  console.log(`🏭 Suppliers: 2`);
  console.log(`🧵 Materials: 5`);
  console.log(`🏭 Work Centers: 4`);
  console.log(`👕 Products: 2 (with variants)`);
  console.log(
    `🎨 Product Variants: ${tshirtVariants.length + poloVariants.length}`
  );
  console.log(`📋 BOMs: Product + Variant specific`);
  console.log(`👥 Customers: 2`);
  console.log(`🛒 Customer Orders: 2`);
  console.log(`📦 Order Lines: 4`);
  console.log(`🏭 Production Orders: 2`);
  console.log(`⚙️ Operations: 2`);
  console.log(`🔍 Quality Checks: 1`);
  console.log(`📄 Purchase Orders: 1`);

  console.log("\n🔑 Test Login Credentials:");
  console.log("Admin: admin@xgenmrp.com / password123");
  console.log("Worker: worker@xgenmrp.com / password123");
  console.log("Inspector: inspector@xgenmrp.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
