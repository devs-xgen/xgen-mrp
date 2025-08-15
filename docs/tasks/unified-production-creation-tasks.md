# TODO: Unified Production Creation (Multi-step Form)

Status: Planned
Owner: Production Module

## Summary
Implement a unified creation page under `@production/` that allows creating production orders either standalone or linked to a customer order, with variant selection, BOM generation, and optional material reservation. Uses server actions.

---

## Deliverables
- Route: `src/app/admin/(protected)/production/create/page.tsx`
- Client: `src/components/module/admin/production/create/ProductionCreateClient.tsx`
- Steps: `src/components/module/admin/production/create/steps/*`
- Validation: `src/lib/validation/production-create.ts`
- Server actions (extend): `src/lib/actions/production-order.ts`
- Helpers (as needed): lightweight getters for products/variants and customer orders
- Feature doc: `docs/features/unified-production-creation.md`

---

## Task Breakdown

### 1) Scaffolding
- [ ] Create page `production/create/page.tsx` (server)
- [ ] Create `ProductionCreateClient.tsx` (client)
- [ ] Add step components under `steps/`
  - [ ] `SourceStep.tsx`
  - [ ] `CustomerOrderStep.tsx`
  - [ ] `ProductStep.tsx`
  - [ ] `VariantStep.tsx`
  - [ ] `DetailsStep.tsx`
  - [ ] `OptionsStep.tsx`
  - [ ] `ReviewStep.tsx`
- [ ] Create Zod schema `production-create.ts`

### 2) Server Actions (in `src/lib/actions/production-order.ts`)
- [ ] `createProductionOrder(input)`
  - [ ] Validate product/variant and dates
  - [ ] Create `ProductionOrder`
  - [ ] Optionally call BOM and reservation flows
  - [ ] Return `{ success, orderId, warnings }`
- [ ] `generateProductionBOM(orderId)`
  - [ ] Derive from `ProductVariantBOM` (if variant) else base `BOM`
  - [ ] Compute `quantityNeeded`, apply `wastePercentage`, store costs
- [ ] `reserveMaterialsForOrder(orderId)`
  - [ ] Reserve available stock; partials allowed; return details

### 3) Read Helpers
- [ ] `getProductsWithVariantsForOrders()` (reuse if exists)
- [ ] `getCustomerOrdersLight()` (customer + order + lines minimal)
- [ ] Ensure `getAvailableWorkCenters()` ready (future scheduling)

### 4) Client Integration
- [ ] Implement stepper with RHF + Zod
- [ ] Persist draft with `use-form-persistence`
- [ ] Pre-fill via query params (productId, variantId, customerOrderId, quantity)
- [ ] Review step shows warnings and computed summary
- [ ] Submit calls server action and redirects to `/admin/production/[id]`

### 5) UX & A11y
- [ ] Keyboard navigation and labels
- [ ] Clear error/warning banners (partials, missing costs)
- [ ] Loading and disabled states on submit

### 6) Testing
- [ ] Unit: schema validation
- [ ] Unit: create action happy path
- [ ] Unit: BOM generation and reservation partials
- [ ] Integration: standalone and order-linked flows

### 7) Docs
- [x] Feature spec (`docs/features/unified-production-creation.md`)
- [x] This tasks document

---

## Acceptance Criteria
- [ ] Standalone production creation works end-to-end with redirect
- [ ] Order-linked creation works end-to-end with redirect
- [ ] BOM rows persisted when selected
- [ ] Reservation creates entries and returns partial warnings
- [ ] No schema changes required for Phase 1

---

## Notes
- Keep business logic in server actions; avoid client mutations.
- Use existing enums and relations in `prisma/schema.prisma`.
- Consider Phase 2: optional `orderLineId` linkage if needed later.
