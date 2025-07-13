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
