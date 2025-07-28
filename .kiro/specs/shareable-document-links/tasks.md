# Implementation Plan

- [x] 1. Set up database schema and core models
  - Add ShareableLink model to Prisma schema with all required fields and relationships
  - Add ShareableDocType enum to schema
  - Generate Prisma client and run database migration
  - _Requirements: 1.3, 2.2, 3.2, 4.1, 6.1_

- [x] 2. Create core API endpoints for share link management
  - [x] 2.1 Implement share link generation API endpoint
    - Create POST /api/share-links route handler
    - Implement cryptographically secure token generation using crypto.randomBytes
    - Add database operations to create and store shareable links
    - Include proper error handling and validation
    - _Requirements: 1.2, 2.2, 3.2, 6.1_

  - [x] 2.2 Implement share link retrieval API endpoint
    - Create GET /api/share-links/[documentType]/[documentId] route handler
    - Add database queries to fetch existing links for a document
    - Include link status and expiration checking
    - _Requirements: 4.2_

  - [x] 2.3 Implement share link revocation API endpoint
    - Create DELETE /api/share-links/[linkId] route handler
    - Add database operations to mark links as revoked
    - Include audit logging for revocation actions
    - _Requirements: 4.3_

- [x] 3. Create shared document retrieval API
  - [x] 3.1 Implement shared document API endpoint
    - Create GET /api/shared-documents/[token] route handler
    - Add token validation and expiration checking
    - Implement document retrieval logic for all three document types
    - Add access logging and rate limiting
    - _Requirements: 1.5, 2.3, 3.3, 5.3, 6.3_

  - [x] 3.2 Create document data transformation utilities
    - Write utility functions to transform BillingStatement to SharedBillingStatement
    - Write utility functions to transform SalesInvoice to SharedSalesInvoice
    - Write utility functions to transform DeliveryReceipt to SharedDeliveryReceipt
    - Include proper data sanitization and customer information handling
    - _Requirements: 5.1, 5.2_

- [x] 4. Build share link management components
  - [x] 4.1 Create ShareLinkButton component
    - Build reusable button component for generating shareable links
    - Add loading states and success/error feedback
    - Implement copy-to-clipboard functionality with confirmation
    - Include proper TypeScript interfaces and props validation
    - _Requirements: 1.1, 2.1, 3.1, 7.1, 7.2_

  - [x] 4.2 Create ShareLinkManager component
    - Build component to display existing shareable links for a document
    - Add functionality to view link details (creation date, expiration, access count)
    - Implement link revocation with confirmation dialog
    - Include link status indicators (active, expired, revoked)
    - _Requirements: 4.2, 4.3, 7.4_

- [x] 5. Integrate share functionality into existing admin pages
  - [x] 5.1 Add share functionality to billing statements pages
    - Integrate ShareLinkButton into billing statement detail views
    - Add ShareLinkManager to show existing links
    - Update existing billing statement pages in src/app/admin/(protected)/billing/billing-statements/
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Add share functionality to sales invoices pages
    - Integrate ShareLinkButton into sales invoice detail views
    - Add ShareLinkManager to show existing links
    - Update existing sales invoice pages in src/app/admin/(protected)/billing/sales-invoices/
    - _Requirements: 3.1, 3.2_

  - [x] 5.3 Add share functionality to delivery receipts pages
    - Integrate ShareLinkButton into delivery receipt detail views
    - Add ShareLinkManager to show existing links
    - Update existing delivery receipt pages in src/app/admin/(protected)/billing/delivery-receipts/
    - _Requirements: 2.1, 2.2_

- [x] 6. Create public document viewing routes and components
  - [x] 6.1 Create public billing statement share route
    - Create src/app/billing-statement/share/[token]/page.tsx
    - Implement server-side document fetching and validation
    - Add proper error handling for expired/invalid tokens
    - Include SEO metadata and proper page structure
    - _Requirements: 1.4, 1.5, 5.4_

  - [x] 6.2 Create public sales invoice share route
    - Create src/app/sales-invoice/share/[token]/page.tsx
    - Implement server-side document fetching and validation
    - Add proper error handling for expired/invalid tokens
    - Include SEO metadata and proper page structure
    - _Requirements: 3.3, 3.4, 5.4_

  - [x] 6.3 Create public delivery receipt share route
    - Create src/app/delivery-receipt/share/[token]/page.tsx
    - Implement server-side document fetching and validation
    - Add proper error handling for expired/invalid tokens
    - Include SEO metadata and proper page structure
    - _Requirements: 2.3, 2.4, 5.4_

- [x] 7. Build shared document display components
  - [x] 7.1 Create SharedDocumentLayout component
    - Build clean, branded layout for public document views
    - Remove admin navigation and controls
    - Add company branding and contact information
    - Include print and download functionality
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 7.2 Create SharedBillingStatementView component
    - Build component to display billing statement data in public format
    - Include customer information, line items, and totals
    - Add proper formatting for dates and currency
    - Ensure accessibility compliance
    - _Requirements: 1.4, 5.1_

  - [x] 7.3 Create SharedSalesInvoiceView component
    - Build component to display sales invoice data in public format
    - Include invoice items, calculations, and payment terms
    - Add proper formatting for dates and currency
    - Ensure accessibility compliance
    - _Requirements: 3.3, 5.1_

  - [x] 7.4 Create SharedDeliveryReceiptView component
    - Build component to display delivery receipt data in public format
    - Include delivery details, recipient information, and tracking
    - Add proper formatting for dates and addresses
    - Ensure accessibility compliance
    - _Requirements: 2.3, 5.1_

- [x] 8. Implement error handling and security features
  - [x] 8.1 Create DocumentNotFound component
    - Build user-friendly error component for invalid/expired links
    - Include different messages for expired, revoked, and not-found scenarios
    - Add company contact information for support
    - Include proper styling and accessibility
    - _Requirements: 5.4, 6.4_

  - [x] 8.2 Implement rate limiting middleware
    - Create middleware to limit requests per IP address
    - Add rate limiting to shared document endpoints
    - Include proper error responses for rate limit exceeded
    - Add logging for rate limit violations
    - _Requirements: 6.3_

  - [x] 8.3 Add comprehensive audit logging
    - Implement access logging for all shared document views
    - Log IP addresses, timestamps, and document access
    - Add logging for link generation and revocation
    - Create database tables or extend existing logging if needed
    - _Requirements: 4.4, 6.4_

- [x] 9. Add configuration and environment setup
  - [x] 9.1 Create configuration utilities
    - Add environment variables for shareable links settings
    - Create configuration object for default expiration, rate limits, etc.
    - Add company information configuration for shared documents
    - Include validation for required configuration values
    - _Requirements: 6.2_

  - [x] 9.2 Create database cleanup utilities
    - Write utility function to clean up expired shareable links
    - Add scheduled cleanup process or manual cleanup command
    - Include logging for cleanup operations
    - Add configuration for cleanup frequency
    - _Requirements: 6.4_

- [-] 10. Write comprehensive tests
  - [-] 10.1 Create unit tests for core functionality
    - Write tests for token generation and validation
    - Test document data transformation utilities
    - Test API endpoint logic and error handling
    - Test component rendering and user interactions
    - _Requirements: All requirements validation_

  - [ ] 10.2 Create integration tests
    - Write end-to-end tests for share link generation flow
    - Test complete document sharing and viewing workflow
    - Test security features like rate limiting and access logging
    - Test error scenarios and edge cases
    - _Requirements: All requirements validation_