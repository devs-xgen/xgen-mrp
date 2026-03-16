# P4: Customer Orders Homepage Route Fix

## Completion Note

**Completed**: 2026-03-10  
**Shipped**: v1.5.16

All stale `/admin/customer-orders` references replaced with `/admin/customer-orders-v2`. No redirect page was needed — the old route had no page file, so direct link fixes were the correct approach. Server action revalidation paths normalized across 8 action files.

---

## Status

`Done`

## Priority

`P4` - High

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Project lead

## Why This Matters

The customer orders homepage currently lands on a 404 in at least one user path. That breaks a core admin workflow and creates confusion because the repo already contains both older customer-order references and the current `customer-orders-v2` implementation.

This scope exists to fix route consistency first, then remove stale links and revalidation assumptions that still point to dead paths.

## Current State In Repo

- The admin portal README identifies `customer-orders-v2` as the active route area.
- Admin navigation in `src/config/nav.ts` already points to `/admin/customer-orders-v2`.
- There are still many references across actions and components to `/admin/customer-orders`.
- Some customer-order components under `src/components/module/admin/customer-orders/**` still push or link to the older path.
- Revalidation calls across billing, stock allocation, transactions, production-order, and customer-order actions still include `/admin/customer-orders`.
- The V2 archive surface already exists at `/admin/customer-orders-v2/archives`.

## Target Outcome

Make customer-order navigation consistent so admin users always land on a working customer orders home route, while old references are either redirected safely or removed.

## Acceptance Checklist

- [x] The admin customer orders homepage resolves to a working page instead of a 404.
- [x] Stale user-facing links to `/admin/customer-orders` are removed or redirected intentionally.
- [x] Revalidation targets align with the supported route family.
- [x] Old-path references that remain are justified and documented.
- [x] The V2 route family remains the canonical admin customer-order surface.

## Changes Shipped

- `src/components/module/admin/billing/billing-statement-card.tsx` — View Order link → V2
- `src/app/admin/(protected)/billing/billing-statements/[id]/client.tsx` — View Order link → V2
- `src/components/module/admin/customer-orders/data-table-row-actions.tsx` — View Details → V2, Analyze Stock → V2 production-planning
- `src/components/module/admin/customer-orders/CustomerOrderDetailsClient.tsx` — analyze/edit/production-planning links → V2
- `src/components/module/admin/customer-orders/CustomerOrderEditClient.tsx` — post-save redirect + back link → V2
- `src/components/module/admin/customer-orders/create/CustomerOrderCreateClient.tsx` — post-create redirect → V2
- `src/components/module/admin/customer-orders/ArchivedOrdersClient.tsx` — archives URL + back to customer orders → V2
- `src/lib/actions/customer-order.ts` — 5 revalidatePath instances → V2
- `src/lib/actions/stock-allocation.ts` — 5 revalidatePath instances → V2
- `src/lib/actions/order-archiving.ts` — 2 revalidatePath instances → V2
- `src/lib/actions/order-analysis.ts` — 2 revalidatePath instances → V2
- `src/lib/actions/production-order.ts` — 1 revalidatePath instance → V2
- `src/lib/actions/transactions.ts` — 1 revalidatePath instance → V2
- `src/lib/actions/enhanced-billing-statements.ts` — 1 revalidatePath instance → V2
- `src/lib/actions/superadmin/production-order.ts` — 1 revalidatePath instance → V2
- `src/lib/actions/superadmin/customer-order.ts` — 2 revalidatePath instances → V2 (superadmin own route preserved)

## Notes / Follow-Ups

- Superadmin customer-order routes (`/superadmin/customer-orders`) were preserved untouched as they have their own page surface.
- No redirect page was introduced since all references were direct links and router.push calls — no external/bookmarked URLs to accommodate.
