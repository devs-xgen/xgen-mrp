# Billing Feature Documentation

## Scope

Billing is a major operational domain with dedicated admin and superadmin screens for billing statements, sales invoices, delivery receipts, report views, PDF generation, CSV export, and public share links.

## Primary Admin Routes

Under `src/app/admin/(protected)/billing`:

- `page.tsx`
- `billing-reports/page.tsx`
- `billing-statements/**`
- `simple-billing-statements/page.tsx`
- `sales-invoices/**`
- `delivery-receipts/**`

Equivalent superadmin routes exist under `src/app/superadmin/(protected)/billing/**`.

## Public and API Surfaces

- Shared documents: `src/app/api/shared-documents/[token]/route.ts`
- Share-link management: `src/app/api/share-links/**`
- Billing PDF generation: `src/app/api/billing/pdf/route.ts`
- Public shared document routes are also handled through share-style pages under the app router

## Core Data Models

- `BillingStatement`
- `SalesInvoice`
- `SalesInvoiceItem`
- `DeliveryReceipt`
- `ShareableLink`
- `Transaction`

## Main Code Areas

- Admin billing UI: `src/components/module/admin/billing/**`
- Shared billing and document views: `src/components/shared/SharedBillingStatementView.tsx`, `src/components/shared/SharedSalesInvoiceView.tsx`, `src/components/shared/SharedDeliveryReceiptView.tsx`
- Actions: `src/lib/actions/billing-statements.ts`, `src/lib/actions/enhanced-billing-statements.ts`, `src/lib/actions/simple-billing-statements.ts`, `src/lib/actions/sales-invoices.ts`, `src/lib/actions/delivery-receipts.ts`, `src/lib/actions/billing-reports.ts`, `src/lib/actions/shareable-link.ts`
- PDF services: `src/lib/services/pdf-generator.tsx`, `src/lib/services/delivery-receipt-pdf.ts`

## What Is Implemented

- Billing statement CRUD and multiple billing flows
- Sales invoice and delivery receipt management
- Report pages for billing
- PDF export and document sharing
- CSV/export helpers and related tests

## Documentation Boundary

Earlier docs claimed payment gateways, recurring billing engines, and accounting-system integrations. Those claims were removed. The current documentation is limited to the implemented document and billing-record workflows present in this repository.

## Related Docs

- [Admin](../../roles/admin/README.md)
- [SuperAdmin](../../roles/superadmin/README.md)
- [Customer Management](../customer-management/README.md)
- [Technical Overview](../../technical/README.md)
