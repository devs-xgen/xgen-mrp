# SuperAdmin Feature Reference

This page summarizes the implemented superadmin surface without assuming behavior that is not directly visible from the current codebase.

## Implemented Route Groups

Under `src/app/superadmin/(protected)` the codebase includes:

- Dashboard
- Analytics overview
- Analytics by users, production, financials, and reports
- Audit logs and audit reports
- Billing statements, sales invoices, and delivery receipts
- Customer orders
- Export data
- Materials
- Organizations
- Production
- Products
- Settings
- Suppliers
- System health
- Users

## Feature Domains

### Platform Visibility

- System-wide KPI and dashboard views
- Centralized analytics screens
- Audit and health monitoring pages

### Data Administration

- User, organization, supplier, material, product, and customer-order management surfaces
- Billing record access across the superadmin portal
- Export-oriented workflows for administrative analysis

### Reporting

- Saved/custom report functionality is reflected by the `SavedReport` model and analytics report pages
- Export features also appear in dedicated route handlers under `src/app/api/developer/database/**`

## Implementation References

- UI: `src/components/module/superadmin/**`
- Server actions: `src/lib/actions/superadmin/**`
- Analytics actions: `src/lib/actions/superadmin/analytics/**`
- Models involved include `Organization`, `SystemMetric`, `SystemError`, `AlertRule`, `AlertHistory`, and `SavedReport`

## Boundaries

- Superadmin is a separate portal, not just an admin page set.
- The current docs no longer claim automatic tenant bypass semantics for every query unless that is explicitly confirmed in code.
- Use the specific server action as the source of truth when auditing permissions or data scope.
