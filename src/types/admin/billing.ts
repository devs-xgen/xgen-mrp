import { z } from "zod";

// ==============================================
// BILLING SYSTEM TYPES & INTERFACES
// ==============================================

// Database model interfaces (matching Prisma schema)
export interface BillingStatement {
  id: string;
  statementNumber: string;
  
  // Customer Information (Required - at least one must be provided)
  customerId: string | null;          // Direct customer reference
  customerOrderId: string | null;     // Or reference via customer order
  customerName: string;               // Derived/cached customer name
  
  // Optional Production Link
  productionOrderId: string | null;   // Optional production order link

  // Financial Information
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;

  // Status and dates
  status: BillingStatus;
  billingDate: Date;
  dueDate: Date | null;
  paidDate: Date | null;

  // Metadata
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  modifiedBy: string | null;

  // Relations
  customer?: Customer;
  customerOrder?: CustomerOrder;
  productionOrder?: ProductionOrder;
  salesInvoice?: SalesInvoice;        // One-to-One relationship
  deliveryReceipts?: DeliveryReceipt[]; // One-to-Many relationship
  createdByUser?: User;
  modifiedByUser?: User;
}

export interface DeliveryReceipt {
  id: string;
  receiptNumber: string;
  
  // Link to billing statement (Required)
  billingStatementId: string;
  
  // Essential Delivery Information
  deliveryDate: Date;
  deliveryAddress: string;
  receivedBy: string;
  receivedByTitle: string | null;
  
  // Optional Proof
  signatureImage: string | null;
  photoEvidence: string | null;
  
  // Optional Tracking
  trackingNumber: string | null;
  courierService: string | null;
  
  // Status and Notes
  deliveryStatus: DeliveryStatus;
  deliveryNotes: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  modifiedBy: string | null;

  // Relations
  billingStatement?: BillingStatement;
  createdByUser?: User;
  modifiedByUser?: User;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  
  // Direct link to billing statement (Required)
  billingStatementId: string;
  
  // Invoice Details
  invoiceDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;

  // Payment Information
  paymentTerms: string | null;
  dueDate: Date | null;
  status: InvoiceStatus;

  // Additional Information
  poNumber: string | null;
  terms: string | null;
  footerNotes: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  modifiedBy: string | null;

  // Relations
  billingStatement?: BillingStatement;  // One-to-One relationship
  invoiceItems?: SalesInvoiceItem[];
  createdByUser?: User;
  modifiedByUser?: User;
}

export interface SalesInvoiceItem {
  id: string;
  salesInvoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;

  // Optional details
  productCode: string | null;
  unit: string | null;
  discountPercent: number | null;
  taxable: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Relations
  salesInvoice?: SalesInvoice;
  product?: Product;
  material?: Material;
  inventoryItem?: InventoryItem;
}

// ==============================================
// ENUMS
// ==============================================

export enum BillingStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
  PARTIAL = "PARTIAL",
}

export enum DeliveryStatus {
  PENDING = "PENDING",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
  PARTIAL = "PARTIAL",
}

// ==============================================
// FORM DATA TYPES
// ==============================================

export interface BillingStatementFormData {
  customerId?: string; // Optional - for existing customers
  customerName: string; // Required - customer name input
  customerOrderId?: string;
  productionOrderId?: string;
  deliveryReceiptId?: string;

  // Billing details
  subtotal: number;
  taxRate: number;
  discountAmount: number;

  // Payment terms
  paymentTerms?: string;
  dueDate?: Date;

  // Invoice items
  invoiceItems: SalesInvoiceItemFormData[];

  // Additional details
  notes?: string;
  poNumber?: string;
  terms?: string;
  footerNotes?: string;
}

export interface SalesInvoiceFormData {
  billingStatementId: string; // Required - link to billing statement
  
  // Invoice details
  subtotal: number;
  taxRate: number;
  discountAmount: number;

  // Payment terms
  paymentTerms?: string;
  dueDate?: Date;

  // Invoice items
  invoiceItems: SalesInvoiceItemFormData[];

  // Additional details
  poNumber?: string;
  terms?: string;
  footerNotes?: string;
}

export interface SalesInvoiceItemFormData {
  productId?: string;
  materialId?: string;
  inventoryItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  productCode?: string;
  unit?: string;
  discountPercent?: number;
  taxable: boolean;
}

export interface DeliveryReceiptFormData {
  billingStatementId: string; // Required link to billing statement
  deliveryDate: Date;
  receivedBy: string;
  receivedByTitle?: string;
  deliveryAddress: string;
  deliveryNotes?: string;

  // Status
  deliveryStatus: DeliveryStatus;

  // Optional proof
  signatureImage?: string;
  photoEvidence?: string;

  // Optional tracking information
  trackingNumber?: string;
  courierService?: string;
}

// ==============================================
// ANALYTICS & REPORTING TYPES
// ==============================================

export interface BillingAnalytics {
  totalBillingStatements: number;
  totalRevenue: number;
  paidAmount: number;
  overdueAmount: number;
  pendingAmount: number;

  // Monthly trends
  monthlyRevenue: MonthlyRevenue[];

  // Status breakdown
  statusBreakdown: StatusBreakdown[];

  // Customer analytics
  topCustomers: CustomerAnalytics[];

  // Recent activity
  recentActivity: BillingActivity[];
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  invoiceCount: number;
}

export interface StatusBreakdown {
  status: BillingStatus;
  count: number;
  amount: number;
  percentage: number;
}

export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  totalAmount: number;
  statementCount: number;
  lastBillingDate: Date;
  outstandingAmount: number;
}

export interface BillingActivity {
  id: string;
  type: "CREATED" | "UPDATED" | "PAID" | "OVERDUE" | "CANCELLED";
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export interface SalesReportData {
  totalSales: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  paidInvoices: number;
  overdueInvoices: number;

  // Time-based analysis
  dailySales: DailySales[];
  monthlySales: MonthlySales[];

  // Product analysis
  topProducts: ProductSales[];

  // Customer analysis
  topCustomers: CustomerSales[];
}

export interface DailySales {
  date: Date;
  sales: number;
  invoiceCount: number;
}

export interface MonthlySales {
  month: string;
  year: number;
  sales: number;
  invoiceCount: number;
  growth: number; // percentage growth from previous month
}

export interface ProductSales {
  productId: string;
  productName: string;
  totalSales: number;
  quantitySold: number;
  invoiceCount: number;
}

export interface CustomerSales {
  customerId: string;
  customerName: string;
  totalSales: number;
  invoiceCount: number;
  averageOrderValue: number;
  lastOrderDate: Date;
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;

  // Delivery method breakdown
  deliveryMethodBreakdown: DeliveryMethodStats[];

  // Courier performance
  courierPerformance: CourierStats[];

  // Recent deliveries
  recentDeliveries: DeliveryActivity[];
}

export interface DeliveryMethodStats {
  method: string;
  count: number;
  successRate: number;
  averageDeliveryTime: number;
}

export interface CourierStats {
  courierService: string;
  deliveryCount: number;
  successRate: number;
  averageDeliveryTime: number;
}

export interface DeliveryActivity {
  id: string;
  receiptNumber: string;
  deliveryDate: Date;
  status: DeliveryStatus;
  customerName: string;
  deliveryMethod: string;
}

// ==============================================
// FILTER & SEARCH TYPES
// ==============================================

export interface BillingStatementFilters {
  status?: BillingStatus[];
  customerId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
  sortBy?: "billingDate" | "dueDate" | "totalAmount" | "statementNumber";
  sortOrder?: "asc" | "desc";
}

export interface SalesInvoiceFilters {
  status?: InvoiceStatus[];
  customerId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
  sortBy?: "invoiceDate" | "dueDate" | "totalAmount" | "invoiceNumber";
  sortOrder?: "asc" | "desc";
}

export interface DeliveryReceiptFilters {
  status?: DeliveryStatus[];
  courierService?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: "deliveryDate" | "receiptNumber" | "deliveryStatus";
  sortOrder?: "asc" | "desc";
}

// ==============================================
// ZOD VALIDATION SCHEMAS
// ==============================================

export const billingStatementSchema = z.object({
  customerId: z.string().optional(), // Optional - for existing customers
  customerName: z.string().min(1, "Customer name is required"), // Required - customer name input
  customerOrderId: z.string().optional(),
  productionOrderId: z.string().optional(),
  deliveryReceiptId: z.string().optional(),

  // Billing details
  subtotal: z.number().min(0, "Subtotal must be positive"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0-100%"),
  discountAmount: z.number().min(0, "Discount must be positive"),

  // Payment terms
  paymentTerms: z.string().optional(),
  dueDate: z.date().optional(),

  // Invoice items
  invoiceItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        materialId: z.string().optional(),
        inventoryItemId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.001, "Quantity must be positive"),
        unitPrice: z.number().min(0, "Unit price must be positive"),
        productCode: z.string().optional(),
        unit: z.string().optional(),
        discountPercent: z.number().min(0).max(100).optional(),
        taxable: z.boolean().default(true),
      })
    )
    .min(1, "At least one item is required"),

  // Additional details
  notes: z.string().optional(),
  poNumber: z.string().optional(),
  terms: z.string().optional(),
  footerNotes: z.string().optional(),
}).refine(
  (data) => data.customerId || data.customerOrderId,
  {
    message: "Either customer or customer order must be selected",
    path: ["customerId"],
  }
);

export const salesInvoiceSchema = z.object({
  billingStatementId: z.string().min(1, "Billing statement is required"),

  // Invoice details
  subtotal: z.number().min(0, "Subtotal must be positive"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0-100%"),
  discountAmount: z.number().min(0, "Discount must be positive"),

  // Payment terms
  paymentTerms: z.string().optional(),
  dueDate: z.date().optional(),

  // Invoice items
  invoiceItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        materialId: z.string().optional(),
        inventoryItemId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.001, "Quantity must be positive"),
        unitPrice: z.number().min(0, "Unit price must be positive"),
        productCode: z.string().optional(),
        unit: z.string().optional(),
        discountPercent: z.number().min(0).max(100).optional(),
        taxable: z.boolean().default(true),
      })
    )
    .min(1, "At least one item is required"),

  // Additional details
  poNumber: z.string().optional(),
  terms: z.string().optional(),
  footerNotes: z.string().optional(),
});

export const deliveryReceiptSchema = z.object({
  billingStatementId: z.string().min(1, "Billing statement is required"),
  deliveryDate: z.date(),
  receivedBy: z.string().min(1, "Receiver name is required"),
  receivedByTitle: z.string().optional(),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryNotes: z.string().optional(),

  // Status
  deliveryStatus: z.enum([
    "PENDING",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED",
    "RETURNED",
    "CANCELLED",
  ]),

  // Optional proof
  signatureImage: z.string().optional(),
  photoEvidence: z.string().optional(),

  // Optional tracking information
  trackingNumber: z.string().optional(),
  courierService: z.string().optional(),
});

export const billingStatementFiltersSchema = z.object({
  status: z
    .array(
      z.enum([
        "DRAFT",
        "SENT",
        "PAID",
        "OVERDUE",
        "CANCELLED",
        "DISPUTED",
        "PARTIAL",
      ])
    )
    .optional(),
  customerId: z.string().optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  amountRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["billingDate", "dueDate", "totalAmount", "statementNumber"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const salesInvoiceFiltersSchema = z.object({
  status: z
    .array(
      z.enum([
        "DRAFT",
        "SENT",
        "PAID",
        "OVERDUE",
        "CANCELLED",
        "DISPUTED",
        "PARTIAL",
      ])
    )
    .optional(),
  customerId: z.string().optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  amountRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["invoiceDate", "dueDate", "totalAmount", "invoiceNumber"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const deliveryReceiptFiltersSchema = z.object({
  status: z
    .array(
      z.enum([
        "PENDING",
        "IN_TRANSIT",
        "DELIVERED",
        "FAILED",
        "RETURNED",
        "CANCELLED",
      ])
    )
    .optional(),
  courierService: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["deliveryDate", "receiptNumber", "deliveryStatus"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ==============================================
// UTILITY TYPES
// ==============================================

export type BillingStatementWithRelations = BillingStatement & {
  customer?: Customer;
  customerOrder?: CustomerOrder;
  productionOrder?: ProductionOrder;
  salesInvoice?: SalesInvoice & {
    invoiceItems: SalesInvoiceItem[];
  };
  deliveryReceipts?: DeliveryReceipt[];
};

export type SalesInvoiceWithItems = SalesInvoice & {
  invoiceItems: SalesInvoiceItem[];
};

export type DeliveryReceiptWithBilling = DeliveryReceipt & {
  billingStatement?: BillingStatement;
};

// Action response types
export interface BillingActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ==============================================
// REFERENCE TYPES (from existing system)
// ==============================================

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  tinNumber?: string;
  creditLimit?: number;
  paymentTerms?: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional related data for enhanced display
  orders?: CustomerOrder[];
  billingStatements?: BillingStatement[];
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: Date;
  requiredDate: Date;
  status: string;
  totalAmount: number;
  customer?: Customer;
}

export interface ProductionOrder {
  id: string;
  productId: string;
  quantity: number;
  startDate: Date;
  dueDate: Date;
  status: string;
  customerOrderId?: string;
  product?: Product;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unitCost: number;
  sellingPrice: number;
  status: string;
}

export interface Material {
  id: string;
  name: string;
  sku: string;
  costPerUnit: number;
  status: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  cost: number;
  currentStock: number;
  unit: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}
