// src/types/admin/order-analysis.ts
/**
 * Types for customer order analysis and production planning
 * Used for decoupled customer order and production planning workflow
 */

import { Status, Priority } from "@prisma/client";

/**
 * Represents the stock status and fulfillment analysis for a single order line
 */
export interface OrderLineStockStatus {
  id: string;
  productId: string;
  productVariantId?: string;
  productName: string;
  productSku: string;
  variantDisplayName?: string; // For product variants
  quantity: number; // Requested quantity
  currentStock: number;
  minimumStockLevel: number;
  availableStock: number; // currentStock - minimumStockLevel (safety stock)
  stockStatus: StockStatus;
  recommendedAction: RecommendedAction;
  stockToUse: number; // How much stock to allocate
  quantityToProduce: number; // How much needs production
  unitPrice: number;
  totalValue: number; // quantity * unitPrice
  estimatedLeadTime?: number; // If production is needed
  existingProductionQuantity?: number; // Quantity already in production orders
  hasProductionOrders?: boolean; // Whether production orders exist for this line
}

/**
 * Complete analysis result for a customer order
 */
export interface CustomerOrderAnalysisResult {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerId: string;
  orderDate: Date;
  requiredDate: Date;
  orderLines: OrderLineStockStatus[];
  overallStatus: OverallOrderStatus;
  itemsFromStock: number; // Count of items that can be fulfilled from stock
  itemsNeedingProduction: number; // Count of items needing production
  totalOrderValue: number;
  estimatedFulfillmentDate: Date;
  canFulfillImmediately: boolean;
  analysisDate: Date;
  existingProductionOrders?: any[]; // Production orders already created for this customer order
  hasExistingProductionOrders?: boolean; // Whether any production orders exist
  needsSync?: boolean; // Whether customer order changed after production orders were created
}

/**
 * Options for production decisions per order line
 */
export interface ProductionSelection {
  orderLineId: string;
  productId: string;
  productVariantId?: string;
  decision: ProductionDecision;
  stockToAllocate: number;
  quantityToProduce: number;
  priority: Priority;
  notes?: string;
}

/**
 * Stock allocation information for order lines
 */
export interface StockAllocation {
  orderLineId: string;
  productId: string;
  productVariantId?: string;
  quantityToAllocate: number;
  reservationDate: Date;
  notes?: string;
}

/**
 * Material requirements for production planning
 */
export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  materialSku: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number; // If negative, indicates shortage
  unitCost: number;
  totalCost: number;
  leadTime: number;
  supplierId: string;
  supplierName: string;
}

/**
 * Production planning analysis for items requiring production
 */
export interface ProductionPlanningAnalysis {
  productId: string;
  productVariantId?: string;
  productName: string;
  productSku: string;
  quantityToProduce: number;
  materialRequirements: MaterialRequirement[];
  estimatedMaterialCost: number;
  estimatedProductionTime: number; // in days
  canStartProduction: boolean;
  materialShortages: MaterialRequirement[]; // Materials that are insufficient
  recommendedStartDate: Date;
  estimatedCompletionDate: Date;
}

/**
 * Batch analysis for multiple orders requiring production planning
 */
export interface BatchOrderAnalysis {
  orderAnalyses: CustomerOrderAnalysisResult[];
  totalOrdersRequiringAnalysis: number;
  totalItemsNeedingProduction: number;
  consolidatedMaterialRequirements: MaterialRequirement[];
  estimatedTotalProductionCost: number;
  recommendedProductionSchedule: ProductionScheduleItem[];
}

/**
 * Production schedule item for batch planning
 */
export interface ProductionScheduleItem {
  productId: string;
  productVariantId?: string;
  productName: string;
  totalQuantityNeeded: number;
  customerOrders: string[]; // Order numbers that need this product
  recommendedBatchSize: number;
  estimatedStartDate: Date;
  estimatedCompletionDate: Date;
  priority: Priority;
}

// Enums for order analysis

/**
 * Stock status for individual order lines
 */
export enum StockStatus {
  SUFFICIENT = "SUFFICIENT", // Enough stock to fulfill without affecting minimum levels
  LOW_STOCK = "LOW_STOCK", // Can fulfill but will drop below minimum stock level
  INSUFFICIENT = "INSUFFICIENT", // Not enough stock to fulfill the order
  OUT_OF_STOCK = "OUT_OF_STOCK", // No stock available
  NEEDS_RESTOCK = "NEEDS_RESTOCK", // Below minimum stock level already
}

/**
 * Recommended actions for order line fulfillment
 */
export enum RecommendedAction {
  USE_STOCK = "USE_STOCK", // Fulfill entirely from current stock
  PRODUCE_ALL = "PRODUCE_ALL", // Create production order for full quantity
  HYBRID = "HYBRID", // Use available stock + produce remainder
  ORDER_MATERIALS = "ORDER_MATERIALS", // Need to order materials first
  DELAY_ORDER = "DELAY_ORDER", // Cannot fulfill due to constraints
}

/**
 * Overall status for complete customer orders
 */
export enum OverallOrderStatus {
  CAN_FULFILL_IMMEDIATELY = "CAN_FULFILL_IMMEDIATELY", // All items available from stock
  PARTIAL_FULFILLMENT = "PARTIAL_FULFILLMENT", // Some items from stock, some from production
  REQUIRES_PRODUCTION = "REQUIRES_PRODUCTION", // Most/all items need production
  MATERIAL_SHORTAGE = "MATERIAL_SHORTAGE", // Cannot start production due to material shortages
  CANNOT_FULFILL = "CANNOT_FULFILL", // Order cannot be fulfilled due to various constraints
  MIXED = "MIXED", // Mixed scenario with various fulfillment methods
}

/**
 * Production decision options for order lines
 */
export enum ProductionDecision {
  USE_AVAILABLE_STOCK = "USE_AVAILABLE_STOCK",
  FULL_PRODUCTION = "FULL_PRODUCTION",
  HYBRID_APPROACH = "HYBRID_APPROACH", // Use stock + production
  DELAY_UNTIL_MATERIALS = "DELAY_UNTIL_MATERIALS",
  OUTSOURCE = "OUTSOURCE", // For future use
}

/**
 * Order analysis filters for admin interface
 */
export interface OrderAnalysisFilters {
  status?: OverallOrderStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  requiresProduction?: boolean;
  hasStockIssues?: boolean;
  hasMaterialShortages?: boolean;
  priority?: Priority[];
}

/**
 * Summary statistics for order analysis dashboard
 */
export interface OrderAnalysisSummary {
  totalOrdersAnalyzed: number;
  ordersByStatus: Record<OverallOrderStatus, number>;
  totalItemsNeedingProduction: number;
  totalEstimatedProductionCost: number;
  averageFulfillmentTime: number; // in days
  ordersRequiringAttention: number;
  materialShortagesCount: number;
  lastAnalysisUpdate: Date;
}
