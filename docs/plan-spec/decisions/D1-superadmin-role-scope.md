# D1: Superadmin Role Scope

## Status

`Decision Needed`

## Priority

`D1` - Pending decision, not an active implementation scope

## Owner / Decision Owner

- Decision owner: Boss ma'am
- Preparation owner: Development

## Why This Matters

The repo still has a separate superadmin portal, routes, components, docs, and actions. At the same time, there is visible overlap with admin in areas such as customer orders, production, materials, products, suppliers, billing, settings, and users.

If the role is no longer necessary, the team should avoid building more superadmin-specific behavior until the purpose of the role is confirmed.

## Current State In Repo

- Superadmin remains a distinct portal under `src/app/superadmin/(protected)/**`.
- Superadmin documentation still exists under `docs/roles/superadmin/**`.
- Admin and superadmin both have route areas for billing, customer orders, materials, production, products, suppliers, settings, and users.
- Superadmin also has broader cross-system surfaces such as analytics, audit logs, audit reports, organizations, system health, and export data.
- The docs describe superadmin as a cross-system high-privilege role rather than a simple admin duplicate.

## Target Outcome

Reach a product decision on whether superadmin should remain separate, be reduced in scope, or be merged into admin, without starting implementation changes prematurely.

## In Scope

- Comparing admin and superadmin route/domain overlap
- Identifying responsibilities that are uniquely superadmin today
- Identifying responsibilities duplicated with admin
- Preparing decision options and discussion prompts
- Listing impact areas if a merge or reduction is chosen later

## Out Of Scope

- Merging roles now
- Removing routes or permissions now
- Refactoring middleware, navigation, or server actions in this decision file
- Finalizing technical migration steps before the business decision is made

## Risks / Open Questions

- Superadmin may still be needed for cross-organization visibility or high-risk administrative actions.
- Removing the role without a decision could break access assumptions in routing, middleware, and action-level authorization.
- Some overlap may be intentional while some may be legacy drift.
- The team needs business clarity on whether superadmin is a real operating role or just a development-era abstraction.

## Phase Breakdown

### Phase 1: Compare Current Scope

- Inventory overlapping admin and superadmin route families.
- Group overlaps by domain: customer orders, production, inventory, billing, supplier/customer management, users, settings.
- Identify which overlaps appear to be near-duplicates versus wider-scope oversight tools.

### Phase 2: Clarify Unique Responsibilities

- Document superadmin-only responsibilities currently visible in routing and docs.
- Pay special attention to analytics, audit, organizations, system health, and export-data surfaces.
- Note any action-level privileges that appear broader than admin.

### Phase 3: Prepare Decision Options

- Option A: Keep superadmin separate as the high-privilege oversight role.
- Option B: Reduce superadmin to only truly global or audit-focused capabilities.
- Option C: Merge superadmin into admin and remove role duplication over time.
- For each option, document operational benefits, risks, and likely follow-up work.

### Phase 4: Decision Follow-Through Planning

- If the decision is to keep it, define tighter boundaries between admin and superadmin.
- If the decision is to reduce it, define which route families remain.
- If the decision is to merge it, plan impact review for routing, permissions, docs, nav, and server actions before implementation begins.

## Acceptance Checklist

- [ ] Admin and superadmin overlaps are documented by domain.
- [ ] Unique superadmin responsibilities are documented separately from overlap.
- [ ] Keep, reduce, and merge options are prepared for discussion.
- [ ] Impact areas for a future merge are listed clearly.
- [ ] The file remains a decision memo, not an implementation spec.
- [ ] Decision status remains pending until boss ma'am confirms direction.

## Related Code Areas

- `src/app/admin/(protected)/**`
- `src/app/superadmin/(protected)/**`
- `src/lib/actions/superadmin/**`
- `src/config/nav.ts`
- `docs/roles/admin/README.md`
- `docs/roles/superadmin/README.md`

## Notes / Follow-Ups

- Do not start new superadmin expansion work until this decision is discussed.
- If the role is retained, consider creating a boundary doc that explicitly lists what admin can do versus what only superadmin should do.

Decision: Pending
