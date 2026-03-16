# P3: Soft Delete and Restore

## Status

`Completed` — v1.5.17

## Priority

`P3` - High

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Boss ma'am / project lead

## Why This Matters

The current operational data set contains customer orders, production orders, products, and materials that are no longer applicable to the present business state. The system needs a reversible removal flow so obsolete records can leave day-to-day views without being permanently destroyed immediately.

This is different from archiving. Archive flows already exist in parts of the repo and are intended for preserving historical records with their own restore behavior. This scope introduces a separate recently deleted lifecycle for operational cleanup.

## Implementation Summary

### Phase 1: Schema Changes
- Added `deletedAt DateTime?`, `deletedBy String?`, `deletedReason String?` to `Product`, `Material`, `ProductionOrder`, and `CustomerOrder` models in `prisma/schema.prisma`.
- Synced schema via `prisma db push` — no data loss, all columns are nullable.

### Phase 2: Server Actions
Added per-entity server actions to `src/lib/actions/`:

| Entity | File | Actions Added |
|---|---|---|
| Product | `product.ts` | `softDeleteProduct`, `restoreProduct`, `getTrashedProducts`, `purgeExpiredTrashedProducts` |
| Material | `materials.ts` | `softDeleteMaterial`, `restoreMaterial`, `getTrashedMaterials`, `purgeExpiredTrashedMaterials` |
| CustomerOrder | `customer-order.ts` | `softDeleteCustomerOrder`, `restoreCustomerOrder`, `getTrashedCustomerOrders`, `purgeExpiredTrashedCustomerOrders` |
| ProductionOrder | `production-order.ts` | `softDeleteProductionOrder`, `restoreProductionOrder`, `getTrashedProductionOrders`, `purgeExpiredTrashedProductionOrders` |

- `softDeleteProductionOrder` blocks deletion if status is `IN_PROGRESS`.
- All actions revalidate relevant admin paths including Trash pages.

**Query filtering:** Added `deletedAt: null` filter to `getAllProducts`, `getAllMaterials`, `getCustomerOrders`, `getCustomerOrdersWithFulfillment`, and `getProductionOrders` so soft-deleted records are excluded from all default operational lists.

### Phase 3: Trash Pages (UI)
Created server-rendered trash pages with client-side restore + purge:

- `src/app/admin/(protected)/products/trash/page.tsx`
- `src/app/admin/(protected)/materials/trash/page.tsx`
- `src/app/admin/(protected)/customer-orders-v2/trash/page.tsx`
- `src/app/admin/(protected)/production/trash/page.tsx`

Each page shows: entity name, deleted date, reason, days until permanent deletion (with urgency badge ≤3 days), and a Restore button.

Client components:
- `src/components/module/admin/products/trashed-products-client.tsx`
- `src/components/module/admin/materials/trashed-materials-client.tsx`
- `src/components/module/admin/customer-orders/trashed-customer-orders-client.tsx`
- `src/components/module/admin/production/trashed-production-orders-client.tsx`

### Phase 4: Row Actions
Added "Move to Trash" action to all 4 entity tables:

- **Products** — inline dialog in `src/components/module/admin/products/columns.tsx`
- **Materials** — inline dialog in `src/app/admin/(protected)/materials/materials-data-table.tsx`
- **Customer Orders V2** — added to `src/components/module/admin/customer-orders/data-table-row-actions.tsx`
- **Production Orders** — added to `src/components/module/admin/production/data-table-row-actions.tsx`

### Phase 5: Navigation
Added Trash sub-nav links in `src/config/nav.ts`:
- Item Management → Products Trash, Materials Trash
- Production → Production Trash
- Orders → Orders Trash

### Phase 6: Retention Cleanup
`purgeExpiredTrashed*` actions included in Phase 2 server actions. Each permanently deletes records with `deletedAt` older than 30 days. Triggered manually from each Trash page via "Purge Expired" button.

## Acceptance Checklist

- [x] Covered entities limited to customer orders, production orders, materials, and products
- [x] Default admin views exclude soft-deleted records (`deletedAt: null` filter)
- [x] Recently deleted records can be listed and restored during the 30-day retention window
- [x] Manual purge of expired records (>30 days) available on each Trash page
- [x] Archive flows remain separate and untouched
- [x] `IN_PROGRESS` production orders cannot be soft-deleted
- [x] Revalidation covers all affected admin paths including Trash sub-pages
- [x] Sidebar nav includes Trash links for all 4 entities

## Related Code Areas

- `prisma/schema.prisma`
- `src/lib/actions/product.ts`
- `src/lib/actions/materials.ts`
- `src/lib/actions/customer-order.ts`
- `src/lib/actions/production-order.ts`
- `src/app/admin/(protected)/products/trash/`
- `src/app/admin/(protected)/materials/trash/`
- `src/app/admin/(protected)/customer-orders-v2/trash/`
- `src/app/admin/(protected)/production/trash/`
- `src/components/module/admin/products/columns.tsx`
- `src/app/admin/(protected)/materials/materials-data-table.tsx`
- `src/components/module/admin/customer-orders/data-table-row-actions.tsx`
- `src/components/module/admin/production/data-table-row-actions.tsx`
- `src/config/nav.ts`
- `src/data/changelog.json`
