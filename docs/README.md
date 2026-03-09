# XGen MRP Documentation

This documentation set is aligned to the current repository structure in `src/`, `prisma/`, and `package.json`.

The application is a Next.js 15 App Router system for manufacturing operations, centered on:

- Role-based portals for `ADMIN`, `WORKER`, `INSPECTOR`, `DELIVERY`, and `SUPER_ADMIN`
- Prisma-backed operational data (59 models in `prisma/schema.prisma`)
- A mix of server actions in `src/lib/actions/**` and route handlers in `src/app/api/**`
- Supporting concerns such as PWA behavior, PDF generation, QR/scan workflows, share links, and support tickets

## Documentation Map

### Planning

- [Plan Spec](./plan-spec/README.md)

### Technical

- [Technical Overview](./technical/README.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Maintenance Mode](./MAINTENANCE_MODE.md)

### Roles

- [Admin](./roles/admin/README.md)
- [Worker](./roles/worker/README.md)
- [Inspector](./roles/inspector/README.md)
- [Delivery](./roles/delivery/README.md)
- [SuperAdmin](./roles/superadmin/README.md)

### Features

- [Production](./features/production/README.md)
- [Inventory](./features/inventory/README.md)
- [Quality](./features/quality/README.md)
- [Customer Management](./features/customer-management/README.md)
- [Billing](./features/billing/README.md)

## Current Application Surface

The implemented UI surface is split across role portals:

- `admin`: 55 route pages
- `worker`: 12 route pages
- `inspector`: 22 route pages
- `delivery`: 9 route pages
- `superadmin`: 35 route pages
- `api`: 54 route handlers

## Source of Truth

When docs and code disagree, use the code as the source of truth:

- UI routes: `src/app/**`
- shared and role modules: `src/components/**`
- server actions: `src/lib/actions/**`
- schema: `prisma/schema.prisma`
- dependencies and scripts: `package.json`

## Notes

- Earlier docs in this repository referenced missing technical pages and several non-existent paths. Those references were removed.
- The documentation now describes the implemented system and avoids claiming capabilities that are not clearly present in the codebase.
