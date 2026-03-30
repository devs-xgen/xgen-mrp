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
  ProductionWorkflowSummary,
  ProductionWorkflowPhase,
} from "@/types/admin/customer-order";
import { Status, Priority } from "@prisma/client";
import {
  getProductionPhaseStatus,
} from "@/lib/actions/production-order";
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { createProductionOrder } from "./production-order";
import { syncProductionOrdersWithCustomerOrder } from "./order-analysis";
import { createProductionBOMFromProduct } from "./production-bom";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeDecimals } from "@/lib/utils/decimal-serializer";

/**
 * Enhanced customer order retrieval for billing with search and filtering
 */
export async function getCustomerOrdersForBilling(options?: {
  search?: string;
  status?: Status[];
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}): Promise<CustomerOrder[]> {
  try {
    const {
      search,
      status,
      customerId,
      dateFrom,
      dateTo,
      limit = 100,
    } = options || {};

    // Build where clause
    const where: any = {};

    where.deletedAt = null;

    // Search filter
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status && status.length > 0) {
      where.status = { in: status };
    }

    // Customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = dateFrom;
      if (dateTo) where.orderDate.lte = dateTo;
    }

    const orders = await prisma.customerOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            paymentTerms: true,
            creditLimit: true,
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
                description: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
                sellingPrice: true,
              },
            },
          },
        },
        productionOrders: {
          where: {
            deletedAt: null,
          },
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
      take: limit,
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
        phone: order.customer.phone,
        address: order.customer.address,
        paymentTerms: order.customer.paymentTerms,
        creditLimit:
          order.customer.creditLimit instanceof Decimal
            ? order.customer.creditLimit.toNumber()
            : Number(order.customer.creditLimit || 0),
      },
      orderLines: order.orderLines.map((line) => ({
        id: line.id,
        productId: line.productId,
        productVariantId: line.productVariantId || undefined,
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
            description: line.product.description,
            sellingPrice:
              line.product.sellingPrice instanceof Decimal
                ? line.product.sellingPrice.toNumber()
                : Number(line.product.sellingPrice || 0),
          }
          : undefined,
        productVariant: line.productVariant
          ? {
            id: line.productVariant.id,
            sku: line.productVariant.sku,
            displayName: line.productVariant.displayName,
            sizeName: line.productVariant.sizeName,
            colorName: line.productVariant.colorName,
            unitPrice:
              line.productVariant.sellingPrice instanceof Decimal
                ? line.productVariant.sellingPrice.toNumber()
                : Number(line.productVariant.sellingPrice || 0),
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
    console.error("Error fetching customer orders for billing:", error);
    throw new Error("Failed to fetch customer orders for billing");
  }
}

/**
 * Get customer orders with enhanced fulfillment tracking data
 * for the admin interface data table
 */
export async function getCustomerOrdersWithFulfillment(): Promise<
  CustomerOrder[]
> {
  try {
    const orders = await prisma.customerOrder.findMany({
      where: { deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            paymentTerms: true,
            creditLimit: true,
          },
        },
        orderLines: {
          select: {
            id: true,
            productId: true,
            productVariantId: true,
            quantity: true,
            unitPrice: true,
            status: true,
            notes: true,
            // Fulfillment tracking fields
            fulfillmentType: true,
            stockAllocated: true,
            productionQuantity: true,
            fulfillmentStatus: true,
            allocatedAt: true,
            fulfilledAt: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPrice: true,
                description: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
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
        billingStatements: {
          select: {
            id: true,
            statementNumber: true,
            status: true,
            totalAmount: true,
            billingDate: true,
            salesInvoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
              },
            },
            deliveryReceipts: {
              select: {
                id: true,
                receiptNumber: true,
                deliveryStatus: true,
                deliveryDate: true,
              },
            },
          },
        },
        _count: {
          select: {
            productionOrders: true,
            orderLines: true,
            billingStatements: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    // Transform the data to include fulfillment tracking and serialize decimals
    return serializeDecimals(
      orders.map((order) => ({
        ...order,
        orderLines: order.orderLines.map((line) => ({
          ...line,
          // Include fulfillment fields
          fulfillmentType: line.fulfillmentType,
          stockAllocated: line.stockAllocated,
          productionQuantity: line.productionQuantity,
          fulfillmentStatus: line.fulfillmentStatus,
          allocatedAt: line.allocatedAt,
          fulfilledAt: line.fulfilledAt,
        })),
      }))
    );
  } catch (error) {
    console.error("Error fetching customer orders with fulfillment:", error);
    throw new Error("Failed to fetch customer orders");
  }
}

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  try {
    const orders = await prisma.customerOrder.findMany({
      where: { deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            paymentTerms: true,
            creditLimit: true,
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
                description: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
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
        billingStatements: {
          select: {
            id: true,
            statementNumber: true,
            status: true,
            totalAmount: true,
            billingDate: true,
            salesInvoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
              },
            },
            deliveryReceipts: {
              select: {
                id: true,
                receiptNumber: true,
                deliveryStatus: true,
                deliveryDate: true,
              },
            },
          },
        },
        _count: {
          select: {
            productionOrders: true,
            orderLines: true,
            billingStatements: true,
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
        productVariantId: line.productVariantId || undefined,
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
        productVariant: line.productVariant
          ? {
            id: line.productVariant.id,
            sku: line.productVariant.sku,
            displayName: line.productVariant.displayName,
            sizeName: line.productVariant.sizeName,
            colorName: line.productVariant.colorName,
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
      billingStatements: order.billingStatements?.map((bs) => ({
        id: bs.id,
        statementNumber: bs.statementNumber,
        status: bs.status,
        totalAmount:
          bs.totalAmount instanceof Decimal
            ? bs.totalAmount.toNumber()
            : Number(bs.totalAmount),
        billingDate: bs.billingDate,
        salesInvoice: bs.salesInvoice
          ? {
            id: bs.salesInvoice.id,
            invoiceNumber: bs.salesInvoice.invoiceNumber,
            status: bs.salesInvoice.status,
          }
          : undefined,
        deliveryReceipts: bs.deliveryReceipts?.map((dr) => ({
          id: dr.id,
          receiptNumber: dr.receiptNumber,
          deliveryStatus: dr.deliveryStatus,
          deliveryDate: dr.deliveryDate,
        })),
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

/**
 * Validate if a customer order can be used for billing
 */
export async function validateOrderForBilling(orderId: string): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  try {
    const order = await prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        productionOrders: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      return {
        isValid: false,
        errors: ["Customer order not found"],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check order status
    if (order.status === Status.CANCELLED) {
      errors.push("Cannot create billing for cancelled orders");
    }

    if (order.status === Status.PENDING) {
      warnings.push("Order is still in pending status");
    }

    // Check if order has items
    if (!order.orderLines || order.orderLines.length === 0) {
      errors.push("Order has no items to bill");
    }

    // Check if order total is valid
    if (order.totalAmount <= 0) {
      errors.push("Order total amount must be greater than zero");
    }

    // Check customer information
    if (!order.customer) {
      errors.push("Order customer information is missing");
    }

    // Check for existing billing statements (if needed)
    const existingBilling = await prisma.salesInvoice.findFirst({
      where: { customerOrderId: orderId },
    });

    if (existingBilling) {
      warnings.push("A billing statement already exists for this order");
    }

    // Check production order status
    if (order.productionOrders && order.productionOrders.length > 0) {
      const pendingProduction = order.productionOrders.filter(
        (po) => po.status === Status.PENDING || po.status === Status.IN_PROGRESS
      );

      if (pendingProduction.length > 0) {
        warnings.push(
          `${pendingProduction.length} production orders are still pending/in progress`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error("Error validating order for billing:", error);
    return {
      isValid: false,
      errors: ["Failed to validate order for billing"],
      warnings: [],
    };
  }
}

/**
 * Get customer order details with enhanced information for billing preview
 */
export async function getCustomerOrderForBilling(
  orderId: string
): Promise<CustomerOrder | null> {
  try {
    const order = await prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            paymentTerms: true,
            creditLimit: true,
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
                description: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
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
    });

    if (!order) {
      return null;
    }

    // Convert to CustomerOrder type with proper type conversion
    return {
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
        phone: order.customer.phone,
        address: order.customer.address,
        paymentTerms: order.customer.paymentTerms,
        creditLimit:
          order.customer.creditLimit instanceof Decimal
            ? order.customer.creditLimit.toNumber()
            : Number(order.customer.creditLimit || 0),
      },
      orderLines: order.orderLines.map((line) => ({
        id: line.id,
        productId: line.productId,
        productVariantId: line.productVariantId || undefined,
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
            description: line.product.description,
            sellingPrice:
              line.product.sellingPrice instanceof Decimal
                ? line.product.sellingPrice.toNumber()
                : Number(line.product.sellingPrice || 0),
          }
          : undefined,
        productVariant: line.productVariant
          ? {
            id: line.productVariant.id,
            sku: line.productVariant.sku,
            displayName: line.productVariant.displayName,
            sizeName: line.productVariant.sizeName,
            colorName: line.productVariant.colorName,
            unitPrice:
              line.productVariant.sellingPrice instanceof Decimal
                ? line.productVariant.sellingPrice.toNumber()
                : Number(line.productVariant.sellingPrice || 0),
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
    };
  } catch (error) {
    console.error("Error fetching customer order for billing:", error);
    throw new Error("Failed to fetch customer order for billing");
  }
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

    // Note: Inventory analysis and production order creation are now handled separately
    // This allows for better order archiving and flexible production planning

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
            productVariantId: line.productVariantId || null, // Add variant support
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
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
              },
            },
          },
        },
      },
    });

    // Production orders are now created separately through the order analysis workflow
    // This allows for better control over production planning and mixed fulfillment scenarios

    revalidatePath("/admin/customer-orders-v2");

    // Return the created customer order
    // Production orders can be created separately through the order analysis workflow
    return customerOrder;
  } catch (error) {
    console.error("Error creating customer order:", error);

    // Provide detailed error messages
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        throw new Error("Invalid customer or product selected. Please check your selections.");
      } else if (error.message.includes('unique constraint')) {
        throw new Error("This order number already exists. Please try again.");
      } else if (error.message.includes('required')) {
        throw new Error(error.message);
      } else {
        throw new Error(`Failed to create customer order: ${error.message}`);
      }
    }
    throw new Error("Failed to create customer order: Unknown error occurred");
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
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
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

    revalidatePath("/admin/customer-orders-v2");
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

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/production");
  } catch (error) {
    console.error("Error deleting customer order:", error);
    throw new Error("Failed to delete customer order");
  }
}

/**
 * Enhanced customer order analysis with comprehensive stock and material checking
 */
export async function analyzeCustomerOrder(
  orderLines: Array<{
    productId: string;
    productVariantId?: string;
    quantity: number;
  }>
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
        orderLine.quantity,
        orderLine.productVariantId
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
  requestedQuantity: number,
  productVariantId?: string
): Promise<OrderLineAnalysis> {
  // Get product details with optional variant
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
      variants: productVariantId
        ? {
          where: { id: productVariantId },
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
        }
        : false,
    },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Get variant details if variant is specified
  let variant = null;
  if (productVariantId) {
    variant =
      product.variants?.[0] ||
      (await prisma.productVariant.findUnique({
        where: { id: productVariantId },
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
      }));

    if (!variant) {
      throw new Error(`Product variant with ID ${productVariantId} not found`);
    }
  }

  // Analyze stock availability - use variant stock if available, otherwise product stock
  const stockTarget = variant || product;
  const stockAvailability = analyzeProductStock(stockTarget, requestedQuantity);

  // Analyze material availability for production - use variant BOM if available, otherwise product BOM
  const bomsToUse = variant?.boms || product.boms;
  const materialAvailability = await analyzeMaterialAvailability(
    bomsToUse,
    requestedQuantity
  );

  // Generate production options
  const productionOptions = generateProductionOptions(
    stockTarget,
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
    productVariantId: variant?.id,
    productName: product.name,
    productSku: product.sku,
    variantDisplayName: variant?.displayName,
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
    if (!session?.user?.id)
      throw new Error("Unauthorized - no valid session or user ID");

    // Verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new Error(`User with ID ${session.user.id} not found in database`);
    }

    const createdOrders = [];

    // Verify customer order exists
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      select: { id: true, orderNumber: true },
    });

    if (!customerOrder) {
      throw new Error(`Customer order ${customerOrderId} not found`);
    }

    // Get default work center
    const defaultWorkCenter = await prisma.workCenter.findFirst({
      where: { status: Status.ACTIVE },
    });

    if (!defaultWorkCenter) {
      throw new Error("No active work center found");
    }

    console.log(
      `Using work center: ${defaultWorkCenter.name} (${defaultWorkCenter.id})`
    );

    for (const decision of productionDecisions) {
      if (decision.productionQuantity <= 0) {
        console.log(`Skipping product ${decision.productId} - zero quantity`);
        continue;
      }

      const startDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks default

      try {
        console.log(
          `Creating production order for product ${decision.productId}, quantity: ${decision.productionQuantity}`
        );

        // Create production order directly without material availability check
        // (since we want to allow production orders for procurement planning)
        const productionOrder = await prisma.productionOrder.create({
          data: {
            productId: decision.productId,
            productVariantId: decision.productVariantId, // 🆕 ADD: Include variant ID
            quantity: decision.productionQuantity,
            startDate,
            dueDate,
            priority: Priority.HIGH,
            customerOrderId,
            notes: `Decision: ${decision.decision}${decision.reason ? ` - ${decision.reason}` : ""}`,
            status: Status.PENDING,
            createdBy: user.id,
            plannedMaterialCost: 0, // Will be calculated later
            operations: {
              create: [
                {
                  workCenterId: defaultWorkCenter.id,
                  startTime: startDate,
                  endTime: dueDate,
                  status: Status.PENDING,
                  cost: 0,
                },
              ],
            },
          },
          include: {
            product: true,
            operations: {
              include: {
                workCenter: true,
              },
            },
          },
        });

        console.log(`Created production order: ${productionOrder.id}`);

        // Create ProductionBOM from product BOM (with variant support)
        await createProductionBOMFromProduct({
          productionOrderId: productionOrder.id,
          productId: decision.productId,
          productVariantId: decision.productVariantId, // 🆕 ADD: Pass variant ID
          createdBy: user.id,
        });

        createdOrders.push(productionOrder);
      } catch (error) {
        console.error(
          `Failed to create production order for product ${decision.productId}:`,
          error
        );
        // Re-throw the error to stop the process and inform the user
        throw error;
      }
    }

    console.log(
      `Successfully created ${createdOrders.length} production orders`
    );

    // Clear Next.js caches
    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/production");

    return createdOrders;
  } catch (error) {
    console.error("Error creating production orders with decisions:", error);
    throw new Error(
      `Failed to create production orders: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get customer order by ID with all related data
 * Server action replacement for /api/customerOrder/[id] GET
 */
export async function getCustomerOrderById(id: string) {
  try {
    if (!id) {
      throw new Error("Customer order ID is required");
    }

    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            paymentTerms: true,
            creditLimit: true,
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
                description: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
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
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
              },
            },
          },
        },
        billingStatements: {
          select: {
            id: true,
            statementNumber: true,
            status: true,
            totalAmount: true,
            billingDate: true,
            salesInvoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
              },
            },
            deliveryReceipts: {
              select: {
                id: true,
                receiptNumber: true,
                deliveryStatus: true,
                deliveryDate: true,
              },
            },
          },
        },
        transaction: true,
        _count: {
          select: {
            orderLines: true,
            productionOrders: true,
            billingStatements: true,
            transaction: true,
          },
        },
      },
    });

    if (!customerOrder) {
      throw new Error("Customer order not found");
    }

    return customerOrder;
  } catch (error) {
    console.error("Error fetching customer order by ID:", error);
    throw new Error(
      `Failed to fetch customer order: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Update customer order with order lines
 * Server action replacement for /api/customerOrder/[id] PATCH
 */
export async function updateCustomerOrderWithLines(
  id: string,
  data: {
    orderNumber?: string;
    customerId?: string;
    orderDate?: Date;
    requiredDate?: Date;
    status?: Status;
    totalAmount?: number;
    shippingAddress?: string;
    billingAddress?: string;
    notes?: string;
    modifiedBy?: string;
    orderLines?: Array<{
      id?: string;
      productId: string;
      productVariantId?: string;
      quantity: number;
      unitPrice: number;
      status?: Status;
      notes?: string;
      createdBy?: string;
      modifiedBy?: string;
    }>;
  }
) {
  try {
    if (!id) {
      throw new Error("Customer order ID is required");
    }

    // Validate required fields
    if (!data.customerId) {
      throw new Error("Customer ID is required");
    }
    if (!data.requiredDate) {
      throw new Error("Required date is required");
    }
    if (!data.totalAmount || data.totalAmount <= 0) {
      throw new Error("Total amount must be greater than zero");
    }
    if (!data.orderLines || data.orderLines.length === 0) {
      throw new Error("Order must have at least one item");
    }

    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id || data.modifiedBy || undefined;

    const normalizeDate = (d?: Date | string) => {
      if (!d) return undefined;
      const date = typeof d === "string" ? new Date(d) : d;
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      return date;
    };

    // Get existing order to preserve required fields
    const existingOrder = await prisma.customerOrder.findUnique({
      where: { id },
      select: { orderDate: true }
    });

    if (!existingOrder) {
      throw new Error("Customer order not found");
    }

    const includeOptions = {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          paymentTerms: true,
          creditLimit: true,
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
              description: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              sku: true,
              displayName: true,
              sizeName: true,
              colorName: true,
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
          orderLines: true,
          productionOrders: true,
          billingStatements: true,
        },
      },
    } as const;

    const updatedCustomerOrder = await prisma.customerOrder.update({
      where: { id },
      data: {
        orderNumber: data.orderNumber,
        customerId: data.customerId,
        orderDate: existingOrder.orderDate, // Preserve existing order date
        requiredDate: normalizeDate(data.requiredDate),
        status: data.status || Status.PENDING,
        totalAmount:
          typeof data.totalAmount === "number"
            ? new Decimal(data.totalAmount)
            : new Decimal(0),
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        notes: data.notes,
        modifiedBy: userId,
        updatedAt: new Date(),
        orderLines: data.orderLines
          ? {
            deleteMany: {}, // Clear existing lines and recreate
            create: data.orderLines.map((orderLineData) => ({
              productId: orderLineData.productId,
              productVariantId: orderLineData.productVariantId ?? null,
              quantity: orderLineData.quantity,
              unitPrice: new Decimal(orderLineData.unitPrice),
              status: orderLineData.status || Status.PENDING,
              notes: orderLineData.notes,
              createdBy: orderLineData.createdBy || userId,
              modifiedBy: userId || orderLineData.modifiedBy,
            })),
          }
          : undefined,
      },
      include: includeOptions,
    });

    let finalCustomerOrder = updatedCustomerOrder;

    if ((updatedCustomerOrder.productionOrders?.length || 0) > 0) {
      try {
        const syncResult = await syncProductionOrdersWithCustomerOrder(id);
        if (!syncResult.success && syncResult.errors.length > 0) {
          console.warn("Customer order update sync warnings:", syncResult.errors);
        }

        const refreshedOrder = await prisma.customerOrder.findUnique({
          where: { id },
          include: includeOptions,
        });

        if (refreshedOrder) {
          finalCustomerOrder = refreshedOrder;
        }
      } catch (syncError) {
        console.error(
          "Failed to sync linked production orders after customer order update:",
          syncError
        );
      }
    }

    // Revalidate related pages
    revalidatePath("/admin/customer-orders-v2");
    revalidatePath(`/admin/customer-orders-v2/${id}`);
    revalidatePath("/admin/production");

    for (const productionOrder of updatedCustomerOrder.productionOrders || []) {
      revalidatePath(`/admin/production/${productionOrder.id}`);
    }

    return finalCustomerOrder;
  } catch (error) {
    console.error("Error updating customer order:", error);
    throw new Error(
      `Failed to update customer order: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Paginated fetch for customer orders
export async function getPaginatedCustomerOrders({
  page = 1,
  limit = 10,
  search = "",
  dateFrom,
  dateTo,
  statuses,
}: {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  statuses?: Status[];
}) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};

    where.deletedAt = null;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) {
        where.orderDate.gte = dateFrom;
      }
      if (dateTo) {
        const adjustedEnd = new Date(dateTo);
        adjustedEnd.setHours(23, 59, 59, 999);
        where.orderDate.lte = adjustedEnd;
      }
    }

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    const [orders, total] = await Promise.all([
      prisma.customerOrder.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          orderLines: {
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
                  sku: true,
                  displayName: true,
                },
              },
            },
          },
          productionOrders: {
            where: {
              deletedAt: null,
            },
            include: {
              delivery: {
                select: {
                  status: true,
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
        skip,
        take: limit,
      }),
      prisma.customerOrder.count({ where }),
    ]);

    // Convert Decimal values to numbers before sending to client
    const convertedOrders = [];

    for (const order of orders) {
      const { productionOrders: productionOrderRecords, ...orderWithoutProduction } = order as any;
      const productionOrdersList = (productionOrderRecords ?? []) as Array<{
        id: string;
        status: Status;
        delivery?: { status: Status } | null;
      }>;

      const workerSummary = { totalOperations: 0, completed: 0, pending: 0 } as {
        totalOperations: number;
        completed: number;
        pending: number;
      };
      const inspectorSummary = { totalChecks: 0, completed: 0, pending: 0 } as {
        totalChecks: number;
        completed: number;
        pending: number;
      };

      let phaseSnapshots: { productionOrderId: string; phaseStatus: any }[] = [];

      if (productionOrdersList.length > 0) {
        const snapshotResults = await Promise.all(
          productionOrdersList.map(async (po) => {
            try {
              const phaseStatus = await getProductionPhaseStatus(po.id);
              return { productionOrderId: po.id, phaseStatus };
            } catch (error) {
              console.error("Failed to fetch phase status for production order", po.id, error);
              return null;
            }
          })
        );

        phaseSnapshots = snapshotResults.filter(Boolean) as {
          productionOrderId: string;
          phaseStatus: any;
        }[];

        if (phaseSnapshots.length > 0) {
          for (const snapshot of phaseSnapshots) {
            const { workCenters, inspections } = snapshot.phaseStatus;

            workerSummary.totalOperations += workCenters.totalOperations;
            workerSummary.completed += workCenters.completedCount;
            workerSummary.pending += workCenters.pendingCount + workCenters.inProgressCount;

            inspectorSummary.totalChecks += inspections.totalChecks;
            inspectorSummary.completed += inspections.completedCount;
            inspectorSummary.pending += inspections.pendingCount + inspections.inProgressCount;
          }
        }
      }

      const deliveryStats = productionOrdersList.reduce(
        (acc, po) => {
          if (po.delivery) {
            acc.assigned += 1;
            if (po.delivery.status === "COMPLETED") {
              acc.completed += 1;
            } else if (po.delivery.status === "IN_PROGRESS") {
              acc.inProgress += 1;
            } else {
              acc.pending += 1;
            }
          } else {
            acc.unassigned += 1;
          }
          return acc;
        },
        { assigned: 0, completed: 0, inProgress: 0, pending: 0, unassigned: 0 }
      );

      const deliverySummary = {
        assigned: deliveryStats.assigned,
        completed: deliveryStats.completed,
        pending: Math.max(deliveryStats.assigned - deliveryStats.completed, 0) + deliveryStats.unassigned,
      };

      const hasProduction = productionOrdersList.length > 0;
      let phase: ProductionWorkflowPhase = hasProduction ? "NOT_STARTED" : "NOT_STARTED";

      if (hasProduction) {
        if (phaseSnapshots.length === 0) {
          phase = "NOT_STARTED";
        } else if (workerSummary.pending > 0) {
          phase = "WORKER";
        } else if (inspectorSummary.pending > 0) {
          phase = "INSPECTOR";
        } else if (deliverySummary.pending > 0) {
          phase = "DELIVERY";
        } else {
          phase = "COMPLETED";
        }
      }

      const description = !hasProduction
        ? "No production order yet"
        : phaseSnapshots.length === 0
          ? "Production status unavailable"
          : phase === "WORKER"
            ? `${workerSummary.completed}/${workerSummary.totalOperations || 0} work center operations completed`
            : phase === "INSPECTOR"
              ? `${inspectorSummary.completed}/${inspectorSummary.totalChecks || 0} inspections completed`
              : phase === "DELIVERY"
                ? deliverySummary.assigned > 0
                  ? `${deliverySummary.completed}/${deliverySummary.assigned} deliveries completed`
                  : "Awaiting delivery scheduling"
                : "Production and delivery completed";

      const productionWorkflow: ProductionWorkflowSummary = {
        phase,
        hasProduction,
        worker: workerSummary,
        inspector: inspectorSummary,
        delivery: deliverySummary,
        description,
      };

      convertedOrders.push({
        ...orderWithoutProduction,
        totalAmount: order.totalAmount.toNumber(),
        customer: {
          ...order.customer,
          creditLimit: order.customer.creditLimit?.toNumber() || 0,
        },
        orderLines: order.orderLines.map((line) => ({
          ...line,
          unitPrice: line.unitPrice.toNumber(),
          product: line.product
            ? {
              ...line.product,
              sellingPrice: line.product.sellingPrice?.toNumber() || 0,
            }
            : undefined,
          productVariant: line.productVariant
            ? {
              ...line.productVariant,
              sellingPrice: line.productVariant.sellingPrice?.toNumber() || 0,
            }
            : undefined,
        })),
        productionWorkflow,
      });
    }

    return {
      data: convertedOrders,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching paginated customer orders:", error);
    throw new Error("Failed to fetch paginated customer orders");
  }
}

export async function getCustomerOrderStats() {
  try {
    const [total, pending, completed, cancelled, totalAmountResult, pendingAmountResult] = await Promise.all([
      prisma.customerOrder.count({ where: { deletedAt: null } }),
      prisma.customerOrder.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.customerOrder.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.customerOrder.count({ where: { status: "CANCELLED", deletedAt: null } }),
      prisma.customerOrder.aggregate({
        where: { deletedAt: null },
        _sum: { totalAmount: true },
      }),
      prisma.customerOrder.aggregate({
        where: { status: "PENDING", deletedAt: null },
        _sum: { totalAmount: true },
      }),
    ]);

    // Get most recent order
    const mostRecentOrder = await prisma.customerOrder.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true, createdAt: true }
    });

    // Calculate monthly growth
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const [currentMonthOrders, lastMonthOrders] = await Promise.all([
      prisma.customerOrder.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: currentMonthStart
          }
        }
      }),
      prisma.customerOrder.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      })
    ]);

    const orderGrowth = lastMonthOrders === 0
      ? 100
      : Math.round(((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100);

    return {
      totalOrders: total,
      pendingOrders: pending,
      completedOrders: completed,
      cancelledOrders: cancelled,
      totalAmount: totalAmountResult._sum.totalAmount?.toNumber() || 0,
      pendingAmount: pendingAmountResult._sum.totalAmount?.toNumber() || 0,
      mostRecentOrder: mostRecentOrder ? {
        orderNumber: mostRecentOrder.orderNumber,
        date: mostRecentOrder.createdAt
      } : null,
      monthlyTrends: {
        currentMonth: currentMonthOrders,
        lastMonth: lastMonthOrders,
        growth: orderGrowth
      }
    };
  } catch (error) {
    console.error("Error fetching customer order stats:", error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalAmount: 0,
      pendingAmount: 0,
      mostRecentOrder: null,
      monthlyTrends: { currentMonth: 0, lastMonth: 0, growth: 0 }
    };
  }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export async function exportCustomerOrdersData(filters?: {
  search?: string;
  statuses?: Status[];
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<{ csvContent: string; filename: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized: Please log in to export data");

  const where: any = {};
  if (filters?.statuses?.length) where.status = { in: filters.statuses };
  if (filters?.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: "insensitive" } },
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.orderDate = {};
    if (filters.dateFrom) where.orderDate.gte = filters.dateFrom;
    if (filters.dateTo) where.orderDate.lte = filters.dateTo;
  }

  const orders = await prisma.customerOrder.findMany({
    where,
    orderBy: { orderDate: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      productionOrders: { select: { id: true } },
    },
  });

  const headers = [
    "Order Number",
    "Status",
    "Customer Name",
    "Customer Email",
    "Total Amount",
    "Order Date",
    "Due Date",
    "Payment Status",
    "Production Orders",
    "Notes",
    "Created At",
  ];

  const toNum = (v: any) => (typeof v === "number" ? v : v?.toNumber ? v.toNumber() : Number(v ?? 0));
  const fmtDate = (d: Date | null | undefined) => (d ? new Date(d).toISOString().split("T")[0] : "");
  const esc = (val: any) => {
    const s = val == null ? "" : String(val);
    return s.includes('"') || s.includes(",") || s.includes("\n")
      ? '"' + s.replaceAll('"', '""') + '"'
      : s;
  };

  const rows = orders.map((o) =>
    [
      o.orderNumber,
      o.status,
      o.customer?.name || "",
      o.customer?.email || "",
      toNum((o as any).totalAmount),
      fmtDate(o.orderDate),
      fmtDate((o as any).dueDate),
      (o as any).paymentStatus || "",
      (o as any).productionOrders?.length ?? 0,
      (o as any).notes || "",
      fmtDate(o.createdAt),
    ]
      .map(esc)
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const ts = new Date().toISOString().split("T")[0];
  return { csvContent, filename: `customer-orders-export-${ts}.csv` };
}

export async function exportCustomerOrdersExcel(filters?: {
  search?: string;
  statuses?: Status[];
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<{ base64: string; filename: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized: Please log in to export data");

  const where: any = {};
  if (filters?.statuses?.length) where.status = { in: filters.statuses };
  if (filters?.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: "insensitive" } },
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.orderDate = {};
    if (filters.dateFrom) where.orderDate.gte = filters.dateFrom;
    if (filters.dateTo) where.orderDate.lte = filters.dateTo;
  }

  const orders = await prisma.customerOrder.findMany({
    where,
    orderBy: { orderDate: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      productionOrders: { select: { id: true } },
    },
  });

  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Customer Orders");

  ws.addRow([
    "Order Number",
    "Status",
    "Customer Name",
    "Customer Email",
    "Total Amount",
    "Order Date",
    "Due Date",
    "Payment Status",
    "Production Orders",
    "Notes",
    "Created At",
  ]);
  ws.getRow(1).font = { bold: true };

  const toNum = (v: any) => (typeof v === "number" ? v : v?.toNumber ? v.toNumber() : Number(v ?? 0));

  orders.forEach((o) => {
    ws.addRow([
      o.orderNumber,
      o.status,
      o.customer?.name || "",
      o.customer?.email || "",
      toNum((o as any).totalAmount),
      o.orderDate ? new Date(o.orderDate) : null,
      (o as any).dueDate ? new Date((o as any).dueDate) : null,
      (o as any).paymentStatus || "",
      (o as any).productionOrders?.length ?? 0,
      (o as any).notes || "",
      o.createdAt ? new Date(o.createdAt) : null,
    ]);
  });

  ws.getColumn(5).numFmt = "#,##0.00";
  [6, 7, 11].forEach((col) => {
    ws.getColumn(col).numFmt = "yyyy-mm-dd";
  });

  ws.columns.forEach((col: any) => {
    let max = 12;
    col.eachCell({ includeEmpty: true }, (cell: any) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(42, max + 2);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const ts = new Date().toISOString().split("T")[0];
  return { base64, filename: `customer-orders-export-${ts}.xlsx` };
}

// ---------------- Soft Delete / Trash ----------------

export async function softDeleteCustomerOrder(orderId: string, reason?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const existing = await prisma.customerOrder.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error("Customer order not found");
    if (existing.deletedAt) throw new Error("Customer order is already in trash");

    await prisma.customerOrder.update({
      where: { id: orderId },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
        deletedReason: reason ?? null,
      },
    });

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/customer-orders-v2/trash");
  } catch (error) {
    console.error("Error soft-deleting customer order:", error);
    throw error instanceof Error ? error : new Error("Failed to move customer order to trash");
  }
}

export async function restoreCustomerOrder(orderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const existing = await prisma.customerOrder.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error("Customer order not found");
    if (!existing.deletedAt) throw new Error("Customer order is not in trash");

    await prisma.customerOrder.update({
      where: { id: orderId },
      data: {
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
    });

    revalidatePath("/admin/customer-orders-v2");
    revalidatePath("/admin/customer-orders-v2/trash");
  } catch (error) {
    console.error("Error restoring customer order:", error);
    throw error instanceof Error ? error : new Error("Failed to restore customer order");
  }
}

export async function getTrashedCustomerOrders() {
  try {
    const orders = await prisma.customerOrder.findMany({
      where: { deletedAt: { not: null } },
      include: {
        customer: true,
        orderLines: { include: { product: true } },
      },
      orderBy: { deletedAt: "desc" },
    });
    return serializeDecimals(orders);
  } catch (error) {
    console.error("Error fetching trashed customer orders:", error);
    throw new Error("Failed to fetch trashed customer orders");
  }
}

export async function purgeExpiredTrashedCustomerOrders() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const result = await prisma.customerOrder.deleteMany({
      where: { deletedAt: { not: null, lte: cutoff } },
    });

    revalidatePath("/admin/customer-orders-v2/trash");
    return { purged: result.count };
  } catch (error) {
    console.error("Error purging expired trashed customer orders:", error);
    throw error instanceof Error ? error : new Error("Failed to purge expired customer orders");
  }
}

