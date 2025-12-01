// src/types/admin/customer-order.ts
import { Status, Priority } from "@prisma/client";

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number;
}

export interface OrderLine {
  id: string;
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  status: Status;
  // New fulfillment tracking fields
  fulfillmentType?: FulfillmentType;
  stockAllocated?: number;
  productionQuantity?: number;
  fulfillmentStatus?: FulfillmentStatus;
  allocatedAt?: Date;
  fulfilledAt?: Date;
  product?: {
    id: string;
    name: string;
    sku: string;
    description?: string | null;
    sellingPrice?: number;
  };
  productVariant?: {
    id: string;
    sku: string;
    displayName: string;
    sizeName?: string | null;
    colorName?: string | null;
    unitPrice?: number;
  };
}

export type ProductionWorkflowPhase =
  | "NOT_STARTED"
  | "WORKER"
  | "INSPECTOR"
  | "DELIVERY"
  | "COMPLETED";

export interface ProductionWorkflowSummary {
  phase: ProductionWorkflowPhase;
  hasProduction: boolean;
  worker: {
    totalOperations: number;
    completed: number;
    pending: number;
  };
  inspector: {
    totalChecks: number;
    completed: number;
    pending: number;
  };
  delivery: {
    assigned: number;
    completed: number;
    pending: number;
  };
  description: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: Date;
  requiredDate: Date;
  status: Status;
  totalAmount: number;
  notes?: string | null;
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    paymentTerms?: string | null;
    creditLimit?: number;
  };
  orderLines: OrderLineForDisplay[];
  productionOrders?: ProductionOrderSummary[];
  billingStatements?: BillingStatementSummary[];
  _count?: {
    productionOrders: number;
    orderLines: number;
    billingStatements: number;
  };
  productionWorkflow?: ProductionWorkflowSummary;
}

export interface ProductionOrderSummary {
  id: string;
  quantity: number;
  status: Status;
  priority: Priority;
  startDate: Date;
  dueDate: Date;
  completedQuantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface BillingStatementSummary {
  id: string;
  statementNumber: string;
  status: string;
  totalAmount: number;
  billingDate: Date;
  salesInvoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  };
  deliveryReceipts?: Array<{
    id: string;
    receiptNumber: string;
    deliveryStatus: string;
    deliveryDate: Date;
  }>;
}

export interface OrderLineForDisplay {
  id: string;
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  status: Status;
  // New fulfillment tracking fields
  fulfillmentType?: FulfillmentType;
  stockAllocated?: number;
  productionQuantity?: number;
  fulfillmentStatus?: FulfillmentStatus;
  allocatedAt?: Date;
  fulfilledAt?: Date;
  product?: {
    id: string;
    name: string;
    sku: string;
    description?: string | null;
    unitOfMeasure?: string | null;
    sellingPrice?: number;
  };
  productVariant?: {
    id: string;
    sku: string;
    displayName: string;
    sizeName?: string | null;
    colorName?: string | null;
    unitPrice?: number;
  };
}

export interface CreateCustomerOrderInput {
  customerId: string;
  requiredDate: Date;
  notes?: string;
  orderLines: Array<{
    productId: string;
    productVariantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// Enhanced types for stock availability and production planning
export interface ProductStockAvailability {
  productId: string;
  productName: string;
  productSku: string;
  requiredQuantity: number;
  currentStock: number;
  minimumStockLevel: number;
  availableStock: number; // currentStock - minimumStockLevel (safety stock)
  shortfall: number; // if negative, indicates shortage
  stockStatus: StockStatus;
  recommendations: StockRecommendation;
}

export interface StockRecommendation {
  canFulfillFromStock: boolean;
  stockToUse: number;
  quantityToProduce: number;
  recommendedAction: RecommendedAction;
  estimatedLeadTime?: number;
  materialAvailability?: MaterialAvailabilityStatus;
}

export interface MaterialAvailabilityStatus {
  allMaterialsAvailable: boolean;
  materialShortages: MaterialShortage[];
  estimatedCost: number;
  canStartProduction: boolean;
}

export interface MaterialShortage {
  materialId: string;
  materialName: string;
  materialSku: string;
  required: number;
  available: number;
  shortage: number;
  estimatedLeadTime: number;
}

export interface ProductionDecisionInput {
  productId: string;
  productVariantId?: string; // 🆕 ADD: Optional variant tracking
  requiredQuantity: number;
  decision: ProductionDecision;
  useAvailableStock: boolean;
  productionQuantity: number;
  reason?: string;
}

export interface CustomerOrderAnalysis {
  orderId?: string;
  orderLines: OrderLineAnalysis[];
  overallStatus: OverallOrderStatus;
  canFulfillCompletely: boolean;
  hasStockIssues: boolean;
  hasMaterialIssues: boolean;
  recommendedActions: string[];
  estimatedCompletionDate?: Date;
  totalEstimatedCost: number;
}

export interface OrderLineAnalysis {
  productId: string;
  productVariantId?: string; // 🆕 ADD: Optional variant tracking
  productName: string;
  productSku: string;
  variantDisplayName?: string; // 🆕 ADD: Variant display name
  requestedQuantity: number;
  stockAvailability: ProductStockAvailability;
  materialAvailability: MaterialAvailabilityStatus;
  productionOptions: ProductionOption[];
  recommendedOption: ProductionDecision;
}

export interface ProductionOption {
  type: ProductionDecision;
  description: string;
  stockUsed: number;
  productionQuantity: number;
  estimatedCost: number;
  estimatedDays: number;
  materialRequirements: MaterialRequirement[];
  feasible: boolean;
  risks: string[];
}

export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  required: number;
  available: number;
  sufficient: boolean;
}

// Enums
export enum StockStatus {
  SUFFICIENT = "SUFFICIENT",
  LOW_STOCK = "LOW_STOCK",
  INSUFFICIENT = "INSUFFICIENT",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}

export enum RecommendedAction {
  USE_STOCK = "USE_STOCK",
  PRODUCE_ALL = "PRODUCE_ALL",
  HYBRID = "HYBRID", // Use available stock + produce remainder
  ORDER_MATERIALS = "ORDER_MATERIALS",
  DELAY_ORDER = "DELAY_ORDER",
}

export enum ProductionDecision {
  USE_AVAILABLE_STOCK = "USE_AVAILABLE_STOCK",
  FULL_PRODUCTION = "FULL_PRODUCTION",
  HYBRID_APPROACH = "HYBRID_APPROACH",
  DELAY_UNTIL_MATERIALS = "DELAY_UNTIL_MATERIALS",
}

export enum OverallOrderStatus {
  CAN_FULFILL_IMMEDIATELY = "CAN_FULFILL_IMMEDIATELY",
  PARTIAL_FULFILLMENT = "PARTIAL_FULFILLMENT",
  REQUIRES_PRODUCTION = "REQUIRES_PRODUCTION",
  MATERIAL_SHORTAGE = "MATERIAL_SHORTAGE",
  CANNOT_FULFILL = "CANNOT_FULFILL",
}

// Table data type for customer orders
export interface CustomerOrderColumn {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  orderDate: Date;
  requiredDate: Date;
  status: Status;
  totalAmount: number;
  itemCount: number;
  totalQuantity: number;
  productionOrderCount: number;
  billingStatementCount: number;
  billingStatements?: BillingStatementSummary[];
  notes: string | null;
  lastUpdated: Date;
  // New fulfillment tracking fields
  fulfillmentOverview?: {
    overallCompletion: number; // 0-100 percentage
    totalAllocated: number; // Total units allocated (stock + production)
    fromStock: number; // Units fulfilled from inventory
    fromProduction: number; // Units fulfilled from production
    pendingItems: number; // Items still pending fulfillment
    fulfilledItems: number; // Items completely fulfilled
    estimatedFulfillmentDate?: Date;
  };
}

// Add interface for products with variants for order selection
export interface ProductWithVariantsForOrder {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock?: number;
  minimumStockLevel?: number;
  hasVariants: boolean;
  variants?: ProductVariantForOrder[];
}

export interface ProductVariantForOrder {
  id: string;
  productId: string;
  sku: string;
  displayName: string;
  sizeName?: string | null;
  sizeCode?: string | null;
  colorName?: string | null;
  colorCode?: string | null;
  unitPrice: number;
  currentStock: number;
  minimumStockLevel: number;
}

// Enums for new fulfillment tracking

/**
 * Types of fulfillment methods for order lines
 */
export enum FulfillmentType {
  PENDING = "PENDING", // Not yet determined
  STOCK = "STOCK", // Fulfilled from existing stock
  PRODUCTION = "PRODUCTION", // Fulfilled through production order
  HYBRID = "HYBRID", // Partially from stock, partially from production
}

/**
 * Status of fulfillment for order lines
 */
export enum FulfillmentStatus {
  PENDING = "PENDING", // Not yet allocated or fulfilled
  ALLOCATED = "ALLOCATED", // Stock allocated or production order created
  PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED", // Some quantity fulfilled
  FULFILLED = "FULFILLED", // Completely fulfilled
  CANCELLED = "CANCELLED", // Fulfillment cancelled
}
