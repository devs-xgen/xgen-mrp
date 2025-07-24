# Implementation Plan

- [x] 1. Create billing type selection components
  - Create BillingTypeOption interface and data structure
  - Implement BillingTypeSelector component with card-based selection
  - Add icons and descriptions for each billing type option
  - Implement responsive grid layout for billing type cards
  - Add hover states and selection animations
  - Create unit tests for billing type selection functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 5.1, 5.4_

- [x] 2. Implement enhanced customer selection components
  - Create CustomerOrderSelector component with searchable dropdown
  - Implement DirectCustomerSelector component with customer search
  - Create ManualCustomerEntry component for free text input
  - Add customer/order preview cards with detailed information
  - Implement auto-population logic for customer name and details
  - Add clear/reset functionality for each selection type
  - Create unit tests for all customer selection components
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.3, 5.2_

- [x] 3. Update billing form layout and structure
  - Refactor BillingStatementForm to use step-based flow
  - Implement responsive grid layout with main form and sidebar
  - Create CustomerInformationCard component with conditional rendering
  - Update form state management to handle billing type selection
  - Add form step navigation and progress indicators
  - Implement form section organization and logical grouping
  - Create integration tests for form layout and navigation
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.4_

- [x] 4. Enhance form validation and error handling
  - Update billingStatementSchema to include billing type validation
  - Implement conditional validation based on selected billing type
  - Create enhanced error display components (FormFieldError, FormSectionError)
  - Add real-time validation with inline error messages
  - Implement form state validation for each billing type scenario
  - Add comprehensive error handling for network and server errors
  - Create unit tests for validation logic and error handling
  - _Requirements: 3.4, 3.5, 5.3_

- [x] 5. Create 2 summary and calculation components
  - Enhance BillingSummaryCard with real-time calculation updates
  - Create CustomerSummaryCard to show selected customer information
  - Implement calculation logic with proper decimal handling
  - Add visual indicators for auto-populated vs manual data
  - Create calculation change handlers with validation
  - Add summary review functionality before form submission
  - Create unit tests for calculation accuracy and summary display
  - _Requirements: 4.3, 4.4, 3.3, 5.2_

- [x] 6. Implement customer order integration
  - Update getCustomerOrders action to include necessary relationship data
  - Implement order search and filtering functionality
  - Add order details preview with customer and financial information
  - Create auto-population logic for order-based billing
  - Implement order item mapping to invoice items
  - Add order status validation and business rules
  - Create integration tests for customer order billing flow
  - _Requirements: 2.3, 2.4, 3.3, 4.2_

- [x] 7. Enhance direct customer billing functionality
  - Update getAllCustomers action to include search and filtering
  - Implement customer search with name, email, and code matching
  - Add customer details preview with contact and payment information
  - Create customer selection validation and business rules
  - Implement customer-based auto-population logic
  - Add customer credit limit and payment terms display
  - Create integration tests for direct customer billing flow
  - _Requirements: 2.1, 3.3, 4.2, 5.2_

- [x] 8. Implement manual customer entry functionality
  - Create ManualCustomerEntry component with validation
  - Add optional customer details fields (email, phone, address)
  - Implement manual customer name validation and formatting
  - Create clear visual indicators for manual entry mode
  - Add customer information persistence for future reference
  - Implement manual entry business rules and validation
  - Create unit tests for manual customer entry functionality
  - _Requirements: 2.2, 3.3, 3.4, 5.2_

- [x] 9. Update invoice items management
  - Enhance invoice item components with better UX
  - Implement drag-and-drop reordering for invoice items
  - Add bulk item operations (add multiple, import from template)
  - Create item validation with real-time feedback
  - Implement auto-calculation for item totals and discounts
  - Add item templates and quick-add functionality
  - Create unit tests for invoice item management
  - _Requirements: 4.3, 4.4, 5.1_

- [x] 10. Implement responsive design and accessibility
  - Ensure all components work properly on mobile devices
  - Add proper ARIA labels and accessibility attributes
  - Implement keyboard navigation for all form elements
  - Add screen reader support for dynamic content updates
  - Test and fix responsive layout issues across screen sizes
  - Implement proper focus management for form flow
  - Create accessibility tests and compliance validation
  - _Requirements: 5.1, 5.4_

- [ ] 11. Add form state persistence and recovery
  - Implement local storage for form data persistence
  - Add form recovery functionality for interrupted sessions
  - Create form dirty state tracking and unsaved changes warnings
  - Implement form auto-save functionality
  - Add form data validation on recovery
  - Create user notifications for form state changes
  - Create integration tests for form persistence functionality
  - _Requirements: 4.5, 5.4_

- [ ] 12. Update billing statement creation page
  - Refactor create billing statement page to use enhanced form
  - Update page layout and navigation elements
  - Add breadcrumb navigation and page context
  - Implement proper loading states and error boundaries
  - Add page-level validation and submission handling
  - Update page metadata and SEO elements
  - Create end-to-end tests for billing statement creation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.5, 5.4_

- [ ] 13. Enhance billing dashboard integration
  - Update billing dashboard to highlight new creation flow
  - Add quick action buttons for different billing types
  - Implement dashboard analytics for billing type usage
  - Create billing type recommendations based on user patterns
  - Add recent billing statements with type indicators
  - Update dashboard navigation to new billing creation flow
  - Create integration tests for dashboard and billing form interaction
  - _Requirements: 5.1, 5.4_

- [ ] 14. Test and validate the enhanced billing UI
  - Perform comprehensive testing of all billing type flows
  - Test form validation and error handling scenarios
  - Validate calculation accuracy and real-time updates
  - Test responsive design across different devices and browsers
  - Perform accessibility testing and compliance validation
  - Test form performance with large datasets
  - Conduct user acceptance testing with different user personas
  - Create comprehensive test documentation and user guides
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_