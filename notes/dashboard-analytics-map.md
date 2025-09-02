# Dashboard Analytics and Data Map

This document lists the proposed dashboard analytics, the exact Prisma models used from `prisma/schema.prisma`, what each analytic shows, and key calculation details. Use this as the source of truth for building queries, materialized views, and UI tiles.

## Legend
- Tables: exact Prisma model names used as sources.
- Join path: how tables relate when multiple models are required.
- Key columns: fields required for the computation.
- Formula: core aggregation or logic (simplified).
- Dimensions: suggested slice-and-dice fields.
- Notes: assumptions or data-quality caveats.

---

## 1) Sales & Billing

1. Revenue trend (daily/monthly)
- Tables: `SalesInvoice`
- Join path: N/A
- Key columns: `invoiceDate`, `totalAmount`, `status`
- Formula: SUM(`totalAmount`) GROUP BY date_trunc(period, `invoiceDate`) WHERE `status` NOT IN ('DRAFT','CANCELLED')
- Dimensions: `BillingStatement.customerId/customerName` (via `SalesInvoice` → `BillingStatement`), product/category (via `SalesInvoiceItem`)
- Notes: Use `invoiceDate` as booking date. If using net vs gross, subtract `discountAmount` and add `taxAmount` as needed.

2. Top customers by revenue
- Tables: `SalesInvoice`, `BillingStatement`, `Customer`
- Join path: `SalesInvoice.billingStatementId` → `BillingStatement.customerId` → `Customer`
- Key columns: `totalAmount`, `status`, `invoiceDate`, `customerId`
- Formula: SUM(`totalAmount`) by customer WHERE `status` NOT IN ('DRAFT','CANCELLED')
- Dimensions: Month, customer, sales status
- Notes: Customer name also available on `BillingStatement.customerName` when `customerId` is null.

3. Sales by product/category
- Tables: `SalesInvoiceItem`, `Product`, `ProductCategory`
- Join path: `SalesInvoiceItem.productId` → `Product.categoryId` → `ProductCategory`
- Key columns: `quantity`, `unitPrice`, `totalPrice`, `productId`
- Formula: SUM(`totalPrice`) and SUM(`quantity`) by product/category
- Dimensions: Month, category, product
- Notes: For non-product lines (services), `productId` may be null; keep separate grouping by `description` if needed.

4. Invoice status funnel
- Tables: `SalesInvoice`
- Join path: N/A
- Key columns: `status`, `invoiceDate`
- Formula: COUNT(*) by `status` (DRAFT, SENT, PAID, OVERDUE, CANCELLED, DISPUTED, PARTIAL)
- Dimensions: Month, customer (via `BillingStatement`)
- Notes: Useful for billing pipeline monitoring.

5. Accounts receivable (outstanding & aging)
- Tables: `SalesInvoice`
- Join path: N/A
- Key columns: `totalAmount`, `dueDate`, `status`
- Formula: Outstanding = SUM(`totalAmount`) WHERE `status` IN ('SENT','OVERDUE','PARTIAL')
  Aging buckets by days past `dueDate`: 0–30, 31–60, 61–90, 90+
- Dimensions: Customer, month
- Notes: There is no explicit payment entity linked to `SalesInvoice` in the schema; rely on `status` and `dueDate` for AR.

---

## 2) Orders & Fulfillment

1. Order intake
- Tables: `CustomerOrder`
- Join path: N/A
- Key columns: `orderDate`, `totalAmount`, `status`
- Formula: COUNT(*) and SUM(`totalAmount`) by `orderDate` (day/month)
- Dimensions: Customer, status

2. Backlog (open order lines)
- Tables: `OrderLine`
- Join path: N/A
- Key columns: `fulfillmentStatus`, `quantity`, `fulfilledAt`
- Formula: COUNT(*) and SUM(`quantity`) WHERE `fulfillmentStatus` IN ('PENDING','ALLOCATED','PARTIALLY_FULFILLED')
- Dimensions: Product/Variant, customer (via `CustomerOrder`), age buckets by `createdAt`

3. Fill rate
- Tables: `OrderLine`
- Join path: N/A
- Key columns: `quantity`, `fulfillmentStatus`
- Formula: FillRate = COUNT(*) FILTER (WHERE `fulfillmentStatus`='FULFILLED') / COUNT(*)
  or QuantityFillRate = SUM(fulfilled_qty)/SUM(ordered_qty)
- Dimensions: Product/Variant, customer, month
- Notes: If line-level fulfilled quantity is required, derive from `variants` and/or shipment/invoice items.

4. OTIF (On-Time, In-Full) delivery rate
- Tables: `DeliveryReceipt`, `BillingStatement`, `CustomerOrder`
- Join path: `DeliveryReceipt.billingStatementId` → `BillingStatement.customerOrderId` → `CustomerOrder.requiredDate`
- Key columns: `deliveryDate`, `requiredDate`
- Formula: COUNT(*) FILTER (deliveryDate <= requiredDate) / COUNT(*)
- Dimensions: Customer, month
- Notes: Uses `requiredDate` as promise date.

5. Order cycle time
- Tables: `CustomerOrder`, `DeliveryReceipt`, `BillingStatement`
- Join path: `CustomerOrder.orderDate` → earliest `DeliveryReceipt.deliveryDate` via `BillingStatement`
- Key columns: `orderDate`, `deliveryDate`
- Formula: AVG(`deliveryDate` - `orderDate`)
- Dimensions: Customer, month

---

## 3) Production

1. WIP (work in process)
- Tables: `ProductionOrder`
- Key columns: `status`
- Formula: COUNT(*) WHERE `status` IN ('IN_PROGRESS','ON_HOLD','SUBCON')
- Dimensions: Product/Variant, priority, customer order linkage

2. Throughput (completed quantity)
- Tables: `ProductionOrder`
- Key columns: `completedQuantity`, `completedAt`
- Formula: SUM(`completedQuantity`) GROUP BY day/month of `completedAt`
- Dimensions: Product/Variant, customer

3. Cycle time
- Tables: `ProductionOrder`
- Key columns: `startDate`, `completedAt`
- Formula: AVG(`completedAt` - `startDate`) for completed orders
- Dimensions: Product/Variant, priority

4. Work center utilization
- Tables: `Operation`, `WorkCenter`
- Join path: `Operation.workCenterId` → `WorkCenter`
- Key columns: `startTime`, `endTime`, `capacityPerHour`, `operatingHours`
- Formula: Utilization = SUM(run_hours) / (capacityPerHour * operatingHours)
  where run_hours = EXTRACT(hours from `endTime`-`startTime`)
- Dimensions: WorkCenter, week/month

5. Bottleneck/queue by work center
- Tables: `Operation`
- Key columns: `workCenterId`, `status`, `startTime`
- Formula: COUNT(*) or SUM(planned_hours) for `status` in waiting states
- Dimensions: WorkCenter

6. Batch performance
- Tables: `ProductionBatch`
- Key columns: `plannedQuantity`, `producedQuantity`, `status`, `unitCost`
- Formula: Yield = produced/planned; Unit cost trends by month
- Dimensions: Product, month, quality status

---

## 4) Inventory

1. Inventory valuation (materials)
- Tables: `Material`
- Key columns: `currentStock`, `costPerUnit`
- Formula: SUM(`currentStock` * `costPerUnit`)
- Dimensions: `MaterialType`, supplier

2. Inventory valuation (finished goods)
- Tables: `Product`
- Key columns: `currentStock`, `unitCost`
- Formula: SUM(`currentStock` * `unitCost`)
- Dimensions: `ProductCategory`

3. Low/critical stock alerts
- Tables: `Material`, `InventoryItem`
- Key columns: `currentStock`, `minimumStockLevel`, `criticalStockLevel`
- Formula: COUNT(*) WHERE stock < threshold
- Dimensions: Material type, location

4. Inventory movements by type
- Tables: `InventoryMovement`
- Key columns: `movementType`, `quantity`, `transactionDate`
- Formula: SUM(`quantity`) and COUNT(*) BY `movementType` over time
- Dimensions: Material/Product, locationFrom/locationTo

5. Days of cover (materials)
- Tables: `Material`, `ProductionMaterialConsumption`
- Join path: `ProductionMaterialConsumption.materialId` → `Material`
- Key columns: `currentStock`, `actualQuantity`, `consumedAt`
- Formula: DoC = currentStock / avg_daily_consumption(lookback N days)
- Dimensions: Material type, supplier
- Notes: Choose lookback window (e.g., 30/60/90 days) based on volatility.

6. Inventory turnover (materials)
- Tables: `InventoryMovement`, `Material`
- Key columns: issues/receipts quantities, `currentStock`
- Formula: Turnover = COGS or Issues / avg_inventory; proxy with total issues over period / avg(currentStock)
- Dimensions: Material type, supplier

---

## 5) Procurement

1. PO spend by supplier
- Tables: `PurchaseOrder`, `Supplier`
- Join path: `PurchaseOrder.supplierId` → `Supplier`
- Key columns: `orderDate`, `totalAmount`
- Formula: SUM(`totalAmount`) by supplier and month
- Dimensions: Supplier, month

2. On-time receipts rate
- Tables: `PurchaseOrder`, `InventoryMovement`
- Join path: `InventoryMovement.movementType`='MATERIAL_RECEIPT' with `referenceType`/`referenceId` pointing to PO/line (assumption)
- Key columns: `expectedDelivery`, `transactionDate`
- Formula: COUNT(receipts on/before expected) / COUNT(receipts)
- Dimensions: Supplier, month, material
- Notes: Depends on reliable `referenceType/referenceId` linkage to PO.

3. Supplier lead time
- Tables: `PurchaseOrder`, `InventoryMovement`
- Join path: as above
- Key columns: `orderDate`, `transactionDate`
- Formula: AVG(`transactionDate` - `orderDate`) for receipts
- Dimensions: Supplier, material

4. Price trends by material
- Tables: `PurchaseOrderLine`, `Material`
- Join path: `PurchaseOrderLine.materialId` → `Material`
- Key columns: `unitPrice`, `createdAt`
- Formula: AVG(`unitPrice`) by month and material
- Dimensions: Supplier, material type

---

## 6) Delivery & Logistics

1. Delivery status breakdown
- Tables: `DeliveryReceipt`
- Key columns: `deliveryStatus`, `deliveryDate`
- Formula: COUNT(*) by `deliveryStatus` over time
- Dimensions: Month, customer (via `BillingStatement`)

2. Delivery lead time
- Tables: `DeliveryReceipt`, `BillingStatement`, `CustomerOrder`
- Join path: `DeliveryReceipt.billingStatementId` → `BillingStatement.customerOrderId` → `CustomerOrder.orderDate`
- Key columns: `orderDate`, `deliveryDate`
- Formula: AVG(`deliveryDate` - `orderDate`)
- Dimensions: Customer, month

3. Failed/returned delivery rate
- Tables: `DeliveryReceipt`
- Key columns: `deliveryStatus`
- Formula: (FAILED + RETURNED) / total deliveries
- Dimensions: Customer, month

---

## 7) Quality

1. Quality pass rate
- Tables: `QualityCheck`
- Key columns: `status`, `checkDate`
- Formula: COUNT(PASSED)/COUNT(total) by period
- Dimensions: Product (via `ProductionOrder.productId`), inspector, work center

2. Defect occurrence and categories
- Tables: `QualityCheck`
- Key columns: `defectsFound` (free text), `actionTaken`, `checkDate`
- Formula: COUNT(*); optionally parse/categorize `defectsFound`
- Dimensions: Product, inspector, work center

3. Rework rate / quality holds
- Tables: `ProductionBatch`
- Key columns: `qualityStatus`
- Formula: COUNT(batches with `qualityStatus` IN ('REWORK','PENDING')) / COUNT(total)
- Dimensions: Product, month

---

## 8) Costing & Variance

1. Planned vs actual material cost (per production order)
- Tables: `ProductionOrder`
- Key columns: `plannedMaterialCost`, `actualMaterialCost`, `materialVariance`
- Formula: SUM planned vs actual; variance = actual - planned
- Dimensions: Product, month, priority

2. Material price variance
- Tables: `CostVariance`
- Key columns: `varianceType`='MATERIAL_PRICE', `variance`, `variancePercent`
- Formula: SUM(`variance`) and AVG(`variancePercent`) by period
- Dimensions: Material, production order

3. Material usage variance
- Tables: `ProductionMaterialConsumption`
- Key columns: `plannedQuantity`, `actualQuantity`, `unitCost`, `consumedAt`
- Formula: Usage variance qty = actual - planned; cost impact = (actual - planned) * unitCost
- Dimensions: Material, product, month

4. Waste cost
- Tables: `ProductionMaterialConsumption`
- Key columns: `wasteQuantity`, `unitCost`, `consumedAt`
- Formula: SUM(`wasteQuantity` * `unitCost`) over period
- Dimensions: Material, product

---

## 9) User Activity & Support

1. Active users
- Tables: `User`, `ActivityLog`
- Key columns: `lastLoginAt` (User), `createdAt` (ActivityLog)
- Formula: DAU/WAU/MAU = COUNT(DISTINCT userId) by period in `ActivityLog`
- Dimensions: Role, department (from `UserProfile`), activity type

2. Activity breakdown by type
- Tables: `ActivityLog`
- Key columns: `type`, `createdAt`
- Formula: COUNT(*) by `type` and period
- Dimensions: User, role

3. Support ticket pipeline
- Tables: `SupportTicket`, `SupportMessage`
- Key columns: `status`, `priority`, `createdAt`, `resolvedAt`
- Formula: COUNT by status/priority; SLA = AVG(`resolvedAt` - `createdAt`)
- Dimensions: User, department

4. Shareable link engagement
- Tables: `ShareableLink`
- Key columns: `documentType`, `accessCount`, `expiresAt`, `isRevoked`
- Formula: SUM(`accessCount`) by documentType; active vs expired/revoked counts
- Dimensions: Document type, month

---

## Suggested Materialized Views (optional for performance)

- `mv_fact_sales_daily`: date, customerId, revenue, invoices, discounts, tax
- `mv_fact_production_daily`: date, wip_count, completed_qty, avg_cycle_time
- `mv_fact_inventory_daily`: date, material_valuation, product_valuation, low_stock_count, movements_by_type
- `mv_fact_procurement_daily`: date, po_count, po_value, on_time_rate
- `mv_fact_quality_daily`: date, pass_rate, defects, rework_rate
- `mv_fact_delivery_daily`: date, delivered_count, on_time_rate, fail_return_rate
- `mv_fact_variance_daily`: date, variance_totals by `varianceType`

Each MV should include foreign keys for common dimensions (customer, product, material, supplier, workCenter) when applicable.

---

## Enum references useful for slicing
- `MovementType` (e.g., MATERIAL_RECEIPT, MATERIAL_CONSUMPTION, PRODUCT_SHIPMENT, ...)
- `InvoiceStatus`, `BillingStatus`, `DeliveryStatus`, `BatchStatus`, `QualityStatus`, `SupportStatus`, `SupportPriority`
- `FulfillmentStatus`, `FulfillmentType`

---

## Gaps and assumptions
- PO receipt-to-PO linkage assumes `InventoryMovement.referenceType/referenceId` map to `PurchaseOrder`/`PurchaseOrderLine` for OTIF/lead time.
- AR relies on `SalesInvoice.status` and `dueDate`; there is no payment record linked to invoices in schema.
- Product-level sales require `SalesInvoiceItem.productId`. Non-product service lines should be reported separately.
- For accurate capacity/OEE, consider adding standard cycle times per product/operation.
- Historical stock trends require daily snapshots; point-in-time `currentStock` alone is not historical.

---

## Appendix: Key relationships
- Sales: `SalesInvoice` → `BillingStatement` → `Customer`; `SalesInvoiceItem` → `Product` → `ProductCategory`
- Orders: `CustomerOrder` → `OrderLine` (+ `OrderLineVariant`) → `Product`/`ProductVariant`
- Production: `ProductionOrder` → `Operation`/`ProductionBatch`/`ProductionMaterialConsumption`
- Inventory: `Material`/`Product` ↔ `InventoryMovement`; `MaterialReservation` ties to `ProductionOrder`
- Procurement: `PurchaseOrder` → `PurchaseOrderLine` → `Material`; receipts via `InventoryMovement`
- Delivery: `DeliveryReceipt` → `BillingStatement` → `CustomerOrder`
- Quality: `QualityCheck` → `ProductionOrder` → `Product`
