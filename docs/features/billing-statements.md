# Billing Statements Feature Documentation

## Overview
The Billing Statements feature provides comprehensive management of customer billing statements, including creation, tracking, and payment management.

## Feature Structure

### Components
- **BillingStatementsPage**: Main page component with Suspense wrapper
- **BillingStatementsClient**: Client-side component handling state and interactions
- **BillingStatementsDashboard**: Analytics dashboard showing key metrics
- **DataTable**: Main table component for displaying billing statements
- **columns**: Table column definitions with sorting and filtering
- **DataTableToolbar**: Filtering and search functionality
- **DataTableColumnHeader**: Sortable column headers
- **DataTableFacetedFilter**: Multi-select filter component
- **DataTableViewOptions**: Column visibility toggle
- **DataTablePagination**: Pagination controls

### Utilities
- **utils.tsx**: Shared utility functions
  - `getStatusBadge()`: Returns status badge component
  - `getStatusOptions()`: Returns status filter options

## Data Types

### BillingStatementWithRelations
```typescript
interface BillingStatementWithRelations {
  id: string
  statementNumber: string
  customerId: string
  customerOrderId?: string
  productionOrderId?: string
  salesInvoiceId?: string
  amount: number
  status: BillingStatus
  billingDate: Date
  dueDate: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
  
  // Relations
  customer?: Customer
  customerOrder?: CustomerOrder
  productionOrder?: ProductionOrder
  salesInvoice?: SalesInvoiceWithItems
  deliveryReceipts?: DeliveryReceipt[]
}
```

### BillingStatus Enum
- `DRAFT`: Statement is in draft mode
- `SENT`: Statement has been sent to customer
- `PAID`: Statement has been fully paid
- `OVERDUE`: Statement is past due date
- `CANCELLED`: Statement has been cancelled
- `DISPUTED`: Statement is under dispute
- `PARTIAL`: Statement has been partially paid

## Features

### Dashboard Analytics
- Total billing statements count
- Paid amount (with green styling)
- Overdue amount (with red styling)
- Total revenue

### Data Table Features
- **Sorting**: All columns support sorting
- **Filtering**: 
  - Text search by statement number
  - Status filter with multi-select
- **Pagination**: Configurable page sizes
- **Column Visibility**: Toggle column display
- **Row Actions**: View, download, edit, mark as paid, delete

### Table Columns
1. **Statement Number**: Unique identifier with link
2. **Customer**: Customer name and email
3. **Order Info**: Customer order and delivery receipt numbers
4. **Amount**: Formatted currency amount
5. **Status**: Color-coded status badges
6. **Billing Date**: Formatted date
7. **Due Date**: Formatted date
8. **Actions**: Dropdown menu with operations

## File Structure
```
billing-statements/
├── index.ts                      # Component exports
├── page.tsx                      # Main page component
├── billing-statements-client.tsx # Client-side logic
├── billing-statements-dashboard.tsx # Analytics dashboard
├── columns.tsx                   # Table column definitions
├── data-table.tsx               # Main table component
├── data-table-toolbar.tsx       # Filtering toolbar
├── data-table-column-header.tsx # Sortable headers
├── data-table-faceted-filter.tsx # Multi-select filters
├── data-table-view-options.tsx  # Column visibility
├── data-table-pagination.tsx    # Pagination controls
└── utils.tsx                    # Shared utilities
```

## Usage Example

```tsx
import { BillingStatementsPage } from "@/components/module/admin/billing/billing-statements"

export default function BillingStatementsRoute() {
  return (
    <BillingStatementsPage 
      initialData={billingStatements}
      analytics={analytics}
    />
  )
}
```

## Dependencies
- `@tanstack/react-table`: Table functionality
- `@radix-ui/react-icons`: Icons
- `lucide-react`: Additional icons
- `shadcn/ui`: UI components
- Custom types from `@/types/admin/billing`
- Utility functions from `@/lib/constant`

## Best Practices
1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Utility functions are shared across components
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Performance**: Efficient table rendering with virtualization
5. **Accessibility**: Proper ARIA labels and keyboard navigation
6. **Responsive**: Mobile-friendly design patterns

## Future Enhancements
- Bulk operations (select multiple statements)
- Advanced filtering (date ranges, amount ranges)
- Export functionality (PDF, CSV)
- Real-time updates via WebSocket
- Email integration for sending statements
- Payment tracking and reconciliation