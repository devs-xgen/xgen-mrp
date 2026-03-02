# Admin Documentation

## Role Scope

The admin portal is the main operational workspace. It is the broadest day-to-day role and owns master data, planning, production management, customer orders, and billing workflows.

Primary route areas under `src/app/admin/(protected)`:

- `dashboard`
- `analytics/orders`
- `users`
- `customers`
- `customer-orders-v2`
- `products`
- `materials`
- `production`
- `purchase-orders`
- `purchase-orderline`
- `quality-checks`
- `work-centers`
- `suppliers`
- `billing`
- `settings`
- `support`

## What Admin Actually Manages

- Master data: customers, suppliers, products, materials, units of measure, material types, categories
- Planning and execution: customer orders, production planning, production orders, work centers, operations
- Commercial flow: billing statements, sales invoices, delivery receipts, billing reports
- User administration: user CRUD, role assignment, inspector linkage
- Monitoring: dashboard analytics, order analytics, support tickets

## Main Code Areas

- Pages: `src/app/admin/(protected)/**`
- UI modules: `src/components/module/admin/**`
- Server actions: `src/lib/actions/**`
- Validation: `src/lib/validation/**`

## Operational Notes

- Admin uses role-gated routing through `src/middleware.ts`.
- Business logic is mostly implemented as server actions, not through tRPC.
- Several admin workflows have both standard and “v2” implementations, especially customer orders and billing.
- Shared-document and share-link flows are exposed through public routes and API handlers, but the originating records are managed from admin and superadmin surfaces.

## Related Docs

- [Documentation Home](../../README.md)
- [Production](../../features/production/README.md)
- [Inventory](../../features/inventory/README.md)
- [Quality](../../features/quality/README.md)
- [Billing](../../features/billing/README.md)
- [Technical Overview](../../technical/README.md)
