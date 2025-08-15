# Unified Production Creation (Multi-step Form)

- Owner: Production Module
- Status: Ready to implement
- Target Route: `src/app/admin/(protected)/production/create/page.tsx`
- Client Entrypoint: `src/components/module/admin/production/create/ProductionCreateClient.tsx`

## Goal
Provide one unified page to create production orders that works for both:
- Standalone production (no customer order)
- Linked to a customer order (select order → product/variant → quantity)

This mirrors the richer creation flow available from `@customer-orders/` and makes the `@production/` area equally capable and self-sufficient.

## User Flows

1) Standalone (no customer order)
- Step 1: Choose Source → “Standalone”
- Step 2: Select Product (and Variant if applicable)
- Step 3: Details (quantity, dates, priority, notes)
- Step 4: Options (Generate BOM, Reserve Materials)
- Step 5: Review + Submit → redirect to production order detail

2) From Customer Order
- Step 1: Choose Source → “Link to Customer Order”
- Step 2: Select Customer → select Order → select Line (product or variant)
- Step 3: Variant (if applicable and editable)
- Step 4: Details (pre-filled quantity; editable)
- Step 5: Options (Generate BOM, Reserve Materials)
- Step 6: Review + Submit → redirect to production order detail

3) From Products (Pre-fill)
- Direct link from `@products/` can open the same create page with query params pre-filled (e.g., productId/variantId), then proceed through remaining steps.

## Steps
- SourceStep: Standalone vs Customer Order
- CustomerOrderStep: Customer → Order → Order line (if source = Order)
- ProductStep: Select product (if source = Standalone)
- VariantStep: If `product.hasVariants` → select a variant, else skip
- DetailsStep: quantity, start date, due date, priority, notes
- OptionsStep: `generateBOM` (checkbox), `reserveMaterials` (checkbox; depends on generateBOM)
- ReviewStep: summary, warnings (e.g., partial reservations), submit

## Validation
- quantity: integer > 0
- dates: `dueDate > startDate`
- variant belongs to the selected product (if provided)
- if linked to customer order: soft-validate product/variant exists on that order; warn if mismatch (don’t block Phase 1)

## Data Model Usage (no schema change)
- `ProductionOrder`: `productId`, optional `productVariantId`, optional `customerOrderId`, `quantity`, `startDate`, `dueDate`, `priority`, `notes`
- `ProductionBOM`: generated from `ProductVariantBOM` (preferred when variant selected) or base `BOM`
- `MaterialReservation`: created per BOM row with available stock (partial reservations allowed)

## Server Actions (Contracts)
Implement/extend in `src/lib/actions/production-order.ts`.

- `createProductionOrder(input): Promise<{ success: true; orderId: string; warnings?: string[] } | { success: false; error: string }>`
  - input
    - productId: string
    - productVariantId?: string
    - quantity: number
    - startDate: string (ISO)
    - dueDate: string (ISO)
    - priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL"
    - notes?: string
    - customerOrderId?: string
    - options?: { generateBOM?: boolean; reserveMaterials?: boolean }
  - behavior
    1. Validate product/variant + dates
    2. Create `ProductionOrder`
    3. If `options.generateBOM` → call `generateProductionBOM(orderId)`
    4. If `options.reserveMaterials` → call `reserveMaterialsForOrder(orderId)`
    5. Collect warnings (e.g., partial reservations, missing costs) and return `{ orderId, warnings }`

- `generateProductionBOM(orderId): Promise<{ count: number; warnings?: string[] }>`
  - Derive BOM rows from `ProductVariantBOM` when variant present and allowed; otherwise fallback to base `BOM`
  - Compute `quantityNeeded` and apply `wastePercentage`
  - Persist `unitCost` and `totalCost`

- `reserveMaterialsForOrder(orderId): Promise<{ reservedCount: number; partials: Array<{ materialId: string; requested: number; reserved: number }> }>`
  - Attempt to reserve available stock for each BOM material
  - Allow partials; do not fail the order creation

Helper read actions (reuse/extend existing):
- `getProductsWithVariantsForOrders()`
- `getCustomerOrdersLight()` (customer + order + lines minimal fields)
- `getAvailableWorkCenters()` (for future scheduling context)

Notes
- Use server actions to avoid client mutation endpoints and to keep PII on server.
- Ensure no reliance on `window` in server action code.

## Client Components
- `src/components/module/admin/production/create/ProductionCreateClient.tsx`
  - Hosts stepper, RHF + Zod resolver, collects state, calls server actions
  - Supports pre-fill via query params: `productId`, `variantId`, `customerOrderId`, `quantity`

- Steps (under `src/components/module/admin/production/create/steps/`):
  - `SourceStep.tsx`
  - `CustomerOrderStep.tsx`
  - `ProductStep.tsx`
  - `VariantStep.tsx`
  - `DetailsStep.tsx`
  - `OptionsStep.tsx`
  - `ReviewStep.tsx`

## UX Details
- Stepper header with progress
- Searchable selects for customers, orders, products, variants
- Persist draft with `use-form-persistence`
- Clear warnings on Review step (partials, missing material costs)
- On success → toast + redirect to `@admin/(protected)/production/[id]`

## Acceptance Criteria
- Create standalone production order with product/variant, details, options → success redirect
- Create from customer order (with product/variant/qty prefill) → success redirect
- BOM generation works and persists rows
- Reservation works with partials; warnings show
- No schema changes required

## Non-Functional
- Performance: server actions, no heavy SSR blocking
- A11y: keyboard friendly, labelled inputs, proper focus
- PWA safe: no client-only APIs in server actions
