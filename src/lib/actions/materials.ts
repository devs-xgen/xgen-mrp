// src/lib/actions/materials.ts
"use server";

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Material, MaterialCreateInput, MaterialUpdateInput } from "@/types/admin/materials"
import { Prisma, Status } from "@prisma/client"
import { convertDecimalsToNumbers } from "@/types/admin/product";

// Check if a material SKU is available. Optional excludeId to ignore an existing material.
export async function isMaterialSkuAvailable(sku: string, excludeId?: string) {
  try {
    const existing = await prisma.material.findFirst({
      where: {
        sku,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return { available: !existing };
  } catch (error) {
    console.error("Error checking material SKU availability:", error);
    return { available: false, error: "Unable to check SKU" };
  }
}

// ---------------- Exports (CSV / Excel) ----------------

export async function exportMaterialsData(filters?: {
  search?: string;
  statusIn?: ("ACTIVE" | "ARCHIVED")[];
  typeIds?: string[];
  supplierIds?: string[];
  uomIds?: string[]; // unit of measure ids
}): Promise<{ csvContent: string; filename: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    throw new Error("Unauthorized: Please log in to export data");

  const where: any = {};
  if (filters?.statusIn?.length) {
    where.status = { in: filters.statusIn as any };
  } else {
    where.status = { not: Status.ARCHIVED };
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.typeIds?.length) where.typeId = { in: filters.typeIds };
  if (filters?.supplierIds?.length)
    where.supplierId = { in: filters.supplierIds };
  if (filters?.uomIds?.length) where.unitOfMeasureId = { in: filters.uomIds };

  const materials = await prisma.material.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      type: { select: { name: true } },
      unitOfMeasure: { select: { name: true, symbol: true } },
      supplier: { select: { name: true } },
    },
  });

  const headers = [
    "Material Name",
    "SKU",
    "Type",
    "Unit",
    "Supplier",
    "Cost / Unit",
    "Current Stock",
    "Min Stock Level",
    "Lead Time (days)",
    "Status",
  ];

  const toNum = (v: any) =>
    typeof v === "number" ? v : v?.toNumber ? v.toNumber() : Number(v ?? 0);
  const esc = (val: any) => {
    const s = val == null ? "" : String(val);
    return s.includes('"') || s.includes(",") || s.includes("\n")
      ? '"' + s.replaceAll('"', '""') + '"'
      : s;
  };

  const rows = materials.map((m: any) =>
    [
      m.name,
      m.sku,
      m.type?.name || "",
      m.unitOfMeasure
        ? `${m.unitOfMeasure.name} (${m.unitOfMeasure.symbol})`
        : "",
      m.supplier?.name || "",
      toNum(m.costPerUnit),
      Number(m.currentStock ?? 0),
      Number(m.minimumStockLevel ?? 0),
      Number(m.leadTime ?? 0),
      m.status,
    ]
      .map(esc)
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const today = new Date();
  const filename = `materials-export-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.csv`;

  return { csvContent, filename };
}

export async function exportMaterialsExcel(filters?: {
  search?: string;
  statusIn?: ("ACTIVE" | "ARCHIVED")[];
  typeIds?: string[];
  supplierIds?: string[];
  uomIds?: string[];
}): Promise<{ base64: string; filename: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Authentication required.");

  const { default: ExcelJS } = await import("exceljs");

  const where: any = {};
  if (filters?.statusIn?.length) where.status = { in: filters.statusIn as any };
  else where.status = { not: Status.ARCHIVED };
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.typeIds?.length) where.typeId = { in: filters.typeIds };
  if (filters?.supplierIds?.length)
    where.supplierId = { in: filters.supplierIds };
  if (filters?.uomIds?.length) where.unitOfMeasureId = { in: filters.uomIds };

  const materials = await prisma.material.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      type: { select: { name: true } },
      unitOfMeasure: { select: { name: true, symbol: true } },
      supplier: { select: { name: true } },
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Materials");
  const headers = [
    "Material Name",
    "SKU",
    "Type",
    "Unit",
    "Supplier",
    "Cost / Unit",
    "Current Stock",
    "Min Stock Level",
    "Lead Time (days)",
    "Status",
  ];
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };

  materials.forEach((m: any) => {
    ws.addRow([
      m.name,
      m.sku,
      m.type?.name || "",
      m.unitOfMeasure
        ? `${m.unitOfMeasure.name} (${m.unitOfMeasure.symbol})`
        : "",
      m.supplier?.name || "",
      Number(m.costPerUnit ?? 0),
      Number(m.currentStock ?? 0),
      Number(m.minimumStockLevel ?? 0),
      Number(m.leadTime ?? 0),
      m.status,
    ]);
  });

  // Number formats
  ws.getColumn(6).numFmt = "#,##0.00"; // Cost / Unit
  ws.getColumn(7).numFmt = "#,##0"; // Current Stock
  ws.getColumn(8).numFmt = "#,##0"; // Min Stock Level
  ws.getColumn(9).numFmt = "#,##0"; // Lead Time

  // Auto width
  ws.columns.forEach((c: any) => {
    let max = 10;
    c.eachCell({ includeEmpty: true }, (cell: any) => {
      const v = cell.value as any;
      const len = v ? String(v).length : 0;
      if (len > max) max = len;
    });
    c.width = Math.min(42, max + 2);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const ts = new Date().toISOString().split("T")[0];
  return { base64, filename: `materials-export-${ts}.xlsx` };
}

async function createLowStockAlert({
  materialId,
  currentLevel,
  minimumLevel,
  createdBy,
}: {
  materialId: string;
  currentLevel: number;
  minimumLevel: number;
  createdBy: string;
}) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        supplier: true,
        unitOfMeasure: true,
      },
    });

    if (!material) {
      throw new Error("Material not found");
    }
    const suggestedOrderQuantity = Math.max(minimumLevel * 2 - currentLevel, 0);

    console.warn(
      `LOW STOCK ALERT: Material "${material.name}" (SKU: ${material.sku}) has fallen below minimum stock level. Current: ${currentLevel} ${material.unitOfMeasure?.symbol || "units"}, Minimum: ${minimumLevel} ${material.unitOfMeasure?.symbol || "units"}.`
    );

    return true;
  } catch (error) {
    console.error("Error creating low stock alert:", error);
    return false;
  }
}

export async function getAllMaterials(): Promise<Material[]> {
  try {
    const materials = await prisma.material.findMany({
      where: {
        status: { not: Status.ARCHIVED },
        deletedAt: null,
      },
      include: {
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        unitOfMeasure: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Properly convert Decimal values to numbers to match Material interface
    const convertedMaterials = materials.map((material) => {
      // First handle the Decimal conversion for costPerUnit
      const costPerUnit =
        typeof material.costPerUnit === "object" &&
        "toNumber" in material.costPerUnit
          ? material.costPerUnit.toNumber()
          : Number(material.costPerUnit);

      // Then return a properly shaped Material object
      return {
        ...material,
        costPerUnit, // Replace the Decimal with number
        // Make sure all required Material interface properties are present
        boms: [], // Add empty array if it's required in your Material interface
      } as Material; // Explicit casting to Material type
    });

    return convertedMaterials;
  } catch (error) {
    console.error("Error fetching materials:", error);
    throw new Error("Failed to fetch materials");
  }
}

// Get archived materials for admin listing
export async function getArchivedMaterials(): Promise<Material[]> {
  try {
    const materials = await prisma.material.findMany({
      where: { status: Status.ARCHIVED },
      include: {
        type: { select: { id: true, name: true } },
        unitOfMeasure: { select: { id: true, name: true, symbol: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    // Convert Decimal to number to align with Material type usage in UI
    const converted = materials.map((m: any) => ({
      ...m,
      costPerUnit:
        typeof m.costPerUnit === "object" && "toNumber" in m.costPerUnit
          ? m.costPerUnit.toNumber()
          : Number(m.costPerUnit),
      boms: m.boms ?? [],
    })) as Material[];

    return converted;
  } catch (error) {
    console.error("Error fetching archived materials:", error);
    throw new Error("Failed to fetch archived materials");
  }
}

// Unarchive a material
export async function unarchiveMaterial(id: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "system";

    await prisma.material.update({
      where: { id },
      data: {
        status: Status.ACTIVE,
        archivedAt: null,
        archivedBy: null,
        archivedReason: null,
        modifiedBy: userId,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/materials/archived");
    return { success: true, message: "Material unarchived successfully" };
  } catch (error) {
    console.error("Error unarchiving material:", error);
    return { success: false, error: "Failed to unarchive material" };
  }
}

export async function getMaterialTypes() {
  try {
    return await prisma.materialType.findMany({
      where: {
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching material types:", error);
    throw new Error("Failed to fetch material types");
  }
}

export async function getUnitOfMeasures() {
  try {
    return await prisma.unitOfMeasure.findMany({
      where: {
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching units of measure:", error);
    throw new Error("Failed to fetch units of measure");
  }
}

export async function getSuppliers() {
  try {
    return await prisma.supplier.findMany({
      where: {
        status: Status.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw new Error("Failed to fetch suppliers");
  }
}

export async function createMaterial(data: MaterialCreateInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const costPerUnit =
      typeof data.costPerUnit === "string"
        ? parseFloat(data.costPerUnit)
        : data.costPerUnit;

    if (isNaN(costPerUnit)) {
      throw new Error("Invalid cost per unit value");
    }

    // Prepare create data with only the fields that exist in the Prisma schema
    const createData: any = {
      name: data.name,
      sku: data.sku,
      costPerUnit,
      currentStock: data.currentStock,
      minimumStockLevel: data.minimumStockLevel,
      leadTime: data.leadTime,
      notes: data.notes,
      status: Status.ACTIVE,
      createdBy: session.user.id,
    };

    // Only add committedStock if it exists (this field exists in the schema)
    if (data.committedStock !== undefined) {
      createData.committedStock = data.committedStock;
    }

    // Handle relations
    if (data.typeId) {
      createData.type = { connect: { id: data.typeId } };
    }

    if (data.unitOfMeasureId) {
      createData.unitOfMeasure = { connect: { id: data.unitOfMeasureId } };
    }

    if (data.supplierId) {
      createData.supplier = { connect: { id: data.supplierId } };
    }

    const material = await prisma.material.create({
      data: createData,
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
        boms: {
          include: {
            product: true,
          },
        },
      },
    });

    // Properly convert to match Material interface
    // Add the virtual fields that are in the interface but not in the database
    const result = {
      ...material,
      costPerUnit:
        typeof material.costPerUnit === "object" &&
        "toNumber" in material.costPerUnit
          ? material.costPerUnit.toNumber()
          : Number(material.costPerUnit),
      // Add virtual fields for the TypeScript interface
      calculatedStock:
        data.calculatedStock !== undefined
          ? data.calculatedStock
          : (data.currentStock || 0) - (data.committedStock || 0),
      expectedStock: data.expectedStock || 0,
      boms: [], // Add any other required properties from your Material interface
    } as Material;

    revalidatePath("/admin/materials");
    return result;
  } catch (error) {
    console.error("Error creating material:", error);
    throw new Error(
      `Failed to create material: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Bulk create materials in one request
export async function createMaterialsBulk(items: MaterialCreateInput[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No materials to create");
    }

    // Map to Prisma data payloads. Use direct foreign keys for createMany.
    const data = items.map((m) => {
      const costPerUnit =
        typeof m.costPerUnit === "string"
          ? parseFloat(m.costPerUnit as any)
          : m.costPerUnit;
      if (isNaN(Number(costPerUnit))) {
        throw new Error(`Invalid costPerUnit for SKU ${m.sku}`);
      }
      return {
        name: m.name,
        sku: m.sku,
        typeId: m.typeId,
        unitOfMeasureId: m.unitOfMeasureId,
        costPerUnit: costPerUnit as number,
        currentStock: m.currentStock,
        minimumStockLevel: m.minimumStockLevel,
        leadTime: m.leadTime,
        supplierId: m.supplierId,
        notes: m.notes ?? null,
        status: Status.ACTIVE,
        createdBy: session.user.id,
        // Optional fields available in schema
        committedStock: m.committedStock ?? undefined,
      } as any;
    });

    const result = await prisma.material.createMany({
      data,
      skipDuplicates: true, // respects unique constraints like sku
    });

    revalidatePath("/admin/materials");
    return {
      success: true,
      insertedCount: result.count,
      attempted: items.length,
    };
  } catch (error) {
    console.error("Error bulk-creating materials:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateMaterial(data: MaterialUpdateInput) {
  try {
    // Get the current user for audit trail
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "system";

    // Initialize update data with audit fields
    const updateData: any = {
      modifiedBy: userId,
      updatedAt: new Date(),
    };

    // Only add fields to updateData if they exist in Prisma schema
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.costPerUnit !== undefined)
      updateData.costPerUnit = data.costPerUnit;
    if (data.currentStock !== undefined)
      updateData.currentStock = data.currentStock;
    if (data.minimumStockLevel !== undefined)
      updateData.minimumStockLevel = data.minimumStockLevel;
    if (data.leadTime !== undefined) updateData.leadTime = data.leadTime;
    if (data.committedStock !== undefined)
      updateData.committedStock = data.committedStock;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // NOTE: We don't include calculatedStock or expectedStock as they're not in the Prisma schema

    // Handle relations with connect if IDs are provided
    if (data.typeId) {
      updateData.type = { connect: { id: data.typeId } };
    }

    if (data.unitOfMeasureId) {
      updateData.unitOfMeasure = { connect: { id: data.unitOfMeasureId } };
    }

    if (data.supplierId) {
      updateData.supplier = { connect: { id: data.supplierId } };
    }

    // Update the material in the database
    const updatedMaterial = await prisma.material.update({
      where: { id: data.id },
      data: updateData,
      include: {
        supplier: true,
        type: true,
        unitOfMeasure: true,
        boms: {
          include: {
            product: true,
          },
        },
        purchaseOrderLines: {
          include: {
            purchaseOrder: true,
          },
        },
      },
    });

    // Check for low stock levels and create alerts if necessary
    const currentStock =
      data.currentStock !== undefined
        ? data.currentStock
        : updatedMaterial.currentStock;
    const minimumLevel =
      data.minimumStockLevel !== undefined
        ? data.minimumStockLevel
        : updatedMaterial.minimumStockLevel;

    if (currentStock <= minimumLevel) {
      await createLowStockAlert({
        materialId: data.id,
        currentLevel: currentStock,
        minimumLevel: minimumLevel,
        createdBy: userId,
      });
    }

    // Revalidate paths
    revalidatePath("/admin/materials");
    revalidatePath("/materials");
    revalidatePath(`/materials/${data.id}`);

    // Return the updated material with converted values for the TypeScript interface
    const result = {
      ...updatedMaterial,
      costPerUnit:
        typeof updatedMaterial.costPerUnit === "object" &&
        "toNumber" in updatedMaterial.costPerUnit
          ? updatedMaterial.costPerUnit.toNumber()
          : Number(updatedMaterial.costPerUnit),
      // Add virtual fields for the TypeScript interface
      calculatedStock:
        data.calculatedStock !== undefined
          ? data.calculatedStock
          : currentStock -
            (data.committedStock || updatedMaterial.committedStock),
      expectedStock: data.expectedStock || 0,
    };

    return result;
  } catch (error) {
    console.error("Error updating material:", error);
    throw new Error(
      `Failed to update material: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getMaterialById(id: string): Promise<Material | null> {
  try {
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
        boms: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!material) {
      return null;
    }

    const materialData = JSON.parse(JSON.stringify(material));

    return materialData as Material;
  } catch (error) {
    console.error("Error fetching material by ID:", error);
    throw new Error("Failed to fetch material");
  }
}

export async function deleteMaterial(id: string, reason?: string) {
  try {
    // Soft-delete (archive) the material instead of hard delete
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "system";

    await prisma.material.update({
      where: { id },
      data: {
        status: Status.ARCHIVED,
        archivedAt: new Date(),
        archivedBy: userId,
        archivedReason: reason || "Archived via admin UI",
        updatedAt: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath("/admin/materials");
    revalidatePath("/materials");

    return { success: true, message: "Material archived successfully" };
  } catch (error) {
    console.error("Error archiving material:", error);
    throw new Error(
      `Failed to archive material: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Paginated fetch for materials
export async function getPaginatedMaterials({
  page = 1,
  limit = 10,
  search = "",
  status,
  typeId,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: Status;
  typeId?: string;
}) {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.MaterialWhereInput = {};

    if (status) {
      where.status = status;
    } else {
      where.status = { not: Status.ARCHIVED };
    }

    if (typeId) {
      where.typeId = typeId;
    }

    const searchTerm = search.trim();
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { sku: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          type: { select: { id: true, name: true } },
          unitOfMeasure: { select: { id: true, name: true, symbol: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.material.count({ where }),
    ]);

    // Convert Decimal to number
    const convertedMaterials = materials.map((material) => ({
      ...material,
      costPerUnit:
        typeof material.costPerUnit === "object" &&
        "toNumber" in material.costPerUnit
          ? material.costPerUnit.toNumber()
          : Number(material.costPerUnit),
      boms: [],
    })) as Material[];

    return {
      data: convertedMaterials,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching paginated materials:", error);
    throw new Error("Failed to fetch paginated materials");
  }
}

export async function getMaterialStats() {
  try {
    const [total, active, lowStock] = await Promise.all([
      prisma.material.count({ where: { status: { not: Status.ARCHIVED } } }),
      prisma.material.count({ where: { status: Status.ACTIVE } }),
      prisma.material.findMany({
        where: {
          status: { not: Status.ARCHIVED },
          currentStock: { lte: prisma.material.fields.minimumStockLevel },
        },
        select: { id: true },
      }),
    ]);

    return {
      totalMaterials: total,
      activeMaterials: active,
      inactiveMaterials: total - active,
      lowStockCount: lowStock.length,
    };
  } catch (error) {
    console.error("Error fetching material stats:", error);
    return {
      totalMaterials: 0,
      activeMaterials: 0,
      inactiveMaterials: 0,
      lowStockCount: 0,
    };
  }
}

// ---------------- Soft Delete / Trash ----------------

export async function softDeleteMaterial(materialId: string, reason?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const existing = await prisma.material.findUnique({ where: { id: materialId } });
    if (!existing) throw new Error("Material not found");
    if (existing.deletedAt) throw new Error("Material is already in trash");

    await prisma.material.update({
      where: { id: materialId },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
        deletedReason: reason ?? null,
      },
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/materials/trash");
  } catch (error) {
    console.error("Error soft-deleting material:", error);
    throw error instanceof Error ? error : new Error("Failed to move material to trash");
  }
}

export async function restoreMaterial(materialId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const existing = await prisma.material.findUnique({ where: { id: materialId } });
    if (!existing) throw new Error("Material not found");
    if (!existing.deletedAt) throw new Error("Material is not in trash");

    await prisma.material.update({
      where: { id: materialId },
      data: {
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/materials/trash");
  } catch (error) {
    console.error("Error restoring material:", error);
    throw error instanceof Error ? error : new Error("Failed to restore material");
  }
}

export async function getTrashedMaterials() {
  try {
    const materials = await prisma.material.findMany({
      where: { deletedAt: { not: null } },
      include: {
        type: true,
        unitOfMeasure: true,
        supplier: true,
      },
      orderBy: { deletedAt: "desc" },
    });
    return materials;
  } catch (error) {
    console.error("Error fetching trashed materials:", error);
    throw new Error("Failed to fetch trashed materials");
  }
}

export async function purgeExpiredTrashedMaterials() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const result = await prisma.material.deleteMany({
      where: { deletedAt: { not: null, lte: cutoff } },
    });

    revalidatePath("/admin/materials/trash");
    return { purged: result.count };
  } catch (error) {
    console.error("Error purging expired trashed materials:", error);
    throw error instanceof Error ? error : new Error("Failed to purge expired materials");
  }
}
