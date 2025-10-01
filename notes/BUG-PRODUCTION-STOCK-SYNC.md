# Bug Report: Production Order Stock Syncing Issue

**Date:** 2025-10-01  
**Status:** 🔴 CRITICAL BUG IDENTIFIED  
**Reporter:** System Analysis  
**File:** `src/lib/actions/production-order.ts`

---

## 🐛 Bug Description

When a production order is marked as **COMPLETED**, the system **ONLY** updates the stock quantity of the **parent Product** but **DOES NOT** update the stock of:
1. **Product Variants** (ProductVariant.currentStock)
2. **Materials** used in production (Material.currentStock)

This causes a critical data inconsistency where:
- The main product shows increased stock
- But the specific variant that was actually produced shows no change
- Material inventory is not correctly decremented
- Reporting and inventory tracking become inaccurate

---

## 📍 Root Cause Analysis

### Location
**File:** `src/lib/actions/production-order.ts`  
**Function:** `updateProductionOrderStatus` (lines 5864-5982)  
**Specific Code:** Lines 5910-5943

### Current Problematic Code

```typescript
// If completing production, increase product stock and update completion fields
if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
  await prisma.product.update({
    where: { id: currentOrder.productId },
    data: {
      currentStock: currentOrder.product.currentStock + productionQty,  // ✅ Product updated
    },
  })
  // ... logging ...
}
```

### What's Missing

1. **No ProductVariant Stock Update**: Production orders can have a `productVariantId`, but the variant's `currentStock` is never updated
2. **No Material Consumption Tracking**: Materials from the BOM should be decremented from inventory
3. **No Transaction Safety**: Multiple updates should be wrapped in a Prisma transaction

---

## 🔍 System Context

### Database Schema (Prisma)

**Product Model:**
- `currentStock: Int` - ✅ Currently being updated

**ProductVariant Model:**
- `productVariantId?: String` in ProductionOrder
- `currentStock: Int` - ❌ NOT being updated
- `expectedStock: Int` - ❌ NOT being updated
- `committedStock: Int` - Should be decremented after completion

**Material Model:**
- `currentStock: Int` - ❌ NOT being decremented after production
- `committedStock: Int` - Reserved during production order creation
- `availableStock: Int` - Calculated field

### Production Order Flow

```
1. CREATE Production Order
   ├─> Reserve materials (committedStock += needed)
   ├─> Create ProductionBOM entries
   └─> Status: PENDING

2. START Production
   └─> Status: IN_PROGRESS

3. COMPLETE Production ⚠️ BUG HERE
   ├─> Product.currentStock += quantity ✅
   ├─> ProductVariant.currentStock += quantity ❌ MISSING
   ├─> Material.currentStock -= consumed ❌ MISSING
   ├─> Material.committedStock -= consumed ❌ MISSING
   └─> Status: COMPLETED
```

---

## 💥 Impact

### Data Integrity Issues
- **Inventory Mismatch**: Parent product stock doesn't match sum of variant stocks
- **Material Phantom Stock**: Materials appear available but were actually consumed
- **Order Fulfillment Errors**: Cannot properly track what variants are actually in stock

### Business Process Issues
- **Inaccurate MRP Calculations**: Material requirements planning relies on accurate stock
- **Production Planning Errors**: System may allow production when materials aren't actually available
- **Financial Reporting**: Cost tracking and inventory valuation will be incorrect

---

## ✅ Proposed Solution

### 1. Update ProductVariant Stock

```typescript
// If production order has a variant, update the variant stock
if (currentOrder.productVariantId) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: currentOrder.productVariantId },
    select: { currentStock: true }
  });
  
  if (variant) {
    await prisma.productVariant.update({
      where: { id: currentOrder.productVariantId },
      data: {
        currentStock: variant.currentStock + productionQty,
      },
    });
  }
}
```

### 2. Consume Materials from Stock

```typescript
// Get BOM materials and reduce their stock
const bomEntries = await prisma.productionBOM.findMany({
  where: { productionOrderId },
  include: { material: true }
});

for (const bomEntry of bomEntries) {
  await prisma.material.update({
    where: { id: bomEntry.materialId },
    data: {
      currentStock: {
        decrement: Math.ceil(Number(bomEntry.quantityNeeded))
      },
      committedStock: {
        decrement: Math.ceil(Number(bomEntry.quantityNeeded))
      }
    }
  });
}
```

### 3. Wrap in Transaction

```typescript
await prisma.$transaction(async (tx) => {
  // Update product stock
  // Update variant stock (if applicable)
  // Consume materials
  // Update production order
  // Create activity logs
});
```

---

## 🔧 Implementation Checklist

- [ ] Create backup/migration plan
- [ ] Implement transactional stock updates
- [ ] Update ProductVariant stock on completion
- [ ] Consume Material stock on completion
- [ ] Add proper error handling
- [ ] Add activity logging for all stock changes
- [ ] Create unit tests for stock syncing
- [ ] Test with various scenarios:
  - [ ] Product without variants
  - [ ] Product with variants
  - [ ] Multiple materials in BOM
  - [ ] Partial production completion
  - [ ] Cancelled production orders
- [ ] Update documentation
- [ ] Deploy fix to production

---

## 📊 Test Scenarios

### Scenario 1: Product with Variant
```
GIVEN: Product "Shirt" with variant "Shirt-Red-L"
AND: Production Order for 10 units of "Shirt-Red-L"
AND: BOM requires 20 yards of Fabric material
WHEN: Production order status changed to COMPLETED
THEN:
  - Product "Shirt" currentStock += 10 ✅
  - ProductVariant "Shirt-Red-L" currentStock += 10 ❌ BUG
  - Material "Fabric" currentStock -= 20 ❌ BUG
  - Material "Fabric" committedStock -= 20 ❌ BUG
```

### Scenario 2: Product without Variant
```
GIVEN: Product "Box" (no variants)
AND: Production Order for 50 units
WHEN: Status changed to COMPLETED
THEN:
  - Product "Box" currentStock += 50 ✅
  - Materials consumed from BOM ❌ BUG
```

---

## 🚨 Recommended Priority

**CRITICAL** - Fix immediately before next release

### Reasons:
1. Data integrity violation
2. Affects core business operations (inventory, production, fulfillment)
3. Silent failure (no errors thrown, just wrong data)
4. Compounds over time (each completed order worsens the discrepancy)

---

## 📝 Related Files

- `src/lib/actions/production-order.ts` - Main bug location
- `src/lib/actions/material-reservation.ts` - Material commitment logic
- `src/lib/actions/production-bom.ts` - BOM management
- `prisma/schema.prisma` - Database schema
- `src/app/admin/(protected)/production/page.tsx` - Production orders UI

---

## 🔗 Related Issues

- Material reservation system (works correctly on order creation)
- Inventory movement tracking
- Cost variance calculations
- Production reporting

---

**END OF BUG REPORT**
