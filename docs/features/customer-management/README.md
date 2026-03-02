# Customer Management Documentation

## Scope

Customer management is centered on customer records, customer orders, fulfillment tracking, and downstream billing/delivery documents.

## Primary Admin Routes

Under `src/app/admin/(protected)`:

- `customers`
- `customers/[id]`
- `customers/[id]/orders`
- `customer-orders-v2`
- `customer-orders-v2/create`
- `customer-orders-v2/[id]`
- `customer-orders-v2/[id]/edit`
- `customer-orders-v2/analytics`
- `customer-orders-v2/archives`
- `customer-orders-v2/**/production-planning`

## Related Role Routes

- Delivery: `orders`, `orders/[id]`, `deliveries`
- SuperAdmin: `customer-orders`

## Core Data Models

- `Customer`
- `CustomerOrder`
- `OrderLine`
- `OrderLineVariant`
- `CustomerOrderArchive`
- `DeliveryAssignment`

## Main Code Areas

- Admin customer UI: `src/components/module/admin/customers/**`
- Admin customer-order UI: `src/components/module/admin/customer-order-ver/**`
- Actions: `src/lib/actions/customers.ts`, `src/lib/actions/customer-order.ts`, `src/lib/actions/order-analysis.ts`, `src/lib/actions/order-analytics.ts`, `src/lib/actions/order-archiving.ts`

## What Is Implemented

- Customer CRUD
- Customer-order creation, detail, edit, analytics, archive, and production-planning flows
- Delivery-facing order review pages
- Linkage from customer orders into production and billing

## Documentation Boundary

The previous docs described CRM-style features such as marketing segmentation, route optimization, and self-service portals. The current codebase documentation is limited to the implemented operational customer/order flows.

## Related Docs

- [Admin](../../roles/admin/README.md)
- [Delivery](../../roles/delivery/README.md)
- [Billing](../billing/README.md)
- [Technical Overview](../../technical/README.md)
