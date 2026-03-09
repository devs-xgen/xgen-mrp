# P5: Delivery Task View Error

## Status

`Planned`

## Priority

`P5` - High

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Project lead

## Why This Matters

Delivery users need to open and work their assigned tasks reliably. An application error when viewing a delivery task blocks fulfillment work and undermines trust in one of the final handoff steps in the workflow.

This scope focuses on reproducing the failure, isolating the actual break point, and stabilizing the task-to-detail flow without widening into unrelated delivery redesign work.

## Current State In Repo

- Delivery task list page exists at `/delivery/tasks`.
- Delivery detail page exists at `/delivery/orders/[id]`.
- `src/app/delivery/(protected)/tasks/page.tsx` fetches assignments through `getDeliveryAssignments`.
- Delivery task UI pushes into `/delivery/orders/${assignment.id}`.
- Delivery detail page fetches by assignment id through `getDeliveryAssignmentById` and returns `notFound()` when the assignment is missing or owned by another user.
- Delivery domain logic is split across `src/lib/actions/delivery/delivery-assignment.ts`, `src/lib/actions/delivery/tasks.ts`, and `src/lib/actions/delivery/orders.ts`.
- Revalidation paths already target both `/delivery/tasks` and `/delivery/orders/[id]`.

## Target Outcome

Make delivery task viewing reliable by identifying the failure mode and ensuring task lists, detail fetches, ownership checks, and route expectations all use a consistent contract.

## In Scope

- Reproduce the current delivery task view error
- Confirm whether the issue is caused by fetch logic, auth/ownership logic, missing related data, or route mismatch
- Audit overlapping delivery task and assignment data sources
- Define a single supported contract for task list item ids and detail page ids
- Improve not-found or failure handling so expected missing-data cases do not surface as opaque application errors
- Add regression coverage for list-to-detail navigation

## Out Of Scope

- Rebuilding delivery scheduling UX
- Redesigning delivery dashboards or analytics
- Reworking unrelated billing or receipt flows
- Large role-permission redesign outside the delivery task path

## Risks / Open Questions

- There may be two partially overlapping abstractions for the same concept: delivery assignments and delivery tasks.
- The visible error may be secondary to missing nested relations in the detail fetch.
- Ownership checks may behave correctly but still present as an application error instead of a clearer not-found state.
- Some notifications or deep links may still point to a production-order id instead of an assignment id.

## Phase Breakdown

### Phase 1: Reproduction

- Reproduce the error from the delivery task list into the detail page.
- Confirm whether the failure happens for all assignments or only certain records.
- Capture whether the error occurs before render, during fetch, or during client interaction in the detail component.
- Check whether direct navigation to `/delivery/orders/[id]` behaves differently from clicking from the list.

### Phase 2: Root-Cause Isolation

- Compare list fetches from `getDeliveryAssignments` with detail fetches from `getDeliveryAssignmentById`.
- Audit `src/lib/actions/delivery/tasks.ts` for competing assumptions about task ids and statuses.
- Verify that notifications and route builders pass the same id type the detail page expects.
- Confirm whether auth and ownership checks should yield `notFound()`, redirect, or a recoverable empty state.

### Phase 3: Fix Implementation

- Normalize delivery task item ids and detail route expectations.
- Remove or reduce overlapping task-source ambiguity where feasible.
- Harden detail-page fetch behavior for missing relations or invalid ids.
- Improve error handling so expected failures do not become generic application crashes.
- Revalidate affected delivery paths consistently after task status changes.

### Phase 4: Regression Checks

- Verify list-to-detail navigation from tasks, dashboard, and deliveries views.
- Verify status updates still revalidate the correct detail and list pages.
- Verify behavior when the assignment does not exist or belongs to another user.
- Verify notification or deep-link paths still open the correct detail page.

## Acceptance Checklist

- [ ] Delivery users can open their assigned task detail pages reliably.
- [ ] The id contract between task lists, detail routes, and notifications is consistent.
- [ ] Ownership and missing-record cases resolve cleanly without opaque application errors.
- [ ] Overlapping delivery task and assignment data flows are documented and narrowed.
- [ ] Regression coverage exists for list-to-detail delivery navigation.

## Related Code Areas

- `src/app/delivery/(protected)/tasks/page.tsx`
- `src/app/delivery/(protected)/orders/[id]/page.tsx`
- `src/components/module/delivery/tasks.tsx`
- `src/components/module/delivery/order-details.tsx`
- `src/lib/actions/delivery/delivery-assignment.ts`
- `src/lib/actions/delivery/tasks.ts`
- `src/lib/actions/delivery/orders.ts`
- `src/lib/actions/notifications.ts`

## Notes / Follow-Ups

- If notifications are using a different id type than delivery detail pages, capture that as part of the fix spec instead of handling it ad hoc.
- If the root cause is data-quality related rather than routing, create a follow-up cleanup scope for invalid delivery assignments.
