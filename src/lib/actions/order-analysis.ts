"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Status, Priority } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Import types
import {
  CustomerOrderAnalysisResult,
  OrderLineStockStatus,
  ProductionSelection,
  StockAllocation,
  MaterialRequirement,
  ProductionPlanningAnalysis,
  BatchOrderAnalysis,
  OrderAnalysisFilters,
  OrderAnalysisSummary,
  StockStatus,
  RecommendedAction,
  OverallOrderStatus,
  ProductionDecision,
} from "@/types/admin/order-analysis";

import {
  FulfillmentType,
  FulfillmentStatus,
} from "@/types/admin/customer-order";
import { createProductionOrder } from "./production-order";
import { checkProductionOrderMaterialRequirements } from "./material-reservation";
import {
  allocateStockForOrderLine,
  batchAllocateStock,
  StockAllocationResult,
} from "./stock-allocation";

/**
 * Helper function to check if production orders need to be synced with customer order
 */
function checkIfSyncNeeded(customerOrder: any, orderLineAnalyses: OrderLineStockStatus[]): boolean {
  const productionOrders = customerOrder.productionOrders || [];
  
  if (productionOrders.length === 0) {
    return false; // No production orders to sync
  }

  // Check if customer order was updated after production orders were created
  const customerOrderUpdated = new Date(customerOrder.updatedAt);
  const latestProductionOrderDate = productionOrders.reduce((latest: Date, po: any) => {
    const poDate = new Date(po.createdAt);
    return poDate > latest ? poDate : latest;
  }, new Date(0));

  if (customerOrderUpdated > latestProductionOrderDate) {
    return true; // Customer order changed after production orders were created
  }

  // Check if quantities match
  const totalOrderQuantity = orderLineAnalyses.reduce((sum, line) => sum + line.quantity, 0);
  const totalProductionQuantity = productionOrders.reduce((sum: number, po: any) => sum + po.quantity, 0);

  if (totalOrderQuantity !== totalProductionQuantity) {
    return true; // Quantities don't match
  }

  return false;
}

/**
 * Analyzes a customer order to determine stock availability and production needs
 * This is the core function for the new decoupled workflow
 */
export async function analyzeCustomerOrderStock(
  orderId: string
): Promise<CustomerOrderAnalysisResult> {
  try {
    // Fetch customer order with all details INCLUDING production orders
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentStock: true,
                minimumStockLevel: true,
                leadTime: true,
                sellingPrice: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                displayName: true,
                currentStock: true,
                minimumStockLevel: true,
                sellingPrice: true,
              },
            },
          },
        },
        productionOrders: {
          where: {
            status: {
              notIn: [Status.CANCELLED, Status.FAILED],
            },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                displayName: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!customerOrder) {
      throw new Error("Customer order not found");
    }

    // Analyze each order line
    const orderLineAnalyses: OrderLineStockStatus[] = [];
    let totalOrderValue = 0;
    let itemsFromStock = 0;
    let itemsNeedingProduction = 0;

    for (const orderLine of customerOrder.orderLines) {
      const analysis = await analyzeOrderLine(orderLine);
      orderLineAnalyses.push(analysis);

      totalOrderValue += analysis.totalValue;

      if (analysis.recommendedAction === RecommendedAction.USE_STOCK) {
        itemsFromStock++;
      } else if (
        analysis.recommendedAction === RecommendedAction.PRODUCE_ALL ||
        analysis.recommendedAction === RecommendedAction.HYBRID
      ) {
        itemsNeedingProduction++;
      }
    }

    // Determine overall order status
    const overallStatus = determineOverallOrderStatus(orderLineAnalyses);

    // Calculate estimated fulfillment date
    const estimatedFulfillmentDate =
      calculateEstimatedFulfillmentDate(orderLineAnalyses);

    // Check if can fulfill immediately (all from stock)
    const canFulfillImmediately = orderLineAnalyses.every(
      (line) => line.recommendedAction === RecommendedAction.USE_STOCK
    );

    // Check if production orders exist and if sync is needed
    const hasExistingProductionOrders = (customerOrder.productionOrders?.length || 0) > 0;
    const needsSync = checkIfSyncNeeded(customerOrder, orderLineAnalyses);

    return {
      orderId: customerOrder.id,
      orderNumber: customerOrder.orderNumber,
      customerName: customerOrder.customer.name,
      customerId: customerOrder.customerId,
      orderDate: customerOrder.orderDate,
      requiredDate: customerOrder.requiredDate,
      orderLines: orderLineAnalyses,
      overallStatus,
      itemsFromStock,
      itemsNeedingProduction,
      totalOrderValue,
      estimatedFulfillmentDate,
      canFulfillImmediately,
      analysisDate: new Date(),
      existingProductionOrders: customerOrder.productionOrders || [],
      hasExistingProductionOrders,
      needsSync,
    };
  } catch (error) {
    console.error("Error analyzing customer order stock:", error);
    throw new Error("Failed to analyze customer order stock");
  }
}

/**
 * Analyzes a single order line for stock availability
 */
async function analyzeOrderLine(orderLine: any): Promise<OrderLineStockStatus> {
  const product = orderLine.product;
  const variant = orderLine.productVariant;

  // Use variant stock if available, otherwise use product stock
  const currentStock = variant ? variant.currentStock : product.currentStock;
  const minimumStockLevel = variant
    ? variant.minimumStockLevel
    : product.minimumStockLevel;
  const unitPrice = variant ? variant.sellingPrice : product.sellingPrice;

  // Convert Decimal values to numbers
  const normalizedCurrentStock = normalizeDecimal(currentStock);
  const normalizedMinimumStock = normalizeDecimal(minimumStockLevel);
  const normalizedUnitPrice = normalizeDecimal(unitPrice);

  // Calculate available stock (current stock minus safety stock)
  const availableStock = Math.max(
    0,
    normalizedCurrentStock - normalizedMinimumStock
  );

  // Determine stock status and recommended action
  const stockAfterOrder = normalizedCurrentStock - orderLine.quantity;
  let stockStatus: StockStatus;
  let recommendedAction: RecommendedAction;
  let stockToUse = 0;
  let quantityToProduce = 0;

  if (normalizedCurrentStock === 0) {
    stockStatus = StockStatus.OUT_OF_STOCK;
    recommendedAction = RecommendedAction.PRODUCE_ALL;
    quantityToProduce = orderLine.quantity;
  } else if (stockAfterOrder < 0) {
    stockStatus = StockStatus.INSUFFICIENT;
    recommendedAction = RecommendedAction.HYBRID;
    stockToUse = normalizedCurrentStock;
    quantityToProduce = Math.abs(stockAfterOrder);
  } else if (stockAfterOrder < normalizedMinimumStock) {
    stockStatus = StockStatus.LOW_STOCK;
    recommendedAction = RecommendedAction.USE_STOCK; // But flag for restocking
    stockToUse = orderLine.quantity;
  } else {
    stockStatus = StockStatus.SUFFICIENT;
    recommendedAction = RecommendedAction.USE_STOCK;
    stockToUse = orderLine.quantity;
  }

  return {
    id: orderLine.id,
    productId: orderLine.productId,
    productVariantId: orderLine.productVariantId || undefined,
    productName: product.name,
    productSku: product.sku,
    variantDisplayName: variant?.displayName,
    quantity: orderLine.quantity,
    currentStock: normalizedCurrentStock,
    minimumStockLevel: normalizedMinimumStock,
    availableStock,
    stockStatus,
    recommendedAction,
    stockToUse,
    quantityToProduce,
    unitPrice: normalizedUnitPrice,
    totalValue: orderLine.quantity * normalizedUnitPrice,
    estimatedLeadTime: product.leadTime || 0,
  };
}

/**
 * Gets all customer orders that require analysis (haven't been analyzed or need production planning)
 */
export async function getOrdersRequiringAnalysis(
  filters?: OrderAnalysisFilters
): Promise<CustomerOrderAnalysisResult[]> {
  try {
    const whereClause: any = {
      status: {
        in: [Status.PENDING, Status.ACTIVE],
      },
    };

    // Apply filters
    if (filters?.customerId) {
      whereClause.customerId = filters.customerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.orderDate = {};
      if (filters.dateFrom) whereClause.orderDate.gte = filters.dateFrom;
      if (filters.dateTo) whereClause.orderDate.lte = filters.dateTo;
    }

    const orders = await prisma.customerOrder.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, name: true },
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                currentStock: true,
                minimumStockLevel: true,
                leadTime: true,
                sellingPrice: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                displayName: true,
                currentStock: true,
                minimumStockLevel: true,
                sellingPrice: true,
              },
            },
          },
        },
        _count: {
          select: {
            productionOrders: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    // Analyze each order
    const analyses: CustomerOrderAnalysisResult[] = [];
    for (const order of orders) {
      try {
        const analysis = await analyzeCustomerOrderStock(order.id);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze order ${order.orderNumber}:`, error);
        // Continue with other orders
      }
    }

    return analyses;
  } catch (error) {
    console.error("Error getting orders requiring analysis:", error);
    throw new Error("Failed to get orders requiring analysis");
  }
}

/**
 * Creates production orders for selected items based on analysis results
 */
export async function createProductionOrdersForItems(
  selections: ProductionSelection[]
): Promise<{
  success: boolean;
  createdOrders: any[];
  errors: string[];
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const createdOrders = [];
    const errors = [];

    // Get default work center for operations
    const defaultWorkCenter = await prisma.workCenter.findFirst({
      where: {
        status: Status.ACTIVE,
      },
    });

    if (!defaultWorkCenter) {
      throw new Error("No active work center found for production orders");
    }

    for (const selection of selections) {
      if (
        selection.decision !== ProductionDecision.FULL_PRODUCTION &&
        selection.decision !== ProductionDecision.HYBRID_APPROACH
      ) {
        continue; // Skip non-production decisions
      }

      try {
        // Get order line details for context
        const orderLine = await prisma.orderLine.findUnique({
          where: { id: selection.orderLineId },
          include: {
            customerOrder: true,
            product: true,
          },
        });

        if (!orderLine) {
          errors.push(`Order line ${selection.orderLineId} not found`);
          continue;
        }

        const startDate = new Date();
        const dueDate = new Date(orderLine.customerOrder.requiredDate);
        dueDate.setDate(dueDate.getDate() - 1); // Due one day before required date

        const productionOrder = await createProductionOrder({
          productId: selection.productId,
          productVariantId: selection.productVariantId,
          quantity: selection.quantityToProduce,
          startDate,
          dueDate,
          priority: selection.priority,
          customerOrderId: orderLine.customerOrder.id,
          notes: `Created from order analysis - ${selection.notes || "Production required for customer order"}`,
          operations: [
            {
              workCenterId: defaultWorkCenter.id,
              startTime: startDate,
              endTime: dueDate,
              cost: 0, // Will be updated during production planning
            },
          ],
        });

        createdOrders.push(productionOrder);

        // Update order line fulfillment tracking
        await prisma.orderLine.update({
          where: { id: selection.orderLineId },
          data: {
            fulfillmentType:
              selection.decision === ProductionDecision.FULL_PRODUCTION
                ? FulfillmentType.PRODUCTION
                : FulfillmentType.HYBRID,
            productionQuantity: selection.quantityToProduce,
            stockAllocated: selection.stockToAllocate,
            fulfillmentStatus: FulfillmentStatus.ALLOCATED,
            allocatedAt: new Date(),
          },
        });
      } catch (error) {
        const errorMsg = `Failed to create production order for ${selection.orderLineId}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/production");

    return {
      success: errors.length === 0,
      createdOrders,
      errors,
    };
  } catch (error) {
    console.error("Error creating production orders for items:", error);
    return {
      success: false,
      createdOrders: [],
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Allocates stock for order lines that can be fulfilled from inventory
 */
export async function allocateStockForOrder(
  orderId: string,
  allocations: StockAllocation[]
): Promise<{
  success: boolean;
  allocatedItems: any[];
  errors: string[];
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Use the new stock allocation system for proper inventory management
    const batchAllocations = allocations.map((allocation) => ({
      orderLineId: allocation.orderLineId,
      quantity: allocation.quantityToAllocate,
    }));

    const batchResult = await batchAllocateStock(batchAllocations);

    const allocatedItems = batchResult.results
      .filter((result) => result.success)
      .map((result, index) => ({
        orderLineId: allocations[index].orderLineId,
        productName: `Product Line ${index + 1}`, // Will be enhanced with actual product names
        quantityAllocated: result.allocatedQuantity,
      }));

    const errors = batchResult.errors || [];

    revalidatePath("/admin/customer-orders-v2");

    return {
      success: errors.length === 0,
      allocatedItems,
      errors,
    };
  } catch (error) {
    console.error("Error allocating stock for order:", error);
    return {
      success: false,
      allocatedItems: [],
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Gets analysis summary for dashboard/reporting
 */
export async function getOrderAnalysisSummary(
  filters?: OrderAnalysisFilters
): Promise<OrderAnalysisSummary> {
  try {
    const analyses = await getOrdersRequiringAnalysis(filters);

    const summary: OrderAnalysisSummary = {
      totalOrdersAnalyzed: analyses.length,
      ordersByStatus: {
        [OverallOrderStatus.CAN_FULFILL_IMMEDIATELY]: 0,
        [OverallOrderStatus.PARTIAL_FULFILLMENT]: 0,
        [OverallOrderStatus.REQUIRES_PRODUCTION]: 0,
        [OverallOrderStatus.MATERIAL_SHORTAGE]: 0,
        [OverallOrderStatus.CANNOT_FULFILL]: 0,
        [OverallOrderStatus.MIXED]: 0,
      },
      totalItemsNeedingProduction: 0,
      totalEstimatedProductionCost: 0,
      averageFulfillmentTime: 0,
      ordersRequiringAttention: 0,
      materialShortagesCount: 0,
      lastAnalysisUpdate: new Date(),
    };

    // Calculate statistics
    let totalFulfillmentDays = 0;

    for (const analysis of analyses) {
      summary.ordersByStatus[analysis.overallStatus]++;
      summary.totalItemsNeedingProduction += analysis.itemsNeedingProduction;

      // Calculate fulfillment time in days
      const fulfillmentDays = Math.ceil(
        (analysis.estimatedFulfillmentDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      totalFulfillmentDays += fulfillmentDays;

      if (
        analysis.overallStatus === OverallOrderStatus.MATERIAL_SHORTAGE ||
        analysis.overallStatus === OverallOrderStatus.CANNOT_FULFILL
      ) {
        summary.ordersRequiringAttention++;
      }
    }

    summary.averageFulfillmentTime =
      analyses.length > 0 ? totalFulfillmentDays / analyses.length : 0;

    return summary;
  } catch (error) {
    console.error("Error getting order analysis summary:", error);
    throw new Error("Failed to get order analysis summary");
  }
}

/**
 * Syncs production orders with customer order changes
 * Updates quantities, dates, and creates/removes orders as needed
 */
export async function syncProductionOrdersWithCustomerOrder(
  orderId: string
): Promise<{
  success: boolean;
  message: string;
  updatedOrders: any[];
  createdOrders: any[];
  errors: string[];
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Get full analysis with production orders
    const analysis = await analyzeCustomerOrderStock(orderId);
    
    if (!analysis.hasExistingProductionOrders) {
      return {
        success: false,
        message: "No production orders to sync",
        updatedOrders: [],
        createdOrders: [],
        errors: ["No existing production orders found for this customer order"],
      };
    }

    const updatedOrders = [];
    const createdOrders = [];
    const errors = [];

    // Map order lines to production orders by product
    const orderLinesByProduct = new Map();
    for (const line of analysis.orderLines) {
      const key = `${line.productId}-${line.productVariantId || 'none'}`;
      if (!orderLinesByProduct.has(key)) {
        orderLinesByProduct.set(key, []);
      }
      orderLinesByProduct.get(key).push(line);
    }

    const productionOrdersByProduct = new Map();
    for (const po of analysis.existingProductionOrders || []) {
      const key = `${po.productId}-${po.productVariantId || 'none'}`;
      if (!productionOrdersByProduct.has(key)) {
        productionOrdersByProduct.set(key, []);
      }
      productionOrdersByProduct.get(key).push(po);
    }

    // Update existing production orders or create new ones
    for (const [key, orderLines] of orderLinesByProduct) {
      const totalNeeded = orderLines.reduce((sum: number, line: any) => sum + line.quantityToProduce, 0);
      
      if (totalNeeded === 0) continue; // Skip if no production needed

      const existingPOs = productionOrdersByProduct.get(key) || [];

      if (existingPOs.length > 0) {
        // Update first production order with new quantity
        const firstPO = existingPOs[0];
        
        try {
          const updated = await prisma.productionOrder.update({
            where: { id: firstPO.id },
            data: {
              quantity: totalNeeded,
              dueDate: new Date(analysis.requiredDate),
              updatedAt: new Date(),
              modifiedBy: session.user.id,
              notes: `${firstPO.notes || ''}\n[Auto-synced on ${new Date().toLocaleString()}] - Quantity updated from ${firstPO.quantity} to ${totalNeeded}`,
            },
            include: {
              product: true,
              productVariant: true,
            },
          });

          updatedOrders.push(updated);
        } catch (error) {
          errors.push(`Failed to update production order ${firstPO.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Cancel extra production orders if any
        for (let i = 1; i < existingPOs.length; i++) {
          try {
            await prisma.productionOrder.update({
              where: { id: existingPOs[i].id },
              data: {
                status: Status.CANCELLED,
                notes: `${existingPOs[i].notes || ''}\n[Auto-cancelled on ${new Date().toLocaleString()}] - Duplicate order removed during sync`,
              },
            });
          } catch (error) {
            errors.push(`Failed to cancel duplicate production order ${existingPOs[i].id}`);
          }
        }
      } else {
        // Create new production order for this product
        const firstLine = orderLines[0];
        
        try {
          const defaultWorkCenter = await prisma.workCenter.findFirst({
            where: { status: Status.ACTIVE },
          });

          if (!defaultWorkCenter) {
            errors.push(`Cannot create production order: No active work center found`);
            continue;
          }

          const startDate = new Date();
          const dueDate = new Date(analysis.requiredDate);
          dueDate.setDate(dueDate.getDate() - 1);

          const newPO = await createProductionOrder({
            productId: firstLine.productId,
            productVariantId: firstLine.productVariantId,
            quantity: totalNeeded,
            startDate,
            dueDate,
            priority: Priority.MEDIUM,
            customerOrderId: orderId,
            notes: `[Auto-created during sync on ${new Date().toLocaleString()}] - Production required for updated customer order`,
            operations: [
              {
                workCenterId: defaultWorkCenter.id,
                startTime: startDate,
                endTime: dueDate,
                cost: 0,
              },
            ],
          });

          createdOrders.push(newPO);
        } catch (error) {
          errors.push(`Failed to create production order for ${firstLine.productName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath(`/admin/customer-orders-v2/${orderId}/production-planning`);
    revalidatePath("/admin/production");

    return {
      success: errors.length === 0,
      message: `Sync completed: ${updatedOrders.length} updated, ${createdOrders.length} created`,
      updatedOrders,
      createdOrders,
      errors,
    };
  } catch (error) {
    console.error("Error syncing production orders:", error);
    return {
      success: false,
      message: "Failed to sync production orders",
      updatedOrders: [],
      createdOrders: [],
      errors: [error instanceof Error ? error.message : "Unknown error occurred"],
    };
  }
}

// Helper functions

/**
 * Determines overall order status based on order line analyses
 */
function determineOverallOrderStatus(
  orderLines: OrderLineStockStatus[]
): OverallOrderStatus {
  const stockLines = orderLines.filter(
    (line) => line.recommendedAction === RecommendedAction.USE_STOCK
  );
  const productionLines = orderLines.filter(
    (line) =>
      line.recommendedAction === RecommendedAction.PRODUCE_ALL ||
      line.recommendedAction === RecommendedAction.HYBRID
  );
  const problematicLines = orderLines.filter(
    (line) =>
      line.recommendedAction === RecommendedAction.ORDER_MATERIALS ||
      line.recommendedAction === RecommendedAction.DELAY_ORDER
  );

  if (problematicLines.length > 0) {
    return OverallOrderStatus.MATERIAL_SHORTAGE;
  } else if (stockLines.length === orderLines.length) {
    return OverallOrderStatus.CAN_FULFILL_IMMEDIATELY;
  } else if (productionLines.length === orderLines.length) {
    return OverallOrderStatus.REQUIRES_PRODUCTION;
  } else {
    return OverallOrderStatus.MIXED;
  }
}

/**
 * Calculates estimated fulfillment date based on order line analyses
 */
function calculateEstimatedFulfillmentDate(
  orderLines: OrderLineStockStatus[]
): Date {
  const maxLeadTime = Math.max(
    ...orderLines.map((line) =>
      line.recommendedAction !== RecommendedAction.USE_STOCK
        ? line.estimatedLeadTime || 0
        : 0
    )
  );

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + maxLeadTime);

  return estimatedDate;
}

/**
 * Normalizes Decimal values to numbers for calculations
 */
function normalizeDecimal(value: any): number {
  if (typeof value === "object" && value && "toNumber" in value) {
    return (value as Decimal).toNumber();
  }
  return Number(value || 0);
}
