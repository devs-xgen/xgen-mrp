"use server";

import { prisma } from "@/lib/db";
import {
  CustomerOrder,
  CreateCustomerOrderInput,
  CustomerOrderAnalysis,
  ProductStockAvailability,
  StockStatus,
  RecommendedAction,
  ProductionDecision,
  OverallOrderStatus,
  OrderLineAnalysis,
  ProductionOption,
  MaterialAvailabilityStatus,
  MaterialShortage,
  ProductionDecisionInput,
} from "@/types/admin/customer-order";
import { Status, Priority } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { createProductionOrder } from "./production-order";
import { createProductionBOMFromProduct } from "./production-bom";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  try {
    const orders = await prisma.customerOrder.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
              },
            },
          },
        },
        productionOrders: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        _count: {
          select: {
            productionOrders: true,
            orderLines: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Prisma model to CustomerOrder type with proper type conversion
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      orderDate: order.orderDate,
      requiredDate: order.requiredDate,
      status: order.status,
      totalAmount:
        order.totalAmount instanceof Decimal
          ? order.totalAmount.toNumber()
          : Number(order.totalAmount),
      notes: order.notes,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
      },
      orderLines: order.orderLines.map((line) => ({
        id: line.id,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice:
          line.unitPrice instanceof Decimal
            ? line.unitPrice.toNumber()
            : Number(line.unitPrice),
        status: line.status,
        product: line.product
          ? {
              id: line.product.id,
              name: line.product.name,
              sku: line.product.sku,
            }
          : undefined,
      })),
      productionOrders: order.productionOrders?.map((po) => ({
        id: po.id,
        quantity: po.quantity,
        status: po.status,
        priority: po.priority,
        startDate: po.startDate,
        dueDate: po.dueDate,
        completedQuantity: po.completedQuantity,
        product: {
          id: po.product.id,
          name: po.product.name,
          sku: po.product.sku,
        },
      })),
      _count: order._count,
    }));
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    throw new Error("Failed to fetch customer orders");
  }
}

/**
 * Checks inventory levels for ordered products and determines production needs
 * @param orderLines Array of order lines with product IDs and quantities
 * @returns Array of products needing production with required quantities
 */
export async function checkInventoryLevels(
  orderLines: Array<{ productId: string; quantity: number }>
) {
  // Get product IDs from order lines
  const productIds = orderLines.map((line) => line.productId);

  // Fetch product details including inventory information
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      sku: true,
      name: true,
      currentStock: true,
      minimumStockLevel: true,
      leadTime: true,
    },
  });

  // Convert any Decimal values to numbers to avoid serialization issues
  const normalizedProducts = products.map((product) => ({
    ...product,
    // Ensure any potential Decimal fields are converted to numbers
    currentStock:
      typeof product.currentStock === "object" &&
      "toNumber" in product.currentStock
        ? (product.currentStock as any).toNumber()
        : Number(product.currentStock),
    minimumStockLevel:
      typeof product.minimumStockLevel === "object" &&
      "toNumber" in product.minimumStockLevel
        ? (product.minimumStockLevel as any).toNumber()
        : Number(product.minimumStockLevel),
    leadTime:
      typeof product.leadTime === "object" && "toNumber" in product.leadTime
        ? (product.leadTime as any).toNumber()
        : Number(product.leadTime),
  }));

  // Determine which products need production orders
  const productsNeedingProduction = [];

  for (const orderLine of orderLines) {
    const product = normalizedProducts.find(
      (p) => p.id === orderLine.productId
    );
    if (!product) continue;

    // Calculate required quantity based on:
    // 1. How much of the order exceeds current stock
    // 2. Whether fulfilling the order would drop below minimum stock level
    const stockAfterOrder = product.currentStock - orderLine.quantity;

    // Case 1: Not enough stock to fulfill the order
    if (stockAfterOrder < 0) {
      productsNeedingProduction.push({
        product,
        requiredQuantity: Math.abs(stockAfterOrder),
        reason: "INSUFFICIENT_STOCK",
      });
      continue;
    }

    // Case 2: Enough stock for order but would drop below minimum level
    if (stockAfterOrder < product.minimumStockLevel) {
      productsNeedingProduction.push({
        product,
        // Order enough to restore minimum stock level
        requiredQuantity: product.minimumStockLevel - stockAfterOrder,
        reason: "BELOW_MINIMUM",
      });
    }
  }

  return productsNeedingProduction;
}

export async function createCustomerOrder(data: CreateCustomerOrderInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const year = new Date().getFullYear();
    const lastOrder = await prisma.customerOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `CO-${year}`,
        },
      },
      orderBy: {
        orderNumber: "desc",
      },
    });

    let sequenceNumber = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2]);
      sequenceNumber = lastSequence + 1;
    }

    const orderNumber = `CO-${year}-${String(sequenceNumber).padStart(4, "0")}`;

    const totalAmount = data.orderLines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0
    );

    // Validate and convert `requiredDate`
    if (!data.requiredDate) {
      throw new Error("Required date is missing");
    }

    const requiredDate = new Date(data.requiredDate);
    if (isNaN(requiredDate.getTime())) {
      throw new Error("Invalid required date format");
    }

    // Use the checkInventoryLevels helper function to determine production needs
    const productsNeedingProduction = await checkInventoryLevels(
      data.orderLines
    );

    // Create the customer order
    const customerOrder = await prisma.customerOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        orderDate: new Date(), // Order date is always set to now
        requiredDate, // Now properly included
        status: Status.PENDING,
        totalAmount: new Decimal(totalAmount),
        notes: data.notes,
        orderLines: {
          create: data.orderLines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: new Decimal(line.unitPrice),
            status: Status.PENDING,
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
    });

    // Create production orders for products with insufficient inventory
    const createdProductionOrders = [];

    // Get default work center for operations
    const defaultWorkCenter = await prisma.workCenter.findFirst({
      where: {
        status: Status.ACTIVE,
      },
    });

    if (!defaultWorkCenter) {
      console.warn("No active work center found for production orders");
    }

    for (const item of productsNeedingProduction) {
      if (!defaultWorkCenter) continue; // Skip if no default work center

      const startDate = new Date();
      const dueDate = new Date(requiredDate);
      dueDate.setDate(dueDate.getDate() - 1); // Set due date one day before required date

      try {
        const productionOrder = await createProductionOrder({
          productId: item.product.id,
          quantity: item.requiredQuantity,
          startDate,
          dueDate,
          priority: Priority.HIGH,
          customerOrderId: customerOrder.id,
          notes: `Auto-generated for Customer Order ${orderNumber} - Reason: ${item.reason}`,
          operations: [
            {
              workCenterId: defaultWorkCenter.id,
              startTime: startDate,
              endTime: dueDate,
              cost: 0, // Default cost, to be updated later
            },
          ],
        });

        createdProductionOrders.push(productionOrder);
      } catch (error) {
        console.error(
          `Failed to create production order for product ${item.product.name}:`,
          error
        );
      }
    }

    revalidatePath("/admin/customer-orders");

    // Return both the customer order and any created production orders
    return {
      customerOrder,
      productionOrders: createdProductionOrders,
    };
  } catch (error) {
    console.error("Error creating customer order:", error);
    throw new Error("Failed to create customer order");
  }
}

export async function updateCustomerOrder(
  id: string,
  data: {
    status?: Status;
    notes?: string;
  }
) {
  try {
    const result = await prisma.customerOrder.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
    });

    // Transform to CustomerOrder type
    const updatedOrder: CustomerOrder = {
      id: result.id,
      orderNumber: result.orderNumber,
      customerId: result.customerId,
      orderDate: result.orderDate,
      requiredDate: result.requiredDate,
      status: result.status,
      totalAmount:
        result.totalAmount instanceof Decimal
          ? result.totalAmount.toNumber()
          : Number(result.totalAmount),
      notes: result.notes,
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        email: result.customer.email,
      },
      orderLines: result.orderLines.map((line) => ({
        id: line.id,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: 0,
        status: line.status,
        product: line.product
          ? {
              id: line.product.id,
              name: line.product.name,
              sku: line.product.sku,
            }
          : undefined,
      })),
    };

    revalidatePath("/admin/customer-orders");
    return updatedOrder;
  } catch (error) {
    console.error("Error updating customer order:", error);
    throw new Error("Failed to update customer order");
  }
}

export async function deleteCustomerOrder(id: string) {
  try {
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        orderLines: {
          select: { id: true },
        },
        productionOrders: {
          select: { id: true },
        },
      },
    });

    if (!customerOrder) {
      throw new Error("Customer order not found");
    }

    // Use transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete production orders and related data first
      if (customerOrder.productionOrders.length > 0) {
        const productionOrderIds = customerOrder.productionOrders.map(
          (po) => po.id
        );

        // Delete ProductionBOM entries
        await tx.productionBOM.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Delete Operations
        await tx.operation.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Delete Quality Checks
        await tx.qualityCheck.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Delete Material Reservations
        await tx.materialReservation.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Delete Material Consumptions
        await tx.productionMaterialConsumption.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Delete Production Batches
        await tx.productionBatch.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Delete Cost Variances
        await tx.costVariance.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Delete Delivery Assignments
        await tx.deliveryAssignment.deleteMany({
          where: { productionOrderId: { in: productionOrderIds } },
        });

        // Finally delete production orders
        await tx.productionOrder.deleteMany({
          where: { id: { in: productionOrderIds } },
        });
      }

      // Delete order lines
      if (customerOrder.orderLines.length > 0) {
        await tx.orderLine.deleteMany({
          where: { orderId: id },
        });
      }

      // Delete any transactions
      await tx.transaction.deleteMany({
        where: { orderId: id },
      });

      // Finally delete the customer order
      await tx.customerOrder.delete({
        where: { id },
      });
    });

    revalidatePath("/admin/customer-orders");
    revalidatePath("/admin/production");
  } catch (error) {
    console.error("Error deleting customer order:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to delete customer order");
  }
}

/**
 * Enhanced customer order analysis with comprehensive stock and material checking
 */
export async function analyzeCustomerOrder(
  orderLines: Array<{ productId: string; quantity: number }>
): Promise<CustomerOrderAnalysis> {
  try {
    const orderLineAnalyses: OrderLineAnalysis[] = [];
    let totalEstimatedCost = 0;
    let canFulfillCompletely = true;
    let hasStockIssues = false;
    let hasMaterialIssues = false;
    const recommendedActions: string[] = [];

    for (const orderLine of orderLines) {
      const analysis = await analyzeOrderLine(
        orderLine.productId,
        orderLine.quantity
      );
      orderLineAnalyses.push(analysis);

      // Update overall status flags
      if (analysis.stockAvailability.stockStatus !== StockStatus.SUFFICIENT) {
        hasStockIssues = true;
        canFulfillCompletely = false;
      }

      if (!analysis.materialAvailability.allMaterialsAvailable) {
        hasMaterialIssues = true;
        canFulfillCompletely = false;
      }

      // Add to total estimated cost
      const recommendedOption = analysis.productionOptions.find(
        (option) => option.type === analysis.recommendedOption
      );
      if (recommendedOption) {
        totalEstimatedCost += recommendedOption.estimatedCost;
      }
    }

    // Determine overall status
    let overallStatus: OverallOrderStatus;
    if (canFulfillCompletely && !hasStockIssues) {
      overallStatus = OverallOrderStatus.CAN_FULFILL_IMMEDIATELY;
    } else if (hasStockIssues && !hasMaterialIssues) {
      overallStatus = OverallOrderStatus.REQUIRES_PRODUCTION;
    } else if (hasMaterialIssues) {
      overallStatus = OverallOrderStatus.MATERIAL_SHORTAGE;
    } else {
      overallStatus = OverallOrderStatus.PARTIAL_FULFILLMENT;
    }

    // Generate recommendations
    if (hasStockIssues && !hasMaterialIssues) {
      recommendedActions.push(
        "Create production orders for products with insufficient stock"
      );
    }
    if (hasMaterialIssues) {
      recommendedActions.push("Order materials before starting production");
    }
    if (canFulfillCompletely) {
      recommendedActions.push(
        "Order can be fulfilled immediately from existing stock"
      );
    }

    return {
      orderLines: orderLineAnalyses,
      overallStatus,
      canFulfillCompletely,
      hasStockIssues,
      hasMaterialIssues,
      recommendedActions,
      totalEstimatedCost,
      estimatedCompletionDate:
        calculateEstimatedCompletionDate(orderLineAnalyses),
    };
  } catch (error) {
    console.error("Error analyzing customer order:", error);
    throw new Error("Failed to analyze customer order");
  }
}

/**
 * Analyze a single order line for stock availability and production options
 */
async function analyzeOrderLine(
  productId: string,
  requestedQuantity: number
): Promise<OrderLineAnalysis> {
  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      boms: {
        include: {
          material: {
            select: {
              id: true,
              name: true,
              sku: true,
              currentStock: true,
              minimumStockLevel: true,
              availableStock: true,
              costPerUnit: true,
              leadTime: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Analyze stock availability
  const stockAvailability = analyzeProductStock(product, requestedQuantity);

  // Analyze material availability for production
  const materialAvailability = await analyzeMaterialAvailability(
    product.boms,
    requestedQuantity
  );

  // Generate production options
  const productionOptions = generateProductionOptions(
    product,
    requestedQuantity,
    stockAvailability,
    materialAvailability
  );

  // Determine recommended option
  const recommendedOption = determineRecommendedOption(
    productionOptions,
    stockAvailability
  );

  return {
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    requestedQuantity,
    stockAvailability,
    materialAvailability,
    productionOptions,
    recommendedOption,
  };
}

/**
 * Analyze product stock availability
 */
function analyzeProductStock(
  product: any,
  requestedQuantity: number
): ProductStockAvailability {
  const currentStock = Number(product.currentStock);
  const minimumStockLevel = Number(product.minimumStockLevel);
  const availableStock = Math.max(0, currentStock - minimumStockLevel);
  const shortfall = requestedQuantity - currentStock;

  let stockStatus: StockStatus;
  let recommendedAction: RecommendedAction;

  if (
    currentStock >= requestedQuantity &&
    availableStock >= requestedQuantity
  ) {
    stockStatus = StockStatus.SUFFICIENT;
    recommendedAction = RecommendedAction.USE_STOCK;
  } else if (
    currentStock >= requestedQuantity &&
    availableStock < requestedQuantity
  ) {
    stockStatus = StockStatus.LOW_STOCK;
    recommendedAction = RecommendedAction.HYBRID;
  } else if (currentStock > 0) {
    stockStatus = StockStatus.INSUFFICIENT;
    recommendedAction = RecommendedAction.HYBRID;
  } else {
    stockStatus = StockStatus.OUT_OF_STOCK;
    recommendedAction = RecommendedAction.PRODUCE_ALL;
  }

  const stockToUse = Math.min(availableStock, requestedQuantity);
  const quantityToProduce = Math.max(0, requestedQuantity - stockToUse);

  return {
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    requiredQuantity: requestedQuantity,
    currentStock,
    minimumStockLevel,
    availableStock,
    shortfall: Math.max(0, shortfall),
    stockStatus,
    recommendations: {
      canFulfillFromStock: stockStatus === StockStatus.SUFFICIENT,
      stockToUse,
      quantityToProduce,
      recommendedAction,
      estimatedLeadTime: product.leadTime || 7,
    },
  };
}

/**
 * Analyze material availability for production
 */
async function analyzeMaterialAvailability(
  boms: any[],
  productionQuantity: number
): Promise<MaterialAvailabilityStatus> {
  const materialShortages: MaterialShortage[] = [];
  let allMaterialsAvailable = true;
  let estimatedCost = 0;

  for (const bom of boms) {
    const requiredQuantity = Number(bom.quantityNeeded) * productionQuantity;
    const wasteQuantity =
      requiredQuantity * (Number(bom.wastePercentage) / 100);
    const totalRequired = requiredQuantity + wasteQuantity;

    const material = bom.material;
    const availableMaterial = Number(material.currentStock);
    const shortage = Math.max(0, totalRequired - availableMaterial);

    estimatedCost += totalRequired * Number(material.costPerUnit);

    if (shortage > 0) {
      allMaterialsAvailable = false;
      materialShortages.push({
        materialId: material.id,
        materialName: material.name,
        materialSku: material.sku,
        required: totalRequired,
        available: availableMaterial,
        shortage,
        estimatedLeadTime: material.leadTime || 7,
      });
    }
  }

  return {
    allMaterialsAvailable,
    materialShortages,
    estimatedCost,
    canStartProduction: allMaterialsAvailable,
  };
}

/**
 * Generate production options for a product
 */
function generateProductionOptions(
  product: any,
  requestedQuantity: number,
  stockAvailability: ProductStockAvailability,
  materialAvailability: MaterialAvailabilityStatus
): ProductionOption[] {
  const options: ProductionOption[] = [];
  const baseEstimatedDays = product.leadTime || 7;

  // Option 1: Use available stock only
  if (stockAvailability.availableStock > 0) {
    options.push({
      type: ProductionDecision.USE_AVAILABLE_STOCK,
      description: `Use ${stockAvailability.recommendations.stockToUse} units from existing stock`,
      stockUsed: stockAvailability.recommendations.stockToUse,
      productionQuantity: 0,
      estimatedCost: 0,
      estimatedDays: 0,
      materialRequirements: [],
      feasible:
        stockAvailability.recommendations.stockToUse >= requestedQuantity,
      risks:
        stockAvailability.recommendations.stockToUse < requestedQuantity
          ? [
              `Shortfall of ${requestedQuantity - stockAvailability.recommendations.stockToUse} units`,
            ]
          : [],
    });
  }

  // Option 2: Full production
  options.push({
    type: ProductionDecision.FULL_PRODUCTION,
    description: `Produce all ${requestedQuantity} units`,
    stockUsed: 0,
    productionQuantity: requestedQuantity,
    estimatedCost: materialAvailability.estimatedCost,
    estimatedDays: materialAvailability.allMaterialsAvailable
      ? baseEstimatedDays
      : baseEstimatedDays + 7,
    materialRequirements: convertToMaterialRequirements(
      product.boms,
      requestedQuantity
    ),
    feasible: materialAvailability.allMaterialsAvailable,
    risks: materialAvailability.allMaterialsAvailable
      ? []
      : [
          `Material shortages: ${materialAvailability.materialShortages.length} items`,
        ],
  });

  // Option 3: Hybrid approach (use stock + produce remainder)
  if (
    stockAvailability.recommendations.stockToUse > 0 &&
    stockAvailability.recommendations.quantityToProduce > 0
  ) {
    const hybridMaterialCost =
      (materialAvailability.estimatedCost / requestedQuantity) *
      stockAvailability.recommendations.quantityToProduce;

    options.push({
      type: ProductionDecision.HYBRID_APPROACH,
      description: `Use ${stockAvailability.recommendations.stockToUse} from stock, produce ${stockAvailability.recommendations.quantityToProduce} units`,
      stockUsed: stockAvailability.recommendations.stockToUse,
      productionQuantity: stockAvailability.recommendations.quantityToProduce,
      estimatedCost: hybridMaterialCost,
      estimatedDays: materialAvailability.allMaterialsAvailable
        ? baseEstimatedDays
        : baseEstimatedDays + 7,
      materialRequirements: convertToMaterialRequirements(
        product.boms,
        stockAvailability.recommendations.quantityToProduce
      ),
      feasible: true,
      risks: [],
    });
  }

  return options;
}

/**
 * Convert BOMs to material requirements
 */
function convertToMaterialRequirements(boms: any[], quantity: number) {
  return boms.map((bom) => {
    const requiredQuantity = Number(bom.quantityNeeded) * quantity;
    const wasteQuantity =
      requiredQuantity * (Number(bom.wastePercentage) / 100);
    const totalRequired = requiredQuantity + wasteQuantity;

    return {
      materialId: bom.material.id,
      materialName: bom.material.name,
      required: totalRequired,
      available: Number(bom.material.currentStock),
      sufficient: Number(bom.material.currentStock) >= totalRequired,
    };
  });
}

/**
 * Determine the recommended production option
 */
function determineRecommendedOption(
  options: ProductionOption[],
  stockAvailability: ProductStockAvailability
): ProductionDecision {
  // Prioritize feasible options
  const feasibleOptions = options.filter((option) => option.feasible);

  if (feasibleOptions.length === 0) {
    return ProductionDecision.DELAY_UNTIL_MATERIALS;
  }

  // If stock is sufficient, recommend using it
  if (stockAvailability.stockStatus === StockStatus.SUFFICIENT) {
    return ProductionDecision.USE_AVAILABLE_STOCK;
  }

  // If hybrid is available and feasible, recommend it
  const hybridOption = feasibleOptions.find(
    (option) => option.type === ProductionDecision.HYBRID_APPROACH
  );
  if (hybridOption) {
    return ProductionDecision.HYBRID_APPROACH;
  }

  // Otherwise, recommend full production if materials are available
  const fullProductionOption = feasibleOptions.find(
    (option) => option.type === ProductionDecision.FULL_PRODUCTION
  );
  if (fullProductionOption) {
    return ProductionDecision.FULL_PRODUCTION;
  }

  return ProductionDecision.DELAY_UNTIL_MATERIALS;
}

/**
 * Calculate estimated completion date based on production requirements
 */
function calculateEstimatedCompletionDate(
  orderLineAnalyses: OrderLineAnalysis[]
): Date | undefined {
  const maxDays = Math.max(
    ...orderLineAnalyses.map((analysis) => {
      const recommendedOption = analysis.productionOptions.find(
        (option) => option.type === analysis.recommendedOption
      );
      return recommendedOption?.estimatedDays || 0;
    })
  );

  if (maxDays === 0) return undefined;

  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + maxDays);
  return completionDate;
}

/**
 * Create production orders with production decisions
 */
export async function createProductionOrdersWithDecisions(
  customerOrderId: string,
  productionDecisions: ProductionDecisionInput[]
): Promise<any[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const createdOrders = [];

    // Get default work center
    const defaultWorkCenter = await prisma.workCenter.findFirst({
      where: { status: Status.ACTIVE },
    });

    if (!defaultWorkCenter) {
      throw new Error("No active work center found");
    }

    for (const decision of productionDecisions) {
      if (decision.productionQuantity <= 0) continue;

      const startDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks default

      try {
        // Create production order
        const productionOrder = await createProductionOrder({
          productId: decision.productId,
          quantity: decision.productionQuantity,
          startDate,
          dueDate,
          priority: Priority.HIGH,
          customerOrderId,
          notes: `Decision: ${decision.decision}${decision.reason ? ` - ${decision.reason}` : ""}`,
          operations: [
            {
              workCenterId: defaultWorkCenter.id,
              startTime: startDate,
              endTime: dueDate,
              cost: 0,
            },
          ],
        });

        // Create ProductionBOM from product BOM
        await createProductionBOMFromProduct({
          productionOrderId: productionOrder.id,
          productId: decision.productId,
          createdBy: session.user.id,
        });

        createdOrders.push(productionOrder);
      } catch (error) {
        console.error(
          `Failed to create production order for product ${decision.productId}:`,
          error
        );
      }
    }

    revalidatePath("/admin/customer-orders");
    revalidatePath("/admin/production");

    return createdOrders;
  } catch (error) {
    console.error("Error creating production orders with decisions:", error);
    throw new Error("Failed to create production orders");
  }
}
