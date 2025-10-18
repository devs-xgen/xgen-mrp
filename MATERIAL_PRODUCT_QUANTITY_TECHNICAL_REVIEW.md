# Material & Product Quantity Management - Technical Review

**Date:** 2025-10-16
**Reviewer:** Claude Code
**Scope:** Admin-side material and product quantity tracking across production lifecycle

---

## Executive Summary

This document provides a comprehensive technical analysis of how materials and products flow through the XGen MRP system, examining quantity tracking at each stage from production order creation through customer delivery.

### Key Findings:

✅ **WORKING CORRECTLY:**
1. Material reservation and deduction during production order creation
2. Material consumption tracking during production execution
3. Product stock increment upon production completion
4. Comprehensive inventory movement audit trail

❌ **CRITICAL GAPS IDENTIFIED:**
1. **NO product stock deduction when products are delivered to customers**
2. **NO inventory movement tracking for product shipments**
3. Product variant stock not properly managed in production completion
4. Missing transaction handling for stock updates during order completion

---

## 1. Production Order Creation → Material Reservation

### Location
- **File:** [`src/lib/actions/material-reservation.ts`](src/lib/actions/material-reservation.ts#L138-L277)
- **Function:** `reserveMaterialsForProduction()`

### How It Works

#### Step 1: Material Availability Check
```typescript
// Line 172-187
const requirements = await checkProductionOrderMaterialRequirements(
  productionOrder.productId,
  productionOrder.quantity
)

if (!requirements.allMaterialsAvailable) {
  return {
    success: false,
    error: `Insufficient materials available: ${shortageDetails}`
  }
}
```

#### Step 2: Material Deduction & Reservation (in transaction)
```typescript
// Lines 194-226
await tx.materialReservation.create({
  data: {
    productionOrderId,
    materialId: material.materialId,
    quantityReserved: material.quantityNeeded,
    status: ReservationStatus.RESERVED,
    // ...
  }
})

// ⚠️ CRITICAL: Materials are DEDUCTED from currentStock immediately
const newCurrentStock = currentMaterial.currentStock - material.quantityNeeded
await tx.material.update({
  where: { id: material.materialId },
  data: {
    currentStock: newCurrentStock,  // ✅ Stock reduced here
    availableStock: newAvailableStock
  }
})
```

#### Step 3: Inventory Movement Logging
```typescript
// Lines 228-244
await tx.inventoryMovement.create({
  data: {
    materialId: material.materialId,
    movementType: MovementType.MATERIAL_RESERVATION,
    quantity: material.quantityNeeded,
    previousStock: currentMaterial.currentStock,
    newStock: newCurrentStock,  // ✅ Audit trail created
    // ...
  }
})
```

### ✅ Status: **WORKING CORRECTLY**

**Key Logic:**
- Materials are **immediately deducted** from `currentStock` when a production order is created
- This happens **atomically** within a Prisma transaction
- Complete audit trail via `InventoryMovement` table
- If material reservation fails, production order creation is rolled back

---

## 2. Material Consumption During Production

### Location
- **File:** [`src/lib/actions/material-consumption.ts`](src/lib/actions/material-consumption.ts#L79-L292)
- **Function:** `consumeMaterialForProduction()`

### How It Works

#### Important Discovery: NO Additional Stock Deduction
```typescript
// Lines 195-212 - Inventory movement for TRACKING ONLY
await tx.inventoryMovement.create({
  data: {
    materialId: data.materialId,
    movementType: MovementType.MATERIAL_CONSUMPTION,
    quantity: totalQuantityUsed,
    previousStock: material.currentStock,
    newStock: material.currentStock, // ⚠️ NO CHANGE - stock already deducted!
    // ...
    notes: `Stock already deducted during reservation.`,
  }
})
```

### ✅ Status: **WORKING CORRECTLY**

**Key Logic:**
- Material consumption is **tracked** but does NOT deduct stock again
- Stock was already deducted during reservation
- Consumption updates the reservation status (RESERVED → PARTIAL → CONSUMED)
- Creates inventory movements for audit purposes only
- Tracks actual usage vs planned usage for variance analysis

---

## 3. Production Completion → Product Stock Increment

### Location
- **File:** [`src/lib/actions/inspector/production-order.ts`](src/lib/actions/inspector/production-order.ts#L850-L886)
- **Function:** `updateProductionOrderStatus()`

### How It Works

```typescript
// Lines 851-865
if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
  await prisma.product.update({
    where: { id: currentOrder.productId },
    data: {
      currentStock: currentOrder.product.currentStock + productionQty,  // ✅ Stock added
    },
  })

  await prisma.productionOrder.update({
    where: { id: productionOrderId },
    data: {
      completedQuantity: productionQty,
      completedAt: new Date(),
    },
  })
}
```

### ⚠️ Status: **PARTIALLY WORKING - Issues Identified**

#### Issue #1: No Transaction Wrapper
```typescript
// ❌ PROBLEM: Two separate database operations without transaction
await prisma.product.update(...)  // Could succeed
await prisma.productionOrder.update(...)  // Could fail

// ✅ SHOULD BE:
await prisma.$transaction(async (tx) => {
  await tx.product.update(...)
  await tx.productionOrder.update(...)
})
```

#### Issue #2: Product Variant Stock Not Updated
```typescript
// ❌ PROBLEM: Only updates base product, not variant stock
if (currentOrder.productVariantId) {
  // NO CODE HERE - variant stock is never updated!
}
```

#### Issue #3: No Inventory Movement Created
```typescript
// ❌ MISSING: No InventoryMovement record for product stock increase
// Should create:
await tx.inventoryMovement.create({
  data: {
    productId: currentOrder.productId,
    movementType: MovementType.PRODUCTION_COMPLETE,
    quantity: productionQty,
    previousStock: currentOrder.product.currentStock,
    newStock: currentOrder.product.currentStock + productionQty,
    // ...
  }
})
```

---

## 4. Delivery/Shipment → Product Stock Deduction

### Location
- **File:** [`src/lib/actions/delivery-receipts.ts`](src/lib/actions/delivery-receipts.ts)
- **Functions:** `createDeliveryReceipt()`, `confirmDelivery()`, etc.

### How It Works

```typescript
// Lines 399-472 - createDeliveryReceipt
const deliveryReceipt = await prisma.deliveryReceipt.create({
  data: {
    receiptNumber,
    billingStatementId: validatedData.billingStatementId,
    deliveryDate: validatedData.deliveryDate,
    // ... other fields
  }
})
// ❌ NO PRODUCT STOCK DEDUCTION ANYWHERE IN THIS FILE
```

### ❌ Status: **CRITICAL GAP - NOT IMPLEMENTED**

**Problem:** When a product is delivered to a customer:
1. Delivery receipt is created
2. Delivery is marked as "DELIVERED"
3. But `product.currentStock` is **NEVER decremented**
4. No `InventoryMovement` record with `PRODUCT_SHIPMENT` is created

**Result:** Product stock accumulates infinitely, never decreases when sold!

---

## 5. Inventory Movement Tracking

### Location
- **File:** [`src/lib/actions/inventory-movement.ts`](src/lib/actions/inventory-movement.ts)

### Available Movement Types

```typescript
// From MovementType enum in Prisma schema:
enum MovementType {
  MATERIAL_RESERVATION   // ✅ Used
  MATERIAL_CONSUMPTION   // ✅ Used
  MATERIAL_RETURN        // ✅ Used
  MATERIAL_RECEIPT       // ✅ Used
  MATERIAL_TRANSFER      // ✅ Implemented
  MATERIAL_ADJUSTMENT    // ✅ Implemented
  MATERIAL_WASTE         // ✅ Used

  PRODUCTION_COMPLETE    // ❌ NOT USED (should be used in production completion)
  PRODUCT_SHIPMENT       // ❌ NOT USED (should be used in delivery)
  PRODUCT_RETURN         // ⚠️ Implemented but not used
  PRODUCT_ADJUSTMENT     // ⚠️ Implemented but not used
  PRODUCT_TRANSFER       // ⚠️ Implemented but not used

  CYCLE_COUNT            // ✅ Implemented
  DAMAGE_WRITE_OFF       // ✅ Implemented
  EXPIRY_WRITE_OFF       // ✅ Implemented
}
```

### ✅ Material Movements: COMPLETE
All material-related inventory movements are properly tracked.

### ❌ Product Movements: INCOMPLETE
Product-related inventory movements are implemented in the helper functions but **not integrated** into the production/delivery workflows.

---

## 6. Stock Calculation Logic

### Current Implementation

**Material Stock Fields:**
```typescript
// From Prisma schema - Material model
currentStock: Decimal       // Physical inventory
committedStock: Decimal     // Reserved for production
expectedStock: Decimal      // Incoming (purchase orders)
availableStock: Decimal     // currentStock - committedStock
```

**Product Stock Fields:**
```typescript
// From Prisma schema - Product/ProductVariant models
currentStock: Decimal       // Physical inventory
minimumStockLevel: Decimal  // Reorder point
expectedStock: Decimal      // Incoming (production orders)
```

### ⚠️ Issues Identified

1. **Product `availableStock` not calculated**
   - Materials have `availableStock = currentStock - committedStock`
   - Products should have similar logic: `availableStock = currentStock - reserved`
   - Currently no `committedStock` or reservation system for finished products

2. **No product reservation system**
   - When customer order is created, products are not reserved
   - Multiple orders can claim the same stock
   - First-come-first-served at delivery time (race condition)

---

## Critical Issues Summary

### Issue #1: Missing Product Stock Deduction on Delivery 🔴 CRITICAL

**Impact:** HIGH - Product inventory becomes inaccurate over time

**Current Behavior:**
- Production completes → Product stock increases ✅
- Delivery occurs → Product stock **DOES NOT** decrease ❌
- Result: Stock accumulates infinitely

**Location to Fix:** `src/lib/actions/delivery-receipts.ts`

**Recommended Fix:**
```typescript
export async function confirmDelivery(
  id: string,
  signature?: string,
  photoEvidence?: string
): Promise<BillingActionResponse<DeliveryReceipt>> {
  // ... existing code ...

  const result = await prisma.$transaction(async (tx) => {
    // Get delivery receipt with billing statement and production order
    const receipt = await tx.deliveryReceipt.findUnique({
      where: { id },
      include: {
        billingStatement: {
          include: {
            productionOrder: {
              include: { product: true, productVariant: true }
            }
          }
        }
      }
    })

    // Deduct product stock
    if (receipt.billingStatement?.productionOrder) {
      const po = receipt.billingStatement.productionOrder
      const quantityToDeduct = po.quantity

      if (po.productVariantId) {
        // Update variant stock
        await tx.productVariant.update({
          where: { id: po.productVariantId },
          data: {
            currentStock: { decrement: quantityToDeduct }
          }
        })

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            productId: po.productId,
            movementType: 'PRODUCT_SHIPMENT',
            quantity: quantityToDeduct,
            referenceId: receipt.id,
            referenceType: 'DeliveryReceipt',
            // ... other fields
          }
        })
      } else {
        // Update base product stock
        await tx.product.update({
          where: { id: po.productId },
          data: {
            currentStock: { decrement: quantityToDeduct }
          }
        })

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            productId: po.productId,
            movementType: 'PRODUCT_SHIPMENT',
            quantity: quantityToDeduct,
            referenceId: receipt.id,
            referenceType: 'DeliveryReceipt',
            // ... other fields
          }
        })
      }
    }

    // Update delivery receipt status
    const updatedReceipt = await tx.deliveryReceipt.update({
      where: { id },
      data: {
        deliveryStatus: "DELIVERED",
        signatureImage: signature,
        photoEvidence: photoEvidence,
        // ...
      }
    })

    return updatedReceipt
  })

  return { success: true, data: result }
}
```

---

### Issue #2: Production Completion Missing Transaction & Inventory Movement 🟡 MEDIUM

**Impact:** MEDIUM - Data consistency risk, incomplete audit trail

**Current Behavior:**
- Product stock update and production order update are separate operations
- No rollback if one fails but the other succeeds
- No inventory movement record created

**Location to Fix:** `src/lib/actions/inspector/production-order.ts:850-886`

**Recommended Fix:**
```typescript
if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
  await prisma.$transaction(async (tx) => {
    const currentProduct = await tx.product.findUnique({
      where: { id: currentOrder.productId }
    })

    const newStock = currentProduct.currentStock + productionQty

    // Update product stock
    await tx.product.update({
      where: { id: currentOrder.productId },
      data: { currentStock: newStock }
    })

    // Update production order
    await tx.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        completedQuantity: productionQty,
        completedAt: new Date(),
      }
    })

    // Create inventory movement
    await tx.inventoryMovement.create({
      data: {
        productId: currentOrder.productId,
        movementType: MovementType.PRODUCTION_COMPLETE,
        quantity: productionQty,
        previousStock: currentProduct.currentStock,
        newStock: newStock,
        referenceId: productionOrderId,
        referenceType: 'ProductionOrder',
        performedBy: session.user.id,
        transactionDate: new Date(),
        notes: `Product stock increased from production completion`
      }
    })

    // Handle product variant stock if applicable
    if (currentOrder.productVariantId) {
      const currentVariant = await tx.productVariant.findUnique({
        where: { id: currentOrder.productVariantId }
      })

      await tx.productVariant.update({
        where: { id: currentOrder.productVariantId },
        data: {
          currentStock: currentVariant.currentStock + productionQty
        }
      })
    }
  })
}
```

---

### Issue #3: Product Variant Stock Not Updated 🟡 MEDIUM

**Impact:** MEDIUM - Variant stock tracking inaccurate

**Current Behavior:**
- Production completion updates base `Product.currentStock`
- Product variant stock (`ProductVariant.currentStock`) is never updated
- Variants become out of sync with reality

**Recommended Fix:** See Issue #2 fix above (includes variant handling)

---

### Issue #4: No Product Reservation System 🟠 LOW-MEDIUM

**Impact:** MEDIUM - Can oversell products, race conditions

**Current Behavior:**
- Customer orders check `currentStock` availability
- But products are not reserved when order is placed
- Multiple orders can claim same stock
- Stock is only checked again at delivery time

**Recommended Enhancement:**
```sql
-- Add to Product and ProductVariant models
ALTER TABLE "Product" ADD COLUMN "committedStock" DECIMAL DEFAULT 0;
ALTER TABLE "ProductVariant" ADD COLUMN "committedStock" DECIMAL DEFAULT 0;

-- Create ProductReservation table (similar to MaterialReservation)
CREATE TABLE "ProductReservation" (
  id TEXT PRIMARY KEY,
  customerOrderId TEXT,
  productId TEXT,
  productVariantId TEXT,
  quantityReserved DECIMAL,
  quantityFulfilled DECIMAL DEFAULT 0,
  status TEXT, -- RESERVED, PARTIAL, FULFILLED, RELEASED
  -- ...
)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PRODUCTION ORDER CREATION                                     │
├─────────────────────────────────────────────────────────────────┤
│ Materials:                                                       │
│   • Check availability                                           │
│   • CREATE MaterialReservation (qty reserved)                    │
│   • UPDATE Material.currentStock (-qty)  ✅ DEDUCTED            │
│   • CREATE InventoryMovement (MATERIAL_RESERVATION) ✅           │
│                                                                  │
│ Products:                                                        │
│   • No action taken                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. MATERIAL CONSUMPTION (During Production)                      │
├─────────────────────────────────────────────────────────────────┤
│ Materials:                                                       │
│   • CREATE ProductionMaterialConsumption                         │
│   • UPDATE MaterialReservation.quantityConsumed                  │
│   • NO stock change (already deducted in step 1) ✅             │
│   • CREATE InventoryMovement (MATERIAL_CONSUMPTION) - tracking   │
│     only, previousStock = newStock ✅                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. PRODUCTION COMPLETION                                         │
├─────────────────────────────────────────────────────────────────┤
│ Products:                                                        │
│   • UPDATE Product.currentStock (+qty) ✅ ADDED                 │
│   • UPDATE ProductionOrder (completedQuantity, completedAt) ✅   │
│   • ❌ NO transaction wrapper (data consistency risk)           │
│   • ❌ NO InventoryMovement created (incomplete audit)          │
│   • ❌ ProductVariant.currentStock NOT updated                   │
│                                                                  │
│ Materials:                                                       │
│   • No action taken (correct)                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4. DELIVERY / SHIPMENT TO CUSTOMER                               │
├─────────────────────────────────────────────────────────────────┤
│ Products:                                                        │
│   • CREATE DeliveryReceipt                                       │
│   • UPDATE DeliveryReceipt.deliveryStatus = 'DELIVERED'         │
│   • ❌ Product.currentStock NOT decremented (CRITICAL BUG!)     │
│   • ❌ NO InventoryMovement created                             │
│                                                                  │
│ Result: Products accumulate infinitely! 🔴                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Recommendations

### Immediate Priority (Fix Now)

1. **Add product stock deduction on delivery confirmation** 🔴
   - Implement in `confirmDelivery()` function
   - Use transaction to ensure atomicity
   - Create `PRODUCT_SHIPMENT` inventory movement
   - Handle both base products and variants

2. **Wrap production completion in transaction** 🟡
   - Ensures data consistency
   - Create `PRODUCTION_COMPLETE` inventory movement
   - Update variant stock if applicable

### High Priority (Next Sprint)

3. **Implement product reservation system**
   - Add `committedStock` field to Product/ProductVariant
   - Create `ProductReservation` table
   - Reserve products when customer order is placed
   - Release reservations on order cancellation

4. **Add product variant stock handling**
   - Update variant stock in production completion
   - Update variant stock in delivery
   - Create separate inventory movements for variant transactions

### Medium Priority (Future Enhancement)

5. **Add stock validation checks**
   - Prevent negative stock (add database constraint or pre-check)
   - Alert when stock goes below minimum level
   - Weekly stock reconciliation reports

6. **Enhance audit trail**
   - Every product/material stock change should have corresponding InventoryMovement
   - Add `productVariantId` field to InventoryMovement table
   - Add cost tracking to product movements (like materials have)

---

## Testing Checklist

Before deploying fixes, test these scenarios:

### Material Flow
- [ ] Create production order → Materials deducted from currentStock
- [ ] Consume materials → No additional deduction, reservation updated
- [ ] Cancel production order → Materials returned to currentStock
- [ ] Material return → Stock increases, inventory movement logged

### Product Flow
- [ ] Complete production → Product currentStock increases
- [ ] Complete production with variant → Variant currentStock increases
- [ ] Confirm delivery → Product currentStock decreases ⚠️ TO BE IMPLEMENTED
- [ ] Confirm delivery with variant → Variant currentStock decreases ⚠️ TO BE IMPLEMENTED
- [ ] Cancel delivery → Product stock returned (if implemented)

### Transaction Safety
- [ ] Production completion fails halfway → No partial stock update
- [ ] Delivery confirmation fails halfway → No partial stock update
- [ ] Concurrent deliveries don't cause negative stock

### Audit Trail
- [ ] Every stock change has corresponding InventoryMovement record
- [ ] InventoryMovement shows correct previousStock and newStock
- [ ] Can reconstruct stock history from InventoryMovement table

---

## Conclusion

The material side of the inventory management is **working correctly** with proper deduction on reservation, tracking during consumption, and comprehensive audit trails.

However, the product side has **critical gaps**:
1. Products are added to stock when production completes ✅
2. But products are **NEVER removed** from stock when delivered ❌
3. Missing transaction safety and audit trails for product movements

**This means product inventory will continuously grow and become completely inaccurate over time.**

The fixes are straightforward and follow the same patterns already implemented for materials. Priority should be given to implementing product stock deduction on delivery confirmation.
