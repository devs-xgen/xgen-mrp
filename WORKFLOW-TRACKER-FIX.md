# Workflow Pipeline Tracker - Work Center Fix

## Issue Identified

The Work Centers tab was showing **0 operations** and the pipeline was showing **-1 dropped** because the query was filtering operations by status `ACTIVE` or `IN_PROGRESS` only, excluding **COMPLETED** operations.

## Root Cause

In `src/lib/actions/dashboard.ts`, the `getWorkflowPipelineData()` function had two problematic queries:

### Problem 1: Work Center Distribution Query (Line 1537-1547)

```typescript
const productionOrdersInWorkCenters = await prisma.operation.groupBy({
  by: ["workCenterId"],
  _count: {
    productionOrderId: true,
  },
  where: {
    status: {
      in: ["ACTIVE", "IN_PROGRESS"], // ❌ EXCLUDED COMPLETED OPERATIONS
    },
  },
});
```

### Problem 2: Production Orders Count Query (Line 1592-1602)

```typescript
const productionOrdersInOperations = await prisma.operation.findMany({
  where: {
    status: {
      in: ["ACTIVE", "IN_PROGRESS"], // ❌ EXCLUDED COMPLETED OPERATIONS
    },
  },
  select: {
    productionOrderId: true,
  },
  distinct: ["productionOrderId"],
});
```

## Solution Applied

### Fix 1: Removed Status Filter from Work Center Query

```typescript
const productionOrdersInWorkCenters = await prisma.operation.groupBy({
  by: ["workCenterId"],
  _count: {
    productionOrderId: true,
  },
  // ✅ No status filter - includes ALL operations (ACTIVE, IN_PROGRESS, COMPLETED, etc.)
});
```

### Fix 2: Removed Status Filter from Production Orders Query

```typescript
const productionOrdersInOperations = await prisma.operation.findMany({
  select: {
    productionOrderId: true,
  },
  distinct: ["productionOrderId"],
  // ✅ No status filter - includes ALL production orders with operations
});
```

### Fix 3: Updated UI Labels for Clarity

Changed labels to be more accurate:

- **Before**: "in work centers"
- **After**: "with operations"

Changed pipeline stage label:

- **Before**: "In Work Centers"
- **After**: "With Operations"

## What This Fixes

### Before Fix

- ❌ Work Centers tab showed 0 operations
- ❌ Pipeline showed -1 dropped (negative dropoff)
- ❌ Only counted ACTIVE/IN_PROGRESS operations
- ❌ Completed work centers were invisible

### After Fix

- ✅ Work Centers tab shows ALL operations (including completed)
- ✅ Pipeline shows accurate progression
- ✅ Counts all operations regardless of status
- ✅ Completed work centers are now visible and counted

## Impact

Now the dashboard will correctly show:

1. **Work Centers Distribution** - All work centers that have operations (active, in progress, or completed)
2. **Pipeline Progression** - Accurate count of production orders with operations
3. **Work Center Activity** - Complete view of which work centers are being used
4. **Historical Data** - Completed operations are now included in analytics

## Example Scenario

**Your Case:**

- Created production order
- Added 2 work centers
- Both work centers completed
- Inspector completed
- Delivery completed

**Before Fix:**

- Work Centers tab: 0 operations shown ❌
- Pipeline: -1 dropped ❌

**After Fix:**

- Work Centers tab: 2 operations shown ✅
- Pipeline: Accurate progression ✅

## Files Modified

1. **src/lib/actions/dashboard.ts**

   - Removed status filter from work center operations query (line 1537-1544)
   - Removed status filter from production orders query (line 1590-1595)

2. **src/components/module/admin/dashboard/workflow-pipeline-tracker.tsx**
   - Updated label: "in work centers" → "with operations" (line 203)
   - Updated funnel stage: "In Work Centers" → "With Operations" (line 127)

## Testing Recommendation

1. Navigate to `/admin/dashboard`
2. Check the **Work Centers** tab - should now show your 2 completed work centers
3. Check the **Pipeline** tab - should show accurate progression without negative dropoffs
4. Verify the summary cards show correct counts

---

**Fix Applied**: December 8, 2025
**Status**: ✅ Complete
