# P3: Soft Delete and Restore

## Status

`Planned`

## Priority

`P3` - High

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Boss ma'am / project lead

## Why This Matters

The current operational data set contains customer orders, production orders, products, and materials that are no longer applicable to the present business state. The system needs a reversible removal flow so obsolete records can leave day-to-day views without being permanently destroyed immediately.

This is different from archiving. Archive flows already exist in parts of the repo and are intended for preserving historical records with their own restore behavior. This scope introduces a separate recently deleted lifecycle for operational cleanup.

## Current State In Repo

- Customer orders already have an archive-and-restore flow through `src/lib/actions/order-archiving.ts` and `/admin/customer-orders-v2/archives`.
- Products already support archive and unarchive flows through `src/lib/actions/product.ts` and `/admin/products/archived`.
- Materials already support archive and unarchive flows through `src/lib/actions/materials.ts` and `/admin/materials/archived`.
- Product, material, and customer-order-related models already contain archive-oriented fields or records in `prisma/schema.prisma`.
- Production-order code contains references to deletion metadata in logging paths, but there is no clear unified recently deleted feature for admins.
- There is no documented cross-entity trash model that covers customer orders, production orders, materials, and products with a one-month retention rule.

## Target Outcome

Add a dedicated soft-delete lifecycle for customer orders, production orders, materials, and products that:

- removes deleted records from normal operational views by default
- exposes a recently deleted view for each covered entity or a unified admin trash surface
- allows authorized users to restore records during the retention window
- permanently deletes eligible records once 1 month has passed
- stays clearly separate from archive behavior and terminology

## In Scope

- Deletion policy definition for customer orders, production orders, materials, and products
- Data-model strategy for soft-delete metadata and restore eligibility
- Admin-facing delete, recently deleted, and restore flows
- Query filtering so deleted records are excluded from default operational views
- Audit trail requirements for who deleted, when, and why
- Scheduled permanent cleanup after the retention window
- Regression planning where deleted records affect linked workflows such as production, billing, or delivery

## Out Of Scope

- Replacing or removing the existing archive system in this phase
- Applying the new delete lifecycle to every model in the database
- Final UX polish beyond what is needed for safe deletion and restore
- Superadmin-specific redesign unless the same deletion rules are explicitly adopted there later
- Historical reporting redesign for archived or deleted records

## Risks / Open Questions

- Customer orders already use a richer archive record model, so the team must decide whether delete uses the main table plus delete flags or a separate deleted-record structure.
- Production orders may have downstream dependencies in operations, billing, delivery assignment, and logs that make restore or permanent deletion more complex than other entities.
- The team needs a clear rule for whether deleted records remain referenceable in audit/history screens.
- The one-month cleanup job needs a reliable execution path in the deployed environment.
- The UI must avoid confusing `archive`, `delete`, `restore`, `unarchive`, and `permanent delete`.

## Phase Breakdown

### Phase 1: Policy and Model Audit

- Audit `Product`, `Material`, `ProductionOrder`, and `CustomerOrder` models in `prisma/schema.prisma`.
- Document current archive-related fields, restore behavior, and data dependencies for each entity.
- Decide the soft-delete metadata contract, such as `deletedAt`, `deletedBy`, and `deletedReason`.
- Define the retention-window rule as 1 month from delete timestamp.
- Define how delete differs from archive in business language and UI copy.

### Phase 2: Server Actions and Queries

- Add or standardize delete and restore server actions per covered entity.
- Update fetch/query paths so soft-deleted records are hidden from default operational lists and detail pages unless explicitly requested.
- Define validation rules that block delete when downstream dependencies make the action unsafe, or explicitly document cascade behavior where allowed.
- Add audit logging for delete, restore, and permanent cleanup operations.
- Revalidate all affected admin paths consistently after delete or restore.

### Phase 3: UI and Restore Views

- Add delete entry points in the admin surfaces for customer orders, production orders, materials, and products.
- Add recently deleted views and filters for restore actions.
- Surface retention information so users can see when permanent deletion will occur.
- Keep archive views separate from recently deleted views.
- Add clear confirmation dialogs and warning copy for delete versus archive.

### Phase 4: Retention Cleanup and Tests

- Implement a scheduled cleanup process for records whose retention window has expired.
- Define cleanup safety rules for linked data and audit references.
- Add automated tests for delete, restore, default-query exclusion, and retention expiry.
- Add manual regression coverage for key operational flows that consume these entities.
- Update project docs after the behavior is finalized.

## Acceptance Checklist

- [ ] Covered entities are explicitly limited to customer orders, production orders, materials, and products.
- [ ] Default admin views exclude soft-deleted records.
- [ ] Recently deleted records can be listed and restored during the retention window.
- [ ] Permanent cleanup occurs automatically after 1 month.
- [ ] Archive flows remain separate and are not silently repurposed.
- [ ] Delete, restore, and permanent cleanup actions are auditable.
- [ ] Query and revalidation behavior is defined for all affected admin surfaces.
- [ ] Dependencies and unsafe-delete cases are documented before implementation starts.

## Related Code Areas

- `prisma/schema.prisma`
- `src/lib/actions/order-archiving.ts`
- `src/lib/actions/product.ts`
- `src/lib/actions/materials.ts`
- `src/lib/actions/production-order.ts`
- `src/app/admin/(protected)/customer-orders-v2/**`
- `src/app/admin/(protected)/production/**`
- `src/app/admin/(protected)/materials/**`
- `src/app/admin/(protected)/products/**`

## Notes / Follow-Ups

- Prefer a shared deletion vocabulary document before implementation to prevent UI and code drift.
- If this feature proves stable, the same delete lifecycle can later be evaluated for additional entities.
- If retention cleanup depends on platform cron support, deployment details should be documented during implementation.
