# Data Table Implementation Quick Guide

**Based on:** Delivery Receipts Page Implementation  
**Purpose:** Step-by-step guide for implementing data tables following XGen MRP standards

## Quick Implementation Checklist

### 1. Setup Phase
- [ ] Define TypeScript interfaces in `types/admin/[module].ts`
- [ ] Create server action in `lib/actions/[entity].ts` 
- [ ] Set up file structure in `components/admin/[module]/[entity]/`

### 2. Core Components (Create in Order)
- [ ] `columns.tsx` - Column definitions with proper typing
- [ ] `data-table-column-header.tsx` - Sortable headers
- [ ] `data-table-faceted-filter.tsx` - Multi-select filters  
- [ ] `data-table-view-options.tsx` - Column visibility
- [ ] `data-table-pagination.tsx` - Pagination controls
- [ ] `data-table-toolbar.tsx` - Search and filters
- [ ] `data-table.tsx` - Main table component
- [ ] `[entity]-dashboard.tsx` - Analytics dashboard (optional)
- [ ] `page.tsx` - Page component

### 3. Essential Features
- [ ] Text search with debouncing
- [ ] Faceted filters for categorical data
- [ ] Column sorting with visual indicators
- [ ] Pagination with page size options
- [ ] Row actions with dropdown menu
- [ ] URL state synchronization
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

## File Structure Template

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

## Key Patterns

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

## Performance Tips

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

## Common Pitfalls to Avoid

1. ❌ Loading all data client-side
2. ❌ Not implementing proper loading states
3. ❌ Missing null safety checks
4. ❌ Inconsistent action menu structure
5. ❌ Not synchronizing state with URL
6. ❌ Poor mobile responsiveness
7. ❌ Missing accessibility features

## Testing Checklist

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

This guide ensures consistent, performant, and accessible data table implementations across the XGen MRP application.