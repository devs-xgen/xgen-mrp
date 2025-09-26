"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import type {
  Material,
  MaterialUpdateInput,
} from "@/types/admin/materials";
import { ensureSuperAdmin } from "./index";

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    // @ts-expect-error - handle Prisma Decimal
    return value.toNumber();
  }

  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

export async function getMaterials(): Promise<Material[]> {
  await ensureSuperAdmin();

  const materials = await prisma.material.findMany({
    where: {
      status: { not: Status.ARCHIVED },
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
    orderBy: {
      name: "asc",
    },
  });

  return materials.map((material) => ({
    ...material,
    costPerUnit: toNumber(material.costPerUnit),
    boms: material.boms ?? [],
  })) as Material[];
}

export async function getArchivedMaterials(): Promise<Material[]> {
  await ensureSuperAdmin();

  const materials = await prisma.material.findMany({
    where: {
      status: Status.ARCHIVED,
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
    orderBy: {
      name: "asc",
    },
  });

  return materials.map((material) => ({
    ...material,
    costPerUnit: toNumber(material.costPerUnit),
    boms: material.boms ?? [],
  })) as Material[];
}

export async function getSuperAdminMaterialTypes() {
  await ensureSuperAdmin();

  return prisma.materialType.findMany({
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
}

export async function getSuperAdminUnitOfMeasures() {
  await ensureSuperAdmin();

  return prisma.unitOfMeasure.findMany({
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
}

export async function getSuperAdminSuppliers() {
  await ensureSuperAdmin();

  return prisma.supplier.findMany({
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
}

export async function refreshSuperAdminMaterials() {
  "use server";
  await ensureSuperAdmin();
  revalidatePath("/superadmin/materials");
}

export async function exportSuperAdminMaterialsData(filters?: {
  search?: string;
  statusIn?: ("ACTIVE" | "ARCHIVED")[];
  typeIds?: string[];
  supplierIds?: string[];
  uomIds?: string[];
}): Promise<{ csvContent: string; filename: string }> {
  await ensureSuperAdmin();

  const where: Record<string, unknown> = {};

  if (filters?.statusIn?.length) {
    where.status = { in: filters.statusIn as Status[] };
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

  if (filters?.typeIds?.length) {
    where.typeId = { in: filters.typeIds };
  }

  if (filters?.supplierIds?.length) {
    where.supplierId = { in: filters.supplierIds };
  }

  if (filters?.uomIds?.length) {
    where.unitOfMeasureId = { in: filters.uomIds };
  }

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

  const escape = (value: unknown) => {
    const str = value == null ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const rows = materials.map((material) =>
    [
      material.name,
      material.sku,
      material.type?.name ?? "",
      material.unitOfMeasure
        ? `${material.unitOfMeasure.name} (${material.unitOfMeasure.symbol})`
        : "",
      material.supplier?.name ?? "",
      toNumber(material.costPerUnit),
      material.currentStock,
      material.minimumStockLevel,
      material.leadTime,
      material.status,
    ]
      .map(escape)
      .join(","),
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const today = new Date();
  const filename = `superadmin-materials-${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.csv`;

  return { csvContent, filename };
}

export async function exportSuperAdminMaterialsExcel(filters?: {
  search?: string;
  statusIn?: ("ACTIVE" | "ARCHIVED")[];
  typeIds?: string[];
  supplierIds?: string[];
  uomIds?: string[];
}): Promise<{ base64: string; filename: string }> {
  await ensureSuperAdmin();

  const { default: ExcelJS } = await import("exceljs");

  const where: Record<string, unknown> = {};

  if (filters?.statusIn?.length) {
    where.status = { in: filters.statusIn as Status[] };
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

  if (filters?.typeIds?.length) {
    where.typeId = { in: filters.typeIds };
  }

  if (filters?.supplierIds?.length) {
    where.supplierId = { in: filters.supplierIds };
  }

  if (filters?.uomIds?.length) {
    where.unitOfMeasureId = { in: filters.uomIds };
  }

  const materials = await prisma.material.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      type: { select: { name: true } },
      unitOfMeasure: { select: { name: true, symbol: true } },
      supplier: { select: { name: true } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Materials");
  worksheet.addRow([
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
  ]);
  worksheet.getRow(1).font = { bold: true };

  materials.forEach((material) => {
    worksheet.addRow([
      material.name,
      material.sku,
      material.type?.name ?? "",
      material.unitOfMeasure
        ? `${material.unitOfMeasure.name} (${material.unitOfMeasure.symbol})`
        : "",
      material.supplier?.name ?? "",
      toNumber(material.costPerUnit),
      material.currentStock,
      material.minimumStockLevel,
      material.leadTime,
      material.status,
    ]);
  });

  worksheet.columns[5]!.numFmt = "#,##0.00";
  worksheet.columns[6]!.numFmt = "#,##0";
  worksheet.columns[7]!.numFmt = "#,##0";
  worksheet.columns[8]!.numFmt = "#,##0";

  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value ? String(cell.value) : "";
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = Math.min(42, maxLength);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const today = new Date();
  const filename = `superadmin-materials-${today.toISOString().split("T")[0]}.xlsx`;

  return { base64, filename };
}

export async function updateMaterialForSuperAdmin(data: MaterialUpdateInput) {
  await ensureSuperAdmin();

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.costPerUnit !== undefined) updateData.costPerUnit = data.costPerUnit;
  if (data.currentStock !== undefined) updateData.currentStock = data.currentStock;
  if (data.minimumStockLevel !== undefined)
    updateData.minimumStockLevel = data.minimumStockLevel;
  if (data.leadTime !== undefined) updateData.leadTime = data.leadTime;
  if (data.committedStock !== undefined)
    updateData.committedStock = data.committedStock;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;

  if (data.typeId) {
    updateData.type = { connect: { id: data.typeId } };
  }

  if (data.unitOfMeasureId) {
    updateData.unitOfMeasure = { connect: { id: data.unitOfMeasureId } };
  }

  if (data.supplierId) {
    updateData.supplier = { connect: { id: data.supplierId } };
  }

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
    },
  });

  revalidatePath("/superadmin/materials");

  return {
    ...updatedMaterial,
    costPerUnit: toNumber(updatedMaterial.costPerUnit),
    calculatedStock:
      data.calculatedStock !== undefined
        ? data.calculatedStock
        : toNumber(updatedMaterial.currentStock) -
          toNumber(updatedMaterial.committedStock ?? 0),
    expectedStock: data.expectedStock ?? 0,
  } as Material;
}

export async function archiveMaterialForSuperAdmin(
  id: string,
  reason?: string,
) {
  const session = await ensureSuperAdmin();

  await prisma.material.update({
    where: { id },
    data: {
      status: Status.ARCHIVED,
      archivedAt: new Date(),
      archivedBy: session.user.id,
      archivedReason: reason || "Archived via superadmin UI",
      updatedAt: new Date(),
    },
  });

  revalidatePath("/superadmin/materials");
}
