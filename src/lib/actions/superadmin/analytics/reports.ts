"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================================================
// Type Definitions
// ============================================================================

export type FieldType = "string" | "number" | "date" | "boolean" | "enum";
export type FilterOperator =
  | "equals"
  | "not"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "notIn"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "between";

export interface EntityField {
  name: string;
  label: string;
  type: FieldType;
  entity: string;
  enumValues?: string[];
}

export interface ReportField {
  entity: string;
  field: string;
  alias?: string;
}

export interface ReportFilter {
  field: string; // Format: "Entity.field"
  operator: FilterOperator;
  value: any;
}

export interface ReportJoin {
  from: string; // Format: "Entity.field"
  to: string;   // Format: "Entity.field"
}

export interface ReportSort {
  field: string; // Format: "Entity.field"
  order: "asc" | "desc";
}

export interface ReportConfig {
  name?: string;
  description?: string;
  entities: string[];
  fields: ReportField[];
  filters: ReportFilter[];
  joins: ReportJoin[];
  sort: ReportSort[];
  limit?: number;
}

export interface SavedReportData {
  id: string;
  name: string;
  description: string | null;
  config: ReportConfig;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string;
}

// ============================================================================
// Entity Metadata Registry
// ============================================================================

export const ENTITY_METADATA: Record<string, EntityField[]> = {
  ProductionOrder: [
    { name: "id", label: "ID", type: "string", entity: "ProductionOrder" },
    { name: "orderNumber", label: "Order Number", type: "string", entity: "ProductionOrder" },
    { name: "status", label: "Status", type: "enum", entity: "ProductionOrder", enumValues: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"] },
    { name: "priority", label: "Priority", type: "enum", entity: "ProductionOrder", enumValues: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
    { name: "quantity", label: "Quantity", type: "number", entity: "ProductionOrder" },
    { name: "completedQuantity", label: "Completed Quantity", type: "number", entity: "ProductionOrder" },
    { name: "startDate", label: "Start Date", type: "date", entity: "ProductionOrder" },
    { name: "dueDate", label: "Due Date", type: "date", entity: "ProductionOrder" },
    { name: "completionDate", label: "Completion Date", type: "date", entity: "ProductionOrder" },
    { name: "plannedCost", label: "Planned Cost", type: "number", entity: "ProductionOrder" },
    { name: "actualCost", label: "Actual Cost", type: "number", entity: "ProductionOrder" },
    { name: "createdAt", label: "Created At", type: "date", entity: "ProductionOrder" },
  ],

  Product: [
    { name: "id", label: "ID", type: "string", entity: "Product" },
    { name: "name", label: "Product Name", type: "string", entity: "Product" },
    { name: "sku", label: "SKU", type: "string", entity: "Product" },
    { name: "description", label: "Description", type: "string", entity: "Product" },
    { name: "currentStock", label: "Current Stock", type: "number", entity: "Product" },
    { name: "committedStock", label: "Committed Stock", type: "number", entity: "Product" },
    { name: "availableStock", label: "Available Stock", type: "number", entity: "Product" },
    { name: "unitPrice", label: "Unit Price", type: "number", entity: "Product" },
    { name: "createdAt", label: "Created At", type: "date", entity: "Product" },
  ],

  Material: [
    { name: "id", label: "ID", type: "string", entity: "Material" },
    { name: "name", label: "Material Name", type: "string", entity: "Material" },
    { name: "sku", label: "SKU", type: "string", entity: "Material" },
    { name: "currentStock", label: "Current Stock", type: "number", entity: "Material" },
    { name: "committedStock", label: "Committed Stock", type: "number", entity: "Material" },
    { name: "availableStock", label: "Available Stock", type: "number", entity: "Material" },
    { name: "reorderPoint", label: "Reorder Point", type: "number", entity: "Material" },
    { name: "unitCost", label: "Unit Cost", type: "number", entity: "Material" },
    { name: "createdAt", label: "Created At", type: "date", entity: "Material" },
  ],

  Customer: [
    { name: "id", label: "ID", type: "string", entity: "Customer" },
    { name: "companyName", label: "Company Name", type: "string", entity: "Customer" },
    { name: "contactPerson", label: "Contact Person", type: "string", entity: "Customer" },
    { name: "email", label: "Email", type: "string", entity: "Customer" },
    { name: "phone", label: "Phone", type: "string", entity: "Customer" },
    { name: "status", label: "Status", type: "enum", entity: "Customer", enumValues: ["ACTIVE", "INACTIVE"] },
    { name: "createdAt", label: "Created At", type: "date", entity: "Customer" },
  ],

  CustomerOrder: [
    { name: "id", label: "ID", type: "string", entity: "CustomerOrder" },
    { name: "orderNumber", label: "Order Number", type: "string", entity: "CustomerOrder" },
    { name: "status", label: "Status", type: "enum", entity: "CustomerOrder", enumValues: ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "SHIPPED", "DELIVERED", "CANCELLED"] },
    { name: "totalAmount", label: "Total Amount", type: "number", entity: "CustomerOrder" },
    { name: "orderDate", label: "Order Date", type: "date", entity: "CustomerOrder" },
    { name: "requestedDeliveryDate", label: "Requested Delivery Date", type: "date", entity: "CustomerOrder" },
    { name: "createdAt", label: "Created At", type: "date", entity: "CustomerOrder" },
  ],

  Supplier: [
    { name: "id", label: "ID", type: "string", entity: "Supplier" },
    { name: "companyName", label: "Company Name", type: "string", entity: "Supplier" },
    { name: "contactPerson", label: "Contact Person", type: "string", entity: "Supplier" },
    { name: "email", label: "Email", type: "string", entity: "Supplier" },
    { name: "phone", label: "Phone", type: "string", entity: "Supplier" },
    { name: "status", label: "Status", type: "enum", entity: "Supplier", enumValues: ["ACTIVE", "INACTIVE"] },
    { name: "createdAt", label: "Created At", type: "date", entity: "Supplier" },
  ],

  WorkCenter: [
    { name: "id", label: "ID", type: "string", entity: "WorkCenter" },
    { name: "name", label: "Work Center Name", type: "string", entity: "WorkCenter" },
    { name: "code", label: "Code", type: "string", entity: "WorkCenter" },
    { name: "capacity", label: "Capacity", type: "number", entity: "WorkCenter" },
    { name: "status", label: "Status", type: "enum", entity: "WorkCenter", enumValues: ["ACTIVE", "INACTIVE", "MAINTENANCE"] },
    { name: "createdAt", label: "Created At", type: "date", entity: "WorkCenter" },
  ],

  QualityCheck: [
    { name: "id", label: "ID", type: "string", entity: "QualityCheck" },
    { name: "checkNumber", label: "Check Number", type: "string", entity: "QualityCheck" },
    { name: "status", label: "Status", type: "enum", entity: "QualityCheck", enumValues: ["PENDING", "IN_PROGRESS", "PASSED", "FAILED", "REQUIRES_REWORK"] },
    { name: "defectsFound", label: "Defects Found", type: "number", entity: "QualityCheck" },
    { name: "inspectionDate", label: "Inspection Date", type: "date", entity: "QualityCheck" },
    { name: "createdAt", label: "Created At", type: "date", entity: "QualityCheck" },
  ],

  BillingStatement: [
    { name: "id", label: "ID", type: "string", entity: "BillingStatement" },
    { name: "statementNumber", label: "Statement Number", type: "string", entity: "BillingStatement" },
    { name: "status", label: "Status", type: "enum", entity: "BillingStatement", enumValues: ["DRAFT", "PENDING", "APPROVED", "PAID", "CANCELLED"] },
    { name: "totalAmount", label: "Total Amount", type: "number", entity: "BillingStatement" },
    { name: "paidAmount", label: "Paid Amount", type: "number", entity: "BillingStatement" },
    { name: "outstandingAmount", label: "Outstanding Amount", type: "number", entity: "BillingStatement" },
    { name: "dueDate", label: "Due Date", type: "date", entity: "BillingStatement" },
    { name: "createdAt", label: "Created At", type: "date", entity: "BillingStatement" },
  ],

  User: [
    { name: "id", label: "ID", type: "string", entity: "User" },
    { name: "email", label: "Email", type: "string", entity: "User" },
    { name: "role", label: "Role", type: "enum", entity: "User", enumValues: ["ADMIN", "SUPER_ADMIN", "WORKER", "INSPECTOR", "DELIVERY", "DEVELOPER"] },
    { name: "status", label: "Status", type: "enum", entity: "User", enumValues: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
    { name: "lastLoginAt", label: "Last Login At", type: "date", entity: "User" },
    { name: "createdAt", label: "Created At", type: "date", entity: "User" },
  ],
};

// ============================================================================
// Query Builder Functions
// ============================================================================

function buildWhereClause(filters: ReportFilter[]): any {
  if (filters.length === 0) return {};

  const conditions: any[] = [];

  for (const filter of filters) {
    const [entity, field] = filter.field.split(".");

    if (!entity || !field) continue;

    let condition: any;

    switch (filter.operator) {
      case "equals":
        condition = { [field]: filter.value };
        break;
      case "not":
        condition = { [field]: { not: filter.value } };
        break;
      case "contains":
        condition = { [field]: { contains: filter.value, mode: "insensitive" } };
        break;
      case "startsWith":
        condition = { [field]: { startsWith: filter.value, mode: "insensitive" } };
        break;
      case "endsWith":
        condition = { [field]: { endsWith: filter.value, mode: "insensitive" } };
        break;
      case "in":
        condition = { [field]: { in: filter.value } };
        break;
      case "notIn":
        condition = { [field]: { notIn: filter.value } };
        break;
      case "lt":
        condition = { [field]: { lt: filter.value } };
        break;
      case "lte":
        condition = { [field]: { lte: filter.value } };
        break;
      case "gt":
        condition = { [field]: { gt: filter.value } };
        break;
      case "gte":
        condition = { [field]: { gte: filter.value } };
        break;
      case "between":
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          condition = { [field]: { gte: filter.value[0], lte: filter.value[1] } };
        }
        break;
    }

    if (condition) {
      conditions.push(condition);
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

function buildOrderBy(sort: ReportSort[]): any[] {
  return sort.map(s => {
    const [entity, field] = s.field.split(".");
    return { [field!]: s.order };
  });
}

function buildInclude(joins: ReportJoin[]): any {
  const include: any = {};

  for (const join of joins) {
    const [fromEntity, fromField] = join.from.split(".");
    const [toEntity] = join.to.split(".");

    if (!toEntity) continue;

    // Convert entity names to Prisma relation names (camelCase)
    const relationName = toEntity.charAt(0).toLowerCase() + toEntity.slice(1);
    include[relationName] = true;
  }

  return include;
}

// ============================================================================
// Report Execution
// ============================================================================

export async function executeReport(config: ReportConfig) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!config.entities || config.entities.length === 0) {
      return { success: false, error: "No entities specified" };
    }

    const primaryEntity = config.entities[0];
    const where = buildWhereClause(config.filters);
    const orderBy = buildOrderBy(config.sort);
    const include = buildInclude(config.joins);
    const limit = Math.min(config.limit || 1000, 10000); // Safety: max 10k rows

    // Build dynamic query
    const query: any = {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      include: Object.keys(include).length > 0 ? include : undefined,
      take: limit,
    };

    // Execute query based on primary entity
    let results: any[] = [];

    switch (primaryEntity) {
      case "ProductionOrder":
        results = await prisma.productionOrder.findMany(query);
        break;
      case "Product":
        results = await prisma.product.findMany(query);
        break;
      case "Material":
        results = await prisma.material.findMany(query);
        break;
      case "Customer":
        results = await prisma.customer.findMany(query);
        break;
      case "CustomerOrder":
        results = await prisma.customerOrder.findMany(query);
        break;
      case "Supplier":
        results = await prisma.supplier.findMany(query);
        break;
      case "WorkCenter":
        results = await prisma.workCenter.findMany(query);
        break;
      case "QualityCheck":
        results = await prisma.qualityCheck.findMany(query);
        break;
      case "BillingStatement":
        results = await prisma.billingStatement.findMany(query);
        break;
      case "User":
        results = await prisma.user.findMany(query);
        break;
      default:
        return { success: false, error: `Unsupported entity: ${primaryEntity}` };
    }

    // Transform results to extract only requested fields
    const transformedResults = results.map(row => {
      const transformed: any = {};

      for (const field of config.fields) {
        const [entity, fieldName] = field.field.split(".");
        const alias = field.alias || `${entity}.${fieldName}`;

        if (entity === primaryEntity) {
          // Direct field
          transformed[alias] = row[fieldName];
        } else {
          // Joined field
          const relationName = entity.charAt(0).toLowerCase() + entity.slice(1);
          if (row[relationName] && row[relationName][fieldName] !== undefined) {
            transformed[alias] = row[relationName][fieldName];
          }
        }
      }

      return transformed;
    });

    // Serialize Decimal fields
    const serializedResults = JSON.parse(
      JSON.stringify(transformedResults, (key, value) =>
        typeof value === "bigint" ? value.toString() :
        value?.constructor?.name === "Decimal" ? Number(value) :
        value instanceof Date ? value.toISOString() :
        value
      )
    );

    return {
      success: true,
      data: {
        results: serializedResults,
        totalRows: serializedResults.length,
        config,
      },
    };
  } catch (error) {
    console.error("Error executing report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute report",
    };
  }
}

// ============================================================================
// Save/Load/Delete Reports
// ============================================================================

export async function saveReport(config: ReportConfig) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!config.name) {
      return { success: false, error: "Report name is required" };
    }

    const savedReport = await prisma.savedReport.create({
      data: {
        name: config.name,
        description: config.description || null,
        createdBy: session.user.id,
        config: config as any,
        isPublic: false,
      },
    });

    return {
      success: true,
      data: { id: savedReport.id, name: savedReport.name },
    };
  } catch (error) {
    console.error("Error saving report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save report",
    };
  }
}

export async function loadReport(reportId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const savedReport = await prisma.savedReport.findUnique({
      where: { id: reportId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!savedReport) {
      return { success: false, error: "Report not found" };
    }

    // Check access: own report or public report
    if (savedReport.createdBy !== session.user.id && !savedReport.isPublic) {
      return { success: false, error: "Access denied" };
    }

    const creatorName = savedReport.creator.profile
      ? `${savedReport.creator.profile.firstName} ${savedReport.creator.profile.lastName}`
      : savedReport.creator.email;

    return {
      success: true,
      data: {
        id: savedReport.id,
        name: savedReport.name,
        description: savedReport.description,
        config: savedReport.config as ReportConfig,
        isPublic: savedReport.isPublic,
        createdAt: savedReport.createdAt,
        updatedAt: savedReport.updatedAt,
        creatorName,
      },
    };
  } catch (error) {
    console.error("Error loading report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load report",
    };
  }
}

export async function getSavedReports() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const savedReports = await prisma.savedReport.findMany({
      where: {
        OR: [
          { createdBy: session.user.id },
          { isPublic: true },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const reports: SavedReportData[] = savedReports.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      config: r.config as ReportConfig,
      isPublic: r.isPublic,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      creatorName: r.creator.profile
        ? `${r.creator.profile.firstName} ${r.creator.profile.lastName}`
        : r.creator.email,
    }));

    return { success: true, data: reports };
  } catch (error) {
    console.error("Error fetching saved reports:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch saved reports",
    };
  }
}

export async function deleteReport(reportId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const savedReport = await prisma.savedReport.findUnique({
      where: { id: reportId },
    });

    if (!savedReport) {
      return { success: false, error: "Report not found" };
    }

    // Only creator can delete
    if (savedReport.createdBy !== session.user.id) {
      return { success: false, error: "Only the creator can delete this report" };
    }

    await prisma.savedReport.delete({
      where: { id: reportId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete report",
    };
  }
}

export async function updateReportVisibility(reportId: string, isPublic: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const savedReport = await prisma.savedReport.findUnique({
      where: { id: reportId },
    });

    if (!savedReport) {
      return { success: false, error: "Report not found" };
    }

    if (savedReport.createdBy !== session.user.id) {
      return { success: false, error: "Only the creator can update visibility" };
    }

    await prisma.savedReport.update({
      where: { id: reportId },
      data: { isPublic },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating report visibility:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update visibility",
    };
  }
}
