# Requirements Document

## Introduction

This feature addresses the need to refactor the PDF download and export functionality for sales invoices from API routes to server actions. The current implementation uses API routes (`/api/admin/billing/sales-invoices/[id]/download/route.ts`) which should be replaced with server actions located in the actions directory for better performance, maintainability, and consistency with the application architecture.

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to download individual sales invoice PDFs using server actions instead of API routes, so that the system has better performance and consistency.

#### Acceptance Criteria

1. WHEN an admin clicks the download PDF button for a sales invoice THEN the system SHALL generate and download the PDF using a server action
2. WHEN the PDF is generated THEN the system SHALL use the existing PDF generator service without modification
3. WHEN the download is initiated THEN the system SHALL provide proper authentication and authorization checks
4. WHEN the PDF generation fails THEN the system SHALL provide appropriate error handling and user feedback

### Requirement 2

**User Story:** As an admin user, I want to export multiple sales invoices data to CSV format using server actions, so that I can analyze sales data efficiently.

#### Acceptance Criteria

1. WHEN an admin requests to export sales invoices data THEN the system SHALL generate a CSV file with all relevant invoice information
2. WHEN the export is requested THEN the system SHALL include filters for date range, status, and customer selection
3. WHEN the CSV is generated THEN the system SHALL include columns for invoice number, customer name, date, amount, status, and payment terms
4. WHEN the export is completed THEN the system SHALL provide a downloadable CSV file with a descriptive filename

### Requirement 3

**User Story:** As a developer, I want the existing API route removed and replaced with server actions, so that the codebase follows consistent patterns and architecture.

#### Acceptance Criteria

1. WHEN the refactoring is complete THEN the API route `/api/admin/billing/sales-invoices/[id]/download/route.ts` SHALL be deleted
2. WHEN server actions are implemented THEN they SHALL be located in `/src/lib/actions/sales-invoices.ts`
3. WHEN the new server actions are created THEN they SHALL follow the same patterns as existing actions in the codebase
4. WHEN the refactoring is complete THEN all existing functionality SHALL work without breaking changes

### Requirement 4

**User Story:** As an admin user, I want the PDF download and CSV export functionality to be accessible from the sales invoices page, so that I can easily access these features.

#### Acceptance Criteria

1. WHEN viewing the sales invoices list THEN the system SHALL provide individual PDF download buttons for each invoice
2. WHEN viewing the sales invoices list THEN the system SHALL provide a bulk export button for CSV data export
3. WHEN the download/export actions are triggered THEN the system SHALL show appropriate loading states
4. WHEN the actions complete successfully THEN the system SHALL provide success feedback to the user