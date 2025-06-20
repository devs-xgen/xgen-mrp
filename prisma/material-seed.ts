import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMaterials() {
  console.log("🌱 Seeding materials...");

  try {
    // First, ensure we have material types and units of measure
    const fabricType = await prisma.materialType.upsert({
      where: { name: "Fabric" },
      update: {},
      create: {
        name: "Fabric",
        description: "Textile materials for garment construction",
        status: "ACTIVE",
      },
    });

    const trimType = await prisma.materialType.upsert({
      where: { name: "Trim" },
      update: {},
      create: {
        name: "Trim",
        description: "Decorative and functional trims",
        status: "ACTIVE",
      },
    });

    const hardwareType = await prisma.materialType.upsert({
      where: { name: "Hardware" },
      update: {},
      create: {
        name: "Hardware",
        description: "Buttons, zippers, snaps, and other hardware",
        status: "ACTIVE",
      },
    });

    const threadType = await prisma.materialType.upsert({
      where: { name: "Thread" },
      update: {},
      create: {
        name: "Thread",
        description: "Sewing threads and yarns",
        status: "ACTIVE",
      },
    });

    const packagingType = await prisma.materialType.upsert({
      where: { name: "Packaging" },
      update: {},
      create: {
        name: "Packaging",
        description: "Labels, tags, and packaging materials",
        status: "ACTIVE",
      },
    });

    // Units of measure
    const yardUnit = await prisma.unitOfMeasure.upsert({
      where: { name: "Yard" },
      update: {},
      create: {
        name: "Yard",
        symbol: "yd",
        description: "Linear measurement for fabric",
        status: "ACTIVE",
      },
    });

    const meterUnit = await prisma.unitOfMeasure.upsert({
      where: { name: "Meter" },
      update: {},
      create: {
        name: "Meter",
        symbol: "m",
        description: "Linear measurement for fabric",
        status: "ACTIVE",
      },
    });

    const pieceUnit = await prisma.unitOfMeasure.upsert({
      where: { name: "Piece" },
      update: {},
      create: {
        name: "Piece",
        symbol: "pc",
        description: "Individual pieces or units",
        status: "ACTIVE",
      },
    });

    const setUnit = await prisma.unitOfMeasure.upsert({
      where: { name: "Set" },
      update: {},
      create: {
        name: "Set",
        symbol: "set",
        description: "Set of multiple pieces",
        status: "ACTIVE",
      },
    });

    const rollUnit = await prisma.unitOfMeasure.upsert({
      where: { name: "Roll" },
      update: {},
      create: {
        name: "Roll",
        symbol: "roll",
        description: "Roll of material",
        status: "ACTIVE",
      },
    });

    // Create supplier
    const supplier = await prisma.supplier.upsert({
      where: { code: "MAIN-SUP-001" },
      update: {},
      create: {
        name: "Main Textile Supplier",
        code: "MAIN-SUP-001",
        contactPerson: "John Doe",
        email: "john@maintextile.com",
        phone: "+63-2-8123-4567",
        address: "123 Textile Street",
        city: "Manila",
        state: "Metro Manila",
        country: "Philippines",
        postalCode: "1000",
        leadTime: 7,
        status: "ACTIVE",
      },
    });

    // Materials data
    const materialsData = [
      // Fabrics
      {
        name: "Cotton Jersey - White",
        sku: "FAB-COT-JER-WHT-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 150.0,
        currentStock: 500,
        minimumStockLevel: 50,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Premium quality cotton jersey fabric, 160gsm",
      },
      {
        name: "Cotton Jersey - Black",
        sku: "FAB-COT-JER-BLK-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 150.0,
        currentStock: 450,
        minimumStockLevel: 50,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Premium quality cotton jersey fabric, 160gsm",
      },
      {
        name: "Cotton Jersey - Navy Blue",
        sku: "FAB-COT-JER-NAV-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 155.0,
        currentStock: 300,
        minimumStockLevel: 50,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Premium quality cotton jersey fabric, 160gsm",
      },
      {
        name: "Cotton Jersey - Red",
        sku: "FAB-COT-JER-RED-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 155.0,
        currentStock: 200,
        minimumStockLevel: 30,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Premium quality cotton jersey fabric, 160gsm",
      },
      {
        name: "Cotton Jersey - Gray",
        sku: "FAB-COT-JER-GRY-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 152.0,
        currentStock: 250,
        minimumStockLevel: 40,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Premium quality cotton jersey fabric, 160gsm",
      },
      {
        name: "Polyester Blend - White",
        sku: "FAB-POL-BLD-WHT-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 120.0,
        currentStock: 400,
        minimumStockLevel: 60,
        leadTime: 5,
        supplierId: supplier.id,
        notes: "65% polyester, 35% cotton blend fabric",
      },
      {
        name: "Polyester Blend - Black",
        sku: "FAB-POL-BLD-BLK-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 120.0,
        currentStock: 350,
        minimumStockLevel: 60,
        leadTime: 5,
        supplierId: supplier.id,
        notes: "65% polyester, 35% cotton blend fabric",
      },
      {
        name: "Denim Fabric - Blue",
        sku: "FAB-DEN-BLU-001",
        typeId: fabricType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 220.0,
        currentStock: 180,
        minimumStockLevel: 25,
        leadTime: 10,
        supplierId: supplier.id,
        notes: "100% cotton denim, 12oz weight",
      },

      // Threads
      {
        name: "Polyester Thread - White",
        sku: "THR-POL-WHT-001",
        typeId: threadType.id,
        unitOfMeasureId: rollUnit.id,
        costPerUnit: 45.0,
        currentStock: 200,
        minimumStockLevel: 20,
        leadTime: 3,
        supplierId: supplier.id,
        notes: "High-strength polyester thread, 40wt",
      },
      {
        name: "Polyester Thread - Black",
        sku: "THR-POL-BLK-001",
        typeId: threadType.id,
        unitOfMeasureId: rollUnit.id,
        costPerUnit: 45.0,
        currentStock: 180,
        minimumStockLevel: 20,
        leadTime: 3,
        supplierId: supplier.id,
        notes: "High-strength polyester thread, 40wt",
      },
      {
        name: "Polyester Thread - Navy",
        sku: "THR-POL-NAV-001",
        typeId: threadType.id,
        unitOfMeasureId: rollUnit.id,
        costPerUnit: 48.0,
        currentStock: 120,
        minimumStockLevel: 15,
        leadTime: 3,
        supplierId: supplier.id,
        notes: "High-strength polyester thread, 40wt",
      },
      {
        name: "Polyester Thread - Red",
        sku: "THR-POL-RED-001",
        typeId: threadType.id,
        unitOfMeasureId: rollUnit.id,
        costPerUnit: 48.0,
        currentStock: 90,
        minimumStockLevel: 10,
        leadTime: 3,
        supplierId: supplier.id,
        notes: "High-strength polyester thread, 40wt",
      },

      // Hardware
      {
        name: "Plastic Buttons - White (Set of 10)",
        sku: "HW-BTN-PLS-WHT-010",
        typeId: hardwareType.id,
        unitOfMeasureId: setUnit.id,
        costPerUnit: 25.0,
        currentStock: 150,
        minimumStockLevel: 20,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "15mm plastic buttons, 4-hole design",
      },
      {
        name: "Plastic Buttons - Black (Set of 10)",
        sku: "HW-BTN-PLS-BLK-010",
        typeId: hardwareType.id,
        unitOfMeasureId: setUnit.id,
        costPerUnit: 25.0,
        currentStock: 130,
        minimumStockLevel: 20,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "15mm plastic buttons, 4-hole design",
      },
      {
        name: "Metal Zipper - 6 inch",
        sku: "HW-ZIP-MTL-06IN-001",
        typeId: hardwareType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 35.0,
        currentStock: 200,
        minimumStockLevel: 25,
        leadTime: 5,
        supplierId: supplier.id,
        notes: "Brass metal zipper, standard pull",
      },
      {
        name: "Metal Zipper - 8 inch",
        sku: "HW-ZIP-MTL-08IN-001",
        typeId: hardwareType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 42.0,
        currentStock: 180,
        minimumStockLevel: 25,
        leadTime: 5,
        supplierId: supplier.id,
        notes: "Brass metal zipper, standard pull",
      },
      {
        name: "Snap Fasteners - Silver (Set of 20)",
        sku: "HW-SNP-SLV-020",
        typeId: hardwareType.id,
        unitOfMeasureId: setUnit.id,
        costPerUnit: 60.0,
        currentStock: 80,
        minimumStockLevel: 15,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Metal snap fasteners, 10mm diameter",
      },

      // Trims
      {
        name: "Cotton Ribbing - White",
        sku: "TRM-RIB-COT-WHT-001",
        typeId: trimType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 85.0,
        currentStock: 150,
        minimumStockLevel: 20,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "2x2 cotton ribbing for collars and cuffs",
      },
      {
        name: "Cotton Ribbing - Black",
        sku: "TRM-RIB-COT-BLK-001",
        typeId: trimType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 85.0,
        currentStock: 120,
        minimumStockLevel: 20,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "2x2 cotton ribbing for collars and cuffs",
      },
      {
        name: "Elastic Band - 1 inch",
        sku: "TRM-ELS-01IN-001",
        typeId: trimType.id,
        unitOfMeasureId: yardUnit.id,
        costPerUnit: 30.0,
        currentStock: 300,
        minimumStockLevel: 50,
        leadTime: 5,
        supplierId: supplier.id,
        notes: "High-quality elastic for waistbands",
      },

      // Packaging
      {
        name: "Brand Labels - Woven",
        sku: "PKG-LBL-WVN-001",
        typeId: packagingType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 8.5,
        currentStock: 1000,
        minimumStockLevel: 100,
        leadTime: 14,
        supplierId: supplier.id,
        notes: "Custom woven brand labels with logo",
      },
      {
        name: "Care Labels - Printed",
        sku: "PKG-LBL-CRE-001",
        typeId: packagingType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 3.5,
        currentStock: 2000,
        minimumStockLevel: 200,
        leadTime: 10,
        supplierId: supplier.id,
        notes: "Printed care instruction labels",
      },
      {
        name: "Size Labels - S",
        sku: "PKG-LBL-SZ-S-001",
        typeId: packagingType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 2.5,
        currentStock: 800,
        minimumStockLevel: 100,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Size S woven labels",
      },
      {
        name: "Size Labels - M",
        sku: "PKG-LBL-SZ-M-001",
        typeId: packagingType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 2.5,
        currentStock: 1200,
        minimumStockLevel: 150,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Size M woven labels",
      },
      {
        name: "Size Labels - L",
        sku: "PKG-LBL-SZ-L-001",
        typeId: packagingType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 2.5,
        currentStock: 1000,
        minimumStockLevel: 120,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Size L woven labels",
      },
      {
        name: "Size Labels - XL",
        sku: "PKG-LBL-SZ-XL-001",
        typeId: packagingType.id,
        unitOfMeasureId: pieceUnit.id,
        costPerUnit: 2.5,
        currentStock: 600,
        minimumStockLevel: 80,
        leadTime: 7,
        supplierId: supplier.id,
        notes: "Size XL woven labels",
      },
    ];

    // Create materials
    for (const materialData of materialsData) {
      await prisma.material.upsert({
        where: { sku: materialData.sku },
        update: {
          currentStock: materialData.currentStock,
          costPerUnit: materialData.costPerUnit,
        },
        create: materialData,
      });
    }

    console.log(`✅ Successfully seeded ${materialsData.length} materials`);
    console.log("📊 Material breakdown:");
    console.log(
      `   - Fabrics: ${materialsData.filter((m) => m.typeId === fabricType.id).length}`
    );
    console.log(
      `   - Threads: ${materialsData.filter((m) => m.typeId === threadType.id).length}`
    );
    console.log(
      `   - Hardware: ${materialsData.filter((m) => m.typeId === hardwareType.id).length}`
    );
    console.log(
      `   - Trims: ${materialsData.filter((m) => m.typeId === trimType.id).length}`
    );
    console.log(
      `   - Packaging: ${materialsData.filter((m) => m.typeId === packagingType.id).length}`
    );
  } catch (error) {
    console.error("❌ Error seeding materials:", error);
    throw error;
  }
}

export default seedMaterials;

// If running directly
if (require.main === module) {
  seedMaterials()
    .then(() => {
      console.log("🎉 Material seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Material seeding failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
