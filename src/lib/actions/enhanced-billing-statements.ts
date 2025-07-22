"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { BillingStatus } from "@prisma/client";

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

export async function createEnhancedBillingStatement(data: BillingStatementData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Generate unique statement number
    const statementNumber = await generateStatementNumber();
    const invoiceNumber = `INV-${statementNumber}`;

    if (data.type === "customer_order") {
      return await createCustomerOrderBilling(data, statementNumber, invoiceNumber, session.user.id);
    } else {
      return await createManualBilling(data, statementNumber, invoiceNumber, session.user.id);
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
          material: true,
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

  // Create sales invoice with order line items
  const salesInvoice = await prisma.salesInvoice.create({
    data: {
      invoiceNumber,
      subtotal: totalAmount,
      taxAmount,
      discountAmount,
      totalAmount: netAmount,
      createdBy: userId,
      invoiceItems: {
        create: customerOrder.orderLines.map((line) => ({
          description: line.product?.name || line.material?.name || "Order Item",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          productId: line.productId,
          materialId: line.materialId,
        })),
      },
    },
  });

  // Create billing statement
  const billingStatement = await prisma.billingStatement.create({
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
      salesInvoiceId: salesInvoice.id,
      customerId: customerOrder.customerId,
      customerOrderId: data.customerOrderId,
    },
  });

  revalidatePath("/admin/billing/billing-statements");
  revalidatePath("/admin/customer-orders");
  return billingStatement;
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
  return billingStatement;
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

    return customers;
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

    return {
      products,
      materials,
      inventoryItems,
    };
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

    return statements;
  } catch (error) {
    console.error("Error fetching billing statements:", error);
    throw new Error("Failed to fetch billing statements");
  }
}

export async function updateBillingStatementStatus(id: string, status: BillingStatus) {
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
    return billingStatement;
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