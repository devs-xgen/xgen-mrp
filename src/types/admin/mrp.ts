// src/types/admin/mrp.ts
// Comprehensive TypeScript types for MRP Material Tracking System

import { Decimal } from "@prisma/client/runtime/library"
import { Status, Priority } from "@prisma/client"

// ==============================================
// NEW ENUMS FROM DATABASE SCHEMA
// ==============================================

export type ReservationStatus = 'RESERVED' | 'PARTIAL' | 'CONSUMED' | 'RELEASED' | 'EXPIRED'

export type MovementType = 
  // Material movements
  | 'MATERIAL_RESERVATION'
  | 'MATERIAL_CONSUMPTION' 
  | 'MATERIAL_RETURN'
  | 'MATERIAL_RECEIPT'
  | 'MATERIAL_TRANSFER'
  | 'MATERIAL_ADJUSTMENT'
  | 'MATERIAL_WASTE'
  // Product movements  
  | 'PRODUCTION_COMPLETE'
  | 'PRODUCT_SHIPMENT'
  | 'PRODUCT_RETURN'
  | 'PRODUCT_ADJUSTMENT'
  | 'PRODUCT_TRANSFER'
  // Other movements
  | 'CYCLE_COUNT'
  | 'DAMAGE_WRITE_OFF'
  | 'EXPIRY_WRITE_OFF'

export type BatchStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED' | 'QUALITY_HOLD'

export type QualityStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'REWORK'

export type VarianceType = 'MATERIAL_PRICE' | 'MATERIAL_USAGE' | 'LABOR_RATE' | 'LABOR_EFFICIENCY' | 'OVERHEAD' | 'TOTAL_COST'

// ==============================================
// MATERIAL RESERVATION TYPES
// ==============================================

export interface MaterialReservation {
  id: string
  productionOrderId: string
  materialId: string
  quantityReserved: number
  quantityConsumed: number
  quantityReleased: number
  status: ReservationStatus
  reservedAt: Date
  consumedAt?: Date | null
  releasedAt?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  modifiedBy?: string | null
  
  // Relations
  productionOrder?: {
    id: string
    quantity: number
    product: {
      name: string
      sku: string
    }
  }
  material?: {
    id: string
    name: string
    sku: string
    unitOfMeasure: {
      symbol: string
    }
  }
}

export interface MaterialReservationInput {
  productionOrderId: string
  materialId: string
  quantityReserved: number
  notes?: string
}

export interface MaterialReservationUpdateInput {
  id: string
  status?: ReservationStatus
  quantityConsumed?: number
  quantityReleased?: number
  notes?: string
}

// ==============================================
// MATERIAL CONSUMPTION TYPES
// ==============================================

export interface ProductionMaterialConsumption {
  id: string
  productionOrderId: string
  materialId: string
  plannedQuantity: number
  actualQuantity: number
  wasteQuantity: number
  unitCost: number
  totalCost: number
  consumedBy: string
  consumedAt: Date
  batchNumber?: string | null
  lotNumber?: string | null
  expiryDate?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  productionOrder?: {
    id: string
    product: {
      name: string
      sku: string
    }
  }
  material?: {
    id: string
    name: string
    sku: string
    unitOfMeasure: {
      symbol: string
    }
  }
  consumedByUser?: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
    }
  }
}

export interface MaterialConsumptionInput {
  productionOrderId: string
  materialId: string
  plannedQuantity: number
  actualQuantity: number
  wasteQuantity?: number
  unitCost: number
  batchNumber?: string
  lotNumber?: string
  expiryDate?: Date
  notes?: string
}

export interface MaterialConsumptionUpdateInput {
  id: string
  actualQuantity?: number
  wasteQuantity?: number
  notes?: string
}

// ==============================================
// INVENTORY MOVEMENT TYPES  
// ==============================================

export interface InventoryMovement {
  id: string
  materialId?: string | null
  productId?: string | null
  movementType: MovementType
  quantity: number
  previousStock: number
  newStock: number
  unitCost?: number | null
  totalValue?: number | null
  referenceId?: string | null
  referenceType?: string | null
  locationFrom?: string | null
  locationTo?: string | null
  performedBy: string
  approvedBy?: string | null
  transactionDate: Date
  notes?: string | null
  batchNumber?: string | null
  lotNumber?: string | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  material?: {
    id: string
    name: string
    sku: string
  }
  product?: {
    id: string
    name: string
    sku: string
  }
  performedByUser?: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
    }
  }
  approvedByUser?: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
    }
  }
}

export interface InventoryMovementInput {
  materialId?: string
  productId?: string
  movementType: MovementType
  quantity: number
  previousStock: number
  newStock: number
  unitCost?: number
  totalValue?: number
  referenceId?: string
  referenceType?: string
  locationFrom?: string
  locationTo?: string
  notes?: string
  batchNumber?: string
  lotNumber?: string
}

// ==============================================
// PRODUCTION BATCH TYPES
// ==============================================

export interface ProductionBatch {
  id: string
  batchNumber: string
  productionOrderId: string
  productId: string
  plannedQuantity: number
  producedQuantity: number
  startedAt?: Date | null
  completedAt?: Date | null
  status: BatchStatus
  qualityStatus: QualityStatus
  totalMaterialCost: number
  totalLaborCost: number
  totalOverheadCost: number
  unitCost: number
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  modifiedBy?: string | null
  
  // Relations
  productionOrder?: {
    id: string
    quantity: number
  }
  product?: {
    id: string
    name: string
    sku: string
  }
}

export interface ProductionBatchInput {
  batchNumber: string
  productionOrderId: string
  productId: string
  plannedQuantity: number
  notes?: string
}

export interface ProductionBatchUpdateInput {
  id: string
  producedQuantity?: number
  status?: BatchStatus
  qualityStatus?: QualityStatus
  totalMaterialCost?: number
  totalLaborCost?: number
  totalOverheadCost?: number
  notes?: string
}

// ==============================================
// COST VARIANCE TYPES
// ==============================================

export interface CostVariance {
  id: string
  productionOrderId: string
  materialId?: string | null
  varianceType: VarianceType
  plannedCost: number
  actualCost: number
  variance: number
  variancePercent: number
  explanation?: string | null
  investigatedBy?: string | null
  investigatedAt?: Date | null
  resolution?: string | null
  resolvedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  productionOrder?: {
    id: string
    product: {
      name: string
      sku: string
    }
  }
  material?: {
    id: string
    name: string
    sku: string
  }
  investigator?: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
    }
  }
}

export interface CostVarianceInput {
  productionOrderId: string
  materialId?: string
  varianceType: VarianceType
  plannedCost: number
  actualCost: number
  explanation?: string
}

export interface CostVarianceUpdateInput {
  id: string
  explanation?: string
  investigatedBy?: string
  resolution?: string
}

// ==============================================
// ENHANCED PRODUCTION ORDER TYPES
// ==============================================

export interface EnhancedProductionOrder {
  id: string
  productId: string
  quantity: number
  startDate: Date
  dueDate: Date
  status: Status
  priority: Priority
  customerOrderId?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  modifiedBy?: string | null
  
  // MRP Enhancement Fields
  plannedMaterialCost: number
  actualMaterialCost: number
  materialVariance: number
  completedQuantity: number
  completedAt?: Date | null
  
  // Relations
  product: {
    id: string
    name: string
    sku: string
  }
  materialReservations?: MaterialReservation[]
  materialConsumptions?: ProductionMaterialConsumption[]
  productionBatches?: ProductionBatch[]
  costVariances?: CostVariance[]
}

// ==============================================
// ENHANCED MATERIAL TYPES
// ==============================================

export interface EnhancedMaterial {
  id: string
  name: string
  sku: string
  typeId: string
  unitOfMeasureId: string
  costPerUnit: number
  currentStock: number
  minimumStockLevel: number
  committedStock: number
  availableStock: number // currentStock - committedStock
  leadTime: number
  supplierId: string
  status: Status
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  
  // Relations
  type?: {
    id: string
    name: string
  }
  unitOfMeasure?: {
    id: string
    name: string
    symbol: string
  }
  supplier?: {
    id: string
    name: string
    code: string
  }
  reservations?: MaterialReservation[]
  consumptions?: ProductionMaterialConsumption[]
  inventoryMovements?: InventoryMovement[]
  costVariances?: CostVariance[]
}

// ==============================================
// WORKFLOW AND UTILITY TYPES
// ==============================================

export interface MaterialAvailabilityCheck {
  materialId: string
  materialName: string
  materialSku: string
  currentStock: number
  committedStock: number
  availableStock: number
  requiredQuantity: number
  isAvailable: boolean
  shortfall: number
  unitSymbol: string
}

export interface ProductionOrderMaterialRequirements {
  productionOrderId: string
  materials: Array<{
    materialId: string
    materialName: string
    materialSku: string
    quantityNeeded: number
    quantityAvailable: number
    isAvailable: boolean
    unitCost: number
    totalCost: number
  }>
  totalMaterialCost: number
  allMaterialsAvailable: boolean
}

export interface MaterialShortageAlert {
  materialId: string
  materialName: string
  materialSku: string
  currentStock: number
  minimumStockLevel: number
  shortageAmount: number
  affectedProductionOrders: Array<{
    id: string
    productName: string
    quantity: number
    dueDate: Date
  }>
}

export interface ProductionCostSummary {
  productionOrderId: string
  plannedMaterialCost: number
  actualMaterialCost: number
  materialVariance: number
  materialVariancePercent: number
  plannedLaborCost: number
  actualLaborCost: number
  laborVariance: number
  totalPlannedCost: number
  totalActualCost: number
  totalVariance: number
}

// ==============================================
// FILTER AND SEARCH TYPES
// ==============================================

export interface MaterialReservationFilters {
  status?: ReservationStatus[]
  productionOrderId?: string
  materialId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface InventoryMovementFilters {
  movementType?: MovementType[]
  materialId?: string
  productId?: string
  dateFrom?: Date
  dateTo?: Date
  performedBy?: string
}

export interface CostVarianceFilters {
  varianceType?: VarianceType[]
  productionOrderId?: string
  materialId?: string
  varianceThreshold?: number
  dateFrom?: Date
  dateTo?: Date
}

// ==============================================
// API RESPONSE TYPES
// ==============================================

export interface MRPActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedMRPResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==============================================
// DASHBOARD AND ANALYTICS TYPES
// ==============================================

export interface MRPDashboardData {
  materialUtilization: Array<{
    materialId: string
    materialName: string
    plannedUsage: number
    actualUsage: number
    wasteAmount: number
    wastePercentage: number
    costImpact: number
  }>
  productionCostTrends: Array<{
    month: string
    plannedCost: number
    actualCost: number
    variance: number
  }>
  inventoryMovementSummary: {
    totalMovements: number
    materialReceipts: number
    materialConsumptions: number
    productionCompletions: number
    adjustments: number
  }
  materialShortages: MaterialShortageAlert[]
  costVarianceSummary: {
    totalVariances: number
    materialPriceVariances: number
    materialUsageVariances: number
    totalVarianceAmount: number
  }
}