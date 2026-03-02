# SuperAdmin Technical Notes

## Structure

The superadmin portal is implemented as a separate App Router branch:

- `src/app/superadmin/(public)/login/page.tsx`
- `src/app/superadmin/(protected)/**`

This keeps its login flow and protected route tree isolated from the other portals.

## Authorization

Role-based access is enforced in two main places:

- `src/lib/auth.ts` maps portal login attempts to allowed roles
- `src/middleware.ts` blocks access when the authenticated role does not match the portal

For superadmin specifically:

- portal path prefix: `/superadmin`
- expected role: `SUPER_ADMIN`

## Implementation Layout

- Pages: `src/app/superadmin/(protected)/**`
- UI components: `src/components/module/superadmin/**`
- Actions: `src/lib/actions/superadmin/**`
- Analytics actions: `src/lib/actions/superadmin/analytics/**`

## Data Domains

The superadmin portal touches operational and platform models, including:

- `User`
- `Organization`
- `ProductionOrder`
- `CustomerOrder`
- `Material`
- `Supplier`
- `BillingStatement`
- `SalesInvoice`
- `DeliveryReceipt`
- `SavedReport`
- `SystemMetric`
- `SystemError`
- `AlertRule`
- `AlertHistory`
- `ActivityLog`

## Documentation Boundary

This document intentionally stays at the architectural level. For permission audits or behavior verification, inspect the exact page component and server action being used.
