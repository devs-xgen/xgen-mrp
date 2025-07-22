"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  BillingStatement,
  BillingStatementWithRelations,
  BillingStatementFormData,
  BillingStatementFilters,
  BillingActionResponse,
  PaginatedResponse,
  BillingAnalytics,
  BillingStatus,
  InvoiceStatus,
  billingStatementSchema,
  billingStatementFiltersSchema,
} from "@/types/admin/billing";
import { BillingStatus as PrismaBillingStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// ==============================================
// BILLING STATEMENT CRUD OPERATIONS
// ==============================================

export async function getAllBillingStatements(
  filters?: BillingStatementFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<BillingStatementWithRelations>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Parse and validate filters
    const validatedFilters = filters
      ? billingStatementFiltersSchema.parse(filters)
      : {};

    // Build where clause
    const whereClause: any = {};

    if (validatedFilters.status && validatedFilters.status.length > 0) {
      whereClause.status = {
        in: validatedFilters.status as PrismaBillingStatus[],
      };
    }

    if (validatedFilters.customerId) {
      whereClause.customerId = validatedFilters.customerId;
    }

    if (validatedFilters.dateRange) {
      whereClause.billingDate = {
        gte: validatedFilters.dateRange.start,
        lte: validatedFilters.dateRange.end,
      };
    }

    if (validatedFilters.amountRange) {
      whereClause.totalAmount = {
        gte: new Decimal(validatedFilters.amountRange.min),
        lte: new Decimal(validatedFilters.amountRange.max),
      };
    }

    // Optimized search using new schema structure with customerName field (Requirements 2.1, 2.2, 4.4)
    if (validatedFilters.search) {
      whereClause.OR = [
        {
          statementNumber: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
        {
          customerName: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
        {
          customer: {
            name: { contains: validatedFilters.search, mode: "insensitive" },
          },
        },
        { notes: { contains: validatedFilters.search, mode: "insensitive" } },
      ];
    }

    // Build order clause
    const orderBy: any = {};
    if (validatedFilters.sortBy) {
      orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder || "desc";
    } else {
      orderBy.billingDate = "desc";
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await prisma.billingStatement.count({ where: whereClause });

    // Get statements with optimized relations using new schema structure (Requirements 4.1, 4.2, 4.4)
    const statements = await prisma.billingStatement.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            code: true,
            address: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            tinNumber: true,
            status: true,
          },
        },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            requiredDate: true,
            status: true,
            totalAmount: true,
          },
        },
        productionOrder: {
          select: {
            id: true,
            quantity: true,
            startDate: true,
            dueDate: true,
            status: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        // One-to-many relationship with delivery receipts (Requirement 4.4)
        deliveryReceipts: {
          select: {
            id: true,
            receiptNumber: true,
            deliveryDate: true,
            receivedBy: true,
            deliveryStatus: true,
            deliveryAddress: true,
            trackingNumber: true,
            courierService: true,
          },
          orderBy: { deliveryDate: "desc" },
        },
        // One-to-one relationship with sales invoice (Requirement 4.4)
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
                Material: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
                InventoryItem: {
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
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        modifiedByUser: {
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
      orderBy,
      skip,
      take: pageSize,
    });

    return {
      data: statements as BillingStatementWithRelations[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Error fetching billing statements:", error);
    throw new Error("Failed to fetch billing statements");
  }
}

export async function getBillingStatementById(
  id: string
): Promise<BillingStatementWithRelations | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Optimized query using new relationship structure (Requirements 4.1, 4.2, 4.4)
    const statement = await prisma.billingStatement.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            code: true,
            address: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            tinNumber: true,
            status: true,
          },
        },
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            requiredDate: true,
            status: true,
            totalAmount: true,
          },
        },
        productionOrder: {
          select: {
            id: true,
            quantity: true,
            startDate: true,
            dueDate: true,
            status: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        // One-to-many relationship with delivery receipts (Requirement 4.4)
        deliveryReceipts: {
          select: {
            id: true,
            receiptNumber: true,
            deliveryDate: true,
            receivedBy: true,
            deliveryStatus: true,
            deliveryAddress: true,
            trackingNumber: true,
            courierService: true,
            signatureImage: true,
            photoEvidence: true,
          },
          orderBy: { deliveryDate: "desc" },
        },
        // One-to-one relationship with sales invoice (Requirement 4.4)
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
                Material: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
                InventoryItem: {
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
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        modifiedByUser: {
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

    return statement as BillingStatementWithRelations | null;
  } catch (error) {
    console.error("Error fetching billing statement:", error);
    throw new Error("Failed to fetch billing statement");
  }
}

export async function createBillingStatement(
  data: BillingStatementFormData
): Promise<BillingActionResponse<BillingStatement>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = billingStatementSchema.parse(data);

    // Derive customer name if not provided
    let customerName = validatedData.customerName;
    if (!customerName && validatedData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId },
        select: { name: true },
      });
      customerName = customer?.name || "Unknown Customer";
    } else if (!customerName && validatedData.customerOrderId) {
      const customerOrder = await prisma.customerOrder.findUnique({
        where: { id: validatedData.customerOrderId },
        include: { customer: { select: { name: true } } },
      });
      customerName = customerOrder?.customer.name || "Unknown Customer";
    }

    if (!customerName) {
      return { success: false, error: "Customer name is required" };
    }

    // Calculate amounts
    const subtotal = validatedData.subtotal;
    const taxAmount = (subtotal * validatedData.taxRate) / 100;
    const totalAmount = subtotal + taxAmount - validatedData.discountAmount;
    const netAmount = totalAmount;

    // Generate unique statement number
    const statementNumber = await generateStatementNumber();

    // Use transaction to create both billing statement and sales invoice
    const result = await prisma.$transaction(async (tx) => {
      // Create billing statement first
      const billingStatement = await tx.billingStatement.create({
        data: {
          statementNumber,
          customerId: validatedData.customerId,
          customerName,
          customerOrderId: validatedData.customerOrderId,
          productionOrderId: validatedData.productionOrderId,
          totalAmount: new Decimal(totalAmount),
          taxAmount: new Decimal(taxAmount),
          discountAmount: new Decimal(validatedData.discountAmount),
          netAmount: new Decimal(netAmount),
          status: "DRAFT" as PrismaBillingStatus,
          billingDate: new Date(),
          dueDate: validatedData.dueDate,
          notes: validatedData.notes,
          createdBy: session.user.id,
        },
      });

      // Create sales invoice linked to billing statement
      const salesInvoice = await tx.salesInvoice.create({
        data: {
          invoiceNumber: await generateInvoiceNumber(),
          billingStatementId: billingStatement.id,
          invoiceDate: new Date(),
          subtotal: new Decimal(subtotal),
          taxRate: new Decimal(validatedData.taxRate),
          taxAmount: new Decimal(taxAmount),
          discountAmount: new Decimal(validatedData.discountAmount),
          totalAmount: new Decimal(totalAmount),
          paymentTerms: validatedData.paymentTerms,
          dueDate: validatedData.dueDate,
          status: "DRAFT" as InvoiceStatus,
          poNumber: validatedData.poNumber,
          terms: validatedData.terms,
          footerNotes: validatedData.footerNotes,
          createdBy: session.user.id,
          invoiceItems: {
            create: validatedData.invoiceItems.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: new Decimal(item.quantity),
              unitPrice: new Decimal(item.unitPrice),
              totalPrice: new Decimal(item.quantity * item.unitPrice),
              productCode: item.productCode,
              unit: item.unit,
              discountPercent: item.discountPercent
                ? new Decimal(item.discountPercent)
                : null,
              taxable: item.taxable,
            })),
          },
        },
      });

      return billingStatement;
    });

    revalidatePath("/admin/billing/billing-statements");
    revalidatePath("/admin/billing/sales-invoices");

    return {
      success: true,
      data: result as BillingStatement,
      message: "Billing statement created successfully",
    };
  } catch (error) {
    console.error("Error creating billing statement:", error);
    return {
      success: false,
      error: "Failed to create billing statement",
    };
  }
}

export async function updateBillingStatement(
  id: string,
  data: Partial<BillingStatementFormData>
): Promise<BillingActionResponse<BillingStatement>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get existing statement
    const existingStatement = await prisma.billingStatement.findUnique({
      where: { id },
      include: { salesInvoice: true },
    });

    if (!existingStatement) {
      return { success: false, error: "Billing statement not found" };
    }

    // Prepare update data
    const updateData: any = {
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    };

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    // Update billing statement
    const updatedStatement = await prisma.billingStatement.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/billing/billing-statements");
    revalidatePath(`/admin/billing/billing-statements/${id}`);

    return {
      success: true,
      data: updatedStatement as BillingStatement,
      message: "Billing statement updated successfully",
    };
  } catch (error) {
    console.error("Error updating billing statement:", error);
    return {
      success: false,
      error: "Failed to update billing statement",
    };
  }
}

export async function updateBillingStatementStatus(
  id: string,
  status: BillingStatus
): Promise<BillingActionResponse<BillingStatement>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = {
      status: status as PrismaBillingStatus,
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    };

    // Set paid date if status is PAID
    if (status === BillingStatus.PAID) {
      updateData.paidDate = new Date();
    }

    const updatedStatement = await prisma.billingStatement.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/billing/billing-statements");
    revalidatePath(`/admin/billing/billing-statements/${id}`);

    return {
      success: true,
      data: updatedStatement as BillingStatement,
      message: `Billing statement marked as ${status.toLowerCase()}`,
    };
  } catch (error) {
    console.error("Error updating billing statement status:", error);
    return {
      success: false,
      error: "Failed to update billing statement status",
    };
  }
}

export async function deleteBillingStatement(
  id: string
): Promise<BillingActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the statement to check if it can be deleted
    const statement = await prisma.billingStatement.findUnique({
      where: { id },
      include: { salesInvoice: true },
    });

    if (!statement) {
      return { success: false, error: "Billing statement not found" };
    }

    // Only allow deletion of draft statements
    if (statement.status !== "DRAFT") {
      return {
        success: false,
        error: "Only draft billing statements can be deleted",
      };
    }

    // Delete in transaction - cascade delete will handle sales invoice and items
    await prisma.billingStatement.delete({
      where: { id },
    });

    revalidatePath("/admin/billing/billing-statements");
    revalidatePath("/admin/billing/sales-invoices");

    return {
      success: true,
      message: "Billing statement deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting billing statement:", error);
    return {
      success: false,
      error: "Failed to delete billing statement",
    };
  }
}

// ==============================================
// ANALYTICS FUNCTIONS
// ==============================================

export async function getBillingAnalytics(): Promise<BillingAnalytics> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Get basic counts and totals
    const [totalCount, totalRevenue, paidStatements, overdueStatements] =
      await Promise.all([
        prisma.billingStatement.count(),
        prisma.billingStatement.aggregate({
          _sum: { totalAmount: true },
        }),
        prisma.billingStatement.aggregate({
          where: { status: "PAID" },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.billingStatement.aggregate({
          where: { status: "OVERDUE" },
          _sum: { totalAmount: true },
          _count: true,
        }),
      ]);

    // Get monthly revenue for the last 12 months
    const monthlyRevenue = await getMonthlyRevenue();

    // Get status breakdown
    const statusBreakdown = await getStatusBreakdown();

    // Get top customers
    const topCustomers = await getTopCustomers();

    // Get recent activity (simplified)
    const recentActivity = await getRecentBillingActivity();

    return {
      totalBillingStatements: totalCount,
      totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
      paidAmount: paidStatements._sum.totalAmount?.toNumber() || 0,
      overdueAmount: overdueStatements._sum.totalAmount?.toNumber() || 0,
      pendingAmount:
        (totalRevenue._sum.totalAmount?.toNumber() || 0) -
        (paidStatements._sum.totalAmount?.toNumber() || 0),
      monthlyRevenue,
      statusBreakdown,
      topCustomers,
      recentActivity,
    };
  } catch (error) {
    console.error("Error fetching billing analytics:", error);
    throw new Error("Failed to fetch billing analytics");
  }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

async function generateStatementNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Get count of statements for this month
  const count = await prisma.billingStatement.count({
    where: {
      statementNumber: {
        startsWith: `BS-${year}${month}`,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `BS-${year}${month}-${sequence}`;
}

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Get count of invoices for this month
  const count = await prisma.salesInvoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}${month}`,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `INV-${year}${month}-${sequence}`;
}

async function getMonthlyRevenue() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const results = await prisma.billingStatement.groupBy({
    by: ["billingDate"],
    where: {
      billingDate: {
        gte: twelveMonthsAgo,
      },
      status: "PAID",
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  // Process results to group by month
  const monthlyData: any = {};
  results.forEach((result) => {
    const date = new Date(result.billingDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[key]) {
      monthlyData[key] = {
        month: date.toLocaleString("default", { month: "long" }),
        year: date.getFullYear(),
        revenue: 0,
        invoiceCount: 0,
      };
    }

    monthlyData[key].revenue += result._sum.totalAmount?.toNumber() || 0;
    monthlyData[key].invoiceCount += result._count;
  });

  return Object.values(monthlyData);
}

async function getStatusBreakdown() {
  const results = await prisma.billingStatement.groupBy({
    by: ["status"],
    _count: true,
    _sum: {
      totalAmount: true,
    },
  });

  const total = results.reduce((sum, result) => sum + result._count, 0);

  return results.map((result) => ({
    status: result.status as BillingStatus,
    count: result._count,
    amount: result._sum.totalAmount?.toNumber() || 0,
    percentage: total > 0 ? (result._count / total) * 100 : 0,
  }));
}

// Optimized top customers query using new schema structure (Requirements 4.1, 4.2, 4.4)
async function getTopCustomers() {
  const results = await prisma.billingStatement.groupBy({
    by: ["customerId", "customerName"],
    _count: true,
    _sum: {
      totalAmount: true,
    },
    orderBy: {
      _sum: {
        totalAmount: "desc",
      },
    },
    take: 10,
  });

  // Enhanced query with additional customer analytics
  const enhancedResults = await Promise.all(
    results.map(async (result) => {
      // Get outstanding amount for this customer
      const outstandingAmount = await prisma.billingStatement.aggregate({
        where: {
          customerId: result.customerId,
          status: { in: ["DRAFT", "SENT", "OVERDUE"] },
        },
        _sum: { totalAmount: true },
      });

      // Get last billing date
      const lastBilling = await prisma.billingStatement.findFirst({
        where: { customerId: result.customerId },
        orderBy: { billingDate: "desc" },
        select: { billingDate: true },
      });

      return {
        customerId: result.customerId,
        customerName: result.customerName || "Unknown",
        totalAmount: result._sum.totalAmount?.toNumber() || 0,
        statementCount: result._count,
        lastBillingDate: lastBilling?.billingDate || new Date(),
        outstandingAmount: outstandingAmount._sum.totalAmount?.toNumber() || 0,
      };
    })
  );

  return enhancedResults;
}

async function getRecentBillingActivity() {
  const recentStatements = await prisma.billingStatement.findMany({
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: {
      modifiedByUser: {
        select: {
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

  return recentStatements.map((statement) => ({
    id: statement.id,
    type: "UPDATED" as const,
    description: `Billing statement ${statement.statementNumber} was updated`,
    timestamp: statement.updatedAt,
    userId: statement.modifiedBy || statement.createdBy || "",
    userName: statement.modifiedByUser?.profile
      ? `${statement.modifiedByUser.profile.firstName} ${statement.modifiedByUser.profile.lastName}`
      : statement.modifiedByUser?.email || "System",
  }));
}

// ==============================================
// QUICK ACTIONS
// ==============================================

export async function createBillingStatementFromCustomerOrder(
  customerOrderId: string
): Promise<BillingActionResponse<BillingStatement>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get customer order with details
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!customerOrder) {
      return { success: false, error: "Customer order not found" };
    }

    // Create billing statement from order data
    const formData: BillingStatementFormData = {
      customerId: customerOrder.customerId,
      customerName: customerOrder.customer.name,
      customerOrderId: customerOrderId,
      subtotal: customerOrder.totalAmount.toNumber(),
      taxRate: 12, // Default tax rate
      discountAmount: 0,
      invoiceItems: customerOrder.orderLines.map((line) => ({
        productId: line.productId,
        description: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toNumber(),
        productCode: line.product.sku,
        unit: "PCS",
        taxable: true,
      })),
      paymentTerms: "Net 30",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    return await createBillingStatement(formData);
  } catch (error) {
    console.error(
      "Error creating billing statement from customer order:",
      error
    );
    return {
      success: false,
      error: "Failed to create billing statement from customer order",
    };
  }
}

export async function createBillingStatementFromProductionOrder(
  productionOrderId: string
): Promise<BillingActionResponse<BillingStatement>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get production order with details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
        customerOrder: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!productionOrder) {
      return { success: false, error: "Production order not found" };
    }

    if (!productionOrder.customerOrder) {
      return {
        success: false,
        error: "Production order must be linked to a customer order",
      };
    }

    // Calculate total amount
    const totalAmount =
      productionOrder.product.sellingPrice.toNumber() *
      productionOrder.quantity;

    // Create billing statement from production order data
    const formData: BillingStatementFormData = {
      customerId: productionOrder.customerOrder.customerId,
      customerName: productionOrder.customerOrder.customer.name,
      customerOrderId: productionOrder.customerOrderId,
      productionOrderId: productionOrderId,
      subtotal: totalAmount,
      taxRate: 12, // Default tax rate
      discountAmount: 0,
      invoiceItems: [
        {
          productId: productionOrder.productId,
          description: productionOrder.product.name,
          quantity: productionOrder.quantity,
          unitPrice: productionOrder.product.sellingPrice.toNumber(),
          productCode: productionOrder.product.sku,
          unit: "PCS",
          taxable: true,
        },
      ],
      paymentTerms: "Net 30",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    return await createBillingStatement(formData);
  } catch (error) {
    console.error(
      "Error creating billing statement from production order:",
      error
    );
    return {
      success: false,
      error: "Failed to create billing statement from production order",
    };
  }
}
