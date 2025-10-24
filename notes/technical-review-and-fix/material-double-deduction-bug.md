# Material Double Deduction Bug - Technical Review

**Date**: October 25, 2025  
**Severity**: 🔴 **CRITICAL**  
**Status**: ✅ Fixed (October 25, 2025)  
**Affected Components**: Production Orders, Material Inventory, Stock Management

---

## Executive Summary

A critical bug has been identified in the production order workflow where **materials are being deducted from inventory twice**:
1. Once during production order creation (material reservation)
2. Again when production is marked as completed

This results in **incorrect material stock levels** and can lead to:
- Negative stock values
- Inaccurate inventory reporting
- Material shortage alerts when materials are actually available
- Broken MRP calculations

---

## Affected Files

- `src/lib/actions/production-order.ts` (lines 5959-6016)
- `src/lib/actions/material-reservation.ts` (lines 237-247)
- `prisma/schema.prisma` (Material, ProductionOrder, MaterialReservation models)

---

## Current Workflow Analysis

### ✅ Step 1: Production Order Creation (Working as Intended)

**File**: `src/lib/actions/production-order.ts`  
**Function**: `createProductionOrder()`  
**Lines**: 4726-4857

```typescript
export async function createProductionOrder(data: CreateProductionOrderInput) {
  // 1. Check material availability
  const materialRequirements = await checkProductionOrderMaterialRequirements(
    data.productId, 
    data.quantity
  ) // Line 4732

  // 2. Create production order
  const order = await prisma.productionOrder.create({ ... }) // Line 4741

  // 3. Reserve materials (THIS DEDUCTS FROM STOCK)
  const reservationResult = await reserveMaterialsForProduction(order.id) // Line 4819
}
```

**What happens**: Materials are checked for availability, production order is created, and materials are reserved.

---

### ✅ Step 2: Material Reservation (First Deduction - CORRECT)

**File**: `src/lib/actions/material-reservation.ts`  
**Function**: `reserveMaterialsForProduction()`  
**Lines**: 157-298

```typescript
export async function reserveMaterialsForProduction(productionOrderId: string) {
  // Get material requirements from BOM
  const requirements = await checkProductionOrderMaterialRequirements(...)

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    for (const material of requirements.materials) {
      // Create reservation record
      await tx.materialReservation.create({ ... })

      // ⚠️ FIRST DEDUCTION: Deduct from currentStock
      const newCurrentStock = currentMaterial.currentStock - material.quantityNeeded // Line 238
      
      await tx.material.update({
        where: { id: material.materialId },
        data: {
          currentStock: newCurrentStock,  // Line 244
          availableStock: newAvailableStock
        }
      })

      // Create inventory movement record
      await tx.inventoryMovement.create({
        movementType: MovementType.MATERIAL_RESERVATION,
        quantity: material.quantityNeeded,
        notes: `Material deducted for production order ${productionOrderId}`
      })
    }
  })
}
```

**What happens**: 
- Materials are **physically deducted** from `currentStock`
- Material reservation records are created
- Inventory movement is logged as `MATERIAL_RESERVATION`

**This is CORRECT** - materials should be removed from available stock when production starts.

---

### ❌ Step 3: Production Completion (Second Deduction - BUG)

**File**: `src/lib/actions/production-order.ts`  
**Function**: `updateProductionOrderStatus()`  
**Lines**: 5864-6084

```typescript
export async function updateProductionOrderStatus(productionOrderId: string, status: Status) {
  // If completing production
  if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
    await prisma.$transaction(async (tx) => {
      // ✅ CORRECT: Add products to stock
      await tx.product.update({
        where: { id: currentOrder.productId },
        data: {
          currentStock: currentOrder.product.currentStock + productionQty, // Line 5918
        }
      })

      // ✅ CORRECT: Add product variants to stock (if applicable)
      if (currentOrder.productVariantId) {
        await tx.productVariant.update({
          where: { id: currentOrder.productVariantId },
          data: {
            currentStock: variant.currentStock + productionQty, // Line 5933
          }
        })
      }

      // ❌ BUG: Deduct materials AGAIN (lines 5959-6016)
      const bomEntries = await tx.productionBOM.findMany({
        where: { productionOrderId }
      })

      for (const bomEntry of bomEntries) {
        const quantityToConsume = Math.ceil(Number(bomEntry.quantityNeeded))
        
        // ⚠️ SECOND DEDUCTION: Materials already deducted during reservation!
        const newCurrentStock = Math.max(0, material.currentStock - quantityToConsume) // Line 5981
        
        await tx.material.update({
          where: { id: bomEntry.materialId },
          data: {
            currentStock: newCurrentStock,      // Line 5988
            committedStock: newCommittedStock,
            availableStock: newAvailableStock,
          }
        })
      }
    })
  }
}
```

**What happens**:
- ✅ Products are correctly added to stock
- ✅ Product variants are correctly added to stock
- ❌ **Materials are deducted AGAIN** (they were already deducted during reservation!)

---

## The Problem: Double Deduction

### Example Scenario

**Initial State:**
- Material "Cotton Fabric": 1000 units in stock
- Production Order: Create 10 shirts (requires 50 units of cotton each = 500 units total)

**Step 1 - Production Order Created:**
```
Material Reservation (CORRECT):
  Cotton Fabric: 1000 - 500 = 500 units remaining ✅
```

**Step 2 - Production Completed:**
```
Material Consumption (BUG):
  Cotton Fabric: 500 - 500 = 0 units remaining ❌
  
EXPECTED: 500 units remaining (materials already deducted)
ACTUAL: 0 units remaining (deducted twice!)
```

**Result:**
- Material stock is **incorrectly reduced by 1000 units** instead of 500
- Can lead to **negative stock** if multiple production orders are completed
- Inventory reports show **incorrect material levels**

---

## Database Schema Context

### Material Model
```prisma
model Material {
  id                    String                          @id @default(cuid())
  name                  String
  currentStock          Int                             // Total physical stock
  minimumStockLevel     Int
  committedStock        Int                             @default(0)  // Reserved for orders
  availableStock        Int                             @default(0)  // currentStock - committedStock
  
  reservations          MaterialReservation[]
  consumptions          ProductionMaterialConsumption[]
  inventoryMovements    InventoryMovement[]
}
```

### MaterialReservation Model
```prisma
model MaterialReservation {
  id                String            @id @default(cuid())
  productionOrderId String
  materialId        String
  quantityReserved  Decimal           @db.Decimal(10, 3)
  quantityConsumed  Decimal           @default(0) @db.Decimal(10, 3)
  quantityReleased  Decimal           @default(0) @db.Decimal(10, 3)
  status            ReservationStatus @default(RESERVED)
  reservedAt        DateTime          @default(now())
  consumedAt        DateTime?
  releasedAt        DateTime?
}
```

### ProductionOrder Model
```prisma
model ProductionOrder {
  id                    String                          @id @default(cuid())
  productId             String
  productVariantId      String?
  quantity              Int
  status                Status                          @default(ACTIVE)
  completedQuantity     Int                             @default(0)
  completedAt           DateTime?
  
  product               Product                         @relation(fields: [productId], references: [id])
  productVariant        ProductVariant?                 @relation(fields: [productVariantId], references: [id])
  materialReservations  MaterialReservation[]
  materialConsumptions  ProductionMaterialConsumption[]
}
```

---

## Expected vs Actual Behavior

### Expected Behavior (Correct Flow)

```
1. Production Order Created:
   ├─ Check material availability
   ├─ Create production order record
   ├─ Reserve materials:
   │  ├─ Deduct from Material.currentStock ✅
   │  ├─ Create MaterialReservation record
   │  └─ Log InventoryMovement (MATERIAL_RESERVATION)
   └─ Status: PENDING

2. Production In Progress:
   └─ Status: IN_PROGRESS (no stock changes)

3. Production Completed:
   ├─ Add to Product.currentStock ✅
   ├─ Add to ProductVariant.currentStock (if applicable) ✅
   ├─ Update ProductionOrder.completedQuantity
   ├─ Update ProductionOrder.completedAt
   └─ Status: COMPLETED
   
   ⚠️ Materials should NOT be deducted again!
```

### Actual Behavior (Bug)

```
1. Production Order Created:
   ├─ Reserve materials:
   │  └─ Deduct from Material.currentStock ✅ (First deduction)
   └─ Status: PENDING

2. Production Completed:
   ├─ Add to Product.currentStock ✅
   ├─ Add to ProductVariant.currentStock ✅
   └─ Deduct from Material.currentStock ❌ (Second deduction - BUG!)
```

---

## Impact Assessment

### Immediate Impact
- ❌ Material stock levels are **incorrect** (too low)
- ❌ Can result in **negative stock values**
- ❌ Material shortage alerts trigger **incorrectly**
- ❌ MRP calculations are **inaccurate**

### Business Impact
- 📉 **Inventory reports are unreliable**
- 📉 **Purchasing decisions based on wrong data**
- 📉 **Production planning disrupted**
- 📉 **Cost calculations incorrect**

### Data Integrity
- 🔴 **Historical data is corrupted** (all completed production orders have double-deducted materials)
- 🔴 **Audit trails show incorrect material movements**
- 🔴 **Reconciliation with physical inventory will fail**

---

## Root Cause Analysis

### Why This Bug Exists

The code appears to have been designed with two different material consumption strategies:

1. **Strategy A (Implemented)**: Deduct materials when production order is created (reservation)
2. **Strategy B (Partially Implemented)**: Deduct materials when production is completed (consumption)

The current implementation **uses both strategies**, resulting in double deduction.

### Design Intent vs Implementation

**Design Intent** (based on MaterialReservation model):
- Materials should be **reserved** (deducted) when production starts
- The `MaterialReservation.quantityConsumed` field should track actual consumption
- The `ProductionMaterialConsumption` model should record detailed consumption data

**Current Implementation (fixed)**:
- Reservation updates `committedStock`, not `currentStock`.
- Completion processes consumption once, returning `committedStock` to zero.
- `MaterialReservation.quantityConsumed` and `ProductionMaterialConsumption` persist actual usage.

---

## Solution Summary

The material flow now uses **reservation = commitment** and **completion = physical deduction**. See "Code Changes" above for updated files.

---

## Testing Requirements

### Unit Tests
- [ ] Production order creation increases `committedStock` and keeps `currentStock` unchanged.
- [ ] Completing production deducts materials once and clears commitments.
- [ ] Completing production adds products (and variants) to stock.
- [ ] Cancelling production releases commitments back to availability.

### Integration Tests
- [ ] Create production order → `availableStock` decreases, `currentStock` unchanged.
- [ ] Complete production order → `currentStock` decreases once; commitments cleared.
- [ ] Complete production order → product/variant stock increments match actual completion quantity.
- [ ] Cancel production order → commitments released, availability restored.

### Regression Tests
- [ ] Variant productions maintain correct parent/variant stock totals.
- [ ] Multi-material BOM orders deduct each material once.
- [ ] Waste and adjustment quantities flow into consumption records appropriately.
- [ ] Concurrent orders do not violate stock constraints.

### Data Validation
- [ ] Verify no negative `currentStock`, `committedStock`, or `availableStock` values occur.
- [ ] Inventory movements correctly distinguish reservation vs. consumption events.
- [ ] `ProductionMaterialConsumption` totals align with reservations and BOM planning.

---

## Data Migration Considerations

### Historical Data

**Problem**: All completed production orders in the database have **incorrectly deducted materials twice**.

**Options**:

1. **Accept Historical Inaccuracy** (Recommended for MVP)
   - Document the issue
   - Fix going forward
   - Perform physical inventory count to reset stock levels

2. **Attempt Data Correction**
   - Query all completed production orders
   - Calculate total over-deducted materials
   - Add correction inventory movements
   - **Risk**: Complex, error-prone, may not be accurate

3. **Fresh Start**
   - Reset all material stock to physical count
   - Document as "inventory adjustment"
   - Start clean with fixed code

---

## Related Issues

### Potential Related Bugs
- Material reservation release on cancellation (verify correct)
- Material committed stock tracking (verify correct)
- Inventory movement logging (verify complete)
- Cost variance calculations (may be affected)

### Follow-up Tasks
- [ ] Review `ProductionMaterialConsumption` model usage
- [ ] Review `MaterialReservation.quantityConsumed` field usage
- [ ] Add validation to prevent negative stock
- [ ] Add alerts for stock discrepancies
- [ ] Implement inventory reconciliation reports

---

## References

### Code Locations
- Production order creation: `src/lib/actions/production-order.ts:4726-4857`
- Material reservation: `src/lib/actions/material-reservation.ts:157-298`
- Production status update: `src/lib/actions/production-order.ts:5864-6084`
- Material consumption: `src/lib/actions/material-consumption.ts`

### Database Models
- Material: `prisma/schema.prisma:342-377`
- ProductionOrder: `prisma/schema.prisma:424-461`
- MaterialReservation: `prisma/schema.prisma:849-871`
- ProductionMaterialConsumption: `prisma/schema.prisma:873-897`

### Related Documentation
- Production stock flow: `notes/PRODUCTION-STOCK-FLOW-DIAGRAM.md`
- Production stock sync: `notes/PRODUCTION-STOCK-SYNC-SUMMARY.md`

---

## Approval & Sign-off

**Reviewed By**: _________________  
**Approved By**: _________________  
**Date**: _________________  
**Priority**: 🔴 Critical  
**Target Fix Date**: _________________

---

**End of Technical Review Document**
