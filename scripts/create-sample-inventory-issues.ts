import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createSampleInventoryIssues() {
  try {
    console.log("Creating sample inventory issue reports...");

    // First, let's get some inventory items to create issues for
    const inventoryItems = await prisma.inventoryItem.findMany({
      take: 5,
      orderBy: { name: "asc" },
    });

    if (inventoryItems.length === 0) {
      console.log(
        "No inventory items found. Creating some sample inventory items first..."
      );

      // Create some sample inventory items if they don't exist
      const sampleItems = [
        {
          sku: "COMP-001",
          name: "Cotton Fabric - White",
          description: "High-quality cotton fabric for garment production",
          materialType: "FABRIC",
          locationId: "LOC-001",
          unit: "METER",
          currentStock: 50,
          minimumStockLevel: 100,
          criticalStockLevel: 25,
          reorderQuantity: 200,
          leadTime: 7,
          cost: 15.5,
          qrCode: "QR-COMP-001",
          notes: "Primary fabric for shirt production",
        },
        {
          sku: "COMP-002",
          name: "Polyester Thread - Black",
          description: "Strong polyester thread for sewing",
          materialType: "THREAD",
          locationId: "LOC-001",
          unit: "SPOOL",
          currentStock: 5,
          minimumStockLevel: 20,
          criticalStockLevel: 10,
          reorderQuantity: 50,
          leadTime: 3,
          cost: 8.75,
          qrCode: "QR-COMP-002",
          notes: "General purpose sewing thread",
        },
        {
          sku: "COMP-003",
          name: "Shirt Buttons - White",
          description: "Standard white buttons for shirts",
          materialType: "ACCESSORY",
          locationId: "LOC-001",
          unit: "PIECE",
          currentStock: 0,
          minimumStockLevel: 500,
          criticalStockLevel: 100,
          reorderQuantity: 1000,
          leadTime: 14,
          cost: 0.25,
          qrCode: "QR-COMP-003",
          notes: "Standard 4-hole buttons",
        },
      ];

      // Create a location first if it doesn't exist
      await prisma.location.upsert({
        where: { id: "LOC-001" },
        update: {},
        create: {
          id: "LOC-001",
          name: "Main Warehouse",
          description: "Primary storage location",
          locationType: "STORAGE",
          isPublic: true,
          capacity: 1000,
        },
      });

      // Create the inventory items
      for (const item of sampleItems) {
        await prisma.inventoryItem.create({
          data: item,
        });
      }

      // Refresh the inventory items list
      const newInventoryItems = await prisma.inventoryItem.findMany({
        take: 5,
        orderBy: { name: "asc" },
      });
      inventoryItems.push(...newInventoryItems);
    }

    // Get a user to be the reporter (preferably a worker)
    const user = await prisma.user.findFirst({
      where: { role: "WORKER" },
      include: { profile: true },
    });

    if (!user) {
      console.log("No worker user found. Please create a worker user first.");
      return;
    }

    // Create sample issue reports
    const sampleIssues = [
      {
        inventoryItemId: inventoryItems[0].id,
        reportType: "LOW_STOCK",
        reportedById: user.id,
        description:
          "Stock level is below minimum threshold. Need to reorder soon.",
        severity: "MEDIUM",
        status: "OPEN",
      },
      {
        inventoryItemId: inventoryItems[1].id,
        reportType: "DISCREPANCY",
        reportedById: user.id,
        description:
          "Physical count shows 3 spools but system shows 5. Need to investigate.",
        severity: "HIGH",
        status: "IN_PROGRESS",
      },
      {
        inventoryItemId: inventoryItems[2].id,
        reportType: "LOW_STOCK",
        reportedById: user.id,
        description: "Completely out of stock. Production is blocked.",
        severity: "HIGH",
        status: "OPEN",
      },
      {
        inventoryItemId: inventoryItems[0].id,
        reportType: "QUALITY",
        reportedById: user.id,
        description:
          "Some fabric rolls have stains and cannot be used for production.",
        severity: "MEDIUM",
        status: "RESOLVED",
        resolvedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        resolution:
          "Defective fabric returned to supplier. Replacement received.",
      },
      {
        inventoryItemId: inventoryItems[1].id,
        reportType: "DAMAGE",
        reportedById: user.id,
        description: "Several thread spools damaged during transport.",
        severity: "LOW",
        status: "CLOSED",
        resolvedDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        resolution: "Damaged spools disposed of. Insurance claim filed.",
      },
    ];

    // Create the issue reports
    for (const issue of sampleIssues) {
      await prisma.inventoryIssueReport.create({
        data: issue,
      });
    }

    console.log(
      `Created ${sampleIssues.length} sample inventory issue reports.`
    );
    console.log("Sample data created successfully!");
  } catch (error) {
    console.error("Error creating sample inventory issues:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleInventoryIssues();
