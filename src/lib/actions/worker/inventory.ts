"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { formatCurrencyPHP } from "@/lib/constant";
import { StockLevel, InventoryIssueReport } from "@/types/worker/inventory";

// Updated types for Material-based inventory
export interface MaterialInventoryItem {
  id: string;
  name: string;
  sku: string;
  materialType: string;
  materialTypeName: string;
  unitOfMeasure: string;
  unitOfMeasureSymbol: string;
  currentStock: number;
  minimumStockLevel: number;
  committedStock: number;
  availableStock: number;
  costPerUnit: number;
  totalValue: number;
  stockLevel: StockLevel;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  leadTime: number;
  lastUpdated: string;
  notes?: string;
}

export interface MaterialStockStatus {
  totalMaterials: number;
  normalStock: number;
  lowStock: number;
  criticalStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface ProductUsage {
  id: string;
  name: string;
  sku: string;
  quantityNeeded: number;
  wastePercentage: number;
  totalRequired: number; // quantityNeeded + waste
}

export interface MaterialWithProducts extends MaterialInventoryItem {
  products: ProductUsage[];
  totalProductsUsing: number;
}

export interface MaterialInventoryResult {
  materials: MaterialInventoryItem[];
  stockStatus: MaterialStockStatus;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Helper function to determine stock level
function getStockLevel(
  currentStock: number,
  minimumStockLevel: number,
  committedStock: number = 0
): StockLevel {
  const availableStock = currentStock - committedStock;

  if (availableStock <= 0) return "outOfStock";
  if (availableStock <= minimumStockLevel * 0.5) return "critical"; // Critical at 50% of minimum
  if (availableStock <= minimumStockLevel) return "low";
  return "normal";
}

// Get materials inventory with filtering, sorting, and pagination
export async function getWorkerMaterialInventory(
  filter?: {
    search?: string;
    materialType?: string;
    stockLevel?: StockLevel | "all";
    supplierId?: string;
    isActive?: boolean;
  },
  sortOption?: {
    field:
      | "name"
      | "sku"
      | "currentStock"
      | "stockLevel"
      | "materialType"
      | "costPerUnit";
    direction: "asc" | "desc";
  },
  pagination?: { page: number; pageSize: number }
): Promise<MaterialInventoryResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Build the query
    const where: any = {
      status: "ACTIVE", // Only show active materials
    };

    // Apply filters
    if (filter) {
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: "insensitive" } },
          { sku: { contains: filter.search, mode: "insensitive" } },
          { notes: { contains: filter.search, mode: "insensitive" } },
        ];
      }

      if (filter.materialType) {
        where.typeId = filter.materialType;
      }

      if (filter.supplierId) {
        where.supplierId = filter.supplierId;
      }
    }

    // Set up sorting
    const orderBy: any = {};
    if (sortOption) {
      switch (sortOption.field) {
        case "materialType":
          orderBy.type = { name: sortOption.direction };
          break;
        case "stockLevel":
          // For stock level, we'll sort by available stock ratio
          orderBy.currentStock = sortOption.direction;
          break;
        default:
          orderBy[sortOption.field] = sortOption.direction;
      }
    } else {
      orderBy.name = "asc";
    }

    // Set up pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Get count for pagination
    const totalItems = await prisma.material.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get materials with related data
    const materials = await prisma.material.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        unitOfMeasure: {
          select: {
            name: true,
            symbol: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Map materials to our interface
    const mappedMaterials: MaterialInventoryItem[] = materials.map(
      (material) => {
        const stockLevel = getStockLevel(
          material.currentStock,
          material.minimumStockLevel,
          material.committedStock
        );

        const totalValue = material.currentStock * Number(material.costPerUnit);

        return {
          id: material.id,
          name: material.name,
          sku: material.sku,
          materialType: material.type.id,
          materialTypeName: material.type.name,
          unitOfMeasure: material.unitOfMeasure.name,
          unitOfMeasureSymbol: material.unitOfMeasure.symbol,
          currentStock: material.currentStock,
          minimumStockLevel: material.minimumStockLevel,
          committedStock: material.committedStock,
          availableStock: material.availableStock,
          costPerUnit: Number(material.costPerUnit),
          totalValue,
          stockLevel,
          supplier: {
            id: material.supplier.id,
            name: material.supplier.name,
            code: material.supplier.code,
          },
          leadTime: material.leadTime,
          lastUpdated: material.updatedAt.toISOString(),
          notes: material.notes || undefined,
        };
      }
    );

    // Apply stock level filter after mapping (since it's calculated)
    let filteredMaterials = mappedMaterials;
    if (filter?.stockLevel && filter.stockLevel !== "all") {
      filteredMaterials = mappedMaterials.filter(
        (material) => material.stockLevel === filter.stockLevel
      );
    }

    // Calculate stock status statistics
    const normal = mappedMaterials.filter(
      (m) => m.stockLevel === "normal"
    ).length;
    const low = mappedMaterials.filter((m) => m.stockLevel === "low").length;
    const critical = mappedMaterials.filter(
      (m) => m.stockLevel === "critical"
    ).length;
    const outOfStock = mappedMaterials.filter(
      (m) => m.stockLevel === "outOfStock"
    ).length;
    const totalValue = mappedMaterials.reduce(
      (sum, m) => sum + m.totalValue,
      0
    );

    const stockStatus: MaterialStockStatus = {
      totalMaterials: totalItems,
      normalStock: normal,
      lowStock: low,
      criticalStock: critical,
      outOfStock: outOfStock,
      totalValue,
    };

    return {
      materials: filteredMaterials,
      stockStatus,
      pagination: {
        page,
        pageSize,
        totalItems: filteredMaterials.length,
        totalPages: Math.ceil(filteredMaterials.length / pageSize),
      },
    };
  } catch (error) {
    console.error("Error fetching material inventory:", error);
    throw new Error("Failed to fetch material inventory");
  }
}

// Get material details with products that use it
export async function getMaterialWithProducts(
  materialId: string
): Promise<MaterialWithProducts | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get the material with related data
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        unitOfMeasure: {
          select: {
            name: true,
            symbol: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        boms: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                status: true,
              },
            },
          },
          where: {
            product: {
              status: "ACTIVE",
            },
          },
        },
      },
    });

    if (!material) return null;

    // Map to our base material interface
    const stockLevel = getStockLevel(
      material.currentStock,
      material.minimumStockLevel,
      material.committedStock
    );

    const totalValue = material.currentStock * Number(material.costPerUnit);

    const baseMaterial: MaterialInventoryItem = {
      id: material.id,
      name: material.name,
      sku: material.sku,
      materialType: material.type.id,
      materialTypeName: material.type.name,
      unitOfMeasure: material.unitOfMeasure.name,
      unitOfMeasureSymbol: material.unitOfMeasure.symbol,
      currentStock: material.currentStock,
      minimumStockLevel: material.minimumStockLevel,
      committedStock: material.committedStock,
      availableStock: material.availableStock,
      costPerUnit: Number(material.costPerUnit),
      totalValue,
      stockLevel,
      supplier: {
        id: material.supplier.id,
        name: material.supplier.name,
        code: material.supplier.code,
      },
      leadTime: material.leadTime,
      lastUpdated: material.updatedAt.toISOString(),
      notes: material.notes || undefined,
    };

    // Map products that use this material
    const products: ProductUsage[] = material.boms.map((bom) => {
      const wasteQuantity =
        Number(bom.quantityNeeded) * (Number(bom.wastePercentage) / 100);
      const totalRequired = Number(bom.quantityNeeded) + wasteQuantity;

      return {
        id: bom.product.id,
        name: bom.product.name,
        sku: bom.product.sku,
        quantityNeeded: Number(bom.quantityNeeded),
        wastePercentage: Number(bom.wastePercentage),
        totalRequired,
      };
    });

    return {
      ...baseMaterial,
      products,
      totalProductsUsing: products.length,
    };
  } catch (error) {
    console.error("Error fetching material with products:", error);
    throw new Error("Failed to fetch material details");
  }
}

// Get material types for filtering
export async function getMaterialTypes() {
  try {
    const materialTypes = await prisma.materialType.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return materialTypes;
  } catch (error) {
    console.error("Error fetching material types:", error);
    throw new Error("Failed to fetch material types");
  }
}

// Get suppliers for filtering
export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw new Error("Failed to fetch suppliers");
  }
}

// Keep the existing functions for backward compatibility but mark as deprecated
export async function getWorkerInventory(
  filter?: any,
  sortOption?: any,
  pagination?: any
): Promise<any> {
  // Redirect to the new material inventory function
  return await getWorkerMaterialInventory(filter, sortOption, pagination);
}

// Get inventory issue reports for the alerts page
export async function getInventoryIssueReports(
  statusFilter?: string[],
  page: number = 1,
  pageSize: number = 10
): Promise<{
  issues: InventoryIssueReport[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Build the where clause for filtering
    const whereClause: any = {};

    if (statusFilter && statusFilter.length > 0) {
      whereClause.status = {
        in: statusFilter,
      };
    }

    // Get total count for pagination
    const totalItems = await prisma.inventoryIssueReport.count({
      where: whereClause,
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch the issue reports
    const issueReports = await prisma.inventoryIssueReport.findMany({
      where: whereClause,
      include: {
        inventoryItem: {
          select: {
            name: true,
            sku: true,
          },
        },
        reportedBy: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        reportDate: "desc",
      },
      skip,
      take: pageSize,
    });

    // Map to the expected interface
    const mappedIssues: InventoryIssueReport[] = issueReports.map((report) => ({
      id: report.id,
      inventoryItemId: report.inventoryItemId,
      inventoryItemName: report.inventoryItem.name,
      reportType: report.reportType as
        | "LOW_STOCK"
        | "DISCREPANCY"
        | "DAMAGE"
        | "QUALITY"
        | "OTHER",
      reportDate: report.reportDate,
      reportedById: report.reportedById,
      reportedByName: report.reportedBy.profile
        ? `${report.reportedBy.profile.firstName} ${report.reportedBy.profile.lastName}`
        : report.reportedBy.email,
      description: report.description,
      severity: report.severity as "LOW" | "MEDIUM" | "HIGH",
      status: report.status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
      resolvedDate: report.resolvedDate || undefined,
      resolution: report.resolution || undefined,
    }));

    return {
      issues: mappedIssues,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching inventory issue reports:", error);
    throw new Error("Failed to fetch inventory issue reports");
  }
}
