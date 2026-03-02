# Inspector Documentation

## Role Scope

The inspector portal covers verification, inspection, and quality-adjacent inventory review. It has a larger operational surface than the worker portal because it spans inspections, production review, and activity history.

Primary route areas under `src/app/inspector/(protected)`:

- `dashboard`
- `orders`
- `production`
- `production/[id]`
- `production/quality-history/[id]`
- `inventory`
- `inventory/request`
- `inventory/export`
- `inventory/alerts`
- `material-request`
- `request`
- `task`
- `tasks`
- `activity-log`
- `qr-scanner`
- `support`
- `settings`

## What Inspectors Actually Do

- Review production orders and quality history
- Work with quality and request/task queues
- Inspect inventory-related issues and material requests
- Export inventory-related views
- Use activity logs to trace changes and operational events

## Main Code Areas

- Pages: `src/app/inspector/(protected)/**`
- UI modules: `src/components/module/inspector/**` and selected shared modules
- Inspector server actions: `src/lib/actions/inspector/**`
- Inspector types: `src/types/inspector/**`

## Operational Notes

- Inspector workflows are tied closely to `QualityCheck`, production history, and inventory issue records in the Prisma schema.
- There is overlap between generic quality actions and inspector-specific server actions. The inspector portal is the dedicated operational UI for those flows.
- The portal includes both queue-style views and detailed per-record pages.

## Related Docs

- [Documentation Home](../../README.md)
- [Quality](../../features/quality/README.md)
- [Production](../../features/production/README.md)
- [Inventory](../../features/inventory/README.md)
- [Technical Overview](../../technical/README.md)
