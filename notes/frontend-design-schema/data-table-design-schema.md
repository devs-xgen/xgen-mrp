# Data Table Design Schema - XGen MRP

## Overview
This document outlines the standardized data table design pattern used across the XGen MRP system, specifically for the billing module components.

## Component Structure

### Core Components
Each data table implementation consists of the following components:

1. **Main Page Component** (`page.tsx`)
   - Server-side data fetching
   - Search parameter parsing
   - Filter construction
   - Analytics data preparation
   - Layout composition

2. **Client Wrapper Component** (`*-client.tsx`) - **NEW PATTERN**
   - Client-side state management
   - URL parameter synchronization
   - Filter and pagination callbacks
   - Real-time data updates

3. **Dashboard Component** (`*-dashboard.tsx`)
   - Analytics visualization
   - Key metrics display
   - Status summaries
   - Card-based layout

4. **Data Table Component** (`data-table.tsx`)
   - Table state management
   - Sorting, filtering, pagination
   - Row selection
   - Column visibility
   - **Enhanced with callback props**

5. **Column Definitions** (`columns.tsx`)
   - Column configuration
   - Cell rendering
   - Action buttons
   - Status badges

6. **Supporting Components**
   - `data-table-column-header.tsx` - Sortable column headers
   - `data-table-faceted-filter.tsx` - Multi-select filters **with onValueChange**
   - `data-table-pagination.tsx` - Pagination controls **with onPageChange**
   - `data-table-toolbar.tsx` - Search and filter toolbar **with onFiltersChange**
   - `data-table-view-options.tsx` - Column visibility toggle

7. **Index File** (`index.ts`)
   - Component exports
   - Clean import interface

## Implementation Pattern

### 1. Directory Structure
```
/components/module/admin/billing/[entity-name]/
├── index.ts
├── page.tsx
├── [entity-name]-client.tsx          # NEW: Client wrapper component
├── [entity-name]-dashboard.tsx
├── data-table.tsx
├── columns.tsx
├── data-table-column-header.tsx
├── data-table-faceted-filter.tsx
├── data-table-pagination.tsx
├── data-table-toolbar.tsx
└── data-table-view-options.tsx
```

### 2. Data Flow
1. **Server Actions** - Fetch data with filters and pagination
2. **Page Component** - Process search params and prepare data
3. **Client Wrapper** - Manage state and URL synchronization (**NEW**)
4. **Dashboard** - Display analytics and summaries
5. **Data Table** - Render filterable, sortable table with callbacks
6. **Columns** - Define cell rendering and actions

#### Enhanced Data Flow with Client-Side Filtering
- **URL Parameters** → **Page Component** → **Initial Data**
- **Initial Data** → **Client Wrapper** → **Local State**
- **User Interactions** → **Client Wrapper** → **URL Updates**
- **Filter Changes** → **Callbacks** → **Table Components**
- **URL State** → **Persistent Filters** → **Shareable Links**

### 3. Type Safety
- Use TypeScript interfaces for all data structures
- Import types from centralized type definitions
- Ensure type consistency across components

### 4. State Management
- **React Table** for table state (sorting, filtering, pagination)
- **URL search params** for persistent filters and pagination
- **Client wrapper state** for real-time data management (**NEW**)
- **Server-side data fetching** with revalidation
- **Callback props** for component communication (**NEW**)

#### Client-Side State Pattern
```typescript
// Client wrapper manages local state and URL synchronization
const [data, setData] = useState(initialData);
const router = useRouter();
const searchParams = useSearchParams();

// Filter changes update both local state and URL
const handleFiltersChange = (filters) => {
  const params = new URLSearchParams(searchParams);
  // Update URL parameters
  router.push(`?${params.toString()}`);
};
```

## Standardized Features

### Dashboard Analytics
- Total count metrics
- Status breakdown with color coding
- Amount summaries (where applicable)
- Recent activity lists

### Table Functionality
- **Sorting** - All columns sortable where appropriate
- **Filtering** - Global search and faceted filters
- **Pagination** - Configurable page sizes
- **Column Visibility** - Toggle column display
- **Row Selection** - Multi-select with actions
- **Responsive Design** - Mobile-friendly layout

### Action Patterns
- View details
- Edit records
- Delete with confirmation
- Export/Download
- Status-specific actions (e.g., Send invoice)
- Copy ID to clipboard

## Enhanced Filtering Patterns (v2.1.0)

### Client-Side Filtering Architecture
The new filtering pattern introduces a client wrapper component that manages state and URL synchronization:

#### Key Components
1. **Client Wrapper** (`[entity]-client.tsx`)
   - Manages local data state
   - Handles filter and pagination callbacks
   - Synchronizes state with URL parameters
   - Provides real-time user feedback

2. **Enhanced DataTable** (`data-table.tsx`)
   - Accepts `onFiltersChange` and `onPageChange` props
   - Passes callbacks to child components
   - Maintains backward compatibility

3. **Enhanced Toolbar** (`data-table-toolbar.tsx`)
   - Accepts `onFiltersChange` callback
   - Triggers callbacks on filter changes
   - Supports search, status, and date range filters

4. **Enhanced Pagination** (`data-table-pagination.tsx`)
   - Accepts `onPageChange` callback
   - Updates URL on page navigation
   - Maintains current page state

### Implementation Benefits
- **URL State Persistence** - Filters persist across page refreshes
- **Shareable URLs** - Users can share filtered views
- **Real-time Feedback** - Instant visual feedback on filter changes
- **Consistent Behavior** - Standardized filtering across all tables
- **Separation of Concerns** - Clear division between server and client logic

### URL Parameter Structure
```
?page=1&per_page=10&search=invoice&status=paid,pending&dateFrom=2024-01-01&dateTo=2024-01-31
```

#### Standard Parameters
- `page` - Current page number
- `per_page` - Items per page
- `search` - Global search term
- `sort` - Sort column and direction

#### Filter Parameters
- `status` - Comma-separated status values
- `dateFrom` - Start date for date range
- `dateTo` - End date for date range
- Custom entity-specific parameters

### Migration to Enhanced Pattern
1. Create `[entity]-client.tsx` wrapper component
2. Update `DataTable` to accept callback props
3. Update `DataTableToolbar` with `onFiltersChange`
4. Update `DataTablePagination` with `onPageChange`
5. Update `page.tsx` to use client wrapper
6. Test URL state persistence

### Code Example
```typescript
// Client wrapper component
export function SalesInvoicesClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFiltersChange = (filters: FilterType) => {
    const params = new URLSearchParams(searchParams);
    
    if (filters.search) {
      params.set("search", filters.search);
    } else {
      params.delete("search");
    }
    
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

## Styling Guidelines

### Color Coding
- **Status Badges**
  - Success: Green (PAID, DELIVERED, COMPLETED)
  - Warning: Yellow (PENDING, IN_TRANSIT)
  - Danger: Red (OVERDUE, FAILED, CANCELLED)
  - Secondary: Gray (DRAFT, CANCELLED)

### Layout
- Card-based dashboard with consistent spacing
- Clean table design with hover effects
- Consistent button styling and iconography
- Responsive breakpoints for mobile

## Reusability

### Component Reuse
- Data table components are generic and reusable
- Only entity-specific logic in main components
- Shared UI components from design system

### Pattern Consistency
- Same structure across all entity tables
- Consistent naming conventions
- Standardized prop interfaces

## Examples

### Implemented Entities
1. **Delivery Receipts** - `/delivery-receipts/` (Legacy pattern)
2. **Sales Invoices** - `/sales-invoices/` (Enhanced pattern with client-side filtering)

### Pattern Versions
- **v1.0** - Server-side only pattern (Delivery Receipts)
- **v2.1** - Enhanced client-side filtering pattern (Sales Invoices)

### Future Entities
- Billing Statements (Enhanced pattern)
- Purchase Orders (Enhanced pattern)
- Inventory Items (Enhanced pattern)
- Production Orders (Enhanced pattern)

## Best Practices

1. **Performance**
   - Server-side pagination
   - Optimized queries with proper indexing
   - Lazy loading for large datasets

2. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader compatibility

3. **Error Handling**
   - Graceful loading states
   - Error boundaries
   - User-friendly error messages

4. **Testing**
   - Unit tests for components
   - Integration tests for data flow
   - E2E tests for user workflows

## Migration Guide

### Creating a New Data Table (Enhanced Pattern v2.1)

1. **Copy the enhanced component structure** from Sales Invoices implementation
2. **Create client wrapper component** using the template pattern
3. **Update entity-specific types and interfaces**
4. **Modify column definitions** for the new entity
5. **Update dashboard metrics and analytics**
6. **Implement filter and pagination callbacks**
7. **Configure URL parameter handling**
8. **Test all functionality thoroughly**

### Upgrading Existing Tables to Enhanced Pattern

1. **Create `[entity]-client.tsx`** wrapper component
2. **Update `DataTable`** to accept callback props
3. **Enhance `DataTableToolbar`** with `onFiltersChange`
4. **Enhance `DataTablePagination`** with `onPageChange`
5. **Update `page.tsx`** to use client wrapper
6. **Test URL state persistence** and filter functionality
7. **Verify backward compatibility**

### Legacy Pattern (v1.0) - For Reference Only
When working with legacy implementations:
1. Copy the component structure from Delivery Receipts
2. Update entity-specific types and interfaces
3. Modify column definitions for the new entity
4. Update dashboard metrics and analytics
5. Adjust filters and search functionality
6. Test all functionality thoroughly

**Note**: New implementations should use the Enhanced Pattern (v2.1) for better user experience and consistency.

This standardized approach ensures consistency, maintainability, and a better user experience across the entire application.