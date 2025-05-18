// Inventory type and status definitions
export type StockLevel = "normal" | "low" | "critical" | "outOfStock";

export interface MaterialType {
  id: string;
  name: string;
  description?: string;
}

export interface LocationType {
  id: string;
  name: string;
  description?: string;
}

// Movement and request types
export type MovementType = "RECEIPT" | "ISSUE" | "TRANSFER" | "ADJUSTMENT" | "CONSUMPTION";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED" | "CANCELED";
export type RequestPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Base inventory item model
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  materialTypeId: string;
  locationId: string;
  currentStock: number;
  reorderPoint: number;
  criticalPoint: number;
  unitOfMeasure: string;
  cost: number;
  lastUpdated: string;
  stockLevel: StockLevel;
}

// Stock status model with calculated values
export interface StockStatus {
  totalItems: number;
  normalStock: number;
  lowStock: number;
  criticalStock: number;
  outOfStock: number;
}

// Inventory movement record
export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  date: Date;
  quantity: number;
  movementType: MovementType;
  sourceLocationId?: string;
  sourceLocationName?: string;
  destinationLocationId?: string;
  destinationLocationName?: string;
  performedById: string;
  performedByName: string;
  referenceNumber?: string;
  notes?: string;
  productionOrderId?: string;
  customerOrderId?: string;
}

// Material request model
export interface MaterialRequest {
  id: string;
  requestDate: Date;
  requestedById: string;
  requestedByName: string;
  workCenterId: string;
  workCenterName: string;
  status: RequestStatus;
  priority: RequestPriority;
  requiredDate: Date;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: Date;
  fulfilledDate?: Date;
  notes?: string;
  productionOrderId?: string;
  items: MaterialRequestItem[];
}

// Individual item in a material request
export interface MaterialRequestItem {
  id: string;
  materialRequestId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityRequested: number;
  quantityApproved?: number;
  quantityFulfilled?: number;
  unit: string;
  notes?: string;
  status: RequestStatus;
}

// Inventory issue report
export interface InventoryIssueReport {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  reportType: "LOW_STOCK" | "DISCREPANCY" | "DAMAGE" | "QUALITY" | "OTHER";
  reportDate: Date;
  reportedById: string;
  reportedByName: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  resolvedDate?: Date;
  resolution?: string;
}

// Filter and sort options for inventory queries
export interface InventoryFilters {
  search?: string;
  stockLevel?: StockLevel | "all";
  materialType?: string;
  location?: string;
  page?: number;
  perPage?: number;
}

export interface InventorySortOption {
  field: "name" | "sku" | "currentStock" | "lastStockUpdate" | "materialType" | "stockLevel";
  direction: "asc" | "desc";
}

export interface InventoryPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Inventory query result with pagination
export interface InventoryQueryResult {
  items: InventoryItem[];
  stockStatus: StockStatus;
  pagination: InventoryPagination;
}

// MRP (Material Requirements Planning) related types
export type MrpPlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELED";
export type MrpItemStatus = "PENDING" | "ORDERED" | "RECEIVED" | "CANCELED";

export interface MrpPlan {
  id: string;
  name: string;
  description?: string;
  planningPeriodStart: Date;
  planningPeriodEnd: Date;
  createdDate: Date;
  createdById: string;
  createdByName: string;
  status: MrpPlanStatus;
  notes?: string;
  lastUpdated: Date;
  items: MrpItem[];
}

export interface MrpItem {
  id: string;
  mrpPlanId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  currentStock: number;
  forecastedDemand: number;
  suggestedOrderQuantity: number;
  reorderPoint: number;
  leadTime: number; // in days
  orderDate?: Date;
  requiredByDate: Date;
  status: MrpItemStatus;
  notes?: string;
  materialRequestId?: string;
}

export interface MrpForecast {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  periodStart: Date;
  periodEnd: Date;
  forecastedQuantity: number;
  actualQuantity?: number;
  deviationPercentage?: number;
  forecastMethod: "MOVING_AVERAGE" | "EXPONENTIAL_SMOOTHING" | "LINEAR_REGRESSION" | "MANUAL";
  createdById: string;
  createdByName: string;
  lastUpdated: Date;
}

export interface MrpSettings {
  defaultLeadTime: number; // in days
  forecastPeriod: number; // in days
  safetyStockPercentage: number; 
  orderQuantityMethod: "ECONOMIC_ORDER_QUANTITY" | "FIXED_QUANTITY" | "PERIOD_SUPPLY" | "LOT_FOR_LOT";
  autoGenerateMaterialRequests: boolean;
  reviewFrequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
}

export interface MrpSummary {
  totalItems: number;
  itemsBelowReorderPoint: number;
  suggestedPurchaseOrders: number;
  totalOrderValue: number;
  criticalItemsCount: number;
} 