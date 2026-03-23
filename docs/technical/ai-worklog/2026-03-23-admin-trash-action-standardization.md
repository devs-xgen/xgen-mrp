# Standardize admin archive actions around Trash

- Date: 2026-03-23
- Last Updated: 2026-03-23 20:54
- Status: completed
- Objective: Unify record removal actions on admin active-list tables so Products, Materials, Customer Orders V2, and Production Orders expose a single Archive action backed by the existing Trash flow.

## Files Changed
- src/components/module/admin/products/columns.tsx
- src/app/admin/(protected)/materials/materials-data-table.tsx
- src/components/module/admin/customer-order-ver/columns.tsx
- src/components/module/admin/production/data-table-row-actions.tsx
- src/components/module/admin/customer-order-ver/CustomerOrderV2HeaderActions.tsx
- src/app/admin/(protected)/products/page.tsx
- src/app/admin/(protected)/materials/page.tsx
- src/components/module/admin/customer-orders/data-table-row-actions.tsx
- src/components/module/admin/customer-orders/columns.tsx
- src/components/module/admin/customer-orders/customer-orders-table.tsx
- src/data/changelog.json
## Validation
- npx eslint <changed-files>: passed; npm run lint: blocked by pre-existing repo errors; npm run type-check: did not complete within the wait window
## React Doctor
- react-doctor passed with repo-level warnings; no change-specific blocker reported
## Progress Log
- [20:54] Implemented the active-list cleanup: removed mixed archive/delete/trash affordances, switched header links from archived to trash, and added archive-to-trash behavior to the live Customer Orders V2 table.
- [20:54] Completed implementation and recorded validation: changed-file ESLint passed, full lint remains blocked by unrelated repo errors, full type-check did not complete within the wait window, and React Doctor reported no change-specific blocker.
## Open Questions
