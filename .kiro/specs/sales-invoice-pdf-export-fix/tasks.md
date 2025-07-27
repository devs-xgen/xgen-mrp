# Implementation Plan

- [ ] 1. Implement PDF export server action
  - Create `exportSalesInvoicePDF` function in `/src/lib/actions/sales-invoices.ts`
  - Add proper authentication and authorization checks
  - Integrate with existing `generateSalesInvoicePDF` service
  - Implement structured error handling and response format
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement CSV export server action
  - Create `exportSalesInvoicesData` function in `/src/lib/actions/sales-invoices.ts`
  - Build database query with proper relationships and filtering
  - Generate CSV content with all required columns (invoice number, customer, dates, amounts, etc.)
  - Add filename generation with timestamp
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Add TypeScript interfaces and types
  - Define `PDFExportResponse` interface for PDF export responses
  - Define `CSVExportResponse` interface for CSV export responses
  - Add proper type exports to billing types file
  - Update existing types if needed for compatibility
  - _Requirements: 3.2, 3.3_

- [ ] 4. Create unit tests for server actions
  - Write tests for `exportSalesInvoicePDF` with mocked database calls
  - Write tests for `exportSalesInvoicesData` with various filter scenarios
  - Test authentication and authorization flows
  - Test error handling and edge cases
  - _Requirements: 1.4, 2.4, 3.3_

- [ ] 5. Update client components to use server actions
  - Identify components currently using the API route for PDF download
  - Replace API calls with server action calls
  - Add proper loading states and error handling
  - Implement file download functionality using server action responses
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 6. Add CSV export UI functionality
  - Add bulk export button to sales invoices page
  - Implement filter options for CSV export (date range, status, customer)
  - Add loading states and success feedback
  - Handle CSV download trigger in browser
  - _Requirements: 4.2, 4.3, 4.4_

- [ ] 7. Remove deprecated API route
  - Delete `/src/app/api/admin/billing/sales-invoices/[id]/download/route.ts`
  - Verify no remaining references to the API route
  - Clean up any unused imports or dependencies
  - Update any documentation or comments referencing the old API
  - _Requirements: 3.1, 3.4_

- [ ] 8. Add integration tests
  - Test complete PDF download flow from UI to file generation
  - Test CSV export with various filter combinations
  - Test error scenarios and user feedback
  - Verify file download functionality works correctly
  - _Requirements: 1.4, 2.4, 4.4_

- [ ] 9. Update error handling and user feedback
  - Ensure consistent error messages across both export functions
  - Add proper toast notifications for success and error states
  - Implement retry mechanisms where appropriate
  - Test all error scenarios thoroughly
  - _Requirements: 1.4, 2.4, 4.4_

- [ ] 10. Performance optimization and final testing
  - Optimize database queries for CSV export with large datasets
  - Test memory usage for PDF generation
  - Verify proper cleanup of temporary resources
  - Conduct end-to-end testing of all functionality
  - _Requirements: 3.4, 4.4_