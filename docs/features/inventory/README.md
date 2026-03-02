# Inventory Feature Documentation

## Scope

Inventory covers material master data, stock visibility, movement, reservations, issue reporting, and role-specific stock interactions.

## Primary Admin Routes

Under `src/app/admin/(protected)`:

- `materials`
- `materials/create`
- `materials/[id]`
- `materials/archived`

Inventory-adjacent admin flows also appear in:

- `products/[id]` for stock adjustment and BOM-linked material context
- `production/[id]/materials`

## Related Role Routes

- Worker: `inventory`, `inventory/alerts`
- Inspector: `inventory`, `inventory/request`, `inventory/export`, `inventory/alerts`
- SuperAdmin: `materials`

## Core Data Models

- `Material`
- `InventoryItem`
- `Location`
- `InventoryMovement`
- `MaterialReservation`
- `MaterialRequest`
- `MaterialRequestItem`
- `InventoryIssueReport`
- `Transaction`

## Main Code Areas

- Admin UI: `src/components/module/admin/materials/**`
- Worker UI: `src/components/module/worker/inventory/**`
- Actions: `src/lib/actions/materials.ts`, `src/lib/actions/inventory-movement.ts`, `src/lib/actions/material-reservation.ts`, `src/lib/actions/material-request.ts`, `src/lib/actions/worker/inventory.ts`, `src/lib/actions/inspector/inventory.ts`
- Worker data helpers: `src/lib/data/worker/inventory.ts`

## What Is Implemented

- Material CRUD and archive-aware views
- Inventory displays for worker and inspector portals
- Inventory alerts
- Material requests
- Inventory export helpers on the inspector side
- Reservation and movement records in the schema and actions

## Documentation Boundary

Earlier docs described broad warehouse-management capabilities such as serial tracking, advanced forecasting, and automated replenishment engines. Those claims were removed unless explicitly represented in the current UI or actions.

## Related Docs

- [Admin](../../roles/admin/README.md)
- [Worker](../../roles/worker/README.md)
- [Inspector](../../roles/inspector/README.md)
- [Technical Overview](../../technical/README.md)
