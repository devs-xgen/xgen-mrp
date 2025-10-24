# Production-Material Stabilization Plan

## Current Pain Points

- **Double deduction of materials**: Materials are reduced during reservation and again on completion within `updateProductionOrderStatus`, causing inventory underflow.@src/lib/actions/production-order.ts#5910-6039
- **Reservation logic skips committed stock**: Reserving materials decrements `currentStock` instead of raising `committedStock`, leaving the schema fields misaligned with typical MRP semantics.@src/lib/actions/material-reservation.ts#214-288 @prisma/schema.prisma#342-377
- **Variant and parent product stock both incremented**: Completing a variant order increments both the variant and parent product current stock, risking double counting if parent stock is meant to aggregate variants.@src/lib/actions/production-order.ts#5915-5957 @prisma/schema.prisma#161-262
- **Actual consumption workflow unused**: The `ProductionMaterialConsumption` model and action exist but are never invoked, so the system cannot differentiate planned vs. actual usage.@src/lib/actions/material-consumption.ts#79-150 @prisma/schema.prisma#873-897
- **No guardrails on stock floors**: Neither reservations nor completions protect against negative stock outcomes despite the schema allowing it.@src/lib/actions/material-reservation.ts#214-288 @src/lib/actions/production-order.ts#5959-6016

## Immediate Remediation Steps (Blocker)

1. **Choose a single consumption point**
   - Adopt “consume on completion” by moving material deductions out of reservation and into a dedicated consumption routine that uses `ProductionMaterialConsumption` records.
   - Refactor `reserveMaterialsForProduction` to only increase `committedStock` (and adjust `availableStock` accordingly), leaving `currentStock` untouched until consumption.@src/lib/actions/material-reservation.ts#214-288
   - Update `updateProductionOrderStatus` to call a new `finalizeMaterialConsumption` that deducts from `currentStock`, decreases `committedStock`, and records movements once per material.@src/lib/actions/production-order.ts#5959-6039

2. **Normalize stock semantics**
   - Document in code comments and developer docs that:
     - `currentStock` = physical on-hand
     - `committedStock` = reserved for production/order
     - `availableStock` = `currentStock - committedStock`
   - Add Prisma-level check constraints (via migrations) or action-level guards preventing any update that results in negative `currentStock`/`availableStock`.

3. **Variant stock policy**
   - Decide whether parent product stock is a rollup or independent value.
     - If rollup: stop writing directly to `Product.currentStock` when a variant is produced; recalculate via aggregate or scheduled job.
     - If independent: ensure reservation and fulfillment use the same source of truth and document the rationale.

## Short-Term Enhancements (High Priority)

1. **Integrate actual consumption tracking**
   - Invoke `consumeMaterialForProduction` (or successor) during completion to capture `plannedQuantity`, `actualQuantity`, and `wasteQuantity` for each reservation.@src/lib/actions/material-consumption.ts#79-150
   - Update `MaterialReservation.quantityConsumed` and `ProductionOrder.completedQuantity` based on actual numbers, not planned quantity.
   - Surface variances in dashboards or alerts when actual usage exceeds plan.

2. **Quality control feedback loop**
   - If `QualityCheck` finds rejects, write them to a `rejectedQuantity` field and subtract from the finished goods increment before posting inventory.@prisma/schema.prisma#503-518 @src/lib/actions/production-order.ts#5910-6039

3. **Transaction safety & isolation**
   - Wrap reservation, consumption, and stock updates in explicit Prisma transactions with serialized logic to prevent race conditions on concurrent orders.
   - Introduce optimistic locking by re-reading stock before commit or using `SELECT ... FOR UPDATE` via `prisma.$executeRaw` when precision is required.

## Schema & Migration Considerations

- Add computed columns or database views if parent product stock should always match the sum of its variants.
- Introduce triggers or Prisma middleware to enforce non-negative stock levels and to auto-derive `availableStock` from `currentStock - committedStock` instead of storing it redundantly.
- Consider decimal precision alignment between BOM requirements (three decimals) and integer stocks; adjust to decimals if partial units are valid.

## Testing & Validation Plan

1. **Unit tests**
   - Mock reservations and completions verifying that only one deduction happens per material.
   - Ensure `availableStock` calculations respect the new semantics.

2. **Integration tests**
   - Simulate end-to-end production for products with and without variants, checking stock snapshots before/after.
   - Cover cancellation flows ensuring committed stock is released correctly and inventory movements are logged.

3. **Data audit tooling**
   - Build a reconciliation script to compare aggregated reservations/consumptions vs. material stock totals, flagging mismatches for manual review.

## Operational Follow-ups

- Update user documentation so operations staff understand when inventory changes occur.
- Train stakeholders on variance reporting once actual consumption tracking goes live.
- Schedule a retrospective after fixes ship to confirm inventory accuracy against physical counts.
