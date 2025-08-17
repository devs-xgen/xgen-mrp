'use server'

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  InventoryItem,
  StockStatus,
  InventoryMovement,
  MaterialRequest,
  MaterialRequestItem,
  InventoryIssueReport,
  InventoryFilters,
  InventorySortOption,
  InventoryPagination,
  InventoryQueryResult,
  StockLevel,
  MovementType,
  RequestStatus,
  RequestPriority
} from "@/types/worker/inventory";
import { formatDate } from "@/lib/utils";
import { getWorkCenterById } from "@/lib/data/worker/workCenters";
import { getUserById } from "@/lib/data/worker/users";
import { getLocationById } from "@/lib/data/worker/locations";
import { getMaterialById } from "@/lib/data/worker/materials";
import { convertDecimals } from "@/lib/convertDecimals";

export async function getAllMaterials() {
  try {
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        minimumStockLevel: true,
        unitOfMeasure: {
          select: {
            symbol: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return convertDecimals(materials);
  } catch (error) {
    console.error("❌ Error fetching materials:", error);
    throw new Error("Failed to fetch materials");
  }
}


export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            sizeName: true,
            sizeCode: true,
            colorName: true,
            colorCode: true,
            currentStock: true,
            minimumStockLevel: true,
            displayName: true,
            isActive: true,
            sortOrder: true,
          },
          where: {
            isActive: true,
          },
          orderBy: [
            { sortOrder: "asc" },
            { sizeName: "asc" },
            { colorName: "asc" },
          ],
        },
        productionOrders: {
          select: {
            id: true,
            status: true,
            quantity: true,
            dueDate: true,
          },
          where: {
            status: {
              in: ["PENDING", "IN_PROGRESS", "ACTIVE"],
            },
          },
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return convertDecimals(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

// Helper function to check worker access to locations
async function getWorkerLocationIds(userId: string): Promise<string[]> {
  try {
    // Get the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId },
      select: { workCenterId: true }
    });

    // Get locations associated with those work centers
    const workCenterIds = userWorkCenters.map(uwc => uwc.workCenterId);
    
    const locations = await prisma.location.findMany({
      where: {
        OR: [
          { workCenterId: { in: workCenterIds } },
          { isPublic: true } // Include public locations
        ]
      },
      select: { id: true }
    });

    return locations.map(loc => loc.id);
  } catch (error) {
    console.error("Error fetching worker locations:", error);
    return [];
  }
}

// Helper function to determine stock level
function getStockLevel(
  currentStock: number,
  minimumStockLevel: number,
  criticalStockLevel: number
): StockLevel {
  if (currentStock <= 0) return "outOfStock";
  if (currentStock <= criticalStockLevel) return "critical";
  if (currentStock <= minimumStockLevel) return "low";
  return "normal";
}

// Update the InventoryFilters interface to include isActive
declare module "@/types/worker/inventory" {
  interface InventoryFilters {
    isActive?: boolean;
  }
}

// Get inventory with filtering, sorting, and pagination
export async function getWorkerInventory(
  filter?: InventoryFilters,
  sortOption?: InventorySortOption,
  pagination?: { page: number; pageSize: number }
): Promise<InventoryQueryResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get locations accessible to this worker
    const accessibleLocationIds = await getWorkerLocationIds(session.user.id);
    
    if (accessibleLocationIds.length === 0) {
      return {
        items: [],
        stockStatus: {
          totalItems: 0,
          normalStock: 0,
          lowStock: 0,
          criticalStock: 0,
          outOfStock: 0
        },
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0
        }
      };
    }

    // Build the query
    const where: any = {
      locationId: { in: accessibleLocationIds }
    };

    // Apply filters
    if (filter) {
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { sku: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      if (filter.materialType) {
        where.materialType = filter.materialType;
      }

      if (filter.location) {
        // Only filter by locations the worker has access to
        if (accessibleLocationIds.includes(filter.location)) {
          where.locationId = filter.location;
        }
      }

      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }
    }

    // Set up sorting
    const orderBy: any = {};
    if (sortOption) {
      orderBy[sortOption.field] = sortOption.direction;
    } else {
      orderBy.name = 'asc';
    }

    // Set up pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // Get count for pagination
    const totalItems = await prisma.inventoryItem.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get inventory items
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        location: {
          select: {
            name: true,
            locationType: true
          }
        }
      }
    });

    // Calculate stock levels for each item
    const mappedItems = items.map(item => {
      const stockLevel = getStockLevel(
        item.currentStock, 
        item.minimumStockLevel, 
        item.criticalStockLevel
      );
      
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        materialTypeId: item.materialType,
        locationId: item.locationId,
        currentStock: item.currentStock,
        reorderPoint: item.minimumStockLevel,
        criticalPoint: item.criticalStockLevel,
        unitOfMeasure: item.unit,
        cost: Number(item.cost),
        lastUpdated: item.updatedAt.toISOString(),
        stockLevel
      };
    });

    // Calculate stock status statistics
    const normal = mappedItems.filter(item => item.stockLevel === "normal").length;
    const low = mappedItems.filter(item => item.stockLevel === "low").length;
    const critical = mappedItems.filter(item => item.stockLevel === "critical").length;
    const outOfStock = mappedItems.filter(item => item.stockLevel === "outOfStock").length;

    const stockStatus: StockStatus = {
      totalItems,
      normalStock: normal,
      lowStock: low,
      criticalStock: critical,
      outOfStock: outOfStock
    };

    return {
      items: mappedItems,
      stockStatus,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    };
  } catch (error) {
    console.error("Error fetching worker inventory:", error);
    throw new Error("Failed to fetch inventory");
  }
}

// Get details of a specific inventory item
export async function getInventoryItemDetails(itemId: string): Promise<InventoryItem | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get accessible locations
    const accessibleLocationIds = await getWorkerLocationIds(session.user.id);

    // Get the inventory item
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        locationId: { in: accessibleLocationIds }
      },
      include: {
        location: {
          select: {
            name: true,
            locationType: true
          }
        }
      }
    });

    if (!item) return null;

    // Map to our type
    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      materialTypeId: item.materialType,
      locationId: item.locationId,
      currentStock: item.currentStock,
      reorderPoint: item.minimumStockLevel,
      criticalPoint: item.criticalStockLevel,
      unitOfMeasure: item.unit,
      cost: Number(item.cost),
      lastUpdated: item.updatedAt.toISOString(),
      stockLevel: getStockLevel(item.currentStock, item.minimumStockLevel, item.criticalStockLevel)
    };
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    throw new Error("Failed to fetch inventory item");
  }
}

// Record an inventory movement (consumption, transfer, etc.)
export async function recordStockMovement(
  inventoryItemId: string,
  quantity: number,
  movementType: MovementType,
  sourceLocationId?: string,
  destinationLocationId?: string,
  referenceNumber?: string,
  notes?: string,
  productionOrderId?: string,
  customerOrderId?: string
): Promise<InventoryMovement> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Validate the item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: {
        location: { select: { name: true } }
      }
    });

    if (!item) {
      throw new Error("Inventory item not found");
    }

    // Check location access
    const accessibleLocationIds = await getWorkerLocationIds(session.user.id);
    
    if (!accessibleLocationIds.includes(item.locationId)) {
      throw new Error("You don't have access to this inventory location");
    }

    // Get source and destination location names if provided
    let sourceLocationName = undefined;
    let destinationLocationName = undefined;

    if (sourceLocationId) {
      const sourceLocation = await prisma.location.findUnique({
        where: { id: sourceLocationId },
        select: { name: true }
      });
      if (sourceLocation) sourceLocationName = sourceLocation.name;
    }

    if (destinationLocationId) {
      const destLocation = await prisma.location.findUnique({
        where: { id: destinationLocationId },
        select: { name: true }
      });
      if (destLocation) destinationLocationName = destLocation.name;
    }

    // Create a simple movement record in a transaction
    const now = new Date();
    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Perform the inventory update in a transaction
    await prisma.$transaction(async (tx) => {
      // Update inventory based on movement type
      let newStock = item.currentStock;
      
      switch (movementType) {
        case "RECEIPT":
          newStock += quantity;
          break;
        case "ISSUE":
        case "CONSUMPTION":
          newStock -= quantity;
          break;
        case "ADJUSTMENT":
          newStock = quantity; // Direct set
          break;
        case "TRANSFER":
          // For transfer, handle both source and destination
          if (destinationLocationId) {
            await tx.inventoryItem.updateMany({
              where: { 
                locationId: destinationLocationId,
                sku: item.sku
              },
              data: {
                currentStock: {
                  increment: quantity
                },
                updatedAt: now
              }
            });
          }
          newStock -= quantity;
          break;
      }

      // Update the stock level
      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          currentStock: newStock < 0 ? 0 : newStock,
          updatedAt: now
        }
      });
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    revalidatePath("/worker/inventory");

    // Return the movement data that matches the InventoryMovement interface
    return {
      id: movementId,
      inventoryItemId,
      inventoryItemName: item.name,
      date: now,
      quantity,
      movementType,
      sourceLocationId,
      sourceLocationName,
      destinationLocationId,
      destinationLocationName,
      performedById: session.user.id,
      performedByName: user?.email || "Unknown User",
      referenceNumber,
      notes,
      productionOrderId,
      customerOrderId
    };
  } catch (error) {
    console.error("Error recording stock movement:", error);
    throw new Error("Failed to record stock movement");
  }
}

// Report an inventory issue
export async function reportInventoryIssue(
  inventoryItemId: string,
  reportType: "LOW_STOCK" | "DISCREPANCY" | "DAMAGE" | "QUALITY" | "OTHER",
  description: string,
  severity: "LOW" | "MEDIUM" | "HIGH"
): Promise<InventoryIssueReport> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Check if item exists and worker has access
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId }
    });

    if (!item) {
      throw new Error("Inventory item not found");
    }

    const accessibleLocationIds = await getWorkerLocationIds(session.user.id);
    if (!accessibleLocationIds.includes(item.locationId)) {
      throw new Error("You don't have access to this inventory location");
    }

    // Create the report
    const report = await prisma.inventoryIssueReport.create({
      data: {
        inventoryItemId,
        reportType,
        reportDate: new Date(),
        reportedById: session.user.id,
        description,
        severity,
        status: "OPEN"
      }
    });

    // Get username
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    revalidatePath("/worker/inventory");

    return {
      id: report.id,
      inventoryItemId,
      inventoryItemName: item.name,
      reportType,
      reportDate: report.reportDate,
      reportedById: session.user.id,
      reportedByName: user?.email || "Unknown User",
      description,
      severity,
      status: "OPEN"
    };
  } catch (error) {
    console.error("Error reporting inventory issue:", error);
    throw new Error("Failed to report inventory issue");
  }
}

// Request materials
export async function requestMaterials(
  workCenterId: string,
  requiredDate: Date,
  priority: RequestPriority,
  notes: string,
  items: {
    inventoryItemId: string;
    quantityRequested: number;
    notes?: string;
  }[],
  productionOrderId?: string
): Promise<MaterialRequest> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Validate the work center
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { 
        userId: session.user.id,
        workCenterId
      }
    });

    if (userWorkCenters.length === 0) {
      throw new Error("You don't have access to this work center");
    }

    // Get work center name
    const workCenter = await prisma.workCenter.findUnique({
      where: { id: workCenterId },
      select: { name: true }
    });

    if (!workCenter) {
      throw new Error("Work center not found");
    }

    // Create the material request
    const materialRequest = await prisma.materialRequest.create({
      data: {
        requestDate: new Date(),
        requestedById: session.user.id,
        workCenterId,
        status: "PENDING",
        priority,
        requiredDate,
        notes,
        productionOrderId,
      }
    });

    // Create request items
    const requestItems = await Promise.all(
      items.map(async (item) => {
        // Validate inventory item
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
          select: { name: true, unit: true }
        });

        if (!inventoryItem) {
          throw new Error(`Inventory item ${item.inventoryItemId} not found`);
        }

        // Create the request item
        const requestItem = await prisma.materialRequestItem.create({
          data: {
            materialRequestId: materialRequest.id,
            inventoryItemId: item.inventoryItemId,
            quantityRequested: item.quantityRequested,
            unit: inventoryItem.unit,
            notes: item.notes,
            status: "PENDING"
          }
        });

        return {
          id: requestItem.id,
          materialRequestId: materialRequest.id,
          inventoryItemId: item.inventoryItemId,
          inventoryItemName: inventoryItem.name,
          quantityRequested: item.quantityRequested,
          unit: inventoryItem.unit,
          notes: item.notes,
          status: "PENDING" as RequestStatus
        };
      })
    );

    // Get username
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    revalidatePath("/worker/inventory");

    return {
      id: materialRequest.id,
      requestDate: materialRequest.requestDate,
      requestedById: session.user.id,
      requestedByName: user?.email || "Unknown User",
      workCenterId,
      workCenterName: workCenter.name,
      status: "PENDING",
      priority,
      requiredDate,
      notes,
      productionOrderId,
      items: requestItems
    };
  } catch (error) {
    console.error("Error requesting materials:", error);
    throw new Error("Failed to request materials");
  }
}

// Get material requests for the worker
export async function getWorkerMaterialRequests(
  status?: RequestStatus[],
  page: number = 1,
  pageSize: number = 10
): Promise<{
  requests: MaterialRequest[];
  pagination: InventoryPagination;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true }
    });

    const workCenterIds = userWorkCenters.map(uwc => uwc.workCenterId);

    // Build query
    const where: any = {
      workCenterId: { in: workCenterIds }
    };

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const totalItems = await prisma.materialRequest.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get material requests
    const requests = await prisma.materialRequest.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { requiredDate: 'asc' }
      ],
      skip,
      take: pageSize,
      include: {
        requestedBy: {
          select: { email: true }
        },
        approvedBy: {
          select: { email: true }
        },
        workCenter: {
          select: { name: true }
        },
        items: {
          include: {
            inventoryItem: {
              select: { name: true, unit: true }
            }
          }
        }
      }
    });

    // Map to our type
    const mappedRequests: MaterialRequest[] = requests.map(req => ({
      id: req.id,
      requestDate: req.requestDate,
      requestedById: req.requestedById,
      requestedByName: req.requestedBy.email || "Unknown User",
      workCenterId: req.workCenterId,
      workCenterName: req.workCenter.name,
      status: req.status as RequestStatus,
      priority: req.priority as RequestPriority,
      requiredDate: req.requiredDate,
      approvedById: req.approvedById || undefined,
      approvedByName: req.approvedBy?.email,
      approvedDate: req.approvedDate || undefined,
      fulfilledDate: req.fulfilledDate || undefined,
      notes: req.notes || undefined,
      productionOrderId: req.productionOrderId || undefined,
      items: req.items.map(item => ({
        id: item.id,
        materialRequestId: item.materialRequestId,
        inventoryItemId: item.inventoryItemId,
        inventoryItemName: item.inventoryItem.name,
        quantityRequested: item.quantityRequested,
        quantityApproved: item.quantityApproved || undefined,
        quantityFulfilled: item.quantityFulfilled || undefined,
        unit: item.unit,
        notes: item.notes || undefined,
        status: item.status as RequestStatus
      }))
    }));

    return {
      requests: mappedRequests,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    };
  } catch (error) {
    console.error("Error fetching material requests:", error);
    throw new Error("Failed to fetch material requests");
  }
}

// Get work centers accessible to the worker
export async function getWorkerWorkCenters() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { 
        workCenterId: true,
        workCenter: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        }
      }
    });

    // Map to simpler format
    return userWorkCenters
      .filter(uwc => uwc.workCenter.status === 'ACTIVE')
      .map(uwc => ({
        id: uwc.workCenter.id,
        name: uwc.workCenter.name,
        description: uwc.workCenter.description || undefined
      }));
  } catch (error) {
    console.error("Error fetching worker work centers:", error);
    throw new Error("Failed to fetch work centers");
  }
}

// Get inventory items for material requests
export async function getInventoryItemsForRequest() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get locations accessible to this worker
    const accessibleLocationIds = await getWorkerLocationIds(session.user.id);
    
    if (accessibleLocationIds.length === 0) {
      return [];
    }

    // Get active inventory items
    const items = await prisma.inventoryItem.findMany({
      where: {
        locationId: { in: accessibleLocationIds },
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        currentStock: true,
        minimumStockLevel: true,
        criticalStockLevel: true
      }
    });

    // Helper function to determine stock level
    const getStockLevelHelper = (
      current: number, 
      minimum: number, 
      critical: number
    ): StockLevel => {
      if (current <= 0) return "outOfStock";
      if (current <= critical) return "critical";
      if (current <= minimum) return "low"; 
      return "normal";
    };

    // Map to our type
    return items.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      unitOfMeasure: item.unit,
      currentStock: item.currentStock,
      stockLevel: getStockLevelHelper(
        item.currentStock, 
        item.minimumStockLevel, 
        item.criticalStockLevel
      )
    }));
  } catch (error) {
    console.error("Error fetching inventory items for request:", error);
    throw new Error("Failed to fetch inventory items");
  }
}


// Get inventory issue reports for worker
export async function getInventoryIssueReports(
  status?: string[],
  page: number = 1,
  pageSize: number = 10
): Promise<{
  issues: InventoryIssueReport[];
  pagination: InventoryPagination;
}> {

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get accessible location IDs for this worker
    const accessibleLocationIds = await getWorkerLocationIds(session.user.id);

    if (accessibleLocationIds.length === 0) {
      return {
        issues: [],
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0
        }
      };
    }

    // Build query
    const where: any = {
      inventoryItem: {
        locationId: { in: accessibleLocationIds }
      }
    };
    if (status && status.length > 0) {
      where.status = { in: status };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const totalItems = await prisma.inventoryIssueReport.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get issue reports
    const issues = await prisma.inventoryIssueReport.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { severity: 'desc' },
        { reportDate: 'desc' }
      ],
      skip,
      take: pageSize,
      include: {
        inventoryItem: {
          select: {
            name: true,
            sku: true,
            unit: true,
            currentStock: true,
            minimumStockLevel: true,
            criticalStockLevel: true,
            location: {
              select: { name: true }
            }
          }
        },
        reportedBy: {
          select: { email: true }
        }
      }
    });
    // Map to our type
    const mappedIssues: InventoryIssueReport[] = issues.map(issue => ({
      id: issue.id,
      inventoryItemId: issue.inventoryItemId,
      inventoryItemName: issue.inventoryItem.name,
      reportType: issue.reportType as any,
      reportDate: issue.reportDate,
      reportedById: issue.reportedById,
      reportedByName: issue.reportedBy.email || "Unknown User",
      description: issue.description,
      severity: issue.severity as any,
      status: issue.status as any,
      resolvedDate: issue.resolvedDate || undefined,
      resolution: issue.resolution || undefined
    }));
    return {
      issues: mappedIssues,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    };
  } catch (error) {
    console.error("Error fetching inventory issue reports:", error);
    throw new Error("Failed to fetch inventory issue reports");
  }
}

//GetAllInventoryIssueReports
export async function getAllInventoryIssueReports(
status?: string[],
  page: number = 1,
  pageSize: number = 10
): Promise<{
  issues: InventoryIssueReport[];
  pagination: InventoryPagination;
}> {
  try {
    console.log("Starting getAllInventoryIssueReportsForInspector function...");

    // 1. Check for an authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("Error: Unauthorized access. No user session found.");
      throw new Error("Unauthorized");
    }
    console.log(`Inspector session found for user ID: ${session.user.id}`);

    // NOTE: This version bypasses the location-based filtering entirely.
    // The inspector is assumed to have global access to all reports.

    // 2. Build the database query
    // The 'where' clause is now simplified to only filter by status, if provided.
    const where: any = {};

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    console.log("Prisma query 'where' clause:", JSON.stringify(where, null, 2));

    // 3. Calculate pagination and get total count
    const skip = (page - 1) * pageSize;
    const totalItems = await prisma.inventoryIssueReport.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    console.log(`Total items matching query: ${totalItems}`);
    console.log(`Fetching items from ${skip} to ${skip + pageSize}`);
    
    if (totalItems === 0) {
      console.log("No inventory issue reports found matching the criteria.");
      return {
        issues: [],
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0
        }
      };
    }

    // 4. Get all issue reports
    const issues = await prisma.inventoryIssueReport.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { severity: 'desc' },
        { reportDate: 'desc' }
      ],
      skip,
      take: pageSize,
      include: {
        inventoryItem: {
          select: { 
            name: true, 
            sku: true,
            unit: true,
            currentStock: true,
            minimumStockLevel: true,
            criticalStockLevel: true,
            location: {
              select: { name: true }
            }
          }
        },
        reportedBy: {
          select: { email: true }
        }
      }
    });

    console.log(`Successfully fetched ${issues.length} total inventory issues.`);

    // 5. Map to the required type
    const mappedIssues: InventoryIssueReport[] = issues.map(issue => ({
      id: issue.id,
      inventoryItemId: issue.inventoryItemId,
      inventoryItemName: issue.inventoryItem.name,
      reportType: issue.reportType as any,
      reportDate: issue.reportDate,
      reportedById: issue.reportedById,
      reportedByName: issue.reportedBy.email || "Unknown User",
      description: issue.description,
      severity: issue.severity as any,
      status: issue.status as any,
      resolvedDate: issue.resolvedDate || undefined,
      resolution: issue.resolution || undefined
    }));

    return {
      issues: mappedIssues,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    };
  } catch (error: any) {
    console.error("Caught an error fetching all inventory issue reports:", error);
    if (error.message === "Unauthorized") {
      throw new Error("Failed to authenticate user. Please log in again.");
    }
    throw new Error(`Failed to fetch all inventory issue reports: ${error.message}`);
  }
}
// Export inventory data as CSV
export async function exportInventoryData(): Promise<{
  csvContent: string;
  filename: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Get locations accessible to this worker
    const accessibleLocationIds = await getWorkerLocationIds(session.user.id);
    
    if (accessibleLocationIds.length === 0) {
      throw new Error("No accessible inventory locations found");
    }

    // Get all inventory items (no pagination)
    const items = await prisma.inventoryItem.findMany({
      where: {
        locationId: { in: accessibleLocationIds },
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        location: {
          select: {
            name: true,
            locationType: true
          }
        }
      }
    });

    // Helper function to determine stock level for export
    const getStockLevelForExport = (
      current: number, 
      minimum: number, 
      critical: number
    ): string => {
      if (current <= 0) return "Out of Stock";
      if (current <= critical) return "Critical";
      if (current <= minimum) return "Low"; 
      return "Normal";
    };

    // Build CSV headers
    const headers = [
      "SKU",
      "Name",
      "Material Type",
      "Location",
      "Current Stock",
      "Unit",
      "Minimum Stock",
      "Critical Stock",
      "Stock Status",
      "Last Updated",
      "Value"
    ];

    // Build CSV rows
    const rows = items.map(item => {
      const stockLevel = getStockLevelForExport(
        item.currentStock, 
        item.minimumStockLevel, 
        item.criticalStockLevel
      );
      
      const value = (item.currentStock * Number(item.cost)).toFixed(2);
      const lastUpdated = item.updatedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      return [
        item.sku,
        item.name,
        item.materialType,
        item.location.name,
        item.currentStock.toString(),
        item.unit,
        item.minimumStockLevel.toString(),
        item.criticalStockLevel.toString(),
        stockLevel,
        lastUpdated,
        value
      ];
    });

    // Convert to CSV content
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        // Escape commas and quotes in cell content
        `"${cell.replace(/"/g, '""')}"`
      ).join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `inventory-export-${date}.csv`;

    return {
      csvContent,
      filename
    };
  } catch (error) {
    console.error("Error exporting inventory data:", error);
    throw new Error("Failed to export inventory data");
  }
}

interface GenerateMaterialRequestPdfParams {
  workCenterId: string;
  requiredDate: Date;
  priority: RequestPriority;
  notes?: string;
  productionOrderId?: string;
  items: MaterialRequestItem[];
}

export async function generateMaterialRequestPdf({
  workCenterId,
  requiredDate,
  priority,
  notes,
  productionOrderId,
  items,
}: GenerateMaterialRequestPdfParams) {
  // Get current user for requester information
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Fetch related data
  const [workCenter, user] = await Promise.all([
    getWorkCenterById(workCenterId),
    getUserById(userId),
  ]);

  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Material Request</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ccc;
        }
        .request-info {
          margin-bottom: 20px;
        }
        .request-info div {
          margin-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .notes {
          margin-top: 20px;
          padding: 10px;
          border: 1px solid #ccc;
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Material Request</h1>
        <p>Generated on ${formatDate(new Date())}</p>
      </div>
      
      <div class="request-info">
        <div><strong>Requester:</strong> ${user?.email || 'Unknown'}</div>
        <div><strong>Work Center:</strong> ${workCenter?.name || 'Unknown'}</div>
        <div><strong>Required Date:</strong> ${formatDate(requiredDate)}</div>
        <div><strong>Priority:</strong> ${priority}</div>
        ${productionOrderId ? `<div><strong>Production Order:</strong> ${productionOrderId}</div>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Material ID</th>
            <th>Material Name</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.inventoryItemId || 'Unknown'}</td>
              <td>${item.inventoryItemName || 'Unknown'}</td>
              <td>${item.quantityRequested}</td>
              <td>${item.unit || 'EA'}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${notes ? `
        <div class="notes">
          <h3>Notes</h3>
          <p>${notes}</p>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>This document was automatically generated by the MRP system.</p>
      </div>
    </body>
    </html>
  `;

  return {
    htmlContent,
    filename: `material-request-${new Date().toISOString().split('T')[0]}.pdf`
  };
} 

export async function getInventoryItems() {
  return await prisma.inventoryItem.findMany({
    select: { id: true, name: true }
  });
}