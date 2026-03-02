# Production Feature Documentation

## Scope

Production is one of the central domains of the system. It spans planning, execution, operations, history, and role-specific production views.

## Primary Admin Routes

Under `src/app/admin/(protected)/production`:

- `page.tsx`
- `create/page.tsx`
- `planning/page.tsx`
- `[id]/page.tsx`
- `[id]/materials/page.tsx`

Related production planning also exists under customer orders:

- `src/app/admin/(protected)/customer-orders-v2/**/production-planning`

## Related Role Routes

- Worker: `src/app/worker/(protected)/production/page.tsx`
- Inspector: `src/app/inspector/(protected)/production/**`
- SuperAdmin: `src/app/superadmin/(protected)/production/**`
- Shared public production view: `src/app/share/production/[token]/page.tsx`

## Core Data Models

Production behavior is backed primarily by:

- `ProductionOrder`
- `ProductionBOM`
- `Operation`
- `WorkCenter`
- `QualityCheck`
- `ProductionBatch`
- `ProductionMaterialConsumption`
- `ProductionOrderHistoryLog`
- `CostVariance`

## Main Code Areas

- Admin UI: `src/components/module/admin/production/**`
- Creation flow: `src/components/module/admin/production/create/**`
- History/logging UI: `src/components/module/history-logs/**`
- Actions: `src/lib/actions/production-order.ts`, `src/lib/actions/production-bom.ts`, `src/lib/actions/material-consumption.ts`, `src/lib/actions/history-log/**`

## What Is Implemented

- Production order listing and detail flows
- Dedicated create and planning screens
- Materials management tied to production orders
- Workflow progress components and dialogs
- Quality-check integration within production
- History and activity views tied to production records
- Shareable production links

## Documentation Boundary

This feature doc describes the implemented structure. It does not assume advanced scheduling, finite-capacity optimization, or ERP-grade planning algorithms unless specifically visible in the corresponding action or component.

## Related Docs

- [Admin](../../roles/admin/README.md)
- [Worker](../../roles/worker/README.md)
- [Inspector](../../roles/inspector/README.md)
- [SuperAdmin](../../roles/superadmin/README.md)
- [Technical Overview](../../technical/README.md)
