# Sales Invoices Module Documentation

## Overview
The Sales Invoices module provides comprehensive invoice management functionality within the XGen MRP billing system. It handles the complete invoice lifecycle from creation to payment tracking.

## Recent Updates
- **TypeScript Fixes**: Resolved all TypeScript errors related to interface mismatches, enum usage, and property access patterns
- **Type Safety**: Enhanced type safety throughout the module with proper enum usage and null checks
- **Component Props**: Fixed component interface mismatches and prop passing issues

## Purpose
- Manage sales invoice creation, editing, and tracking
- Monitor invoice status and payment processing
- Generate invoice analytics and reports
- Provide customer billing statement integration

## Related Files

### Backend Components
- **Server Actions**: `/src/lib/actions/sales-invoices.ts`
- **Database Schema**: Prisma models for SalesInvoice, SalesInvoiceItem
- **Types**: `/src/types/admin/billing.ts`

### Frontend Components
- **Main Page**: `/src/components/module/admin/billing/sales-invoices/page.tsx`
- **Dashboard**: `/src/components/module/admin/billing/sales-invoices/sales-invoices-dashboard.tsx`
- **Data Table**: `/src/components/module/admin/billing/sales-invoices/data-table.tsx`
- **Column Definitions**: `/src/components/module/admin/billing/sales-invoices/columns.tsx`
- **Supporting Components**: Various data table utilities

### Page Components
- **Invoice Details**: `/src/app/admin/(protected)/billing/sales-invoices/[id]/page.tsx`
- **Invoice Edit**: `/src/app/admin/(protected)/billing/sales-invoices/[id]/edit/page.tsx`
- **Invoice Create**: `/src/app/admin/(protected)/billing/sales-invoices/create/page.tsx`
- **Main Listing**: `/src/app/admin/(protected)/billing/sales-invoices/page.tsx`

### Additional Components
- **Invoice Form**: `/src/components/module/admin/billing/sales-invoice-form.tsx`
- **Invoice List**: `/src/components/module/admin/billing/sales-invoice-list.tsx`
- **Invoice Preview**: `/src/components/module/admin/billing/sales-invoice-preview.tsx`

## File-Specific Documentation

### Server Actions (`sales-invoices.ts`)

#### `getAllSalesInvoices(filters, page, perPage)`
**Purpose**: Fetch paginated sales invoices with filtering and sorting
**Parameters**:
- `filters`: Object containing search, status, date range, and amount range filters
- `page`: Current page number (default: 1)
- `perPage`: Items per page (default: 10)

**Returns**: Object with data array and pagination metadata
**Features**:
- Full-text search across invoice number, PO number, customer name, statement number
- Status filtering (Draft, Pending, Paid, Overdue, Cancelled)
- Date range filtering (invoice date and due date)
- Amount range filtering
- Sorting by multiple fields
- Includes related data: invoice items, billing statements, customer details

#### `getSalesInvoiceById(id)`
**Purpose**: Fetch single sales invoice with complete related data
**Parameters**: 
- `id`: Sales invoice ID
**Returns**: Complete invoice object with items, billing statement, customer, and user data

#### `createSalesInvoice(data)`
**Purpose**: Create new sales invoice with validation
**Parameters**: 
- `data`: Invoice creation data including items
**Returns**: Created invoice object
**Features**:
- Data validation using Zod schemas
- Authorization checks
- Automatic invoice number generation
- Transaction handling for invoice and items

#### `updateSalesInvoice(id, data)`
**Purpose**: Update existing sales invoice
**Parameters**: 
- `id`: Invoice ID
- `data`: Updated invoice data
**Returns**: Updated invoice object

#### `deleteSalesInvoice(id)`
**Purpose**: Delete sales invoice and related items
**Parameters**: 
- `id`: Invoice ID
**Returns**: Success confirmation

#### `getSalesReportData(startDate?, endDate?)`
**Purpose**: Generate comprehensive sales analytics
**Parameters**: 
- `startDate`: Optional start date for filtering
- `endDate`: Optional end date for filtering
**Returns**: Object containing:
- Total sales metrics (amount, count, paid/overdue breakdown)
- Daily sales data (last 30 days)
- Monthly sales data (last 12 months with growth calculation)
- Top products by sales volume
- Top customers by total sales

### Frontend Components

#### Main Page Component (`page.tsx`)
**Purpose**: Server-side data fetching and page composition
**Features**:
- Search parameter parsing for filters and pagination
- Parallel data fetching for invoices and analytics
- Error handling and loading states
- Layout composition with dashboard and data table

#### Dashboard Component (`sales-invoices-dashboard.tsx`)
**Purpose**: Display sales invoice analytics and key metrics
**Features**:
- Total invoices count and amount
- Status breakdown with color-coded badges
- Paid vs pending vs overdue metrics
- Responsive card layout

#### Data Table Component (`data-table.tsx`)
**Purpose**: Interactive table with advanced features
**Features**:
- Sorting by all columns
- Global search and faceted filtering
- Column visibility toggle
- Row selection
- Pagination controls
- Responsive design

#### Column Definitions (`columns.tsx`)
**Purpose**: Define table structure and cell rendering
**Features**:
- Invoice number with link to details
- Status badges with color coding
- Customer information display
- Date formatting with overdue highlighting
- Amount formatting
- Comprehensive action menu

## Flow of Logic

### Invoice Creation Flow
1. **Input** → User provides invoice data (customer, items, dates, amounts)
2. **Validation** → Server validates data using Zod schemas
3. **Authorization** → Check user permissions
4. **Processing** → Generate invoice number, create database records
5. **Output** → Return created invoice with generated ID

### Invoice Listing Flow
1. **Input** → Page load with optional search parameters
2. **Processing** → Parse filters, fetch data with pagination
3. **Analytics** → Generate dashboard metrics
4. **Output** → Render dashboard and data table

### Invoice Status Management
1. **Draft** → Initial state, can be edited
2. **Pending** → Sent to customer, awaiting payment
3. **Paid** → Payment received and processed
4. **Overdue** → Past due date without payment
5. **Cancelled** → Invoice cancelled/voided

### Search and Filtering
1. **Global Search** → Searches across invoice number, PO number, customer name, statement number
2. **Status Filter** → Multi-select filter for invoice status
3. **Date Range** → Filter by invoice date or due date
4. **Amount Range** → Filter by total amount
5. **Sorting** → Sort by any column with direction toggle

## Data Relationships

### Core Entities
- **SalesInvoice** → Main invoice record
- **SalesInvoiceItem** → Individual line items
- **BillingStatement** → Associated billing statement
- **Customer** → Invoice recipient
- **User** → Invoice creator

### Related Data
- **ProductionOrder** → Source production order
- **DeliveryReceipt** → Associated delivery
- **Product** → Items being invoiced

## Key Features

### Analytics Dashboard
- Real-time metrics calculation
- Status distribution visualization
- Growth tracking and trends
- Top performers identification

### Advanced Filtering
- Multi-criteria search
- Persistent URL state
- Real-time filter updates
- Filter reset functionality

### Action System
- View invoice details
- Edit invoice (if draft)
- Download PDF
- Send to customer
- Copy invoice ID
- Delete with confirmation

### Responsive Design
- Mobile-friendly layout
- Adaptive column display
- Touch-friendly interactions
- Progressive enhancement

## Performance Considerations

### Database Optimization
- Indexed search fields
- Efficient join queries
- Pagination at database level
- Aggregation for analytics

### Frontend Optimization
- Server-side rendering
- Lazy loading for large datasets
- Debounced search inputs
- Optimistic UI updates

## Security Features

### Authorization
- User permission checks
- Role-based access control
- Secure data validation
- SQL injection prevention

### Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Secure API endpoints

## Testing Strategy

### Unit Tests
- Server action validation
- Component rendering
- Utility functions
- Data transformations

### Integration Tests
- API endpoint testing
- Database operations
- Component interactions
- Error handling

### End-to-End Tests
- Complete user workflows
- Cross-browser compatibility
- Performance testing
- Accessibility compliance

## Future Enhancements

### Planned Features
- Bulk invoice operations
- Advanced reporting
- Email automation
- Payment integration
- Invoice templates
- Multi-currency support

### Scalability Improvements
- Virtual scrolling for large datasets
- Background job processing
- Caching strategies
- Performance monitoring

This documentation provides a comprehensive overview of the Sales Invoices module, enabling team members to understand, maintain, and extend the functionality effectively.