# Currency Format Update Summary - Philippine Peso (PHP)

## Overview
This document lists all SuperAdmin files that have been updated or need to be updated to use the Philippine Peso (₱) currency format via the `formatCurrencyPHP` function from `@/lib/constant.ts`.

## ✅ Completed Updates

### 1. Products Module
- **File**: `src/components/module/superadmin/products/ProductsTable.tsx`
- **Changes**:
  - Added import: `import { formatCurrencyPHP } from "@/lib/constant";`
  - Updated selling price column: Changed from `$${row.original.sellingPrice.toFixed(2)}` to `{formatCurrencyPHP(row.original.sellingPrice)}`
  - Updated variant price in expanded view: Changed from `${variant.sellingPrice.toFixed(2)}` to `{formatCurrencyPHP(variant.sellingPrice)}`

### 2. Production Module
- **File**: `src/components/module/superadmin/production/SuperadminProductionOrderDetail.tsx`
- **Changes**:
  - Added import: `import { formatCurrencyPHP } from "@/lib/constant";`
  - Updated Planned Cost: Changed from `₱{order.plannedMaterialCost.toLocaleString()}` to `{formatCurrencyPHP(order.plannedMaterialCost)}`
  - Updated Actual Cost: Changed from `₱{order.actualMaterialCost.toLocaleString()}` to `{formatCurrencyPHP(order.actualMaterialCost)}`
  - Updated Operation Cost: Changed from `₱{operation.cost.toLocaleString()}` to `{formatCurrencyPHP(operation.cost)}`
  - Updated BOM Cost: Changed from `₱{bom.totalCost.toLocaleString()}` to `{formatCurrencyPHP(bom.totalCost)}`

### 3. Customer Orders Module
- **File**: `src/components/module/superadmin/customer-orders/CustomerOrdersTable.tsx`
- **Changes**:
  - Added import: `import { formatCurrencyPHP } from "@/lib/constant";`
  - Updated Total Amount column: Changed from `${Number(row.original.totalAmount).toLocaleString(...)}` to `{formatCurrencyPHP(row.original.totalAmount)}`

## 📋 Files Requiring Updates

### Customer Orders Module (Remaining)
1. **`customer-orders/CustomerOrdersClient.tsx`**
   - Search for: `toFixed`, `toLocaleString` with currency
   - Update: All price/amount displays to use `formatCurrencyPHP`

2. **`customer-orders/CustomerOrderDetailClient.tsx`**
   - Search for: Currency symbols, `toFixed`, `toLocaleString`
   - Update: Order totals, line item prices, subtotals

3. **`customer-orders/create/steps/StepReview.tsx`**
   - Search for: Price displays in order review
   - Update: All currency displays

4. **`customer-orders/create/steps/StepOrderLines.tsx`**
   - Search for: Unit price, line totals
   - Update: All currency displays

### Production Module (Remaining)
5. **`production/create/steps/ReviewStep.tsx`**
   - Search for: Cost estimates, material costs
   - Update: All currency displays

### Suppliers Module
6. **`suppliers/PurchaseOrdersTable.tsx`**
   - Search for: PO amounts, unit costs
   - Update: All currency displays

### Materials Module
7. **`materials/reservations/MaterialReservationsTable.tsx`**
   - Search for: Material costs, reservation values
   - Update: All currency displays

### Analytics Module
8. **`analytics/financial/FinancialKPICards.tsx`**
   - Search for: Revenue, costs, profits
   - Update: All KPI values with currency

9. **`analytics/financial/BillingAnalytics.tsx`**
   - Search for: Billing amounts, totals
   - Update: All currency displays

10. **`analytics/financial/CashFlowForecast.tsx`**
    - Search for: Cash flow amounts
    - Update: All currency displays

11. **`analytics/financial/RevenueAnalytics.tsx`**
    - Search for: Revenue figures
    - Update: All currency displays

12. **`analytics/production/KPICards.tsx`**
    - Search for: Cost-related KPIs
    - Update: All currency displays

13. **`analytics/production/CostAnalyticsChart.tsx`**
    - Search for: Cost data points
    - Update: Chart tooltips and labels

## 🔧 Standard Update Pattern

For each file, follow this pattern:

### 1. Add Import
```typescript
import { formatCurrencyPHP } from "@/lib/constant";
```

### 2. Replace Currency Formatting

**From:**
```typescript
${value.toFixed(2)}
// or
${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
// or
₱{value.toLocaleString()}
```

**To:**
```typescript
{formatCurrencyPHP(value)}
```

## 📌 Notes

- The `formatCurrencyPHP` function handles:
  - Null/undefined values (returns ₱0.00)
  - NaN values (returns ₱0.00)
  - Proper PHP locale formatting ('en-PH')
  - Consistent 2 decimal places
  - Philippine Peso symbol (₱)

- The function is defined in: `src/lib/constant.ts`
  ```typescript
  export function formatCurrencyPHP(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '₱0.00';
    }
    return value.toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  ```

## ✅ Testing Checklist

After updating each file:
- [ ] Import statement added correctly
- [ ] All currency displays use `formatCurrencyPHP`
- [ ] No TypeScript errors
- [ ] Page renders correctly
- [ ] Currency displays show ₱ symbol
- [ ] Amounts formatted with 2 decimal places
- [ ] Null/undefined values display as ₱0.00

## 🚀 Next Steps

1. Update remaining Customer Orders files (4 files)
2. Update Production create step (1 file)
3. Update Suppliers module (1 file)
4. Update Materials module (1 file)
5. Update Analytics module (6 files)
6. Test all pages thoroughly
7. Verify consistent currency display across all SuperAdmin pages
