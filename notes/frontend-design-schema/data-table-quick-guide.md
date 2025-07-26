# Data Table Implementation Quick Guide

**Based on:** Sales Invoices Enhanced Pattern (v2.1)  
**Previous:** Delivery Receipts Legacy Pattern (v1.0)  
**Purpose:** Step-by-step guide for implementing data tables with client-side filtering

## Pattern Selection

### Enhanced Pattern (v2.1) - **RECOMMENDED**
- ✅ Client-side filtering with URL synchronization
- ✅ Real-time user feedback
- ✅ Shareable filtered URLs
- ✅ Better user experience
- **Use for:** All new implementations

### Legacy Pattern (v1.0) - **REFERENCE ONLY**
- ⚠️ Server-side only filtering
- ⚠️ Limited user feedback
- **Use for:** Understanding existing Delivery Receipts code only

## Enhanced Implementation Checklist

### 1. Setup Phase
- [ ] Define TypeScript interfaces in `types/admin/[module].ts`
- [ ] Create server action in `lib/actions/[entity].ts` 
- [ ] Set up file structure in `components/admin/[module]/[entity]/`

### 2. Core Components (Create in Order)
- [ ] `columns.tsx` - Column definitions with proper typing
- [ ] `data-table-column-header.tsx` - Sortable headers
- [ ] `data-table-faceted-filter.tsx` - Multi-select filters **with onValueChange**
- [ ] `data-table-view-options.tsx` - Column visibility
- [ ] `data-table-pagination.tsx` - Pagination controls **with onPageChange**
- [ ] `data-table-toolbar.tsx` - Search and filters **with onFiltersChange**
- [ ] `data-table.tsx` - Main table component **with callback props**
- [ ] `[entity]-client.tsx` - **NEW: Client wrapper component**
- [ ] `[entity]-dashboard.tsx` - Analytics dashboard (optional)
- [ ] `page.tsx` - Page component **using client wrapper**

### 3. Enhanced Features
- [ ] Text search with real-time URL updates
- [ ] Faceted filters with URL synchronization
- [ ] Column sorting with visual indicators
- [ ] Pagination with URL state persistence
- [ ] Row actions with dropdown menu
- [ ] **Client-side state management**
- [ ] **URL parameter synchronization**
- [ ] **Filter callbacks and handlers**
- [ ] Loading, empty, and error states
- [ ] Responsive design

### 4. Action System
- [ ] View action (link to detail page)
- [ ] Edit action (link to edit page)
- [ ] Conditional actions (based on data properties)
- [ ] Download/Export actions
- [ ] Utility actions (copy ID)
- [ ] Destructive actions (delete with confirmation)

### 5. Styling Standards
- [ ] `bg-muted/50` for table headers
- [ ] `hover:bg-muted/30` for data rows
- [ ] `p-4` for cell padding
- [ ] `rounded-md border` for table wrapper
- [ ] Status badges with color coding
- [ ] Consistent icon usage

## Enhanced File Structure Template

```
src/components/admin/[module]/[entity]/
├── index.ts                          # Export barrel
├── [entity]-client.tsx               # NEW: Client wrapper with state management
├── [entity]-dashboard.tsx            # Analytics dashboard
├── data-table.tsx                    # Main table component (enhanced)
├── data-table-toolbar.tsx            # Search and filters (with callbacks)
├── data-table-column-header.tsx      # Sortable headers
├── data-table-faceted-filter.tsx     # Multi-select filters (with onValueChange)
├── data-table-view-options.tsx       # Column visibility
├── data-table-pagination.tsx         # Pagination controls (with onPageChange)
└── columns.tsx                       # Column definitions
```

### Legacy File Structure (Reference Only)
```
src/components/admin/[module]/[entity]/
├── index.ts                          # Export barrel
├── [entity]-dashboard.tsx            # Analytics dashboard
├── data-table.tsx                    # Main table component
├── data-table-toolbar.tsx            # Search and filters
├── data-table-column-header.tsx      # Sortable headers
├── data-table-faceted-filter.tsx     # Multi-select filters
├── data-table-view-options.tsx       # Column visibility
├── data-table-pagination.tsx         # Pagination controls
└── columns.tsx                       # Column definitions
```

## Enhanced Key Patterns (v2.1)

### Client Wrapper Pattern
```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "./data-table";

interface EntityClientProps {
  initialData: EntityType[];
}

export function EntityClient({ initialData }: EntityClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);

  const handleFiltersChange = (filters: {
    search?: string;
    status?: StatusType[];
    dateRange?: { start: Date; end: Date };
  }) => {
    const params = new URLSearchParams(searchParams);
    
    // Update URL parameters
    if (filters.search) {
      params.set("search", filters.search);
    } else {
      params.delete("search");
    }
    
    if (filters.status && filters.status.length > 0) {
      params.set("status", filters.status.join(","));
    } else {
      params.delete("status");
    }
    
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <DataTable 
      data={data}
      onFiltersChange={handleFiltersChange}
      onPageChange={handlePageChange}
    />
  );
}
```

### Enhanced DataTable Props
```tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onFiltersChange?: (filters: FilterType) => void;  // NEW
  onPageChange?: (page: number) => void;            // NEW
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onFiltersChange,  // NEW
  onPageChange,     // NEW
}: DataTableProps<TData, TValue>) {
  // ... existing table logic

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        onFiltersChange={onFiltersChange}  // Pass callback
      />
      {/* ... table content */}
      <DataTablePagination 
        table={table} 
        onPageChange={onPageChange}        // Pass callback
      />
    </div>
  );
}
```

### Enhanced Toolbar with Callbacks
```tsx
interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onFiltersChange?: (filters: FilterType) => void;  // NEW
}

export function DataTableToolbar<TData>({
  table,
  onFiltersChange,  // NEW
}: DataTableToolbarProps<TData>) {
  const handleSearchChange = (value: string) => {
    table.getColumn("searchField")?.setFilterValue(value);
    onFiltersChange?.({ search: value });  // Trigger callback
  };

  const handleStatusChange = (values: string[]) => {
    table.getColumn("status")?.setFilterValue(values);
    onFiltersChange?.({ status: values as StatusType[] });  // Trigger callback
  };

  const handleResetFilters = () => {
    table.resetColumnFilters();
    onFiltersChange?.({});  // Trigger callback
  };

  // ... rest of component
}
```

### Enhanced Faceted Filter
```tsx
interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: { label: string; value: string; icon?: ComponentType<{ className?: string }> }[];
  onValueChange?: (values: string[]) => void;  // NEW
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  onValueChange,  // NEW
}: DataTableFacetedFilterProps<TData, TValue>) {
  const handleSelect = (value: string) => {
    const filterValues = facets?.has(value) 
      ? Array.from(selectedValues).filter((v) => v !== value)
      : [...Array.from(selectedValues), value];
    
    column?.setFilterValue(filterValues.length ? filterValues : undefined);
    onValueChange?.(filterValues);  // Trigger callback
  };

  const handleClearFilters = () => {
    column?.setFilterValue(undefined);
    onValueChange?.([]);  // Trigger callback
  };

  // ... rest of component
}
```

## Legacy Key Patterns (Reference Only)

### Column Definition Pattern
```tsx
{
  accessorKey: "fieldName",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Display Name" />
  ),
  cell: ({ row }) => {
    const value = row.getValue("fieldName");
    return <div className="styling">{value}</div>;
  },
}
```

### Status Badge Pattern
```tsx
const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  DELIVERED: "bg-green-100 text-green-800",
  // ... more statuses
};

<Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
  {status ? status.replace('_', ' ') : 'Unknown'}
</Badge>
```

### Action Menu Pattern
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="h-8 w-8 p-0">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    {/* Utility actions */}
    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(entity.id)}>
      Copy ID
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    {/* Primary actions */}
    <DropdownMenuItem asChild>
      <Link href={`/admin/[module]/[entity]/${entity.id}`}>
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </Link>
    </DropdownMenuItem>
    {/* ... more actions */}
  </DropdownMenuContent>
</DropdownMenu>
```

## Enhanced Performance Tips

1. **Server-side data fetching** - Initial data from server actions
2. **Client-side state management** - Real-time filtering without server calls
3. **URL state synchronization** - Persist filters, sorting, pagination in URL
4. **Proper memoization** - Use `useMemo` for expensive calculations
5. **Debounced search** - Prevent excessive URL updates (optional)
6. **Skeleton loading** - Show loading states during data fetching
7. **Callback optimization** - Use `useCallback` for filter handlers

### Legacy Performance Tips (Reference Only)
1. **Server-side everything** - Never load all data client-side
2. **URL state management** - Persist filters, sorting, pagination in URL
3. **Proper memoization** - Use `useMemo` for expensive calculations
4. **Debounced search** - Prevent excessive API calls
5. **Skeleton loading** - Show loading states during data fetching

## Accessibility Requirements

1. **Keyboard navigation** - Full keyboard support
2. **Screen reader support** - Proper ARIA labels
3. **Focus management** - Clear focus indicators
4. **Color contrast** - Sufficient contrast for all text

## Enhanced Common Pitfalls to Avoid

1. ❌ Not implementing client wrapper component
2. ❌ Missing callback props in enhanced components
3. ❌ Not synchronizing filter state with URL
4. ❌ Forgetting to handle empty/null filter values
5. ❌ Not implementing proper loading states
6. ❌ Missing null safety checks
7. ❌ Inconsistent action menu structure
8. ❌ Poor mobile responsiveness
9. ❌ Missing accessibility features
10. ❌ Not testing URL state persistence

### Legacy Pitfalls (Reference Only)
1. ❌ Loading all data client-side
2. ❌ Not implementing proper loading states
3. ❌ Missing null safety checks
4. ❌ Inconsistent action menu structure
5. ❌ Not synchronizing state with URL
6. ❌ Poor mobile responsiveness
7. ❌ Missing accessibility features

## Enhanced Testing Checklist

### Core Functionality
- [ ] Table loads data correctly
- [ ] Search functionality works with URL updates
- [ ] Filters apply correctly and persist in URL
- [ ] Sorting works for all sortable columns
- [ ] Pagination navigates properly with URL sync
- [ ] Actions perform expected operations

### Enhanced Features
- [ ] **Client wrapper manages state correctly**
- [ ] **Filter callbacks trigger URL updates**
- [ ] **Page refresh preserves filter state**
- [ ] **Shareable URLs work with applied filters**
- [ ] **Real-time feedback on filter changes**

### Cross-browser & Accessibility
- [ ] Mobile layout is usable
- [ ] Keyboard navigation works
- [ ] Loading states display properly
- [ ] Error states handle gracefully
- [ ] URL parameters work across browsers

### Legacy Testing Checklist (Reference Only)
- [ ] Table loads data correctly
- [ ] Search functionality works
- [ ] Filters apply correctly
- [ ] Sorting works for all sortable columns
- [ ] Pagination navigates properly
- [ ] Actions perform expected operations
- [ ] Mobile layout is usable
- [ ] Keyboard navigation works
- [ ] Loading states display properly
- [ ] Error states handle gracefully

This enhanced guide ensures consistent, performant, and user-friendly data table implementations with client-side filtering across the XGen MRP application. The new pattern provides better user experience through real-time feedback and URL state persistence while maintaining backward compatibility with existing implementations.