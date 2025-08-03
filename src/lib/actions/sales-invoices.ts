"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  SalesInvoice,
  SalesInvoiceWithItems,
  SalesInvoiceFormData,
  SalesInvoiceFilters,
  BillingActionResponse,
  PaginatedResponse,
  SalesReportData,
  InvoiceStatus,
  PDFExportResponse,
  CSVExportResponse,
  salesInvoiceSchema,
  salesInvoiceFiltersSchema,
} from "@/types/admin/billing";
import { InvoiceStatus as PrismaInvoiceStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { generateSalesInvoicePDF } from "@/lib/services/pdf-generator";

// ==============================================
// SALES INVOICE CRUD OPERATIONS
// ==============================================

export async function getAllSalesInvoices(
  filters?: SalesInvoiceFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<SalesInvoiceWithItems>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Parse and validate filters
    const validatedFilters = filters
      ? salesInvoiceFiltersSchema.parse(filters)
      : {};

    // Build where clause
    const whereClause: any = {};

    if (validatedFilters.status && validatedFilters.status.length > 0) {
      whereClause.status = {
        in: validatedFilters.status as PrismaInvoiceStatus[],
      };
    }

    if (validatedFilters.dateRange) {
      whereClause.invoiceDate = {
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

    // Optimized search using new schema structure with billing statement customerName (Requirements 2.1, 2.2, 4.4)
    if (validatedFilters.search) {
      whereClause.OR = [
        {
          invoiceNumber: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
        {
          poNumber: { contains: validatedFilters.search, mode: "insensitive" },
        },
        {
          billingStatement: {
            customerName: {
              contains: validatedFilters.search,
              mode: "insensitive",
            },
          },
        },
        {
          billingStatement: {
            statementNumber: {
              contains: validatedFilters.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Build order clause
    const orderBy: any = {};
    if (validatedFilters.sortBy) {
      orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder || "desc";
    } else {
      orderBy.invoiceDate = "desc";
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await prisma.salesInvoice.count({ where: whereClause });

    // Get invoices with optimized billing statement relationship data (Requirements 4.1, 4.2, 4.4)
    const invoices = await prisma.salesInvoice.findMany({
      where: whereClause,
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
        // Optimized billing statement relationship with customer data (Requirements 4.4, 2.1, 2.2)
        billingStatement: {
          select: {
            id: true,
            statementNumber: true,
            customerName: true, // Use cached customerName field for better performance
            billingDate: true,
            status: true,
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
              },
            },
            productionOrder: {
              select: {
                id: true,
                quantity: true,
                status: true,
                product: {
                  select: {
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

    // Convert Decimal fields to numbers for client component compatibility
    const convertedInvoices = invoices.map((invoice) => ({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      totalAmount: Number(invoice.totalAmount),
      invoiceItems: invoice.invoiceItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountPercent: item.discountPercent
          ? Number(item.discountPercent)
          : null,
      })),
    }));

    return {
      data: convertedInvoices as SalesInvoiceWithItems[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Error fetching sales invoices:", error);
    throw new Error("Failed to fetch sales invoices");
  }
}

export async function getSalesInvoiceById(
  id: string
): Promise<SalesInvoiceWithItems> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id },
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
        billingStatement: {
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
              },
            },
            productionOrder: {
              select: {
                id: true,
                quantity: true,
                status: true,
                product: {
                  select: {
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

    if (!invoice) {
      throw new Error("Sales invoice not found");
    }

    // Convert Decimal fields to numbers for client component compatibility
    const convertedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      totalAmount: Number(invoice.totalAmount),
      invoiceItems: invoice.invoiceItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountPercent: item.discountPercent
          ? Number(item.discountPercent)
          : null,
      })),
    };

    return convertedInvoice as SalesInvoiceWithItems;
  } catch (error) {
    console.error("Error fetching sales invoice:", error);
    throw new Error("Failed to fetch sales invoice");
  }
}

export async function createSalesInvoice(
  data: SalesInvoiceFormData
): Promise<BillingActionResponse<SalesInvoice>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input data
    const validatedData = salesInvoiceSchema.parse(data);

    // Validate that billingStatementId is provided (required)
    if (!validatedData.billingStatementId) {
      return {
        success: false,
        error: "Billing statement ID is required",
      };
    }

    // Check if billing statement exists and validate one-to-one relationship
    const billingStatement = await prisma.billingStatement.findUnique({
      where: { id: validatedData.billingStatementId },
      include: { salesInvoice: true },
    });

    if (!billingStatement) {
      return {
        success: false,
        error: "Billing statement not found",
      };
    }

    // Prevent duplicate invoices for same billing statement (one-to-one relationship)
    if (billingStatement.salesInvoice) {
      return {
        success: false,
        error: "A sales invoice already exists for this billing statement. Each billing statement can only have one sales invoice.",
      };
    }

    // Calculate amounts
    const subtotal = validatedData.subtotal;
    const taxAmount = (subtotal * validatedData.taxRate) / 100;
    const totalAmount = subtotal + taxAmount - validatedData.discountAmount;

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create sales invoice with required billingStatementId
    const salesInvoice = await prisma.salesInvoice.create({
      data: {
        invoiceNumber,
        billingStatementId: validatedData.billingStatementId, // Required field
        invoiceDate: new Date(),
        subtotal: new Decimal(subtotal),
        taxRate: new Decimal(validatedData.taxRate),
        taxAmount: new Decimal(taxAmount),
        discountAmount: new Decimal(validatedData.discountAmount),
        totalAmount: new Decimal(totalAmount),
        paymentTerms: validatedData.paymentTerms,
        dueDate: validatedData.dueDate,
        status: "DRAFT" as PrismaInvoiceStatus,
        poNumber: validatedData.poNumber,
        terms: validatedData.terms,
        footerNotes: validatedData.footerNotes,
        createdBy: session.user.id,
        invoiceItems: {
          create: validatedData.invoiceItems.map((item) => ({
            productId: item.productId,
            materialId: item.materialId,
            inventoryItemId: item.inventoryItemId,
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
      include: {
        billingStatement: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            customerOrder: {
              select: {
                id: true,
                orderNumber: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/admin/billing/sales-invoices");

    return {
      success: true,
      data: salesInvoice as SalesInvoice,
      message: "Sales invoice created successfully",
    };
  } catch (error) {
    console.error("Error creating sales invoice:", error);
    return {
      success: false,
      error: "Failed to create sales invoice",
    };
  }
}

export async function updateSalesInvoice(
  id: string,
  data: Partial<SalesInvoiceFormData>
): Promise<BillingActionResponse<SalesInvoice>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get existing invoice with billing statement relationship
    const existingInvoice = await prisma.salesInvoice.findUnique({
      where: { id },
      include: { 
        invoiceItems: true,
        billingStatement: true 
      },
    });

    if (!existingInvoice) {
      return { success: false, error: "Sales invoice not found" };
    }

    // Only allow editing of draft invoices
    if (existingInvoice.status !== "DRAFT") {
      return {
        success: false,
        error: "Only draft invoices can be edited",
      };
    }

    // Validate one-to-one relationship integrity
    // billingStatementId cannot be changed after creation to maintain relationship integrity
    if (data.billingStatementId && data.billingStatementId !== existingInvoice.billingStatementId) {
      return {
        success: false,
        error: "Cannot change billing statement for existing invoice. Create a new invoice instead.",
      };
    }

    // Prepare update data
    const updateData: any = {
      modifiedBy: session.user.id,
      updatedAt: new Date(),
    };

    if (data.paymentTerms !== undefined) {
      updateData.paymentTerms = data.paymentTerms;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    if (data.terms !== undefined) {
      updateData.terms = data.terms;
    }

    if (data.footerNotes !== undefined) {
      updateData.footerNotes = data.footerNotes;
    }

    // Update invoice items if provided
    if (data.invoiceItems) {
      // Delete existing items and create new ones
      await prisma.salesInvoiceItem.deleteMany({
        where: { salesInvoiceId: id },
      });

      // Recalculate amounts
      const subtotal = data.subtotal || existingInvoice.subtotal.toNumber();
      const taxRate = data.taxRate || existingInvoice.taxRate.toNumber();
      const discountAmount =
        data.discountAmount || existingInvoice.discountAmount.toNumber();
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount - discountAmount;

      updateData.subtotal = new Decimal(subtotal);
      updateData.taxRate = new Decimal(taxRate);
      updateData.taxAmount = new Decimal(taxAmount);
      updateData.discountAmount = new Decimal(discountAmount);
      updateData.totalAmount = new Decimal(totalAmount);

      updateData.invoiceItems = {
        create: data.invoiceItems.map((item) => ({
          productId: item.productId,
          materialId: item.materialId,
          inventoryItemId: item.inventoryItemId,
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
      };
    }

    // Update sales invoice
    const updatedInvoice = await prisma.salesInvoice.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/billing/sales-invoices");
    revalidatePath(`/admin/billing/sales-invoices/${id}`);

    return {
      success: true,
      data: updatedInvoice as SalesInvoice,
      message: "Sales invoice updated successfully",
    };
  } catch (error) {
    console.error("Error updating sales invoice:", error);
    return {
      success: false,
      error: "Failed to update sales invoice",
    };
  }
}

export async function updateSalesInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<BillingActionResponse<SalesInvoice>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedInvoice = await prisma.salesInvoice.update({
      where: { id },
      data: {
        status: status as PrismaInvoiceStatus,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/billing/sales-invoices");
    revalidatePath(`/admin/billing/sales-invoices/${id}`);

    return {
      success: true,
      data: updatedInvoice as SalesInvoice,
      message: `Sales invoice marked as ${status.toLowerCase()}`,
    };
  } catch (error) {
    console.error("Error updating sales invoice status:", error);
    return {
      success: false,
      error: "Failed to update sales invoice status",
    };
  }
}

export async function deleteSalesInvoice(
  id: string
): Promise<BillingActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the invoice to check if it can be deleted
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id },
      include: { billingStatement: true },
    });

    if (!invoice) {
      return { success: false, error: "Sales invoice not found" };
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== "DRAFT") {
      return {
        success: false,
        error: "Only draft invoices can be deleted",
      };
    }

    // Note: Invoice is always linked to a billing statement in the new schema
    // We allow deletion only if the invoice is in DRAFT status (already checked above)

    // Delete in transaction
    await prisma.$transaction([
      // Delete invoice items first
      prisma.salesInvoiceItem.deleteMany({
        where: { salesInvoiceId: id },
      }),
      // Delete sales invoice
      prisma.salesInvoice.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/admin/billing/sales-invoices");

    return {
      success: true,
      message: "Sales invoice deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting sales invoice:", error);
    return {
      success: false,
      error: "Failed to delete sales invoice",
    };
  }
}

// ==============================================
// INVOICE GENERATION FUNCTIONS
// ==============================================

export async function generateInvoiceFromCustomerOrder(
  customerOrderId: string
): Promise<BillingActionResponse<SalesInvoice>> {
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
        billingStatements: true, // Check if billing statement already exists
      },
    });

    if (!customerOrder) {
      return { success: false, error: "Customer order not found" };
    }

    // Check if a billing statement already exists for this customer order
    let billingStatement = customerOrder.billingStatements?.[0];
    
    if (!billingStatement) {
      // Create a billing statement first (required for sales invoice)
      const billingStatementResult = await prisma.billingStatement.create({
        data: {
          statementNumber: `BS-${Date.now()}`, // Generate unique statement number
          customerOrderId: customerOrderId,
          customerId: customerOrder.customerId,
          customerName: customerOrder.customer.name,
          totalAmount: customerOrder.totalAmount,
          taxAmount: new Decimal((customerOrder.totalAmount.toNumber() * 12) / 100), // 12% tax
          discountAmount: new Decimal(0),
          netAmount: new Decimal(customerOrder.totalAmount.toNumber() + (customerOrder.totalAmount.toNumber() * 12) / 100),
          status: "DRAFT",
          billingDate: new Date(),
          createdBy: session.user.id,
        },
      });
      billingStatement = billingStatementResult;
    }

    // Check if invoice already exists for this billing statement
    const existingInvoice = await prisma.salesInvoice.findFirst({
      where: { billingStatementId: billingStatement.id },
    });

    if (existingInvoice) {
      return {
        success: false,
        error: "Sales invoice already exists for this customer order",
      };
    }

    // Create invoice from order data with required billingStatementId
    const formData: SalesInvoiceFormData = {
      billingStatementId: billingStatement.id, // Required field
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

    return await createSalesInvoice(formData);
  } catch (error) {
    console.error("Error generating invoice from customer order:", error);
    return {
      success: false,
      error: "Failed to generate invoice from customer order",
    };
  }
}

export async function generateInvoiceFromProductionOrder(
  productionOrderId: string
): Promise<BillingActionResponse<SalesInvoice>> {
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
            billingStatements: true, // Check if billing statement already exists
          },
        },
        billingStatements: true, // Check if billing statement exists for production order
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

    // Check if a billing statement already exists for this production order or customer order
    let billingStatement = productionOrder.billingStatements?.[0] || 
                          productionOrder.customerOrder.billingStatements?.[0];
    
    if (!billingStatement) {
      // Create a billing statement first (required for sales invoice)
      const billingStatementResult = await prisma.billingStatement.create({
        data: {
          statementNumber: `BS-${Date.now()}`, // Generate unique statement number
          customerOrderId: productionOrder.customerOrderId,
          customerId: productionOrder.customerOrder.customerId,
          customerName: productionOrder.customerOrder.customer.name,
          productionOrderId: productionOrderId, // Link to production order
          totalAmount: new Decimal(totalAmount),
          taxAmount: new Decimal((totalAmount * 12) / 100), // 12% tax
          discountAmount: new Decimal(0),
          netAmount: new Decimal(totalAmount + (totalAmount * 12) / 100),
          status: "DRAFT",
          billingDate: new Date(),
          createdBy: session.user.id,
        },
      });
      billingStatement = billingStatementResult;
    }

    // Check if invoice already exists for this billing statement
    const existingInvoice = await prisma.salesInvoice.findFirst({
      where: { billingStatementId: billingStatement.id },
    });

    if (existingInvoice) {
      return {
        success: false,
        error: "Sales invoice already exists for this production order",
      };
    }

    // Create invoice from production order data with required billingStatementId
    const formData: SalesInvoiceFormData = {
      billingStatementId: billingStatement.id, // Required field
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

    return await createSalesInvoice(formData);
  } catch (error) {
    console.error("Error generating invoice from production order:", error);
    return {
      success: false,
      error: "Failed to generate invoice from production order",
    };
  }
}

// ==============================================
// REPORTING FUNCTIONS
// ==============================================

export async function getSalesReportData(
  startDate?: Date,
  endDate?: Date
): Promise<SalesReportData> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const dateFilter =
      startDate && endDate
        ? {
            invoiceDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {};

    // Get basic sales metrics
    const [totalSales, totalInvoices, paidInvoices, overdueInvoices] =
      await Promise.all([
        prisma.salesInvoice.aggregate({
          where: { ...dateFilter, status: "PAID" },
          _sum: { totalAmount: true },
        }),
        prisma.salesInvoice.count({
          where: dateFilter,
        }),
        prisma.salesInvoice.count({
          where: { ...dateFilter, status: "PAID" },
        }),
        prisma.salesInvoice.count({
          where: { ...dateFilter, status: "OVERDUE" },
        }),
      ]);

    // Get daily sales (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailySales = await getDailySales(thirtyDaysAgo, new Date());

    // Get monthly sales (last 12 months)
    const twelveMonthsAgo = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 11,
      1
    );
    const monthlySales = await getMonthlySales(twelveMonthsAgo, new Date());

    // Get top products
    const topProducts = await getTopProducts(startDate, endDate);

    // Get top customers
    const topCustomers = await getTopCustomers(startDate, endDate);

    return {
      totalSales: totalSales._sum.totalAmount?.toNumber() || 0,
      totalInvoices,
      averageInvoiceValue:
        totalInvoices > 0
          ? (totalSales._sum.totalAmount?.toNumber() || 0) / totalInvoices
          : 0,
      paidInvoices,
      overdueInvoices,
      dailySales,
      monthlySales,
      topProducts,
      topCustomers,
    };
  } catch (error) {
    console.error("Error fetching sales report data:", error);
    throw new Error("Failed to fetch sales report data");
  }
}

// ==============================================
// PDF EXPORT FUNCTIONS
// ==============================================

export async function exportSalesInvoicePDF(
  id: string
): Promise<PDFExportResponse> {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { 
        success: false, 
        error: "Authentication required. Please log in to continue.",
        errorCode: "UNAUTHORIZED"
      };
    }

    // Authorization check - ensure user has admin role
    if (session.user.role !== "ADMIN") {
      return { 
        success: false, 
        error: "Admin access required to export invoices.",
        errorCode: "INSUFFICIENT_PERMISSIONS"
      };
    }

    // Validate input
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return {
        success: false,
        error: "Invalid invoice ID provided.",
        errorCode: "INVALID_INPUT"
      };
    }

    // Get sales invoice with all required relationships for PDF generation
    const salesInvoice = await prisma.salesInvoice.findUnique({
      where: { id: id.trim() },
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
        billingStatement: {
          select: {
            id: true,
            statementNumber: true,
            customerName: true,
            billingDate: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                country: true,
              },
            },
            customerOrder: {
              select: {
                id: true,
                orderNumber: true,
                orderDate: true,
                shippingAddress: true,
              },
            },
          },
        },
      },
    });

    if (!salesInvoice) {
      return { 
        success: false, 
        error: "Invoice not found. It may have been deleted or you don't have access to it.",
        errorCode: "NOT_FOUND"
      };
    }

    // Convert Decimal fields to numbers for PDF generation
    const convertedInvoice = {
      ...salesInvoice,
      subtotal: Number(salesInvoice.subtotal),
      taxRate: Number(salesInvoice.taxRate),
      taxAmount: Number(salesInvoice.taxAmount),
      discountAmount: Number(salesInvoice.discountAmount),
      totalAmount: Number(salesInvoice.totalAmount),
      invoiceItems: salesInvoice.invoiceItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountPercent: item.discountPercent
          ? Number(item.discountPercent)
          : null,
      })),
    };

    // Generate PDF using existing service
    const pdfBuffer = await generateSalesInvoicePDF(convertedInvoice);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return {
        success: false,
        error: "PDF generation failed. The generated file is empty.",
        errorCode: "PDF_GENERATION_FAILED"
      };
    }

    // Generate filename with invoice number and timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `sales-invoice-${salesInvoice.invoiceNumber}-${timestamp}.pdf`;

    return {
      success: true,
      pdfBuffer,
      filename,
    };
  } catch (error) {
    console.error("Error exporting sales invoice PDF:", error);
    
    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: "PDF generation timed out. Please try again with a smaller invoice.",
          errorCode: "TIMEOUT"
        };
      }
      if (error.message.includes('memory')) {
        return {
          success: false,
          error: "Insufficient memory to generate PDF. Please try again later.",
          errorCode: "MEMORY_ERROR"
        };
      }
      if (error.message.includes('database') || error.message.includes('connection')) {
        return {
          success: false,
          error: "Database connection error. Please try again in a moment.",
          errorCode: "DATABASE_ERROR"
        };
      }
    }
    
    return {
      success: false,
      error: "Failed to generate PDF. Please try again or contact support if the problem persists.",
      errorCode: "UNKNOWN_ERROR"
    };
  }
}

export async function exportSalesInvoicesData(
  filters?: SalesInvoiceFilters
): Promise<CSVExportResponse> {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Authentication required. Please log in to continue.");
    }

    // Authorization check - ensure user has admin role
    if (session.user.role !== "ADMIN") {
      throw new Error("Admin access required to export invoices.");
    }

    // Parse and validate filters
    const validatedFilters = filters
      ? salesInvoiceFiltersSchema.parse(filters)
      : {};

    // Build where clause for filtering
    const whereClause: any = {};

    if (validatedFilters.status && validatedFilters.status.length > 0) {
      whereClause.status = {
        in: validatedFilters.status as PrismaInvoiceStatus[],
      };
    }

    if (validatedFilters.dateRange) {
      whereClause.invoiceDate = {
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

    if (validatedFilters.search) {
      whereClause.OR = [
        {
          invoiceNumber: {
            contains: validatedFilters.search,
            mode: "insensitive",
          },
        },
        {
          poNumber: { contains: validatedFilters.search, mode: "insensitive" },
        },
        {
          billingStatement: {
            customerName: {
              contains: validatedFilters.search,
              mode: "insensitive",
            },
          },
        },
        {
          billingStatement: {
            statementNumber: {
              contains: validatedFilters.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Build order clause
    const orderBy: any = {};
    if (validatedFilters.sortBy) {
      orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder || "desc";
    } else {
      orderBy.invoiceDate = "desc";
    }

    // Get all sales invoices with related data for CSV export
    const invoices = await prisma.salesInvoice.findMany({
      where: whereClause,
      orderBy,
      include: {
        billingStatement: {
          select: {
            id: true,
            statementNumber: true,
            customerName: true,
            billingDate: true,
            status: true,
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

    // Build CSV headers based on design document requirements
    const headers = [
      "Invoice Number",
      "Invoice Date",
      "Due Date",
      "Status",
      "Customer Name",
      "Customer Email",
      "Customer Code",
      "Billing Statement Number",
      "PO Number",
      "Subtotal",
      "Tax Rate",
      "Tax Amount",
      "Discount Amount",
      "Total Amount",
      "Payment Terms",
      "Created By",
      "Created Date",
      "Modified By",
      "Modified Date",
    ];

    // Build CSV rows
    const rows = invoices.map((invoice) => {
      const customer = invoice.billingStatement?.customer;
      const createdBy = invoice.createdByUser;
      const modifiedBy = invoice.modifiedByUser;
      
      const createdByName = createdBy?.profile
        ? `${createdBy.profile.firstName} ${createdBy.profile.lastName}`
        : createdBy?.email || "Unknown";

      const modifiedByName = modifiedBy?.profile
        ? `${modifiedBy.profile.firstName} ${modifiedBy.profile.lastName}`
        : modifiedBy?.email || "";

      return [
        invoice.invoiceNumber,
        invoice.invoiceDate.toISOString().split('T')[0], // YYYY-MM-DD format
        invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : "",
        invoice.status,
        customer?.name || invoice.billingStatement?.customerName || "Unknown",
        customer?.email || "",
        customer?.code || "",
        invoice.billingStatement?.statementNumber || "",
        invoice.poNumber || "",
        Number(invoice.subtotal).toFixed(2),
        Number(invoice.taxRate).toFixed(2),
        Number(invoice.taxAmount).toFixed(2),
        Number(invoice.discountAmount).toFixed(2),
        Number(invoice.totalAmount).toFixed(2),
        invoice.paymentTerms || "",
        createdByName,
        invoice.createdAt.toISOString().split('T')[0],
        modifiedByName,
        invoice.updatedAt.toISOString().split('T')[0],
      ];
    });

    // Convert to CSV content
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        // Escape commas and quotes in cell content
        `"${String(cell).replace(/"/g, '""')}"`
      ).join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `sales-invoices-export-${timestamp}.csv`;

    return {
      csvContent,
      filename,
    };
  } catch (error) {
    console.error("Error exporting sales invoices data:", error);
    
    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        throw new Error("Authentication required. Please log in to continue.");
      }
      if (error.message.includes('Admin access required')) {
        throw new Error("Admin access required to export invoices.");
      }
      if (error.message.includes('timeout')) {
        throw new Error("Export timed out. Please try with fewer filters or contact support.");
      }
      if (error.message.includes('memory')) {
        throw new Error("Export too large. Please apply filters to reduce the data size.");
      }
      if (error.message.includes('database') || error.message.includes('connection')) {
        throw new Error("Database connection error. Please try again in a moment.");
      }
      if (error.message.includes('validation')) {
        throw new Error("Invalid filter parameters. Please check your selections and try again.");
      }
    }
    
    throw new Error("Failed to export sales invoices. Please try again or contact support if the problem persists.");
  }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

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

async function getDailySales(startDate: Date, endDate: Date) {
  const results = await prisma.salesInvoice.groupBy({
    by: ["invoiceDate"],
    where: {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
      status: "PAID",
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  return results.map((result) => ({
    date: result.invoiceDate,
    sales: result._sum.totalAmount?.toNumber() || 0,
    invoiceCount: result._count,
  }));
}

async function getMonthlySales(startDate: Date, endDate: Date) {
  const results = await prisma.salesInvoice.groupBy({
    by: ["invoiceDate"],
    where: {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
      status: "PAID",
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  // Group by month
  const monthlyData: any = {};
  results.forEach((result) => {
    const date = new Date(result.invoiceDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[key]) {
      monthlyData[key] = {
        month: date.toLocaleString("default", { month: "long" }),
        year: date.getFullYear(),
        sales: 0,
        invoiceCount: 0,
      };
    }

    monthlyData[key].sales += result._sum.totalAmount?.toNumber() || 0;
    monthlyData[key].invoiceCount += result._count;
  });

  // Calculate growth
  const monthlyArray = Object.values(monthlyData) as Array<{
    month: string;
    year: number;
    sales: number;
    invoiceCount: number;
  }>;
  return monthlyArray.map((month, index) => ({
    ...month,
    growth:
      index > 0
        ? ((month.sales - monthlyArray[index - 1].sales) /
            monthlyArray[index - 1].sales) *
          100
        : 0,
  }));
}

async function getTopProducts(startDate?: Date, endDate?: Date) {
  const dateFilter =
    startDate && endDate
      ? {
          salesInvoice: {
            invoiceDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        }
      : {};

  const results = await prisma.salesInvoiceItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      ...dateFilter,
    },
    _sum: {
      totalPrice: true,
      quantity: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalPrice: "desc",
      },
    },
    take: 10,
  });

  // Get product details
  const productIds = results.map((result) => result.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  return results.map((result) => {
    const product = products.find((p) => p.id === result.productId);
    return {
      productId: result.productId || "",
      productName: product?.name || "Unknown",
      totalSales: result._sum.totalPrice?.toNumber() || 0,
      quantitySold: result._sum.quantity?.toNumber() || 0,
      invoiceCount: result._count,
    };
  });
}

async function getTopCustomers(startDate?: Date, endDate?: Date) {
  const dateFilter =
    startDate && endDate
      ? {
          invoiceDate: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  const results = await prisma.billingStatement.groupBy({
    by: ["customerId"],
    where: {
      salesInvoice: dateFilter,
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalAmount: "desc",
      },
    },
    take: 10,
  });

  // Get customer details
  const customerIds = results.map((result) => result.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true },
  });

  return results.map((result) => {
    const customer = customers.find((c) => c.id === result.customerId);
    return {
      customerId: result.customerId,
      customerName: customer?.name || "Unknown",
      totalSales: result._sum.totalAmount?.toNumber() || 0,
      invoiceCount: result._count,
      averageOrderValue:
        result._count > 0
          ? (result._sum.totalAmount?.toNumber() || 0) / result._count
          : 0,
      lastOrderDate: new Date(), // Would need separate query for actual last order date
    };
  });
}
