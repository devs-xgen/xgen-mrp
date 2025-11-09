# Customer Order Fulfillment Guide

A step-by-step user manual for Admin users who manage customer demand, production, and delivery inside XGen MRP. This guide explains how an order moves from intake to fulfilled, using language that works for non-technical operators.

---

## Quick Navigation

| Goal | Navigation Path |
| --- | --- |
| Review or add products | **Admin Portal → Item Management → Products** (`/admin/products`)
| Review or add materials | **Admin Portal → Item Management → Materials** (`/admin/materials`)
| Create or manage customer orders | **Admin Portal → Orders → Customer Orders V2** (`/admin/customer-orders-v2`)
| Analyze fulfillment options | From an order row, select **⋮ → Analyze** (`/admin/customer-orders-v2/[id]/analyze`)
| Allocate stock | Inside the analysis page, choose **Allocate Stock**
| Create production work | Inside the analysis page, choose **Create Production Orders**
| Track production status | **Admin Portal → Production → Production Orders** (`/admin/production`)
| Monitor fulfillment progress | Order detail tab: **Fulfillment** (`/admin/customer-orders-v2/[id]`)

---

## 1. Prepare Your Catalog

Before taking any orders, make sure the foundation is ready:

- **Products** – Every sellable item (example: *T-Shirt Classic Fit*) lives in the Products list with pricing, SKU, and available variants (size, color).
- **Materials & Bill of Materials (BOM)** – Each product knows which fabrics, inks, labels, etc., it consumes. Accurate BOMs let the system plan material needs for production.
- **Suppliers** – Keep supplier records updated so purchase orders can be raised when materials run low.

> **Why this matters:** Fulfillment decisions rely on knowing what stock is on hand and what it costs to make more. If the catalog is incomplete, the analysis step cannot give good recommendations.

---

## 2. Capture the Customer Order

1. Go to **Customer Orders V2**.
2. Click **Create Order**.
3. Fill in the customer, required date, and each product line. Example: 12 units of the T-Shirt Classic Fit.
4. Submit the order.

The order now appears in the table with a **Fulfillment** column showing 0% because nothing has been allocated or produced yet.

---

## 3. Review the Order Summary

- Click an order number to open its detail page.
- Tabs show **Overview, Fulfillment, Production, Billing, Payment**.
- At this point, the Fulfillment tab will list each item with a “Pending” badge.

This page becomes your command center for the rest of the workflow.

---

## 4. Analyze Fulfillment Options

1. In the Customer Orders table, open the menu (⋮) for the order and choose **Analyze**.
2. The Stock Analysis page checks:
   - On-hand product stock (ready-to-ship quantities).
   - How much stock can be used without dipping below safety levels.
   - Whether production is required and if materials are short.
3. The page highlights recommendations per line:
   - **Use Stock** – Ship directly from existing inventory.
   - **Produce All** – Make the full quantity through production.
   - **Hybrid** – Combine stock and fresh production.

> **Tip:** The top summary tells you how many items can ship today versus those that need production.

---

## 5. Allocate Available Stock

If any lines can use stock:

1. Click **Allocate Stock**.
2. Confirm the quantities the system suggests. You can adjust if needed.
3. Submit.

The order lines immediately reflect:
- Fulfillment Type: **Stock**
- Fulfillment Status: **Allocated**
- Progress bars showing allocated units vs. requested units

This step “reserves” the inventory so nothing else can consume it.

---

## 6. Launch Production for the Remainder

For lines that require manufacturing:

1. Click **Create Production Orders** on the analysis page.
2. Choose the production quantity (for hybrid, the balance after stock).
3. Confirm priority and notes (example: “Need by Friday for VIP client”).
4. Submit.

The system creates linked Production Orders and updates the customer order lines to:
- Fulfillment Type: **Production** or **Hybrid**
- Fulfillment Status: **Allocated** (meaning work has been scheduled)

Production planners and floor supervisors now see these orders in their respective portals.

---

## 7. Track Production Progress

Visit **Production Orders** to monitor status:

- Each production order shows start/due dates, progress across operations, and completed quantity.
- As work centers finish tasks, statuses move from **Pending → In Progress → Completed**.

When a production order reaches the required quantity, the customer order line automatically trends toward **Fulfilled**.

---

## 8. Confirm Fulfillment Completion

Back on the customer order detail page:

- Open the **Fulfillment** tab.
- Each line shows current quantity, allocated stock, produced quantity, percentage complete, and timestamps for allocation/fulfillment.
- Once all 12 shirts (in our example) are completed—either from stock or production—the line will display a **Fulfilled** badge and 100% progress.

The order summary will reflect full fulfillment, making it ready for delivery and billing workflows.

---

## 9. Why Production Is Crucial

- **Guarantees Accuracy** – Production orders ensure every promised unit has a plan (cutting, sewing, packaging) instead of relying on guesswork.
- **Protects Inventory** – Allocating stock prevents accidental double-selling.
- **Highlights Material Gaps** – Shortages revealed during analysis prompt timely purchase orders.
- **Supports Commit Dates** – Coordinated production lets you promise realistic delivery timelines.

In short, production keeps fulfillment honest. Without it, the “12 shirts” example might ship late, incomplete, or with the wrong specs.

---

## 10. Checklist: End-to-End Fulfillment

1. ✅ Products and materials updated
2. ✅ Customer order created
3. ✅ Analysis run and decisions made
4. ✅ Stock allocated (if available)
5. ✅ Production orders created (if needed)
6. ✅ Production completed
7. ✅ Fulfillment tab shows 100%
8. ✅ Ready for delivery and billing

Keep this checklist handy during onboarding or audits.

---

## Need Help?

- **Support Chat:** Inside the Admin Portal, open **Support** to create a ticket or chat with the help desk.
- **Training Resources:** Visit the internal knowledge base (Admin Portal → Support → Resources).
- **Escalations:** For urgent production blockers, notify the Production Lead via the Production Orders page.

Staying disciplined with this flow keeps customers happy and the shop floor predictable. Happy fulfilling!
