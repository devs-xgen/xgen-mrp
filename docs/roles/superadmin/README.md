# SuperAdmin Documentation

## Role Scope

The superadmin portal is the cross-system administrative layer. It mirrors many admin domains but at a wider system scope and includes platform-level analytics and audit screens.

Primary route areas under `src/app/superadmin/(protected)`:

- `dashboard`
- `analytics`
- `analytics/users`
- `analytics/production`
- `analytics/financial`
- `analytics/reports`
- `audit-logs`
- `audit-reports`
- `billing`
- `customer-orders`
- `export-data`
- `materials`
- `organizations`
- `production`
- `products`
- `settings`
- `suppliers`
- `system-health`
- `users`

## What SuperAdmin Actually Manages

- Cross-cutting reporting and analytics
- Global user and organization administration
- System-health and audit-oriented views
- Broad access to billing, production, materials, supplier, and customer-order data
- Data export workflows

## Main Code Areas

- Pages: `src/app/superadmin/(protected)/**`
- UI modules: `src/components/module/superadmin/**`
- Server actions: `src/lib/actions/superadmin/**`

## Operational Notes

- The codebase clearly separates admin and superadmin portals in routing and middleware.
- Superadmin should be treated as a high-privilege operational layer, but the exact extent of per-action “override” behavior depends on the specific server action implementation.
- Earlier docs claimed explicit unrestricted force-operation coverage for many workflows. Those claims were narrowed here to match the visible route and action structure only.

## Related Docs

- [Quick Start](./QUICKSTART.md)
- [Feature Reference](./FEATURES.md)
- [Technical Notes](./technical/README.md)
- [Documentation Home](../../README.md)
- [Technical Overview](../../technical/README.md)
