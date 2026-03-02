# SuperAdmin Quick Start

## Access

- Login route: `/superadmin/login`
- Primary landing route after authentication: `/superadmin/dashboard`

Authentication and role gating are enforced through:

- `src/lib/auth.ts`
- `src/middleware.ts`

## Recommended First Pass

1. Open the dashboard to review global counts and system summary cards.
2. Review `analytics` for cross-domain trends and saved reports.
3. Check `system-health`, `audit-logs`, and `audit-reports` for operational issues.
4. Use `users`, `organizations`, and `export-data` for administrative maintenance.
5. Move into `production`, `customer-orders`, or `billing` only after confirming the operational context.

## When To Use SuperAdmin

- Platform-level support and oversight
- Cross-cutting audits or reporting
- Global user or organization maintenance
- Data exports and system diagnostics

## When Not To Use SuperAdmin

- Routine plant-floor execution
- Role-specific task handling better suited to worker, inspector, or delivery portals
- Standard day-to-day master-data changes that can remain within admin scope

## Related Docs

- [SuperAdmin Overview](./README.md)
- [SuperAdmin Feature Reference](./FEATURES.md)
- [SuperAdmin Technical Notes](./technical/README.md)
