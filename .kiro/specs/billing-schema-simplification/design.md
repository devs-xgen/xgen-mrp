# Design Document

## Overview

This design document outlines the simplified billing schema structure for the MRP system. The goal is to create clearer relationships between billing entities while maintaining all necessary functionality and improving maintainability.

## Architecture

### Current Schema Issues
- BillingStatement has too many nullable foreign keys (customerId?, customerOrderId?, productionOrderId?, deliveryReceiptId?, salesInvoiceId?)
- Unclear relationship flow between entities
- DeliveryReceipt has unnecessary complexity with too many optional fields
- SalesInvoice relationship to BillingStatement is unclear

### Proposed Schema Changes

#### 1. Simplified BillingStatement Model
```prisma
model BillingStatement {
  id                String           @id @default(cuid())
  statementNumber   String           @unique
  
  // Customer Information (Required - at least one must be provided)
  customerId        String?          // Direct customer reference
  customerOrderId   String?          // Or reference via customer order
  customerName      String           // Derived/cached customer name
  
  // Optional Production Link
  productionOrderId String?          // Optional production order link
  
  // Financial Information
  totalAmount       Decimal          @db.Decimal(12, 2)
  taxAmount         Decimal          @default(0) @db.Decimal(12, 2)
  discountAmount    Decimal          @default(0) @db.Decimal(12, 2)
  netAmount         Decimal          @db.Decimal(12, 2)
  
  // Status and Dates
  status            BillingStatus    @default(DRAFT)
  billingDate       DateTime         @default(now())
  dueDate           DateTime?
  paidDate          DateTime?
  
  // Metadata
  notes             String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  createdBy         String?
  modifiedBy        String?
  
  // Relationships
  customer          Customer?        @relation(fields: [customerId], references: [id])
  customerOrder     CustomerOrder?   @relation(fields: [customerOrderId], references: [id])
  productionOrder   ProductionOrder? @relation(fields: [productionOrderId], references: [id])
  createdByUser     User?            @relation("CreatedBillingStatements", fields: [createdBy], references: [id])
  modifiedByUser    User?            @relation("ModifiedBillingStatements", fields: [modifiedBy], references: [id])
  
  // One-to-One with SalesInvoice
  salesInvoice      SalesInvoice?    @relation("BillingToInvoice")
  
  // One-to-Many with DeliveryReceipts
  deliveryReceipts  DeliveryReceipt[]
  
  @@index([customerId])
  @@index([customerName])
  @@index([customerOrderId])
  @@index([productionOrderId])
  @@index([status])
  @@index([billingDate])
}
```

#### 2. Simplified SalesInvoice Model
```prisma
model SalesInvoice {
  id                String             @id @default(cuid())
  invoiceNumber     String             @unique
  
  // Direct link to billing statement (Required)
  billingStatementId String            @unique
  
  // Invoice Details
  invoiceDate       DateTime           @default(now())
  subtotal          Decimal            @db.Decimal(12, 2)
  taxRate           Decimal            @default(0) @db.Decimal(5, 2)
  taxAmount         Decimal            @default(0) @db.Decimal(12, 2)
  discountAmount    Decimal            @default(0) @db.Decimal(12, 2)
  totalAmount       Decimal            @db.Decimal(12, 2)
  
  // Payment Information
  paymentTerms      String?
  dueDate           DateTime?
  status            InvoiceStatus      @default(DRAFT)
  
  // Additional Information
  poNumber          String?
  terms             String?
  footerNotes       String?
  
  // Metadata
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  createdBy         String?
  modifiedBy        String?
  
  // Relationships
  billingStatement  BillingStatement   @relation("BillingToInvoice", fields: [billingStatementId], references: [id], onDelete: Cascade)
  createdByUser     User?              @relation("CreatedSalesInvoices", fields: [createdBy], references: [id])
  modifiedByUser    User?              @relation("ModifiedSalesInvoices", fields: [modifiedBy], references: [id])
  invoiceItems      SalesInvoiceItem[]
  
  @@index([invoiceDate])
  @@index([status])
  @@index([dueDate])
  @@index([billingStatementId])
}
```

#### 3. Simplified DeliveryReceipt Model
```prisma
model DeliveryReceipt {
  id                String           @id @default(cuid())
  receiptNumber     String           @unique
  
  // Link to billing statement (Required)
  billingStatementId String
  
  // Essential Delivery Information
  deliveryDate      DateTime
  deliveryAddress   String
  receivedBy        String
  receivedByTitle   String?
  
  // Optional Proof
  signatureImage    String?
  photoEvidence     String?
  
  // Optional Tracking
  trackingNumber    String?
  courierService    String?
  
  // Status and Notes
  deliveryStatus    DeliveryStatus   @default(DELIVERED)
  deliveryNotes     String?
  
  // Metadata
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  createdBy         String?
  modifiedBy        String?
  
  // Relationships
  billingStatement  BillingStatement @relation(fields: [billingStatementId], references: [id], onDelete: Cascade)
  createdByUser     User?            @relation("CreatedDeliveryReceipts", fields: [createdBy], references: [id])
  modifiedByUser    User?            @relation("ModifiedDeliveryReceipts", fields: [modifiedBy], references: [id])
  
  @@index([deliveryDate])
  @@index([deliveryStatus])
  @@index([billingStatementId])
}
```

## Components and Interfaces

### 1. Database Constraints
- BillingStatement must have either customerId OR customerOrderId (enforced at application level)
- customerName is automatically derived from customer or customerOrder
- SalesInvoice has required billingStatementId (one-to-one relationship)
- DeliveryReceipt has required billingStatementId (many-to-one relationship)

### 2. Business Logic Rules
- When creating BillingStatement from CustomerOrder, customerId is derived from order
- When creating BillingStatement directly, customerId must be provided
- customerName is always populated from the related customer record
- SalesInvoice is automatically created when BillingStatement is finalized
- DeliveryReceipt can be created multiple times for the same BillingStatement (partial deliveries)

### 3. Migration Strategy
- Create new simplified models alongside existing ones
- Migrate existing data to new structure
- Update application code to use new relationships
- Remove old models after successful migration

## Data Models

### Key Changes Summary
1. **BillingStatement**: Removed salesInvoiceId and deliveryReceiptId foreign keys, added one-to-one and one-to-many relationships
2. **SalesInvoice**: Added required billingStatementId, removed reverse relationship array
3. **DeliveryReceipt**: Added required billingStatementId, removed itemsDelivered JSON field, simplified optional fields
4. **Relationships**: Clearer one-to-one (BillingStatement ↔ SalesInvoice) and one-to-many (BillingStatement → DeliveryReceipt)

### Workflow Integration
1. **Customer Order → Billing**: CustomerOrder → BillingStatement (via customerOrderId)
2. **Direct Billing**: Customer → BillingStatement (via customerId)
3. **Invoice Generation**: BillingStatement → SalesInvoice (automatic)
4. **Delivery Tracking**: BillingStatement → DeliveryReceipt[] (multiple allowed)
5. **Production Link**: ProductionOrder → BillingStatement (optional)

## Error Handling

### Validation Rules
- BillingStatement creation requires either customerId or customerOrderId
- customerName is automatically populated and cannot be manually set
- SalesInvoice cannot exist without a BillingStatement
- DeliveryReceipt must reference a valid BillingStatement
- Financial amounts must be positive decimals

### Error Scenarios
- Missing customer information → Validation error
- Duplicate invoice creation → Prevent duplicate SalesInvoice for same BillingStatement
- Invalid delivery receipt → Validate billingStatementId exists
- Orphaned records → Cascade delete prevents orphaned SalesInvoice/DeliveryReceipt

## Testing Strategy

### Unit Tests
- Model validation tests for required fields
- Relationship constraint tests
- Business logic tests for customer name derivation
- Financial calculation tests

### Integration Tests
- End-to-end billing workflow tests
- Migration script tests
- Database constraint tests
- API endpoint tests with new schema

### Data Migration Tests
- Test migration of existing BillingStatements
- Test migration of existing SalesInvoices
- Test migration of existing DeliveryReceipts
- Verify data integrity after migration