# P1: Export and Import Stabilization

## Status

`Completed` — Shipped in v1.5.14

## Completion Date

2025-01-15

## Completion Summary

All acceptance criteria met. The following was implemented:

### Fixed (Misleading Excel labels)
- `src/lib/utils/report-export.ts` → `exportToExcel()` now generates a real `.xlsx` file via dynamic ExcelJS import with auto-width columns and ISO date parsing.
- `src/lib/utils/audit-export.ts` → `exportAuditToExcel()` now generates a real `.xlsx` file with two sheets: **Summary** (report metadata) and **Audit Log** (timestamped entries with date formatting).

### Added (Missing admin export surfaces)
- `src/lib/actions/customer-order.ts` → `exportCustomerOrdersData()` (CSV) and `exportCustomerOrdersExcel()` (true .xlsx) — auth-guarded, includes order number, status, customer, total amount, dates, payment status, linked production count.
- `src/lib/actions/production-order.ts` → `exportProductionOrdersData()` (CSV) and `exportProductionOrdersExcelAdmin()` (true .xlsx) — auth-guarded, includes product, SKU, variant, quantity, progress %, costs, customer, dates, operation/QC counts.
- `src/components/module/admin/customer-order-ver/customer-orders-export-button.tsx` — new Export dropdown button wired into Customer Orders V2 page header.
- `src/components/module/admin/production/production-orders-export-button.tsx` — new Export dropdown button wired into Admin Production Orders page header.

### Import scope — Documented, no change needed
- The only supported import surface is CSV paste for **Sales Invoice line items** in `src/components/module/admin/billing/invoice-items/bulk-item-operations.tsx`. This is working and intentionally limited.
- No entity-level import (products, materials, customer orders, production orders) is supported in this phase.

### Google Sheets / Drive — Explicitly deferred
- Zero integration exists or is needed in this phase.
- Requires: OAuth 2.0 credentials, service account or user consent flow, Drive API/Sheets API policy approval, and a dedicated implementation scope.
- Do **not** imply partial support in any UI until a dedicated scope ships.

---

## Priority

`P1` - Highest priority

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Boss ma'am / project lead

## Why This Matters

Export and import are foundational operational features. The system already contained several export surfaces and some import-related work, but the experience was incomplete or misleading, especially for Excel output that was actually CSV in disguise.

## Acceptance Checklist

- [x] The repo has a clear inventory of implemented import/export surfaces.
- [x] Supported CSV and Excel behavior is documented and aligned with actual output.
- [x] High-priority broken or incomplete import/export flows are fixed.
- [x] UI labels do not claim Excel support where only CSV behavior exists.
- [x] Google file support is explicitly categorized as deferred intentionally.
- [x] A contributor can tell which import/export features are production-ready and which are not.
- [x] Changelog updated (v1.5.14).

## Import / Export Matrix (Post-P1)

| Domain | CSV Export | Excel Export | Import | Notes |
|--------|-----------|-------------|--------|-------|
| Products | ✅ | ✅ | ❌ | Admin |
| Materials | ✅ | ✅ | ❌ | Admin |
| Customer Orders | ✅ | ✅ | ❌ | Admin — added in P1 |
| Production Orders (Admin) | ✅ | ✅ | ❌ | Admin — added in P1 |
| Production Orders (Superadmin) | ✅ | ✅ | ❌ | Superadmin only |
| Billing Statements | ✅ | ✅ | ❌ | Admin |
| Sales Invoices | ✅ | ✅ | ❌ | Admin |
| Delivery Receipts | ✅ | ✅ | ❌ | Admin |
| Sales Invoice Line Items | ❌ | ❌ | ✅ CSV paste | Billing form only |
| Audit Logs (Superadmin) | ✅ | ✅ (fixed) | ❌ | Previously fake .xlsx |
| Analytics Reports | ✅ | ✅ (fixed) | ❌ | Previously fake .xlsx |
| Raw DB Tables (Superadmin) | ❌ | ✅ | ❌ | Any table, SUPER_ADMIN only |
| Google Sheets / Drive | ❌ | ❌ | ❌ | Deferred — no OAuth yet |

## Related Code Areas

- `src/lib/utils/report-export.ts`
- `src/lib/utils/audit-export.ts`
- `src/lib/actions/customer-order.ts`
- `src/lib/actions/production-order.ts`
- `src/components/module/admin/customer-order-ver/customer-orders-export-button.tsx`
- `src/components/module/admin/production/production-orders-export-button.tsx`
- `src/app/admin/(protected)/production/page.tsx`
- `src/app/admin/(protected)/customer-orders-v2/page.tsx` (via CustomerOrderV2HeaderActions)
