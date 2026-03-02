# Delivery Documentation

## Role Scope

The delivery portal is the smallest operational portal. It focuses on assigned deliveries, order review, profile management, and basic support/settings pages.

Primary route areas under `src/app/delivery/(protected)`:

- `dashboard`
- `deliveries`
- `orders`
- `orders/[id]`
- `tasks`
- `profile`
- `support`
- `settings`

## What Delivery Actually Does

- View delivery dashboard summaries
- Review assigned deliveries and order detail pages
- Work with delivery task lists
- Maintain personal profile data
- Access support tickets and personal settings

## Main Code Areas

- Pages: `src/app/delivery/(protected)/**`
- UI modules: `src/components/module/delivery/**`
- Delivery server actions: `src/lib/actions/delivery/**`
- Delivery types: `src/types/delivery/**`

## Operational Notes

- The current codebase supports delivery management records and delivery receipt generation.
- There is no clear evidence in the codebase of built-in GPS route optimization, live map routing, or fleet telematics. Earlier docs overstated those capabilities.
- Delivery is integrated with the billing/document layer through `DeliveryReceipt` records and shared-document views.

## Related Docs

- [Documentation Home](../../README.md)
- [Billing](../../features/billing/README.md)
- [Customer Management](../../features/customer-management/README.md)
- [Technical Overview](../../technical/README.md)
