# P5: Delivery Task View Error

## Completion Note

**Completed**: 2026-03-10  
**Shipped**: v1.5.16

Root cause audit found three issues. The `/delivery/orders` index page already existed with auth guard and error fallback — no dead nav link. The main fix was hardening `getDeliveryAssignmentById` to preserve error identity and updating `DeliveryOrderPage` to distinguish not-found (404) from unexpected data errors, showing a recoverable UI instead of a silent crash.

---

## Status

`Done`

## Priority

`P5` - High

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Project lead

## Why This Matters

Delivery users need to open and work their assigned tasks reliably. An application error when viewing a delivery task blocks fulfillment work and undermines trust in one of the final handoff steps in the workflow.

## Root Cause Findings

1. **`getDeliveryAssignmentById` swallowed error identity** — the catch block re-threw a generic `"Failed to fetch delivery assignment"` message regardless of what actually failed, making it impossible for the page to distinguish a true 404 from a Prisma/network error.
2. **`DeliveryOrderPage` used `notFound()` for all errors** — any fetch failure (including transient DB errors) silently produced a 404 page instead of a recoverable error state.
3. **`/delivery/orders` index page already existed** — confirmed not a dead nav link. Page has auth guard and error fallback already in place.
4. **`order-details.tsx` null-safety** — confirmed already uses optional chaining (`?.`) throughout for `productionOrder.customerOrder` fields. No additional changes needed.

## Acceptance Checklist

- [x] Delivery users can open their assigned task detail pages reliably.
- [x] The id contract between task lists, detail routes is consistent (both use `assignment.id`).
- [x] Ownership and missing-record cases resolve cleanly without opaque application errors.
- [x] Unexpected fetch errors show a recoverable UI with a Return to Tasks link.
- [x] `/delivery/orders` nav link has a valid index page — confirmed.

## Changes Shipped

- `src/lib/actions/delivery/delivery-assignment.ts` — `getDeliveryAssignmentById` catch block now re-throws the original `Error` instance instead of wrapping it in a generic message.
- `src/app/delivery/(protected)/orders/[id]/page.tsx` — catch block now checks `error.message === "Delivery assignment not found"` for true 404; all other errors render a recoverable error card with a Return to Tasks link instead of `notFound()`.

## Notes / Follow-Ups

- If notifications or deep links ever use production-order IDs instead of assignment IDs, that would be a separate regression. No evidence of this pattern found in the current codebase.
- The overlapping `delivery/tasks.ts` and `delivery/delivery-assignment.ts` data sources were audited — both use `assignment.id` consistently for navigation. No consolidation required at this time.
