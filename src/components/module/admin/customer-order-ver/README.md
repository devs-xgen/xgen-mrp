# Customer Order V2 Components

This directory contains all components for the Customer Order Management V2 system.

## Directory Structure

```
src/components/module/admin/customer-order-ver/
├── CustomerOrderV2Client.tsx      # Main client component with state management
├── CustomerOrderV2Table.tsx       # Enhanced table using global table system
├── CustomerOrderFilters.tsx       # Advanced filtering component
├── dialogs/
│   ├── CreateOrderDialog.tsx      # Order creation dialog
│   ├── EditOrderDialog.tsx        # Order editing dialog (TODO)
│   └── FulfillmentDialog.tsx      # Fulfillment management dialog (TODO)
└── README.md                      # This file
```

## Components Overview

### CustomerOrderV2Client.tsx
The main orchestrating component that:
- Manages overall state for orders, filters, and UI
- Handles data fetching and refreshing
- Coordinates between table, filters, and dialogs
- Provides summary statistics and analytics

### CustomerOrderV2Table.tsx
Enhanced data table component that:
- Uses the global DataTable system from `@/components/global/table`
- Provides sortable columns with advanced formatters
- Shows fulfillment progress and status indicators
- Includes action buttons for order management

### CustomerOrderFilters.tsx
Advanced filtering component that:
- Supports multi-criteria filtering (status, customer, date range, etc.)
- Provides search functionality across multiple fields
- Shows active filter summary
- Allows saving and clearing filter presets

### dialogs/CreateOrderDialog.tsx
Order creation dialog that:
- Provides comprehensive order creation form
- Supports multiple order line items
- Auto-fills customer information
- Calculates totals in real-time

## Integration Points

### Global Table System
Components utilize the reusable table system:
- `@/components/global/table/data-table.tsx` - Main table component
- `@/components/global/table/column-helpers.tsx` - Column helper functions
- `@/components/global/table/table-utils.ts` - Utility functions

### Server Actions
Components use existing server actions:
- `@/lib/actions/customer-order.ts` - Customer order operations
- `@/lib/actions/customers.ts` - Customer data
- `@/lib/actions/product.ts` - Product information

### Type Definitions
Components use shared types:
- `@/types/admin/customer-order.ts` - Customer order types
- `@/types/admin/customer.ts` - Customer types
- `@/types/admin/product.ts` - Product types

## Usage

The main page component imports and uses the client component:

```tsx
import { CustomerOrderV2Client } from "@/components/module/admin/customer-order-ver/CustomerOrderV2Client";

// In page component
<CustomerOrderV2Client
  initialOrders={orders}
  customers={customers}
  products={products}
/>
```

## Future Enhancements

Planned components to be added:
- `EditOrderDialog.tsx` - Order editing functionality
- `FulfillmentDialog.tsx` - Fulfillment management
- `OrderAnalytics.tsx` - Analytics dashboard
- `OrderExport.tsx` - Data export functionality
- `BulkOperations.tsx` - Bulk order operations

## Development Notes

- All components use TypeScript with strict typing
- Components follow the established UI patterns using shadcn/ui
- State management uses React hooks (useState, useMemo, useCallback)
- Error handling and loading states are implemented throughout
- Components are responsive and mobile-friendly

## Related Documentation

- See `@/notes/customer-order-v2-prd.md` for complete requirements
- See `@/notes/customer-order-overview.md` for business logic documentation
- See `@/components/global/table/README.md` for table system documentation
