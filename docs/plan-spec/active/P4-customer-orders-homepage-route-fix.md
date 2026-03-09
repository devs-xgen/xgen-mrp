# P4: Customer Orders Homepage Route Fix

## Status

`Planned`

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

## In Scope

- Audit all admin customer-order entry points
- Identify and classify dead, stale, and still-needed old routes
- Decide whether to use redirect compatibility or direct migration only
- Update navigation, links, button actions, and router pushes
- Update revalidation paths to match the supported route surface
- Document the supported admin customer-order route contract

## Out Of Scope

- Redesigning customer-order features
- Merging old and V2 component trees unless required for the route fix
- Rebuilding customer-order analytics or production-planning behavior
- Superadmin customer-order routes except where shared code creates accidental breakage

## Risks / Open Questions

- Some old-path references may still correspond to code that is not fully migrated and may need temporary redirects rather than immediate removal.
- Shared components used by billing or production may still assume old path shapes for detail links.
- Revalidation cleanup must not remove support for any still-live legacy route without verifying actual usage.
- A homepage 404 might be caused by a top-level link or by downstream redirects, not just missing page files.

## Phase Breakdown

### Phase 1: Route Audit

- Inventory all references to `/admin/customer-orders` and `/admin/customer-orders-v2`.
- Identify which old-path references are user-facing navigation, internal router pushes, or revalidation calls.
- Confirm whether an actual page exists for the old route or whether the route is fully absent.
- Identify any homepage widgets or dashboard shortcuts that still target the dead route.

### Phase 2: Fix Strategy

- Decide whether to add a temporary redirect from `/admin/customer-orders` to `/admin/customer-orders-v2` or to fully remove old-path usage.
- Update admin entry points so homepage and navigation always land on the working V2 route.
- Normalize detail, edit, analyze, archive, and production-planning links to the supported route family.
- Update revalidation targets to include the working path contract.

### Phase 3: Regression Pass

- Verify navigation from dashboard, admin nav, billing links, and customer-order lists.
- Verify create, view, edit, archive, and production-planning flows still route correctly.
- Verify revalidation after status or payment changes refreshes the correct customer-order pages.
- Check whether any old-path code remains intentionally for backward compatibility and document it.

### Phase 4: Documentation Updates

- Update docs that still imply the old admin route is primary.
- Record the canonical customer-order route family for future contributors.
- Note any temporary compatibility redirect and its intended removal criteria.

## Acceptance Checklist

- [ ] The admin customer orders homepage resolves to a working page instead of a 404.
- [ ] Supported admin customer-order routes are documented clearly.
- [ ] Stale user-facing links to `/admin/customer-orders` are removed or redirected intentionally.
- [ ] Revalidation targets align with the supported route family.
- [ ] Old-path references that remain are justified and documented.
- [ ] The V2 route family remains the canonical admin customer-order surface.

## Related Code Areas

- `src/config/nav.ts`
- `src/app/admin/(protected)/customer-orders-v2/**`
- `src/components/module/admin/customer-order-ver/**`
- `src/components/module/admin/customer-orders/**`
- `src/lib/actions/customer-order.ts`
- `src/lib/actions/order-analysis.ts`
- `src/lib/actions/order-archiving.ts`
- `src/lib/actions/transactions.ts`
- `src/lib/actions/stock-allocation.ts`
- `src/lib/actions/production-order.ts`

## Notes / Follow-Ups

- If old-path redirects are introduced, create a follow-up cleanup scope to remove them once all legacy references are gone.
- Keep superadmin customer-order routes separate unless shared components force a broader refactor.
