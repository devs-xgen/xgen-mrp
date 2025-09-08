# Customer Order Page: Features, Workflows, and System Relationships

Last updated: 2025-09-08 23:39 (+08:00)

## 1) Purpose and Scope
This document explains the Customer Order page, its major features, how data flows between the UI and backend, and how it relates to Billing, Payments, Fulfillment, Production, and document records (Sales Invoices, Delivery Receipts). It is intended for developers and admins maintaining the order lifecycle and financial integrity.

## 2) Where It Lives in the Codebase
- Page component: `src/app/admin/(protected)/customer-orders-v2/[id]/page.tsx`
  - Renders the overall page layout and tab system.
  - Fetches the order via `getCustomerOrderById()` (server action) and serializes non-plain types (Prisma Decimal, Date, BigInt) for the client.
- Tabs (rendered by `OrderDetails` inside `page.tsx`):
  - `OverviewSection`: `src/components/module/admin/customer-order-ver/view/OverviewSection.tsx`
  - `FulfillmentSection`: `src/components/module/admin/customer-order-ver/view/FulfillmentSection.tsx`
  - `ProductionSection`: `src/components/module/admin/customer-order-ver/view/ProductionSection.tsx`
  - `BillingSection`: `src/components/module/admin/customer-order-ver/view/BillingSection.tsx`
  - `PaymentSection`: `src/components/module/admin/customer-order-ver/view/PaymentSection.tsx`

## 3) Data Flow (Server → Client)
- `page.tsx` calls `getCustomerOrderById(id)` on the server and serializes the result using a robust helper to safely convert:
  - Prisma `Decimal` → numeric (or string if not finite)
  - `Date` → ISO strings
  - `BigInt` → string
- The serialized `order` object is passed to each tab component.

## 4) Core Domain Models and Relationships (Prisma)
See `prisma/schema.prisma` for the full definitions. Relevant highlights:
- CustomerOrder (parent)
  - `billingStatements`: list of `BillingStatement` (1:N)
  - `transaction`: list of payment `Transaction` records (1:N)
- BillingStatement
  - Represents what the customer owes for a portion or the entirety of the order.
  - `salesInvoice`: one-to-one SalesInvoice link.
  - `deliveryReceipts`: many-to-one list of DeliveryReceipt.
- SalesInvoice
  - One-to-one with BillingStatement, the formal invoice document.
- DeliveryReceipt
  - Linked to BillingStatement; tracks delivered items and their status.
- Transaction (Payments)
  - Linked to CustomerOrder; only `COMPLETED` transactions count as paid amounts.

## 5) The Tabs and Their Responsibilities
- Overview
  - High-level order details, quick status indicators.
- Fulfillment
  - Delivery planning, shipment/delivery progress. Often correlates with Delivery Receipts.
- Production
  - Work-in-progress and manufacturing steps relevant to the order.
- Billing (`BillingSection.tsx`)
  - Displays billing statements, status badges, and links to view statements and related invoices.
  - Shows warnings if a billing statement is marked `PAID` but payments are incomplete.
  - Provides a "Create Billing Statement" CTA (dialog)
    - `CreateBillingStatementDialog.tsx` is used to generate billing and (optionally) delivery documents.
- Payment (`PaymentSection.tsx`)
  - Displays recorded payments (transactions), per-transaction details, and overall payment progress.
  - Shows a progress bar, totals (amount, paid, remaining), and contextual guidance.
  - When the order is fully paid, shows a "Mark Billing as Paid" button to sync billing statuses.

## 6) Business Rules and Validation (Billing vs Payment Integrity)
- A billing statement must NOT be set to `PAID` unless real payments fully cover the billed amount.
- Backend enforcement:
  - `src/lib/actions/enhanced-billing-statements.ts` → `updateBillingStatementStatus()`
    - If a status update to `PAID` is requested, it validates accumulated `COMPLETED` transactions for the related order.
    - If total paid < required amount, throws a descriptive error that the UI surfaces to the user.
- UI safeguards:
  - PAID status is not selectable on create in `CreateBillingStatementDialog.tsx`.
  - `BillingSection` shows a red warning badge if a mismatch is detected.
  - `PaymentSection` shows a green CTA only when fully paid and gives precise toast messages otherwise.

## 7) Automation and Sync Logic (Payment → Billing)
- `src/lib/actions/billing-payment-sync.ts`:
  - `syncBillingStatusWithPayment(customerOrderId)`
    - Computes total paid (only `COMPLETED` transactions) vs order total.
    - If fully paid, marks all non-PAID billing statements as `PAID`, sets `paidDate`, and updates `modifiedBy/modifiedAt`.
    - Revalidates:
      - `/admin/customer-orders-v2`
      - `/admin/billing/billing-statements`
    - Returns a friendly message and counts for UI to display.
  - `checkPaymentCompletion(customerOrderId)`
    - Utility for gating UI (is fully paid, unpaid statements, remaining balances).
  - `getPaymentSummary(customerOrderId)`
    - Summarizes total amount, total paid, remaining, and includes handlers.

## 8) Permissions / Auth
- Server actions (e.g., `billing-payment-sync.ts`) use `getServerSession(authOptions)` to require authenticated users.
- `modifiedBy` and `modifiedAt` are updated where applicable for auditability.

## 9) Caching, Revalidation, and Navigation
- After data mutations, relevant lists/pages are revalidated using `revalidatePath` to keep UI state fresh.
- Avoid direct page reloads; prefer Next.js `router.refresh()` for post-action updates.

## 10) Error Handling and UX Messaging
- PaymentSection toasts:
  - Success: "Payment Complete — All N billing statement(s) have been marked as PAID"
  - Blocked: "Cannot Mark as Paid — Payment not yet complete. ₱X remaining"
  - Error: "Failed to update billing status. Please try again."
- BillingSection warnings:
  - If `PAID` but payments incomplete, shows a visible red warning card with precise guidance.
- General guidance banners (blue) clarify the difference between Billing (what is owed) and Payment (money actually received).

## 11) Related Documents and Navigation
- From BillingStatement cards:
  - View Statement → `/billing-statement/[id]`
  - View Invoice → `/sales-invoice/[id]` (if present)
- Delivery Receipts are listed per billing statement when present.

## 12) Testing Notes
- Add/extend tests to validate:
  - Billing cannot be marked as `PAID` unless fully paid.
  - `syncBillingStatusWithPayment` correctly updates when threshold reached.
  - UI shows appropriate toasts and banners for both valid and invalid states.
- See `tests/` for existing coverage (e.g., billing-related tests) and add scenarios as needed.

## 13) Known Pitfalls and Prior Fixes
- Avoid client-side `fetch()` in components for critical flows—prefer server actions.
- Avoid `window.location.reload()`; use `router.refresh()` to prevent service-worker conflicts.
- If hot-reload chunk issues occur during dev, restart or clear `.next/`.

## 14) Extensibility / Roadmap
- Automation:
  - Optional scheduled sync to mark statements `PAID` when payments reconcile overnight.
- Observability:
  - Add richer audit logs on billing status changes (who, when, why).
- Notifications:
  - Email/SMS or in-app notifications when payment completion is detected.
- Permissions:
  - Granular roles to limit who can mark billing as `PAID`.

## 15) Quick Reference (Key Files)
- Page & Layout
  - `src/app/admin/(protected)/customer-orders-v2/[id]/page.tsx`
- Sections
  - `src/components/module/admin/customer-order-ver/view/BillingSection.tsx`
  - `src/components/module/admin/customer-order-ver/view/PaymentSection.tsx`
  - `src/components/module/admin/customer-order-ver/view/OverviewSection.tsx`
  - `src/components/module/admin/customer-order-ver/view/FulfillmentSection.tsx`
  - `src/components/module/admin/customer-order-ver/view/ProductionSection.tsx`
- Actions
  - `src/lib/actions/enhanced-billing-statements.ts`
  - `src/lib/actions/billing-payment-sync.ts`
- Dialogs
  - `src/components/module/admin/customer-order-ver/CreateBillingStatementDialog.tsx`
- Prisma (Data Models)
  - `prisma/schema.prisma`

---
This page orchestrates the end-to-end lifecycle for Customer Orders and enforces financial integrity by coupling Billing (what is owed) with Payments (what was actually received). The combination of backend validation, UI safeguards, and automation prevents mismatched states and reduces operator error.
