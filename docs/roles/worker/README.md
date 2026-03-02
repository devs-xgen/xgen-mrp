# Worker Documentation

## Role Scope

The worker portal is focused on execution. It is intentionally narrower than admin and centers on assigned work, inventory interaction, and task updates.

Primary route areas under `src/app/worker/(protected)`:

- `dashboard`
- `tasks`
- `tasks/create`
- `tasks/operations`
- `production`
- `inventory`
- `inventory/alerts`
- `qr-scanner`
- `support`
- `settings`

## What Workers Actually Do

- View assigned tasks and task details
- Create or update task records tied to production work
- Review production-related context
- Interact with inventory views and alert lists
- Use QR scanning flows for shop-floor operations
- Access support and personal settings

## Main Code Areas

- Pages: `src/app/worker/(protected)/**`
- UI modules: `src/components/module/worker/**`
- Worker server actions: `src/lib/actions/worker/**`
- Worker types: `src/types/worker/**`

## Operational Notes

- Worker features are execution-oriented; configuration and master-data changes stay in admin or superadmin.
- Inventory and task flows overlap with inspector in some underlying actions, but the UI is scoped differently.
- The portal is built as a responsive web interface and also participates in the broader PWA shell.

## Related Docs

- [Documentation Home](../../README.md)
- [Production](../../features/production/README.md)
- [Inventory](../../features/inventory/README.md)
- [Technical Overview](../../technical/README.md)
