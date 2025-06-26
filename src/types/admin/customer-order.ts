// src/types/admin/customer-order.ts
import { Status, Priority } from "@prisma/client";

export interface Customer {
  id: string;
  name: string;
  email?: string;
}

export interface OrderLine {
  id: string;
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  status: Status;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  productVariant?: {
    id: string;
    sku: string;
    displayName: string;
    sizeName?: string | null;
    colorName?: string | null;
  };
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
  };
  orderLines: OrderLineForDisplay[];
  productionOrders?: ProductionOrderSummary[];
  _count?: {
    productionOrders: number;
    orderLines: number;
  };
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

export interface OrderLineForDisplay {
  id: string;
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  status: Status;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  productVariant?: {
    id: string;
    sku: string;
    displayName: string;
    sizeName?: string | null;
    colorName?: string | null;
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
  notes: string | null;
  lastUpdated: Date;
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
