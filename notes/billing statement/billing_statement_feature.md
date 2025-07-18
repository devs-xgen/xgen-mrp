# Billing Statement Feature Documentation

## 📋 Overview
The Billing Statement feature is a comprehensive billing system that connects customer orders, production orders, delivery receipts, and sales invoices into a unified billing workflow for the MRP system.

## 🏗️ System Architecture Pattern

### 📐 **MRP System Architecture Rules**
This system follows a **Server Actions** pattern, NOT API routes:

1. **Server Actions** → `src/lib/actions/` - All business logic and database operations
2. **Types** → `src/types/admin/` - TypeScript definitions and interfaces  
3. **Components** → `src/components/module/admin/` - React components and UI
4. **Pages** → `src/app/admin/(protected)/` - Next.js pages and routing

**❌ DO NOT CREATE:**
- API routes in `src/app/api/`
- Separate API endpoints

**✅ FOLLOW THIS PATTERN:**
```
Feature: "billing"
├── src/lib/actions/billing-statements.ts     # Server actions
├── src/lib/actions/sales-invoices.ts         # Server actions  
├── src/lib/actions/delivery-receipts.ts      # Server actions
├── src/types/admin/billing.ts                # TypeScript types
├── src/components/module/admin/billing/      # React components
└── src/app/admin/(protected)/billing/        # Next.js pages
```

## 🎯 Purpose & Reasoning

### Why We Need This Feature
1. **Complete Sales Cycle Tracking** - Track from order to delivery to payment
2. **Financial Accountability** - Proper invoicing and payment tracking
3. **Delivery Verification** - Proof of delivery with receipts
4. **Customer Transparency** - Clear billing statements for customers
5. **Business Intelligence** - Sales reporting and analytics

### Business Impact
- **Improved Cash Flow** - Faster invoicing and payment tracking
- **Reduced Errors** - Automated billing from production data
- **Better Customer Service** - Clear, detailed billing statements
- **Compliance** - Proper documentation for auditing

## 🗄️ Database Structure

### Core Models
```
BillingStatement (Main Hub)
├── Customer (Required)
├── CustomerOrder (Optional)
├── ProductionOrder (Optional)
├── DeliveryReceipt (Optional)
└── SalesInvoice (Required)

SalesInvoice
└── SalesInvoiceItem[] (Line Items)
```

### Key Relationships
- **One-to-One**: BillingStatement ↔ SalesInvoice
- **One-to-Many**: SalesInvoice ↔ SalesInvoiceItem
- **Optional Links**: BillingStatement ↔ DeliveryReceipt, CustomerOrder, ProductionOrder

## 📱 Frontend Structure Plan

### File Organization
```
src/app/admin/(protected)/billing/
├── billing-statements/
│   ├── page.tsx           # List all billing statements
│   ├── create/page.tsx    # Create new billing statement
│   └── [id]/page.tsx      # View/edit specific statement
├── sales-invoices/
│   ├── page.tsx           # List all invoices
│   ├── create/page.tsx    # Create new invoice
│   └── [id]/page.tsx      # View/edit specific invoice
├── delivery-receipts/
│   ├── page.tsx           # List all delivery receipts
│   ├── create/page.tsx    # Create new delivery receipt
│   └── [id]/page.tsx      # View/edit specific receipt
└── billing-reports/
    ├── page.tsx           # Sales reports and analytics
    ├── monthly/page.tsx   # Monthly sales reports
    └── customer/page.tsx  # Customer-specific reports
```

## 🔧 Implementation Tasks

### Phase 1: Server Actions (Core Backend)
**Location**: `src/lib/actions/`

- [ ] **billing-statements.ts** - CRUD operations for billing statements
  - `getAllBillingStatements()` 
  - `getBillingStatementById(id)`
  - `createBillingStatement(data)`
  - `updateBillingStatement(id, data)`
  - `deleteBillingStatement(id)`

- [ ] **sales-invoices.ts** - Invoice creation and management
  - `getAllSalesInvoices()`
  - `getSalesInvoiceById(id)`
  - `createSalesInvoice(data)`
  - `updateSalesInvoice(id, data)`
  - `generateInvoiceFromOrder(orderId)`

- [ ] **delivery-receipts.ts** - Delivery receipt management
  - `getAllDeliveryReceipts()`
  - `getDeliveryReceiptById(id)`
  - `createDeliveryReceipt(data)`
  - `updateDeliveryReceipt(id, data)`
  - `confirmDelivery(id, signature)`

- [ ] **billing-reports.ts** - Analytics and reporting functions
  - `getMonthlySalesReport(month, year)`
  - `getCustomerBillingReport(customerId)`
  - `getOverduePaymentsReport()`
  - `getSalesAnalytics()`

### Phase 2: Types & Interfaces
**Location**: `src/types/admin/`

- [ ] **billing.ts** - TypeScript definitions
  - `BillingStatement` interface
  - `SalesInvoice` interface
  - `DeliveryReceipt` interface
  - `BillingFormData` types
  - `BillingReportData` types
  - Form validation schemas (Zod)

### Phase 3: React Components
**Location**: `src/components/module/admin/billing/`

- [ ] **billing-statements/** - Billing statement components
  - `BillingStatementList.tsx`
  - `BillingStatementForm.tsx`
  - `BillingStatementCard.tsx`
  - `BillingStatementFilters.tsx`

- [ ] **sales-invoices/** - Invoice components
  - `SalesInvoiceList.tsx`
  - `SalesInvoiceForm.tsx`
  - `SalesInvoicePreview.tsx`
  - `InvoiceItemsTable.tsx`

- [ ] **delivery-receipts/** - Delivery receipt components
  - `DeliveryReceiptList.tsx`
  - `DeliveryReceiptForm.tsx`
  - `DeliverySignature.tsx`
  - `DeliveryPhotoUpload.tsx`

- [ ] **billing-reports/** - Analytics components
  - `BillingReportsDashboard.tsx`
  - `SalesChart.tsx`
  - `CustomerAnalytics.tsx`
  - `PaymentStatusChart.tsx`

### Phase 4: Next.js Pages
**Location**: `src/app/admin/(protected)/billing/`

- [ ] Create page structure following the frontend plan
- [ ] Import and use server actions from `src/lib/actions/`
- [ ] Import types from `src/types/admin/billing.ts`
- [ ] Import components from `src/components/module/admin/billing/`

### Phase 5: Integration Points
- [ ] **Customer Orders** - Add "Create Invoice" button in existing pages
- [ ] **Production Orders** - Add "Mark for Delivery" action
- [ ] **Dashboard** - Add billing metrics and charts
- [ ] **Navigation** - ✅ Already updated

## 🔄 Workflow Integration

### Customer Order → Billing Flow
1. Customer places order → `customer-order.ts` actions
2. Production order created → `production-order.ts` actions
3. Production completed → `production-order.ts` actions
4. Delivery receipt generated → `delivery-receipts.ts` actions
5. Sales invoice created → `sales-invoices.ts` actions
6. Billing statement generated → `billing-statements.ts` actions
7. Payment tracking → `billing-statements.ts` actions

### Production Order → Billing Flow
1. Production order completed → `production-order.ts` actions
2. Quality check passed → `quality-checks.ts` actions
3. Delivery receipt created → `delivery-receipts.ts` actions
4. Sales invoice generated → `sales-invoices.ts` actions
5. Billing statement created → `billing-statements.ts` actions

## 📊 Key Features

### Billing Statement Features
- **Unique Statement Numbers** - Auto-generated identifiers
- **Multiple Source Support** - Link to customer orders OR production orders
- **Delivery Verification** - Optional delivery receipt attachment
- **Payment Tracking** - Due dates, paid dates, status tracking
- **Tax Calculations** - Automatic tax calculations
- **Discount Management** - Percentage and fixed discounts

### Sales Invoice Features
- **Line Item Details** - Product, quantity, price breakdown
- **Tax Management** - Configurable tax rates
- **Payment Terms** - Flexible payment terms
- **PDF Generation** - Printable invoice format
- **Multiple Formats** - Support for different invoice layouts

### Delivery Receipt Features
- **Delivery Confirmation** - Signature capture
- **Photo Evidence** - Delivery proof photos
- **Tracking Integration** - Courier tracking numbers
- **Recipient Details** - Who received the delivery
- **Delivery Address** - Specific delivery location

## 🎨 UI/UX Considerations

### Design Principles
- **Clean Tables** - Easy to scan billing data
- **Quick Actions** - One-click invoice creation
- **Status Indicators** - Clear visual status (paid, pending, overdue)
- **Search & Filter** - Find specific billing statements quickly
- **Export Options** - PDF, Excel export capabilities

### User Experience
- **Wizard-style Forms** - Step-by-step billing creation
- **Auto-population** - Pre-fill data from orders
- **Validation** - Real-time form validation
- **Progress Indicators** - Show billing workflow progress

## 📈 Analytics & Reporting

### Key Metrics
- **Monthly Sales** - Total sales by month
- **Customer Analysis** - Top customers by revenue
- **Payment Tracking** - Outstanding payments
- **Delivery Performance** - Delivery success rates
- **Invoice Efficiency** - Time from order to invoice

### Reports
- **Sales Summary** - Overall sales performance
- **Customer Statements** - Individual customer billing
- **Overdue Reports** - Outstanding payments
- **Delivery Reports** - Delivery performance metrics

## 🔒 Security Considerations

### Access Control
- **Admin Only** - Billing features restricted to admin users
- **Server Actions** - All operations via server-side actions
- **Data Validation** - Strict input validation in server actions
- **Audit Trail** - Track all billing modifications
- **Financial Data Protection** - Secure handling of financial information

## 🚀 Future Enhancements

### Potential Features
- **Payment Gateway Integration** - Direct payment processing
- **Automated Reminders** - Overdue payment notifications
- **Multi-currency Support** - International billing
- **Subscription Billing** - Recurring billing support
- **Customer Portal** - Customer-facing billing portal

## 📝 Implementation Notes

### Technical Requirements
- **Database**: PostgreSQL with Prisma ORM
- **Server Actions**: Next.js 13+ server actions pattern
- **Authentication**: NextAuth.js for user management
- **PDF Generation**: jsPDF or similar for invoice generation
- **File Upload**: For delivery receipt photos/signatures
- **Export**: CSV/Excel export functionality

### Development Standards
- **Server Actions Only** - No API routes
- **TypeScript** - Strict typing for all components
- **Error Handling** - Comprehensive error management in server actions
- **Validation** - Zod schemas for form validation
- **Testing** - Unit tests for server actions
- **Documentation** - Inline code documentation
- **Performance** - Optimized Prisma queries

## ✅ Success Criteria

### Functional Requirements
- [ ] Create billing statements from customer/production orders
- [ ] Generate professional sales invoices
- [ ] Track delivery receipts with proof
- [ ] Monitor payment status and due dates
- [ ] Generate sales reports and analytics

### Non-Functional Requirements
- [ ] Page load times under 2 seconds
- [ ] Mobile-responsive design
- [ ] Accessible UI (WCAG 2.1 AA)
- [ ] Secure financial data handling via server actions
- [ ] Scalable architecture for growth

---

## 🎯 Next Steps

1. **Phase 1**: Implement server actions in `src/lib/actions/`
2. **Phase 2**: Create TypeScript definitions in `src/types/admin/`
3. **Phase 3**: Build React components in `src/components/module/admin/`
4. **Phase 4**: Create Next.js pages in `src/app/admin/(protected)/`
5. **Phase 5**: Integrate with existing workflows

**Priority**: High - Critical for complete order-to-cash workflow
**Timeline**: 2-3 weeks for core functionality
**Dependencies**: Existing customer orders and production order systems

**Architecture**: Server Actions pattern (NO API routes)

## 📄 Implemented Pages Documentation

This section documents the implemented billing pages based on the current codebase. It covers the structure, components, data flow, fields, and input data for each page.

### Billing Dashboard (src/app/admin/(protected)/billing/page.tsx)

#### Purpose
Provides an overview of billing metrics, status breakdowns, recent activities, quick actions, and lists of recent billing statements and sales invoices.

#### Key Components
- **Analytics Cards**: Display Total Revenue, Paid Amount, Pending Amount, and Overdue using `AnalyticsCard` component.
- **Status Overview**: Card showing breakdown of billing statement statuses (e.g., PAID, OVERDUE) with badges.
- **Recent Activity**: List of recent actions with descriptions, user names, and timestamps.
- **Quick Actions**: Buttons linking to create billing statement, sales invoice, delivery receipt, and view reports.
- **Recent Billing Statements**: List of recent statements with statement number, customer, amount, and status.
- **Recent Sales Invoices**: Similar list for invoices with invoice number, customer, amount, and status.
- **Floating Chatbox**: Integrated for support.

#### Data Flow
- Fetches data asynchronously using server actions: `getComprehensiveBillingAnalytics`, `getAllBillingStatements`, `getAllSalesInvoices`, `getAllDeliveryReceipts`.
- Handles errors by displaying skeletons or error messages.
- Uses Suspense for loading states with skeleton placeholders.
- No direct user inputs; serves as a navigational and overview page.
- Data inputted/derived: Analytics values (e.g., totalRevenue, paidAmount) formatted as currency.

#### Fields and Inputs
- This is a read-only dashboard; no form fields. Links navigate to creation pages.

### Billing Statements List (src/app/admin/(protected)/billing/billing-statements/page.tsx)

#### Purpose
Lists all billing statements with search, filtering, summary analytics, and actions like view, download, edit, mark paid, delete.

#### Key Components
- **Summary Cards**: Display Total Statements, Paid Amount, Overdue Amount, Total Revenue.
- **Search and Filters**: Input for search, Select for status filter (All, Draft, Sent, Paid, Overdue, Cancelled), More Filters button.
- **Table**: Columns include Statement #, Customer (name and email), Order Info (order number, production details, delivery), Amount (net and total), Status (badge), Billing Date, Due Date, Actions (dropdown).
- **Actions Dropdown**: View Details, Download PDF, Edit (if draft), Mark as Paid (if sent), Delete (if draft).
- **Empty State**: Message and button to create new statement if no data.

#### Data Flow
- Fetches statements using `getAllBillingStatements` (paginated to 50 items) and analytics using `getBillingAnalytics`.
- Supports client-side search and status filtering.
- Uses Suspense for loading with table skeleton.
- Error handling shows refresh button.
- Data inputted/derived: Statement details from database, formatted dates and currency.

#### Fields and Inputs
- **Search Input**: Text search for statements.
- **Status Select**: Filters by billing status.
- No creation forms; actions link to detail/edit pages.

### Create Billing Statement (src/app/admin/(protected)/billing/billing-statements/create/page.tsx)

#### Purpose
Form-based page to create a new billing statement, linking to sources like orders and receipts, adding invoice items, and calculating totals.

#### Key Components
- **Form Sections**:
  - Basic Information: Statement Number (disabled), Customer Name*, Billing Date*, Due Date, Notes.
  - Source Information: Customer Order (select), Production Order (select), Delivery Receipt (select).
  - Invoice Items: Multiple addable items with Description*, Quantity*, Unit Price*, Product Code, Unit (select), Discount %, Taxable checkbox. Buttons to add/remove items.
  - Additional Details: PO Number, Payment Terms (select), Terms & Conditions, Footer Notes.
- **Billing Summary Sidebar**: Displays Subtotal, Tax, Discount, Net Amount; fields for Tax Rate, Discount Amount.
- **Quick Actions**: Preview Statement, Save as Draft (disabled in code).
- **Status Information**: Shows Draft status, created date, created by.
- **Buttons**: Back, Cancel, Save Statement.

#### Data Flow
- Loads data on mount: customer orders, production orders, delivery receipts, sales invoices using respective server actions.
- Auto-populates fields on selection (e.g., customer name from order, amounts calculated).
- Real-time calculations for totals on changes to quantity, price, tax, discount.
- Submits form data to `createBillingStatement` server action.
- Uses React Hook Form with Zod validation.
- Handles loading with spinner, errors with toasts.

#### Fields and Inputs
- **Required (*)**: Customer Name, Billing Date, Description/Quantity/Unit Price per item.
- **Selects**: Customer Order (from loaded orders), Production Order, Delivery Receipt, Unit (PCS, KG, etc.), Payment Terms (Net 30, etc.).
- **Numbers**: Quantity (decimal), Unit Price (decimal), Discount % (0-100), Tax Rate (%), Discount Amount.
- **Dates**: Billing Date, Due Date (date inputs).
- **Textareas**: Notes, Terms & Conditions, Footer Notes.
- **Checkbox**: Taxable per item.
- **Derived**: Subtotal (sum of items), Tax Amount (subtotal * taxRate/100), Net Amount (subtotal + tax - discount).
- Validation ensures required fields, positive numbers, valid dates.

#### Creation Flow
1. Select sources (order/production/delivery) to auto-fill data.
2. Add/edit invoice items; totals update automatically.
3. Set tax, discount, terms.
4. Add notes and details.
5. Submit to create statement and redirect to list.

Note: The detail view page ([id]/page.tsx) appears not fully implemented yet based on available code; it may follow similar patterns to the list and create pages.
