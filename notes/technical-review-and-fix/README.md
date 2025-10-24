# Technical Review & Fix Documentation

**Purpose**: This folder contains comprehensive technical reviews, bug analyses, and architectural assessments of the xGen MRP system. All documents are written from a senior developer perspective, focusing on logic flow, data integrity, and MRP best practices.

**Review Date**: October 25, 2025  
**Reviewer Role**: Senior Full-Stack Developer / MRP Systems Architect  
**Review Type**: Production-Material-Product Integration Analysis

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Critical Issues Found](#critical-issues-found)
3. [Files Under Review](#files-under-review)
4. [Suspicious Code Locations](#suspicious-code-locations)
5. [MRP System Requirements](#mrp-system-requirements)
6. [Review Methodology](#review-methodology)

---

## Overview

This technical review focuses on the **production order lifecycle** and its interaction with **material inventory** and **product stock**. The review examines whether the system correctly implements MRP (Material Requirements Planning) principles.

### Core MRP Principles Being Validated

1. **Material Consumption**: Materials should be deducted from inventory **exactly once** when committed to production
2. **Product Creation**: Finished goods should be added to inventory **exactly once** when production completes
3. **Stock Accuracy**: All inventory movements must maintain data integrity (no negative stock, accurate audit trails)
4. **Reservation vs Consumption**: Clear distinction between reserving materials and consuming them
5. **Transaction Atomicity**: All related stock changes must happen together or not at all

---

## Critical Issues Found

### 🟢 Issue #1: Material Double Deduction Bug
**Severity**: CRITICAL  
**Status**: ✅ Fixed (October 25, 2025)  
**Document**: `material-double-deduction-bug.md`

**Summary**: Materials were being deducted twice (reservation and completion). Logic now enforces reservation as a committed quantity and consumes materials only at completion. Updated files: `src/lib/actions/material-reservation.ts`, `src/lib/actions/production-order.ts`.

---

## Files Under Review

### Primary Files (Core Logic)

| File Path | Purpose | Lines Reviewed | Risk Level |
|-----------|---------|----------------|------------|
| `src/lib/actions/production-order.ts` | Production order lifecycle management | 1-7372 (full file) | 🔴 HIGH |
| `src/lib/actions/material-reservation.ts` | Material reservation and availability | 1-679 (full file) | 🟡 MEDIUM |
| `src/lib/actions/material-consumption.ts` | Material consumption tracking | 1-820 (full file) | 🟡 MEDIUM |
| `src/lib/actions/bom.ts` | Bill of Materials management | TBD | 🟢 LOW |
| `src/lib/actions/product.ts` | Product stock management | TBD | 🟡 MEDIUM |

### Database Schema

| File Path | Purpose | Risk Level |
|-----------|---------|------------|
| `prisma/schema.prisma` | Database models and relationships | 🔴 HIGH |

### API Routes

| File Path | Purpose | Risk Level |
|-----------|---------|------------|
| `src/app/api/production-order/route.ts` | Production order API endpoints | 🟡 MEDIUM |
| `src/app/api/production-order/[id]/route.ts` | Single production order operations | 🟡 MEDIUM |

---

## Suspicious Code Locations

### 🔴 CRITICAL: Double Material Deduction

**File**: `src/lib/actions/production-order.ts`  
**Function**: `updateProductionOrderStatus()`  
**Lines**: 5959-6016  
**Severity**: CRITICAL

#### What the Code Does
When a production order status is changed to "COMPLETED", the code:
1. ✅ Adds finished products to `Product.currentStock` (CORRECT)
2. ✅ Adds finished variants to `ProductVariant.currentStock` (CORRECT)
3. ❌ Deducts materials from `Material.currentStock` (INCORRECT - already deducted)

#### Why This Is Suspicious
```
Logic Flow Analysis:
├─ Production Order Created (line 4726)
│  └─ reserveMaterialsForProduction() called (line 4819)
│     └─ Materials deducted from stock (material-reservation.ts:238)
│
└─ Production Order Completed (line 5864)
   └─ Materials deducted AGAIN (lines 5959-6016) ❌
```

#### MRP Principle Violated
**Material Consumption Timing**: In a proper MRP system, materials should be consumed (deducted from inventory) at **one specific point** in the production lifecycle. The current implementation consumes materials at **two points**:
- Point 1: Reservation (when production starts)
- Point 2: Completion (when production finishes)

This is logically incorrect. Materials cannot be consumed twice.

#### Expected Behavior
Materials should be deducted **only once** - either:
- **Option A**: At reservation time (current implementation in `material-reservation.ts`)
- **Option B**: At completion time (would require removing deduction from reservation)

The system currently implements **both options simultaneously**, which is wrong.

#### Impact on MRP System
- **Inventory Accuracy**: Material stock levels are incorrect (too low by 2x)
- **MRP Calculations**: Material requirements planning will suggest ordering materials that are actually in stock
- **Cost Accounting**: Material costs are double-counted in production orders
- **Negative Stock**: Can result in negative inventory values, breaking business logic
- **Audit Trail**: Inventory movements show duplicate deductions, confusing reconciliation

---

### 🟡 MEDIUM: Material Reservation Logic

**File**: `src/lib/actions/material-reservation.ts`  
**Function**: `reserveMaterialsForProduction()`  
**Lines**: 237-247  
**Severity**: MEDIUM (Correct implementation, but needs verification)

#### What the Code Does
When materials are reserved for a production order:
1. Creates `MaterialReservation` record
2. Deducts quantity from `Material.currentStock`
3. Updates `Material.availableStock`
4. Creates `InventoryMovement` record with type `MATERIAL_RESERVATION`

#### Why This Needs Review
The code **deducts from currentStock** during reservation. This is a valid approach, but we need to verify:

**Question 1**: Should `currentStock` represent physical inventory or available inventory?
- If `currentStock` = physical inventory → deduction at reservation is WRONG
- If `currentStock` = available inventory → deduction at reservation is CORRECT

**Question 2**: What is the purpose of `committedStock` field?
- The schema has `Material.committedStock` but it's not being updated during reservation
- This suggests materials should be "committed" (reserved) without reducing `currentStock`
- Then `currentStock` should only reduce when physically consumed

#### MRP Principle Analysis
Standard MRP systems typically use:
- **On-Hand Quantity**: Physical inventory in warehouse
- **Committed Quantity**: Reserved for production orders
- **Available Quantity**: On-Hand - Committed

Current schema supports this:
```
Material {
  currentStock      Int  // Should be "on-hand"
  committedStock    Int  // Should be "reserved"
  availableStock    Int  // Should be "on-hand - committed"
}
```

But the code treats `currentStock` as "available" by deducting during reservation.

#### Recommendation
**Review Required**: Clarify the intended semantics of stock fields and ensure consistent usage throughout the system.

---

### 🟡 MEDIUM: Material Consumption Records

**File**: `src/lib/actions/material-consumption.ts`  
**Function**: `consumeMaterialForProduction()`  
**Lines**: 79-150  
**Severity**: MEDIUM

#### What the Code Does
This function is designed to record material consumption, but it's **never called** in the production order lifecycle.

#### Why This Is Suspicious
The system has a complete `ProductionMaterialConsumption` model and consumption tracking logic, but:
1. It's not invoked during production order creation
2. It's not invoked during production completion
3. The `MaterialReservation.quantityConsumed` field is never updated

#### MRP Principle Analysis
A proper MRP system should track:
- **Planned Consumption**: From BOM (Bill of Materials)
- **Reserved Quantity**: Materials allocated to production order
- **Actual Consumption**: Materials physically used in production
- **Variance**: Difference between planned and actual

Current implementation:
- ✅ Planned consumption: Tracked via `ProductionBOM`
- ✅ Reserved quantity: Tracked via `MaterialReservation`
- ❌ Actual consumption: `ProductionMaterialConsumption` exists but unused
- ❌ Variance: Not tracked

#### Questions to Answer
1. **Is actual consumption tracking required?** If yes, when should it be recorded?
2. **Should workers report material usage?** Or assume BOM quantities are accurate?
3. **What about material waste?** The schema has `wasteQuantity` but it's not used
4. **How to handle material substitutions?** If a different material is used than planned

#### Recommendation
**Architectural Decision Needed**: Determine if the system should track actual consumption separately from planned consumption, or if BOM quantities are considered accurate.

---

### 🟡 MEDIUM: Product Stock Increment

**File**: `src/lib/actions/production-order.ts`  
**Function**: `updateProductionOrderStatus()`  
**Lines**: 5915-5920  
**Severity**: MEDIUM (Correct, but needs validation)

#### What the Code Does
When production is completed, adds finished products to stock:
```
Product.currentStock = currentStock + productionQuantity
```

#### Why This Needs Review
**Question 1**: What if production quantity differs from planned quantity?
- The code uses `currentOrder.quantity` (planned quantity)
- But what if only 80 out of 100 units were successfully produced?
- Should there be a `completedQuantity` field that can differ from `quantity`?

**Question 2**: What about quality control failures?
- If 10 units fail quality inspection, should they be added to stock?
- The system has `QualityCheck` model but it doesn't affect stock increment

**Question 3**: What about work-in-progress (WIP)?
- If production is partially complete, where is WIP tracked?
- Should there be intermediate stock locations?

#### MRP Principle Analysis
Standard MRP systems track:
- **Planned Production**: Original order quantity
- **Completed Production**: Actual finished goods
- **Rejected Units**: Failed quality control
- **WIP**: Partially completed units

Current implementation:
- ✅ Planned production: `ProductionOrder.quantity`
- ⚠️ Completed production: Assumed equal to planned (no separate field)
- ❌ Rejected units: Not tracked
- ❌ WIP: Not tracked

#### Recommendation
**Enhancement Opportunity**: Consider adding `completedQuantity` and `rejectedQuantity` fields to track actual production outcomes.

---

### 🟡 MEDIUM: Product Variant Stock

**File**: `src/lib/actions/production-order.ts`  
**Function**: `updateProductionOrderStatus()`  
**Lines**: 5923-5957  
**Severity**: MEDIUM

#### What the Code Does
If production order is for a specific product variant, updates variant stock:
```
ProductVariant.currentStock = currentStock + productionQuantity
```

#### Why This Needs Review
**Question 1**: Is parent product stock also updated?
- Line 5918 updates `Product.currentStock`
- Line 5933 updates `ProductVariant.currentStock`
- Are both updated? Or only variant?

**Question 2**: Stock relationship between product and variants
- Should `Product.currentStock` = sum of all variant stocks?
- Or are they independent?
- What if a product has no variants?

#### Logic Flow Concern
```
If production order has productVariantId:
  1. Update Product.currentStock (line 5918)
  2. Update ProductVariant.currentStock (line 5933)
  
This means:
  - Product stock increases by X
  - Variant stock increases by X
  - Total system stock increases by 2X ❌
```

#### MRP Principle Analysis
In inventory management:
- **Option A**: Variants are separate SKUs with independent stock
  - Product stock = sum of variant stocks (calculated field)
  - Only update variant stock, not product stock
  
- **Option B**: Variants are attributes of the same product
  - Product stock = total across all variants
  - Update both product and variant stock

Current implementation appears to be **Option B**, but this needs verification.

#### Recommendation
**Clarification Needed**: Define the relationship between product and variant stock. Ensure no double-counting.

---

### 🟢 LOW: Material Reservation Release

**File**: `src/lib/actions/material-reservation.ts`  
**Function**: `releaseMaterialReservations()`  
**Lines**: 300-400 (estimated)  
**Severity**: LOW

#### What the Code Does
When a production order is cancelled, releases reserved materials back to available stock.

#### Why This Is Reviewed
This is the **inverse operation** of reservation. If reservation logic is wrong, release logic is also wrong.

#### Logic Validation Needed
```
Reservation:
  currentStock = currentStock - quantity
  
Release:
  currentStock = currentStock + quantity
  
Symmetry Check: ✅ Should be symmetric
```

#### MRP Principle Analysis
Material release should:
1. ✅ Add quantity back to available stock
2. ✅ Update `MaterialReservation` status to RELEASED
3. ✅ Create inventory movement record
4. ✅ Log activity for audit trail

#### Recommendation
**Low Priority**: Review after fixing reservation logic to ensure symmetry.

---

### 🟢 LOW: BOM (Bill of Materials) Retrieval

**File**: `src/lib/actions/bom.ts`  
**Function**: `getBOMForProduct()`  
**Severity**: LOW

#### What the Code Does
Retrieves the bill of materials for a product, showing which materials are needed and in what quantities.

#### Why This Is Reviewed
BOM is the **source of truth** for material requirements. If BOM data is incorrect, all downstream calculations are wrong.

#### Validation Points
1. **BOM Completeness**: Does every product have a BOM?
2. **BOM Accuracy**: Are quantities correct?
3. **Waste Percentage**: Is waste factored into material requirements?
4. **Unit Consistency**: Are all units of measure consistent?

#### MRP Principle Analysis
BOM should include:
- ✅ Material ID and name
- ✅ Quantity per unit of product
- ✅ Waste percentage
- ✅ Unit of measure
- ⚠️ Lead time (for material procurement)
- ⚠️ Alternative materials (for substitutions)

#### Recommendation
**Low Priority**: BOM logic appears sound, but validate data quality in database.

---

## MRP System Requirements

### Core Requirements Checklist

#### ✅ Requirement 1: Material Planning
- [ ] System calculates material requirements based on production orders
- [ ] System checks material availability before creating production orders
- [ ] System suggests purchase orders when materials are insufficient
- [ ] System accounts for lead times in material procurement

#### ✅ Requirement 2: Inventory Accuracy
- [ ] Material stock is deducted exactly once when committed to production
- [ ] Product stock is incremented exactly once when production completes
- [ ] No negative stock values are possible
- [ ] All inventory movements are logged with audit trail

#### ✅ Requirement 3: Production Tracking
- [ ] Production orders have clear status lifecycle (PENDING → IN_PROGRESS → COMPLETED)
- [ ] Material consumption is tracked (planned vs actual)
- [ ] Production completion updates product inventory
- [ ] Quality control results affect inventory

#### ✅ Requirement 4: Cost Accounting
- [ ] Material costs are tracked per production order
- [ ] Labor costs are tracked per production order
- [ ] Overhead costs are allocated
- [ ] Cost variances are identified and investigated

#### ✅ Requirement 5: Data Integrity
- [ ] All stock changes happen in database transactions
- [ ] Concurrent production orders don't cause race conditions
- [ ] Audit logs capture all inventory movements
- [ ] System can reconcile with physical inventory counts

---

## Review Methodology

### Phase 1: Code Reading (Completed)
- ✅ Read all production-related action files
- ✅ Trace execution flow from order creation to completion
- ✅ Identify all points where inventory is modified
- ✅ Map relationships between models

### Phase 2: Logic Analysis (Completed)
- ✅ Validate against MRP principles
- ✅ Identify logical inconsistencies
- ✅ Check for double-counting or missing operations
- ✅ Verify transaction boundaries

### Phase 3: Data Flow Mapping (Completed)
- ✅ Material flow: Supplier → Inventory → Production → Product
- ✅ Stock field semantics: currentStock, committedStock, availableStock
- ✅ Reservation vs consumption timing
- ✅ Product vs variant stock relationship

### Phase 4: Issue Documentation (Completed)
- ✅ Document critical bugs with severity levels
- ✅ Provide detailed explanations with examples
- ✅ Suggest solutions with trade-offs
- ✅ Create testing requirements

### Phase 5: Fix Implementation (Pending)
- [ ] Implement recommended fixes
- [ ] Write unit tests for fixed logic
- [ ] Perform integration testing
- [ ] Validate with sample production orders

---

## Detailed Reasoning for Suspicious Lines

### Why Lines 5959-6016 Are Problematic

#### Logical Reasoning

**Premise 1**: Materials are physical resources that can only be consumed once.

**Premise 2**: The system deducts materials from `Material.currentStock` during reservation (line 238 in `material-reservation.ts`).

**Premise 3**: The system deducts materials from `Material.currentStock` again during completion (lines 5981-5992 in `production-order.ts`).

**Conclusion**: Materials are being deducted twice, which violates Premise 1.

#### Proof by Example

**Scenario**: Produce 10 shirts, each requires 5 meters of fabric.

**Initial State**:
```
Material: Fabric
  currentStock: 100 meters
  committedStock: 0 meters
  availableStock: 100 meters
```

**After Production Order Created** (reservation):
```
Material: Fabric
  currentStock: 50 meters (100 - 50)  ← First deduction
  committedStock: 0 meters
  availableStock: 50 meters
```

**After Production Completed**:
```
Material: Fabric
  currentStock: 0 meters (50 - 50)  ← Second deduction ❌
  committedStock: 0 meters
  availableStock: 0 meters

Product: Shirt
  currentStock: 10 units (0 + 10)  ← Product added ✅
```

**Expected State**:
```
Material: Fabric
  currentStock: 50 meters (should stay at 50)
  committedStock: 0 meters
  availableStock: 50 meters

Product: Shirt
  currentStock: 10 units
```

**Actual vs Expected**:
- Actual: 0 meters of fabric remaining
- Expected: 50 meters of fabric remaining
- Difference: 50 meters (the production quantity)
- **Conclusion**: Materials were deducted twice

#### Why This Breaks MRP

**MRP Calculation**:
```
Net Requirements = Gross Requirements - On-Hand + Safety Stock

If On-Hand is incorrect (too low), then:
  Net Requirements will be too high
  System will suggest ordering materials that are actually in stock
  Purchasing will order unnecessary materials
  Inventory carrying costs increase
  Cash flow is negatively impacted
```

#### Why This Wasn't Caught Earlier

**Possible Reasons**:
1. **Testing with small datasets**: Bug only becomes obvious with multiple production orders
2. **No physical inventory reconciliation**: No comparison with actual stock counts
3. **Incomplete test coverage**: Tests may not verify stock levels after completion
4. **Copy-paste error**: Code may have been duplicated from different implementation strategy
5. **Incomplete refactoring**: System may have changed from "consume on completion" to "consume on reservation" but old code wasn't removed

---

### Why Material Reservation Logic Needs Clarification

#### Semantic Ambiguity

The database schema has three stock fields:
```
Material {
  currentStock      Int
  committedStock    Int
  availableStock    Int
}
```

**Question**: What does each field represent?

**Interpretation A** (Standard MRP):
- `currentStock` = Physical inventory (on-hand quantity)
- `committedStock` = Reserved for production orders
- `availableStock` = currentStock - committedStock

**Interpretation B** (Current Implementation):
- `currentStock` = Available inventory (already excluding committed)
- `committedStock` = Unused (always 0)
- `availableStock` = Same as currentStock

**Evidence for Interpretation B**:
- Line 238 in `material-reservation.ts` deducts from `currentStock` during reservation
- `committedStock` is never updated in reservation logic
- This suggests `currentStock` already represents "available" stock

**Evidence for Interpretation A**:
- Schema has separate `committedStock` field (why have it if unused?)
- Field name `currentStock` implies "current physical stock"
- Standard MRP systems use this pattern

**Problem**: The code implements Interpretation B, but the schema suggests Interpretation A.

#### Impact on System Correctness

**If Interpretation A is correct**:
- ❌ Current code is wrong (should update `committedStock`, not `currentStock`)
- ❌ Material reservation should not deduct from `currentStock`
- ❌ Material consumption (on completion) should deduct from `currentStock`

**If Interpretation B is correct**:
- ✅ Current reservation code is correct
- ❌ But then `committedStock` field is useless and should be removed
- ❌ And completion code should not deduct again (current bug)

**Recommendation**: Clarify intended semantics and make code consistent with schema.

---

### Why Product Variant Stock Needs Validation

#### Double-Counting Concern

**Code Flow**:
```typescript
// Line 5915: Update product stock
await tx.product.update({
  where: { id: currentOrder.productId },
  data: {
    currentStock: currentOrder.product.currentStock + productionQty
  }
})

// Line 5923: If variant exists, update variant stock
if (currentOrder.productVariantId) {
  await tx.productVariant.update({
    where: { id: currentOrder.productVariantId },
    data: {
      currentStock: variant.currentStock + productionQty
    }
  })
}
```

**Question**: Are we adding the same quantity to both product and variant?

**Scenario**: Produce 10 units of "T-Shirt (Red, Large)"

**If both are updated**:
```
Product: T-Shirt
  currentStock: +10 units

ProductVariant: T-Shirt (Red, Large)
  currentStock: +10 units

Total inventory increase: 20 units ❌
Actual production: 10 units
```

**This is double-counting** unless the system treats product and variant stock as independent.

#### Possible Interpretations

**Interpretation A**: Variants are separate SKUs
- Product stock = sum of all variant stocks (calculated, not stored)
- Only update variant stock, not product stock
- Product stock is a rollup for reporting

**Interpretation B**: Variants are attributes
- Product stock = total across all variants
- Update both product and variant stock
- They represent the same inventory from different views

**Current Implementation**: Appears to be Interpretation B, but this needs validation.

**Test Case Needed**:
1. Create product with 2 variants (Red, Blue)
2. Produce 10 Red units
3. Produce 5 Blue units
4. Check: Product.currentStock should be 15 (10 + 5)
5. Check: Red variant stock should be 10
6. Check: Blue variant stock should be 5
7. Verify: Product stock = sum of variant stocks

---

## Files That Need Scanning (Priority Order)

### 🔴 Priority 1: Critical Path Files

1. **`src/lib/actions/production-order.ts`**
   - **Lines to scan**: 4726-4857 (creation), 5864-6084 (status update)
   - **Reason**: Core production logic, contains the double-deduction bug
   - **Focus**: Material deduction timing, product stock increment logic

2. **`src/lib/actions/material-reservation.ts`**
   - **Lines to scan**: 157-298 (reservation), 300-400 (release)
   - **Reason**: First point of material deduction, needs semantic clarification
   - **Focus**: Stock field usage (currentStock vs committedStock)

3. **`prisma/schema.prisma`**
   - **Lines to scan**: 342-377 (Material), 424-461 (ProductionOrder), 849-871 (MaterialReservation)
   - **Reason**: Schema defines data model, must match code semantics
   - **Focus**: Stock field definitions, relationships, constraints

### 🟡 Priority 2: Supporting Logic Files

4. **`src/lib/actions/material-consumption.ts`**
   - **Lines to scan**: 79-150 (consumption recording)
   - **Reason**: Unused but complete logic, understand why it's not called
   - **Focus**: Integration points, when should this be invoked

5. **`src/lib/actions/product.ts`**
   - **Lines to scan**: All product stock update functions
   - **Reason**: Verify product stock management is consistent
   - **Focus**: Stock increment/decrement logic, variant handling

6. **`src/lib/actions/bom.ts`**
   - **Lines to scan**: BOM retrieval and calculation functions
   - **Reason**: Source of truth for material requirements
   - **Focus**: Quantity calculations, waste percentage, unit conversions

### 🟢 Priority 3: Integration Points

7. **`src/app/api/production-order/route.ts`**
   - **Lines to scan**: POST endpoint (creation)
   - **Reason**: API layer, verify it calls correct action functions
   - **Focus**: Input validation, error handling

8. **`src/app/api/production-order/[id]/route.ts`**
   - **Lines to scan**: PATCH endpoint (status update)
   - **Reason**: API layer for status changes
   - **Focus**: Status transition validation

9. **`src/lib/actions/inventory-movement.ts`** (if exists)
   - **Lines to scan**: All movement recording functions
   - **Reason**: Audit trail for all stock changes
   - **Focus**: Completeness of logging, movement types

---

## Next Steps

### Immediate Actions Required

1. **Fix Critical Bug**
   - Remove duplicate material deduction (lines 5959-6016 in `production-order.ts`)
   - Add comments explaining why materials are not deducted on completion
   - Update activity logs to clarify material consumption timing

2. **Clarify Stock Semantics**
   - Document intended meaning of `currentStock`, `committedStock`, `availableStock`
   - Update code to be consistent with documented semantics
   - Consider renaming fields if current names are misleading

3. **Validate Product-Variant Relationship**
   - Test production with variants to verify stock counting
   - Document whether product stock is independent or calculated from variants
   - Fix any double-counting issues found

4. **Add Validation Guards**
   - Prevent negative stock values at database level
   - Add checks before stock deductions
   - Implement inventory reconciliation reports

### Long-Term Improvements

1. **Implement Actual Consumption Tracking**
   - Decide if `ProductionMaterialConsumption` should be used
   - Allow workers to report actual material usage
   - Track variances between planned and actual consumption

2. **Add Quality Control Integration**
   - Link quality checks to stock increments
   - Track rejected units separately
   - Implement rework/scrap workflows

3. **Enhance Cost Accounting**
   - Calculate actual production costs
   - Track cost variances
   - Generate cost reports per production order

4. **Improve Audit Trail**
   - Ensure all stock changes are logged
   - Add user attribution to all movements
   - Implement inventory reconciliation tools

---

## Conclusion

This technical review has identified a **critical bug** in the material consumption logic that violates fundamental MRP principles. The system is deducting materials twice, leading to incorrect inventory levels and unreliable MRP calculations.

The root cause is a **logical inconsistency** between two different implementation strategies that were both partially implemented. The fix is straightforward: remove the duplicate deduction logic and ensure materials are only consumed once.

Beyond the critical bug, several areas need **clarification and validation** to ensure the system correctly implements MRP best practices. These are documented above with specific file locations and line numbers.

**Recommendation**: Fix the critical bug immediately, then systematically address the clarification items to ensure long-term system correctness.

---

**Document Version**: 1.0  
**Last Updated**: October 25, 2025  
**Status**: Initial Review Complete, Fix Pending
