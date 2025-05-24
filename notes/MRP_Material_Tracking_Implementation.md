# MRP Material Tracking Implementation Guide

**Last Updated:** 2024-05-24  
**Status:** Step 4 Complete - Inventory Movement Management ✅  

## Implementation Progress

### ✅ **Phase 1: Database Schema Enhancements (COMPLETED)**
- ✅ New models: MaterialReservation, ProductionMaterialConsumption, InventoryMovement, ProductionBatch, CostVariance
- ✅ Enhanced existing models: Material, ProductionOrder, User, Product  
- ✅ New enums: ReservationStatus, MovementType, BatchStatus, QualityStatus, VarianceType
- ✅ Migration applied: `20250524001449_initial_with_mrp_tracking`
- ✅ Database seeded with initial data

### ✅ **Step 1: Create MRP Type Definitions (COMPLETED)**
- ✅ Created comprehensive MRP types file: `src/types/admin/mrp.ts`
- ✅ Updated existing type files:
  - ✅ `src/types/admin/production-order.ts` - Added MRP fields
  - ✅ `src/types/admin/materials.ts` - Added availableStock and MRP fields
  - ✅ `src/types/admin/index.ts` - Export MRP types
- ✅ Type safety ensured across the application

### ✅ **Step 2: Material Reservation System (COMPLETED)**
- ✅ Created comprehensive material reservation actions: `src/lib/actions/material-reservation.ts`
- ✅ **Material Availability Functions**:
  - ✅ `checkMaterialAvailability()` - Check single material availability
  - ✅ `checkProductionOrderMaterialRequirements()` - Check all materials for production order
- ✅ **Material Reservation Functions**:
  - ✅ `reserveMaterialsForProduction()` - Automatic material reservation
  - ✅ `releaseMaterialReservations()` - Release materials when production cancelled
- ✅ **Reservation Management Functions**:
  - ✅ `getMaterialReservations()` - Fetch reservations with filters
  - ✅ `getReservationsForProductionOrder()` - Get reservations for specific order
  - ✅ `updateMaterialReservation()` - Update reservation status
- ✅ **Shortage Alert Functions**:
  - ✅ `checkMaterialShortages()` - Identify materials below minimum stock
  - ✅ `getMaterialReservationDashboardData()` - Dashboard analytics
- ✅ **Enhanced Production Order Integration**:
  - ✅ Enhanced `createProductionOrder()` - Automatic material availability check & reservation
  - ✅ Enhanced `deleteProductionOrder()` - Automatic material release & cleanup
  - ✅ Enhanced `updateProductionOrderStatus()` - Release materials on cancellation

### ✅ **Step 3: Material Consumption System (COMPLETED)**
- ✅ Created comprehensive material consumption actions: `src/lib/actions/material-consumption.ts`
- ✅ **Real-time Material Consumption Functions**:
  - ✅ `consumeMaterialForProduction()` - Record single material consumption with full traceability
  - ✅ `batchConsumeMaterials()` - Efficient batch consumption for production lines
- ✅ **Consumption Management Functions**:
  - ✅ `getMaterialConsumptions()` - Fetch consumptions with comprehensive filters
  - ✅ `getConsumptionsForProductionOrder()` - Get all consumptions for specific order
  - ✅ `updateMaterialConsumption()` - Update existing consumption records with stock adjustments
- ✅ **Analytics and Reporting Functions**:
  - ✅ `getProductionOrderConsumptionAnalytics()` - Complete consumption analytics per order
  - ✅ `getMaterialConsumptionDashboardData()` - Dashboard metrics and recent activity
- ✅ **Advanced Features**:
  - ✅ Automatic cost variance calculation and recording
  - ✅ Real-time production order cost updates
  - ✅ Waste tracking with separate inventory movements
  - ✅ Batch/lot traceability support
  - ✅ Type-safe Decimal to number conversion

### ✅ **Step 4: Inventory Movement Management (COMPLETED)**
- ✅ Created comprehensive inventory movement management: `src/lib/actions/inventory-movement.ts`
- ✅ **Inventory Movement Query Functions**:
  - ✅ `getInventoryMovements()` - Comprehensive filtering and pagination
  - ✅ `getMaterialMovementHistory()` - Complete movement history for materials
  - ✅ `getProductMovementHistory()` - Complete movement history for products
- ✅ **Material Adjustment Functions**:
  - ✅ `adjustMaterialStock()` - Manual stock adjustments with approval workflow
  - ✅ `transferMaterial()` - Inter-location material transfers with dual movements
- ✅ **Material Receipt Functions**:
  - ✅ `receiveMaterialFromSupplier()` - Supplier receipts with weighted average costing
- ✅ **Material Return Functions**:
  - ✅ `returnMaterialToStock()` - Production returns and other returns to inventory
- ✅ **Write-off Functions**:
  - ✅ `writeOffDamagedMaterial()` - Damage write-offs with loss tracking
  - ✅ `writeOffExpiredMaterial()` - Expiry write-offs with expiration date tracking
- ✅ **Cycle Count Functions**:
  - ✅ `performCycleCount()` - Physical inventory counts with variance analysis
- ✅ **Analytics and Reporting Functions**:
  - ✅ `getInventoryMovementDashboardData()` - Dashboard metrics and movement analytics
  - ✅ `getMaterialStockHistory()` - Historical stock level tracking
  - ✅ `approveInventoryMovement()` - Movement approval workflow

### 🔄 **Next Step: Step 5 - Cost Variance Tracking**
**Goal**: Implement automated cost variance calculation and analysis system  
**Duration**: 1-2 hours  
**Files to create**: `src/lib/actions/cost-variance.ts`

## Overview

This document outlines the implementation of comprehensive Material Requirements Planning (MRP) material tracking functionality in the XGen MRP system. The implementation focuses on automatic material reservation, consumption tracking, inventory movements, and cost management throughout the production lifecycle.

## Database Schema Enhancements

### New Models Added

#### 1. MaterialReservation
**Purpose**: Track materials reserved for production orders

```sql
MaterialReservation {
  id                String          @id @default(cuid())
  productionOrderId String
  materialId        String
  quantityReserved  Decimal         @db.Decimal(10, 3)
  quantityConsumed  Decimal         @default(0) @db.Decimal(10, 3)
  quantityReleased  Decimal         @default(0) @db.Decimal(10, 3)
  status            ReservationStatus @default(RESERVED)
  reservedAt        DateTime        @default(now())
  consumedAt        DateTime?
  releasedAt        DateTime?
  notes             String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  createdBy         String?
  modifiedBy        String?
}
```

**Key Features**:
- Tracks reserved vs consumed quantities
- Status tracking (RESERVED, PARTIAL, CONSUMED, RELEASED, EXPIRED)
- Audit trail with timestamps
- Unique constraint per production order and material

#### 2. ProductionMaterialConsumption
**Purpose**: Record actual material consumption during production

```sql
ProductionMaterialConsumption {
  id                String          @id @default(cuid())
  productionOrderId String
  materialId        String
  plannedQuantity   Decimal         @db.Decimal(10, 3)
  actualQuantity    Decimal         @db.Decimal(10, 3)
  wasteQuantity     Decimal         @default(0) @db.Decimal(10, 3)
  unitCost          Decimal         @db.Decimal(10, 4)
  totalCost         Decimal         @db.Decimal(12, 2)
  consumedBy        String
  consumedAt        DateTime        @default(now())
  batchNumber       String?
  lotNumber         String?
  expiryDate        DateTime?
  notes             String?
}
```

**Key Features**:
- Planned vs actual quantity tracking
- Waste quantity recording
- Cost tracking at the transaction level
- Batch/lot traceability
- Worker accountability

#### 3. InventoryMovement
**Purpose**: Comprehensive audit trail of all inventory movements

```sql
InventoryMovement {
  id                String          @id @default(cuid())
  materialId        String?
  productId         String?
  movementType      MovementType
  quantity          Decimal         @db.Decimal(10, 3)
  previousStock     Decimal         @db.Decimal(10, 3)
  newStock          Decimal         @db.Decimal(10, 3)
  unitCost          Decimal?        @db.Decimal(10, 4)
  totalValue        Decimal?        @db.Decimal(12, 2)
  referenceId       String?
  referenceType     String?
  locationFrom      String?
  locationTo        String?
  performedBy       String
  approvedBy        String?
  transactionDate   DateTime        @default(now())
  notes             String?
  batchNumber       String?
  lotNumber         String?
}
```

**Key Features**:
- Complete movement history for materials and products
- Before and after stock levels
- Movement type categorization
- Location tracking
- Reference to source documents

#### 4. ProductionBatch
**Purpose**: Track production batches and costs

```sql
ProductionBatch {
  id                String          @id @default(cuid())
  batchNumber       String          @unique
  productionOrderId String
  productId         String
  plannedQuantity   Int
  producedQuantity  Int             @default(0)
  startedAt         DateTime?
  completedAt       DateTime?
  status            BatchStatus     @default(PLANNED)
  qualityStatus     QualityStatus   @default(PENDING)
  totalMaterialCost Decimal         @default(0) @db.Decimal(12, 2)
  totalLaborCost    Decimal         @default(0) @db.Decimal(12, 2)
  totalOverheadCost Decimal         @default(0) @db.Decimal(12, 2)
  unitCost          Decimal         @default(0) @db.Decimal(10, 4)
  notes             String?
}
```

**Key Features**:
- Batch-level production tracking
- Comprehensive cost tracking (material, labor, overhead)
- Quality status integration
- Unit cost calculation

#### 5. CostVariance
**Purpose**: Track and analyze cost variances

```sql
CostVariance {
  id                String          @id @default(cuid())
  productionOrderId String
  materialId        String?
  varianceType      VarianceType
  plannedCost       Decimal         @db.Decimal(12, 2)
  actualCost        Decimal         @db.Decimal(12, 2)
  variance          Decimal         @db.Decimal(12, 2)
  variancePercent   Decimal         @db.Decimal(8, 4)
  explanation       String?
  investigatedBy    String?
  investigatedAt    DateTime?
  resolution        String?
  resolvedAt        DateTime?
}
```

**Key Features**:
- Multiple variance types (price, usage, labor, overhead)
- Investigation workflow
- Resolution tracking

### Enhanced Existing Models

#### Material Model Enhancements
```sql
-- Added fields:
availableStock     Int                 @default(0) // currentStock - committedStock

-- Added relations:
reservations       MaterialReservation[]
consumptions       ProductionMaterialConsumption[]
inventoryMovements InventoryMovement[]
costVariances      CostVariance[]
```

#### ProductionOrder Model Enhancements
```sql
-- Added fields:
plannedMaterialCost Decimal         @default(0) @db.Decimal(12, 2)
actualMaterialCost  Decimal         @default(0) @db.Decimal(12, 2)
materialVariance    Decimal         @default(0) @db.Decimal(12, 2)
completedQuantity   Int             @default(0)
completedAt         DateTime?

-- Added relations:
materialReservations  MaterialReservation[]
materialConsumptions  ProductionMaterialConsumption[]
productionBatches     ProductionBatch[]
costVariances         CostVariance[]
```

### New Enums

#### ReservationStatus
```sql
enum ReservationStatus {
  RESERVED    // Materials reserved for production
  PARTIAL     // Partially consumed
  CONSUMED    // Fully consumed
  RELEASED    // Reservation released (cancelled production)
  EXPIRED     // Reservation expired
}
```

#### MovementType
```sql
enum MovementType {
  // Material movements
  MATERIAL_RESERVATION     // Reserve material for production
  MATERIAL_CONSUMPTION     // Consume material in production
  MATERIAL_RETURN         // Return unused material
  MATERIAL_RECEIPT        // Receive material from supplier
  MATERIAL_TRANSFER       // Transfer between locations
  MATERIAL_ADJUSTMENT     // Manual stock adjustment
  MATERIAL_WASTE          // Record material waste
  
  // Product movements
  PRODUCTION_COMPLETE     // Add finished product to inventory
  PRODUCT_SHIPMENT        // Ship product to customer
  PRODUCT_RETURN          // Product return from customer
  PRODUCT_ADJUSTMENT      // Manual product stock adjustment
  PRODUCT_TRANSFER        // Transfer between locations
  
  // Other movements
  CYCLE_COUNT            // Physical inventory count adjustment
  DAMAGE_WRITE_OFF       // Write off damaged inventory
  EXPIRY_WRITE_OFF       // Write off expired inventory
}
```

#### BatchStatus
```sql
enum BatchStatus {
  PLANNED       // Batch planned but not started
  IN_PROGRESS   // Production in progress
  COMPLETED     // Production completed
  ON_HOLD       // Production on hold
  CANCELLED     // Production cancelled
  QUALITY_HOLD  // On hold for quality issues
}
```

#### QualityStatus
```sql
enum QualityStatus {
  PENDING       // Quality check pending
  PASSED        // Quality check passed
  FAILED        // Quality check failed
  CONDITIONAL   // Passed with conditions
  REWORK        // Requires rework
}
```

#### VarianceType
```sql
enum VarianceType {
  MATERIAL_PRICE    // Material price variance
  MATERIAL_USAGE    // Material usage variance
  LABOR_RATE        // Labor rate variance
  LABOR_EFFICIENCY  // Labor efficiency variance
  OVERHEAD          // Overhead variance
  TOTAL_COST        // Total cost variance
}
```

## Step 2: Material Reservation System Implementation

### Core Features Implemented

#### **Automatic Material Availability Checking**
- Pre-production validation of material availability
- BOM-based quantity calculations including waste percentages
- Real-time available stock calculations (currentStock - committedStock)
- Comprehensive shortage reporting with affected production orders

#### **Intelligent Material Reservation**
- Automatic reservation during production order creation
- Transaction-based operations ensuring data consistency
- Inventory movement audit trail for all reservation activities
- Rollback capabilities if reservation fails

#### **Smart Material Release**
- Automatic release when production orders are cancelled or deleted
- Partial release support for partially consumed materials
- Comprehensive cleanup of related records (movements, reservations, etc.)
- Audit trail maintenance for all release activities

#### **Enhanced Production Order Integration**
- **Enhanced `createProductionOrder()`**:
  - Pre-checks material availability before order creation
  - Automatically reserves materials if available
  - Includes planned material cost in production order
  - Rolls back order creation if material reservation fails
  - Returns comprehensive reservation status and cost information

- **Enhanced `deleteProductionOrder()`**:
  - Automatically releases all material reservations
  - Cleans up all related MRP records (consumptions, batches, variances, movements)
  - Maintains data integrity across all related entities
  - Graceful handling of cleanup failures

- **Enhanced `updateProductionOrderStatus()`**:
  - Automatically releases materials when production is cancelled
  - Updates completion fields when production is completed
  - Maintains audit trail for all status-driven material operations

### Key Functions Implemented

#### **Material Availability Functions**
- `checkMaterialAvailability(materialId, requiredQuantity)` - Single material availability check
- `checkProductionOrderMaterialRequirements(productId, quantity)` - Complete BOM availability analysis

#### **Material Reservation Functions**  
- `reserveMaterialsForProduction(productionOrderId)` - Automatic reservation with inventory updates
- `releaseMaterialReservations(productionOrderId, reason)` - Release with audit trail

#### **Reservation Management Functions**
- `getMaterialReservations(filters)` - Filtered reservation queries
- `getReservationsForProductionOrder(productionOrderId)` - Order-specific reservations
- `updateMaterialReservation(data)` - Status and quantity updates

#### **Shortage Alert Functions**
- `checkMaterialShortages()` - Identify low stock materials with affected orders
- `getMaterialReservationDashboardData()` - Analytics and dashboard metrics

## Key Workflows Enabled

### 1. Enhanced Material Reservation Workflow
1. **Production Order Creation** → Material availability validation
2. **Availability Check** → BOM-based requirement calculation
3. **Automatic Reservation** → Transaction-based material locking
4. **Inventory Updates** → Real-time committed stock adjustments
5. **Audit Trail** → Complete movement history

### 2. Intelligent Material Release Workflow  
1. **Production Cancellation/Deletion** → Automatic release trigger
2. **Partial Release Support** → Handle partially consumed reservations
3. **Stock Restoration** → Return materials to available stock
4. **Comprehensive Cleanup** → Remove all related records
5. **Audit Documentation** → Track release reasons and history

### 3. Production Lifecycle Integration
1. **Order Creation** → Automatic material reservation
2. **Status Changes** → Smart material handling
3. **Completion** → Final cost calculations and stock updates
4. **Cancellation** → Automatic material release and cleanup

## Next Implementation Steps

### Phase 2: Server Actions - Remaining Steps
- **Step 5**: Cost Variance Tracking - Automated variance calculation and analysis

### Phase 3: User Interface
- Material Reservation Dashboard
- Production Material Consumption Forms
- Real-time Stock Level Displays
- Cost Variance Reports
- Inventory Movement History

### Phase 4: Advanced Features
- Automated reorder point calculations
- Material shortage alerts
- Cost variance analysis
- Waste reduction analytics
- Real-time production cost tracking

## Benefits Achieved

### Step 2 Benefits
1. **Automatic Material Management** - No manual reservation required
2. **Production Order Validation** - Prevents orders with insufficient materials
3. **Real-time Stock Accuracy** - Committed stock properly tracked
4. **Complete Audit Trail** - Every material movement documented
5. **Data Integrity** - Transaction-based operations prevent inconsistencies
6. **Smart Cleanup** - Automatic material release and record cleanup

### Long-term Benefits  
1. **Cost Optimization** - Identify and reduce material waste
2. **Process Improvement** - Analyze production efficiency
3. **Quality Enhancement** - Track material quality impact
4. **Planning Accuracy** - Better production planning with historical data

## Step 4: Inventory Movement Management Key Workflows

### 1. Comprehensive Material Adjustment Workflow
1. **Manual Stock Adjustments** → Real-time stock updates with reason tracking
2. **Approval Workflow** → Optional approval requirement for sensitive adjustments
3. **Cost Impact Tracking** → Automatic calculation of financial impact
4. **Audit Trail** → Complete movement history with user attribution

### 2. Material Transfer Workflow
1. **Inter-location Transfers** → Dual movement tracking (out/in)
2. **Stock Validation** → Prevent transfers exceeding available stock
3. **Batch/Lot Tracking** → Maintain traceability through transfers
4. **Real-time Updates** → Immediate inventory visibility

### 3. Supplier Receipt Workflow
1. **Material Receipts** → Automatic stock and cost updates
2. **Weighted Average Costing** → Intelligent cost basis calculation
3. **Purchase Order Integration** → Link receipts to PO references
4. **Quality Data Tracking** → Batch, lot, and expiry date management

### 4. Write-off and Loss Management Workflow
1. **Damage Write-offs** → Track damaged material with reason codes
2. **Expiry Management** → Handle expired materials with date tracking
3. **Cost Impact** → Automatic loss value calculation
4. **Compliance Documentation** → Complete audit trail for regulatory requirements

### 5. Cycle Count and Physical Inventory Workflow
1. **Physical Counts** → Record actual vs system quantities
2. **Variance Analysis** → Automatic calculation of discrepancies
3. **Stock Adjustments** → Real-time correction of system quantities
4. **Financial Impact** → Track monetary impact of count variances

## Benefits Achieved

### Step 4 Benefits
1. **Complete Audit Trail** - Every inventory movement fully documented
2. **Manual Control** - Full range of manual inventory adjustments
3. **Cost Accuracy** - Weighted average costing and real-time updates
4. **Compliance Support** - Complete documentation for regulatory requirements
5. **Loss Management** - Systematic tracking of waste, damage, and expiry
6. **Physical Inventory** - Cycle count support with variance analysis
7. **Approval Workflows** - Optional approval requirements for sensitive operations
8. **Batch/Lot Traceability** - Complete tracking through all movements

## Technical Notes

### Database Performance
- Proper indexing on high-query fields (status, dates, IDs)
- Decimal precision suitable for material quantities and costs
- Optimized relationships for efficient joins

### Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate reservations
- Transaction-based operations ensure consistency

### Scalability
- Schema designed to handle large volumes of transactions
- Partitioning strategies can be applied for historical data
- Archive strategies for old movement records

## Conclusion

**Phase 1 and Steps 1-4 are now complete!** The MRP Material Tracking system now has a robust foundation with intelligent material reservation capabilities. Production orders automatically validate material availability, reserve materials, and handle cleanup operations seamlessly.

**Step 3 delivers a complete material consumption system** that integrates seamlessly with the existing production order workflow, providing automatic material management, real-time stock tracking, and comprehensive audit capabilities.

**Step 4 delivers a comprehensive inventory movement management system** that provides complete audit trails, manual adjustments, and all types of inventory operations needed for clothing manufacturing operations.

The next phase will focus on implementing automated cost variance calculation and analysis system to complete the production material lifecycle management. 