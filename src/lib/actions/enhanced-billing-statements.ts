"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { BillingStatus } from "@prisma/client";
import { serializeDecimals } from "@/lib/utils/decimal-serializer";
import { createDeliveryReceipt } from "@/lib/actions/delivery-receipts";
import { DeliveryReceiptFormData, DeliveryStatus } from "@/types/admin/billing";

// Interface for customer order-based billing
interface CustomerOrderBillingData {
  type: "customer_order";
  customerOrderId: string;
  totalAmount: number;
  billingDate: Date;
  dueDate: Date;
  status: BillingStatus;
  notes?: string;
  taxAmount?: number;
  discountAmount?: number;
  // Delivery information for creating delivery receipt
  deliveryAddress?: string;
  deliveryDate?: Date;
  receivedBy?: string;
  receivedByTitle?: string;
  deliveryNotes?: string;
  createDeliveryReceipt?: boolean;
}

// Interface for manual billing creation
interface ManualBillingData {
  type: "manual";
  customerId?: string; // Optional - can select existing customer
  customerName: string; // Required - can be typed manually
  totalAmount: number;
  billingDate: Date;
  dueDate: Date;
  status: BillingStatus;
  notes?: string;
  taxAmount?: number;
  discountAmount?: number;
  items: BillingItem[];
}

interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId?: string;
  materialId?: string;
  inventoryItemId?: string;
}

type BillingStatementData = CustomerOrderBillingData | ManualBillingData;

export async function createEnhancedBillingStatement(
  data: BillingStatementData
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Generate unique statement number
    const statementNumber = await generateStatementNumber();
    const invoiceNumber = `INV-${statementNumber}`;

    if (data.type === "customer_order") {
      return await createCustomerOrderBilling(
        data,
        statementNumber,
        invoiceNumber,
        session.user.id
      );
    } else {
      return await createManualBilling(
        data,
        statementNumber,
        invoiceNumber,
        session.user.id
      );
    }
  } catch (error) {
    console.error("Error creating billing statement:", error);
    throw new Error("Failed to create billing statement");
  }
}

async function createCustomerOrderBilling(
  data: CustomerOrderBillingData,
  statementNumber: string,
  invoiceNumber: string,
  userId: string
) {
  // Get customer order details
  const customerOrder = await prisma.customerOrder.findUnique({
    where: { id: data.customerOrderId },
    include: {
      customer: true,
      orderLines: {
        include: {
          product: true,
          productVariant: true,
        },
      },
    },
  });

  if (!customerOrder) {
    throw new Error("Customer order not found");
  }

  const taxAmount = new Decimal(data.taxAmount || 0);
  const discountAmount = new Decimal(data.discountAmount || 0);
  const totalAmount = new Decimal(data.totalAmount);
  const netAmount = totalAmount.minus(discountAmount).plus(taxAmount);

  // Use transaction to create all documents together
  const result = await prisma.$transaction(async (tx) => {
    // Create billing statement first
    const billingStatement = await tx.billingStatement.create({
      data: {
        statementNumber,
        customerName: customerOrder.customer?.name || "Unknown Customer",
        totalAmount,
        taxAmount,
        discountAmount,
        netAmount,
        billingDate: data.billingDate,
        dueDate: data.dueDate,
        status: data.status,
        notes: data.notes,
        createdBy: userId,
        customerId: customerOrder.customerId,
        customerOrderId: data.customerOrderId,
      },
    });

    // Create sales invoice linked to billing statement
    const salesInvoice = await tx.salesInvoice.create({
      data: {
        invoiceNumber,
        billingStatementId: billingStatement.id,
        subtotal: totalAmount,
        taxAmount,
        discountAmount,
        totalAmount: netAmount,
        createdBy: userId,
        invoiceItems: {
          create: customerOrder.orderLines.map((line) => {
            const productName = line.product?.name || "Unknown Product";
            const variantName = line.productVariant?.displayName;
            const description = variantName
              ? `${productName} - ${variantName}`
              : productName;

            return {
              description,
              quantity: new Decimal(line.quantity),
              unitPrice: line.unitPrice,
              totalPrice: new Decimal(line.quantity).mul(line.unitPrice),
              productId: line.productId,
              // Note: OrderLine doesn't have materialId, only productId and productVariantId
            };
          }),
        },
      },
    });

    return { billingStatement, salesInvoice };
  });

  // Create delivery receipt if requested
  if (data.createDeliveryReceipt) {
    // Ensure required fields have valid defaults
    const defaultDeliveryAddress =
      data.deliveryAddress ||
      customerOrder.shippingAddress ||
      customerOrder.customer?.address ||
      `Customer: ${customerOrder.customer?.name || "Unknown"} - Address to be provided`;

    const defaultReceivedBy =
      data.receivedBy ||
      customerOrder.customer?.contactPerson ||
      customerOrder.customer?.name ||
      "To be determined";

    const deliveryData: DeliveryReceiptFormData = {
      billingStatementId: result.billingStatement.id,
      deliveryDate: data.deliveryDate || new Date(),
      deliveryAddress: defaultDeliveryAddress,
      receivedBy: defaultReceivedBy,
      receivedByTitle: data.receivedByTitle,
      deliveryNotes:
        data.deliveryNotes ||
        `Auto-generated delivery receipt for Order ${customerOrder.id}`,
      deliveryStatus: DeliveryStatus.PENDING,
    };

    const deliveryReceiptResult = await createDeliveryReceipt(deliveryData);
    if (!deliveryReceiptResult.success) {
      console.error(
        "Failed to create delivery receipt:",
        deliveryReceiptResult.error
      );
      console.error("Delivery data that failed:", deliveryData);
      // Don't throw error - billing statement and invoice were created successfully
    } else {
      console.log(
        "✅ Delivery receipt created successfully:",
        deliveryReceiptResult.data?.id
      );
    }
  }

  revalidatePath("/admin/billing/billing-statements");
  revalidatePath("/admin/customer-orders");
  revalidatePath("/admin/billing/delivery-receipts");
  return serializeDecimals(result.billingStatement);
}

async function createManualBilling(
  data: ManualBillingData,
  statementNumber: string,
  invoiceNumber: string,
  userId: string
) {
  const taxAmount = new Decimal(data.taxAmount || 0);
  const discountAmount = new Decimal(data.discountAmount || 0);
  const totalAmount = new Decimal(data.totalAmount);
  const netAmount = totalAmount.minus(discountAmount).plus(taxAmount);

  // Validate customer if customerId is provided
  let customer = null;
  if (data.customerId) {
    customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      throw new Error("Selected customer not found");
    }
  }

  // Create sales invoice with manual items
  const salesInvoice = await prisma.salesInvoice.create({
    data: {
      invoiceNumber,
      subtotal: totalAmount,
      taxAmount,
      discountAmount,
      totalAmount: netAmount,
      createdBy: userId,
      invoiceItems: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          totalPrice: new Decimal(item.totalPrice),
          productId: item.productId,
          materialId: item.materialId,
          inventoryItemId: item.inventoryItemId,
        })),
      },
    },
  });

  // Create billing statement
  const billingStatement = await prisma.billingStatement.create({
    data: {
      statementNumber,
      customerName: customer?.name || data.customerName,
      totalAmount,
      taxAmount,
      discountAmount,
      netAmount,
      billingDate: data.billingDate,
      dueDate: data.dueDate,
      status: data.status,
      notes: data.notes,
      createdBy: userId,
      salesInvoiceId: salesInvoice.id,
      customerId: data.customerId, // Can be null for manual entry
      // customerOrderId is null for manual billing
    },
  });

  revalidatePath("/admin/billing/billing-statements");
  return serializeDecimals(billingStatement);
}

async function generateStatementNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  // Get the count of billing statements created this month
  const count = await prisma.billingStatement.count({
    where: {
      createdAt: {
        gte: new Date(year, today.getMonth(), 1),
        lt: new Date(year, today.getMonth() + 1, 1),
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `BS-${year}${month}-${sequence}`;
}

// Helper function to get all customers for selection
export async function getCustomersForBilling() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const customers = await prisma.customer.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        creditLimit: true,
        paymentTerms: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return serializeDecimals(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

// Helper function to get products/materials for manual billing
export async function getItemsForBilling() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const [products, materials, inventoryItems] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          code: true,
          sellingPrice: true,
          unit: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.material.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          code: true,
          unitCost: true,
          unit: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.inventoryItem.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          itemName: true,
          itemCode: true,
          unitCost: true,
          unit: true,
        },
        orderBy: {
          itemName: "asc",
        },
      }),
    ]);

    return serializeDecimals({
      products,
      materials,
      inventoryItems,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    throw new Error("Failed to fetch items");
  }
}

export async function getBillingStatements() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const statements = await prisma.billingStatement.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            code: true,
          },
        },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            status: true,
          },
        },
        salesInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize decimal fields for client consumption
    return serializeDecimals(statements);
  } catch (error) {
    console.error("Error fetching billing statements:", error);
    throw new Error("Failed to fetch billing statements");
  }
}

export async function getBillingStatement(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const statement = await prisma.billingStatement.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            code: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
          },
        },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            status: true,
            totalAmount: true,
          },
        },
        salesInvoice: {
          include: {
            invoiceItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
                material: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!statement) {
      return null;
    }

    // Serialize decimal fields for client consumption
    return serializeDecimals(statement);
  } catch (error) {
    console.error("Error fetching billing statement:", error);
    throw new Error("Failed to fetch billing statement");
  }
}

export async function updateBillingStatementStatus(
  id: string,
  status: BillingStatus
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const billingStatement = await prisma.billingStatement.update({
      where: { id },
      data: {
        status,
        modifiedBy: session.user.id,
        modifiedAt: new Date(),
        ...(status === "PAID" && { paidDate: new Date() }),
      },
    });

    revalidatePath("/admin/billing/billing-statements");
    return serializeDecimals(billingStatement);
  } catch (error) {
    console.error("Error updating billing statement status:", error);
    throw new Error("Failed to update billing statement status");
  }
}

export async function deleteBillingStatement(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Get billing statement with sales invoice
    const billingStatement = await prisma.billingStatement.findUnique({
      where: { id },
      include: {
        salesInvoice: true,
      },
    });

    if (!billingStatement) {
      throw new Error("Billing statement not found");
    }

    // Delete in transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete billing statement first
      await tx.billingStatement.delete({
        where: { id },
      });

      // Delete associated sales invoice if it exists
      if (billingStatement.salesInvoiceId) {
        await tx.salesInvoice.delete({
          where: { id: billingStatement.salesInvoiceId },
        });
      }
    });

    revalidatePath("/admin/billing/billing-statements");
  } catch (error) {
    console.error("Error deleting billing statement:", error);
    throw new Error("Failed to delete billing statement");
  }
}
