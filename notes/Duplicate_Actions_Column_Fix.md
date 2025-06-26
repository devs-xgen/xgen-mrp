# Duplicate Actions Column Fix

## Issue Summary
Several DataTable components in the XGen MRP application had **duplicate actions columns** appearing in their tables. This was caused by:

1. **Actions column defined in `columns.tsx`** - The base column definition already included an actions column
2. **Additional actions column added in `data-table.tsx`** - The DataTable component was programmatically adding another actions column

This resulted in tables showing two identical "Actions" columns with the same dropdown menus.

## Root Cause Analysis

### Example: Products Table
- **File 1**: `src/components/module/admin/products/columns.tsx` - Line 194: `id: "actions"`
- **File 2**: `src/components/module/admin/products/data-table.tsx` - Lines 59-71: Adding another actions column

### Pattern Found
```typescript
// In columns.tsx - ALREADY DEFINED
{
  id: "actions",
  cell: ({ row }) => <DataTableRowActions row={row} />,
}

// In data-table.tsx - DUPLICATE ADDITION
const columnsWithActions = [
  ...columns,
  {
    id: "actions", // DUPLICATE!
    header: "Actions",
    cell: ({ row }) => <DataTableRowActions ... />
  }
];
```

## Pages Affected
- ✅ **Products** - Fixed
- ✅ **Materials** - Fixed
- 🔍 **Potentially Others** - Need investigation

## Solution Implemented

### 1. Convert Static Columns to Function-Based

**Before:**
```typescript
export const columns: ColumnDef<Product>[] = [
  // ... other columns
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
```

**After:**
```typescript
export const createColumns = (
  categories: ProductCategory[],
  onSuccess?: () => Promise<void>
): ColumnDef<Product>[] => [
  // ... other columns
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions 
      row={row} 
      categories={categories} 
      onSuccess={onSuccess} 
    />,
  },
];
```

### 2. Remove Duplicate Actions from DataTable

**Before:**
```typescript
// Add actions column to the provided columns
const columnsWithActions: ColumnDef<Product, any>[] = [
  ...columns,
  {
    id: "actions", // DUPLICATE!
    header: "Actions",
    cell: ({ row }) => <DataTableRowActions ... />
  },
];

const table = useReactTable({
  data,
  columns: columnsWithActions, // Using duplicate columns
  // ...
});
```

**After:**
```typescript
// Create columns with required props
const columns = createColumns(categories, onSuccess);

const table = useReactTable({
  data,
  columns, // Single source of truth
  // ...
});
```

### 3. Update DataTable Interface

**Before:**
```typescript
interface DataTableProps {
  data: Product[];
  columns: ColumnDef<Product, any>[]; // Externally provided
  categories: ProductCategory[];
  onSuccess?: () => Promise<void>;
}
```

**After:**
```typescript
interface DataTableProps {
  data: Product[];
  // columns removed - created internally
  categories: ProductCategory[];
  onSuccess?: () => Promise<void>;
}
```

### 4. Update Page Usage

**Before:**
```typescript
import { columns } from "./columns";

<DataTable
  columns={columns} // No longer needed
  data={products}
  categories={categories}
  onSuccess={refreshData}
/>
```

**After:**
```typescript
// No columns import needed

<DataTable
  data={products}
  categories={categories}
  onSuccess={refreshData}
/>
```

## Files Modified

### Products Table
1. `src/components/module/admin/products/columns.tsx`
   - Converted `columns` to `createColumns` function
   - Fixed checkbox type issues
   - Added proper TypeScript types

2. `src/components/module/admin/products/data-table.tsx`
   - Removed duplicate actions column creation
   - Updated to use `createColumns` function
   - Simplified interface

3. `src/app/admin/(protected)/products/page.tsx`
   - Removed `columns` import
   - Removed `columns` prop from DataTable

### Materials Table
1. `src/components/module/admin/materials/columns.tsx`
   - Converted `columns` to `createColumns` function
   - Added actions column with proper props
   - Added DataTableRowActions import

2. `src/components/module/admin/materials/data-table.tsx`
   - Removed duplicate actions column creation
   - Updated to use `createColumns` function
   - Simplified interface

3. `src/app/admin/(protected)/materials/page.tsx`
   - Removed `columns` import
   - Removed `columns` prop from DataTable

## Benefits of the Fix

1. **Eliminates Duplication**: No more double actions columns
2. **Better Props Flow**: Required props (categories, onSuccess) properly passed to row actions
3. **Cleaner Code**: Single source of truth for column definitions
4. **Type Safety**: Improved TypeScript support
5. **Maintainability**: Easier to modify actions behavior

## Testing Checklist

- [ ] Products table shows single actions column
- [ ] Products actions (Edit, Delete, View) work correctly
- [ ] Materials table shows single actions column  
- [ ] Materials actions work correctly
- [ ] No console errors in browser
- [ ] Table sorting and filtering still work
- [ ] Mobile responsive behavior maintained

## Next Steps

1. **Audit Other Tables**: Check if customer-orders, production, purchase-orders, etc. have similar issues
2. **Standardize Pattern**: Apply this pattern to all table components
3. **Update Documentation**: Document the correct pattern for future table implementations

## Pattern for Future Tables

When creating new DataTable components:

1. **Always define actions in `columns.tsx`** using a function:
   ```typescript
   export const createColumns = (requiredProps) => [
     // ... other columns
     {
       id: "actions",
       cell: ({ row }) => <DataTableRowActions row={row} {...requiredProps} />
     }
   ];
   ```

2. **Never add actions in `data-table.tsx`**

3. **Use function-based columns** when row actions need external props

4. **Keep DataTable interface clean** - only pass data and required props

This pattern ensures consistency and prevents duplicate actions columns across all tables in the application. 