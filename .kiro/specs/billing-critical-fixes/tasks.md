# Implementation Plan

- [x] 1. Create decimal serialization utilities
  - Create `src/lib/utils/decimal-serializer.ts` with conversion functions
  - Implement `serializeDecimal()` and `deserializeDecimal()` functions
  - Add type definitions for serializable decimal data
  - Create unit tests for decimal conversion accuracy
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Update server actions to handle decimal serialization
  - Modify `src/lib/actions/simple-billing-statements.ts` to serialize Decimal objects
  - Update `getBillingStatements()` to return serializable data
  - Update `getBillingStatement()` to serialize individual statement data
  - Create wrapper functions for all billing-related server actions
  - _Requirements: 1.1, 1.2_

- [x] 3. Fix Next.js params handling in billing statement pages
  - Update `src/app/admin/(protected)/billing/billing-statements/[id]/page.tsx` to use React.use()
  - Create params handling utility in `src/lib/utils/params-handler.ts`
  - Update `BillingStatementPage` component to properly await params
  - Add error handling for params resolution
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Create PDF generation service for billing documents
  - Create `src/lib/services/pdf-generator.ts` with PDF generation functions
  - Implement `generateBillingStatementPDF()` function
  - Create PDF templates for billing statements with proper formatting
  - Add company branding and styling to PDF templates
  - _Requirements: 3.3, 4.3, 5.2_

- [x] 5. Implement delivery receipts page and export functionality
  - Create `src/app/admin/(protected)/billing/delivery-receipts/page.tsx`
  - Implement delivery receipts table component
  - Add download receipt functionality with PDF generation
  - Create export functionality for delivery receipts data
  - Add proper loading states and error handling
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Create delivery receipt PDF generation
  - Implement `generateDeliveryReceiptPDF()` in PDF generator service
  - Create delivery receipt PDF template with proper formatting
  - Add delivery details, customer information, and item listings
  - Include proper branding and legal information
  - _Requirements: 3.1, 3.3_

- [ ] 7. Fix sales invoice PDF download functionality
  - Update sales invoice page to use PDF generation service
  - Implement `generateSalesInvoicePDF()` function
  - Create sales invoice PDF template with invoice items
  - Add download button functionality to sales invoice pages
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Implement sales invoice export functionality
  - Create export service in `src/lib/services/export-service.ts`
  - Implement `exportSalesInvoices()` function for CSV/Excel export
  - Add export button to sales invoice list page
  - Include all invoice data and items in export
  - _Requirements: 4.2, 4.3_

- [ ] 9. Fix billing statement edit functionality
  - Create `src/app/admin/(protected)/billing/billing-statements/[id]/edit/page.tsx`
  - Implement edit form with pre-populated data from existing statement
  - Add proper form validation and error handling
  - Ensure decimal values are properly handled in edit form
  - _Requirements: 5.1, 5.3_

- [ ] 10. Fix billing statement PDF download
  - Add download PDF functionality to billing statement detail page
  - Implement proper PDF generation with all statement details
  - Add download button to billing statement list and detail views
  - Ensure PDF includes customer information and invoice items
  - _Requirements: 5.2, 5.3_

- [ ] 11. Update UI components for better responsiveness
  - Fix loading states in all billing-related components
  - Add proper error boundaries and error display components
  - Implement immediate visual feedback for user interactions
  - Update form components to show validation states clearly
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. Create comprehensive error handling system
  - Create `src/components/ui/error-boundary.tsx` for error boundaries
  - Implement error display components for different error types
  - Add error recovery mechanisms for failed operations
  - Create user-friendly error messages for common issues
  - _Requirements: 6.3_

- [ ] 13. Add proper loading states and feedback
  - Create loading spinner components for async operations
  - Add loading states to all export and download operations
  - Implement progress indicators for long-running operations
  - Add success/failure notifications for user actions
  - _Requirements: 6.1, 6.2_

- [ ] 14. Test and validate all fixes
  - Test decimal serialization across all billing components
  - Verify Next.js params handling works correctly
  - Test PDF generation and download functionality
  - Validate export functionality for all billing modules
  - Test edit functionality for billing statements
  - Verify UI responsiveness and error handling
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_