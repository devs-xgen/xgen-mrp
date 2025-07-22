# Implementation Plan

- [x] 1. Update Prisma schema with simplified billing models
  - Modify BillingStatement model to remove salesInvoiceId and deliveryReceiptId foreign keys
  - Add one-to-one relationship between BillingStatement and SalesInvoice
  - Add one-to-many relationship between BillingStatement and DeliveryReceipt
  - Update SalesInvoice model to include required billingStatementId field
  - Update DeliveryReceipt model to include required billingStatementId field and simplify optional fields
  - Remove itemsDelivered JSON field from DeliveryReceipt
  - Add proper indexes for new foreign key relationships
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Create database migration script
  - Write Prisma migration to update existing schema
  - Add data migration logic to populate new billingStatementId fields in SalesInvoice and DeliveryReceipt
  - Handle existing nullable relationships and convert them to new structure
  - Ensure customerName is populated from customer or customerOrder data
  - Test migration script with sample data
  - _Requirements: 4.5, 4.1, 4.2, 4.3_

- [x] 3. Update TypeScript types and interfaces
  - Update billing types in src/types/admin/billing.ts to match new schema
  - Remove references to old foreign key fields
  - Add new relationship types for one-to-one and one-to-many relationships
  - Update form validation schemas to reflect new required fields
  - Update API response types to match new data structure
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [x] 4. Update server actions for billing statements
  - Modify createBillingStatement to handle either customerId or customerOrderId
  - Add logic to automatically derive customerName from customer or customerOrder
  - Update getBillingStatementById to include new relationship data
  - Modify updateBillingStatement to maintain data integrity with new relationships
  - Update getAllBillingStatements to use new relationship structure
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [x] 5. Update server actions for sales invoices
  - Modify createSalesInvoice to require billingStatementId
  - Update getSalesInvoiceById to use billingStatement relationship
  - Modify updateSalesInvoice to maintain one-to-one relationship integrity
  - Update getAllSalesInvoices to include billing statement data
  - Add validation to prevent duplicate invoices for same billing statement
  - _Requirements: 1.4, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [x] 6. Update server actions for delivery receipts
  - Modify createDeliveryReceipt to require billingStatementId
  - Remove itemsDelivered JSON handling and use simplified fields
  - Update getDeliveryReceiptById to use billingStatement relationship
  - Modify updateDeliveryReceipt to maintain relationship integrity
  - Update getAllDeliveryReceipts to include billing statement data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Update React components for billing statements
  - Modify BillingStatementForm to handle either customer or customerOrder selection
  - Update form validation to require either customerId or customerOrderId
  - Add automatic customerName population based on selection
  - Update BillingStatementList to display new relationship data
  - Modify BillingStatementCard to show simplified relationship information
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ] 8. Update React components for sales invoices
  - Modify SalesInvoiceForm to work with required billingStatementId
  - Update SalesInvoiceList to display billing statement relationship
  - Modify SalesInvoicePreview to include billing statement information
  - Update invoice creation flow to link properly with billing statements
  - Add validation to prevent duplicate invoice creation
  - _Requirements: 1.4, 2.1, 2.2, 4.1, 4.2, 4.3_

- [ ] 9. Update React components for delivery receipts
  - Modify DeliveryReceiptForm to require billingStatementId selection
  - Remove itemsDelivered JSON field handling from components
  - Update DeliveryReceiptList to display billing statement relationship
  - Simplify delivery receipt creation form with essential fields only
  - Update delivery confirmation flow to link properly with billing statements
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2_

- [ ] 10. Update database queries and joins
  - Optimize Prisma queries to use new relationship structure
  - Update billing analytics queries to use new foreign keys
  - Modify report generation queries to leverage simplified relationships
  - Update search and filter functionality to work with new schema
  - Test query performance with new indexes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 11. Run database migration and update Prisma client
  - Execute Prisma migration to apply schema changes
  - Generate new Prisma client with updated types
  - Verify migration completed successfully
  - Test database constraints and relationships
  - Update any cached data or indexes
  - _Requirements: 4.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 12. Test and validate the updated billing system
  - Test billing statement creation with customer and customerOrder scenarios
  - Verify sales invoice creation is properly linked to billing statements
  - Test delivery receipt creation with simplified fields
  - Validate all relationships work correctly in the UI
  - Test data integrity and constraint enforcement
  - Verify existing functionality still works after migration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_