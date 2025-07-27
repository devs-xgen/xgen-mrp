# Design Document

## Overview

This design outlines the refactoring of sales invoice PDF download and CSV export functionality from API routes to server actions. The solution will maintain existing functionality while improving performance, consistency, and maintainability by following established patterns in the codebase.

## Architecture

### Current State
- PDF download functionality exists as API route: `/api/admin/billing/sales-invoices/[id]/download/route.ts`
- Uses `generateSalesInvoicePDF` from `pdf-generator.tsx` service
- No CSV export functionality currently exists
- Client components likely call API routes directly

### Target State
- PDF download and CSV export functionality moved to server actions in `/src/lib/actions/sales-invoices.ts`
- API route removed completely
- Client components use server actions with proper loading states
- Consistent error handling and user feedback

## Components and Interfaces

### Server Actions

#### 1. exportSalesInvoicePDF
```typescript
async function exportSalesInvoicePDF(
  id: string
): Promise<{ success: boolean; pdfBuffer?: Buffer; filename?: string; error?: string }>
```

**Purpose:** Generate and return PDF buffer for a single sales invoice
**Authentication:** Requires valid session
**Authorization:** Admin users only
**Error Handling:** Returns structured response with success/error states

#### 2. exportSalesInvoicesData
```typescript
async function exportSalesInvoicesData(
  filters?: SalesInvoiceFilters
): Promise<{ csvContent: string; filename: string }>
```

**Purpose:** Export sales invoices data as CSV with optional filtering
**Authentication:** Requires valid session
**Authorization:** Admin users only
**Data Scope:** All sales invoices with related customer and billing data

### Data Models

#### PDF Export Response
```typescript
interface PDFExportResponse {
  success: boolean;
  pdfBuffer?: Buffer;
  filename?: string;
  error?: string;
}
```

#### CSV Export Response
```typescript
interface CSVExportResponse {
  csvContent: string;
  filename: string;
}
```

### Client Integration

#### PDF Download Flow
1. User clicks download button for specific invoice
2. Client component calls `exportSalesInvoicePDF` server action
3. Server action generates PDF using existing `generateSalesInvoicePDF` service
4. Client receives PDF buffer and triggers browser download
5. Loading states and error handling managed by client component

#### CSV Export Flow
1. User clicks export button (with optional filters)
2. Client component calls `exportSalesInvoicesData` server action
3. Server action queries database and generates CSV content
4. Client receives CSV content and triggers browser download
5. Loading states and success feedback provided to user

## Data Models

### CSV Export Columns
Based on existing delivery receipts pattern, the CSV will include:

- Invoice Number
- Invoice Date
- Due Date
- Status
- Customer Name
- Customer Email
- Customer Code
- Billing Statement Number
- PO Number
- Subtotal
- Tax Rate
- Tax Amount
- Discount Amount
- Total Amount
- Payment Terms
- Created By
- Created Date
- Modified By
- Modified Date

### Database Queries

#### PDF Export Query
- Single invoice lookup with full relationships
- Include billing statement, customer, and invoice items
- Same query structure as existing `getSalesInvoiceById`

#### CSV Export Query
- Bulk invoice query with pagination support
- Include customer, billing statement, and user relationships
- Apply filters for date range, status, customer selection
- Order by invoice date descending

## Error Handling

### Server Action Error Patterns
Following existing patterns in `delivery-receipts.ts`:

```typescript
try {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Business logic
  // ...

  return { success: true, data: result };
} catch (error) {
  console.error("Error message:", error);
  return { success: false, error: "User-friendly error message" };
}
```

### Client Error Handling
- Display toast notifications for errors
- Show loading spinners during operations
- Graceful fallback for failed downloads
- Retry mechanisms where appropriate

## Testing Strategy

### Unit Tests
- Test server actions with mocked database calls
- Test PDF generation with sample data
- Test CSV generation and formatting
- Test authentication and authorization flows

### Integration Tests
- Test complete PDF download flow
- Test CSV export with various filters
- Test error scenarios (unauthorized, not found, etc.)
- Test file download functionality in browser

### End-to-End Tests
- Test user interactions from sales invoices page
- Test download triggers and file generation
- Test bulk export functionality
- Test error handling and user feedback

## Security Considerations

### Authentication & Authorization
- All server actions require valid session
- Admin role verification for access control
- Input validation for invoice IDs and filters

### Data Protection
- No sensitive data logged in error messages
- PDF content matches user's access permissions
- CSV export respects data access boundaries

### File Security
- Generated files are temporary and not stored
- PDF content sanitized through existing service
- CSV content properly escaped to prevent injection

## Performance Considerations

### PDF Generation
- Leverage existing `generateSalesInvoicePDF` service
- Single database query for invoice data
- Buffer-based response for memory efficiency

### CSV Export
- Implement pagination for large datasets
- Stream processing for memory efficiency
- Database query optimization with proper indexes
- Consider background processing for very large exports

### Caching Strategy
- No caching for PDF generation (real-time data)
- Consider caching for frequently accessed invoice data
- Leverage existing database connection pooling

## Migration Strategy

### Phase 1: Implement Server Actions
1. Add new server actions to `sales-invoices.ts`
2. Implement PDF export functionality
3. Implement CSV export functionality
4. Add comprehensive error handling

### Phase 2: Update Client Components
1. Identify components using the API route
2. Replace API calls with server action calls
3. Update loading states and error handling
4. Test functionality thoroughly

### Phase 3: Remove API Route
1. Delete `/api/admin/billing/sales-invoices/[id]/download/route.ts`
2. Update any remaining references
3. Verify no broken functionality
4. Clean up unused imports

### Rollback Plan
- Keep API route until server actions are fully tested
- Feature flag to switch between implementations
- Database rollback not required (no schema changes)
- Quick revert by restoring API route if needed