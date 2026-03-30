# Stabilize admin archive-to-trash consistency

- Date: 2026-03-30
- Last Updated: 2026-03-30 20:29
- Status: in_progress
- Objective: Ensure archive-to-trash actions remove rows from active admin lists and keep active stats/loaders aligned with soft-delete semantics without database changes.

## Files Changed
- src/lib/actions/product.ts
- src/lib/actions/materials.ts
- src/lib/actions/customer-order.ts
- src/lib/actions/production-order.ts
- src/app/admin/(protected)/materials/materials-data-table.tsx
- src/app/admin/(protected)/production/page.tsx
## Validation
- npm run type-check: repo-wide existing failures; filtered check reported no matching errors in touched files
## React Doctor
- Ran npx -y react-doctor@latest . --verbose --diff; score 96/100, findings limited to pre-existing MaterialsDataTable patterns outside the archive bug fix scope
## Progress Log
- [20:29] 2026-03-30: Added deletedAt-null guards to live product, materials, customer-order, and production active queries/stats; aligned active related loaders; added Production View Trash shortcut; forced Materials router refresh after archive. Type-check still has unrelated repo-wide failures, but filtered output showed no matching errors for touched files. React Doctor score 96/100 with pre-existing warnings/errors isolated to MaterialsDataTable derived-state/search-param patterns not changed as part of this bug fix.
## Open Questions
