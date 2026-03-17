# XGen MRP Documentation

This folder is the fastest way to understand the system layout before reading code.

Use it as a navigation layer for humans and AI agents:

- Start by role when the question is portal-specific
- Start by technical docs when the question is system-wide
- Start by plan-spec when the question is about pending or recently shipped work

## Quick Start

If you need one thing fast, start here:

- System architecture and source-of-truth folders: [technical/README.md](./technical/README.md)
- Admin portal scope and major features: [roles/admin/README.md](./roles/admin/README.md)
- Worker portal scope and task flows: [roles/worker/README.md](./roles/worker/README.md)
- Inspector portal scope and quality flows: [roles/inspector/README.md](./roles/inspector/README.md)
- Delivery portal scope and delivery flows: [roles/delivery/README.md](./roles/delivery/README.md)
- Superadmin portal scope and platform-wide control: [roles/superadmin/README.md](./roles/superadmin/README.md)
- Planning, active scopes, and completed implementation notes: [plan-spec/README.md](./plan-spec/README.md)
- Error and failure behavior: [ERROR_HANDLING.md](./ERROR_HANDLING.md)
- Maintenance-mode behavior: [MAINTENANCE_MODE.md](./MAINTENANCE_MODE.md)

## Docs Folder Layout

```text
docs/
├── README.md                     # This navigation guide
├── technical/                    # System-wide architecture and codebase overview
├── roles/                        # Portal-specific docs by role
│   ├── admin/
│   ├── worker/
│   ├── inspector/
│   ├── delivery/
│   └── superadmin/
├── plan-spec/                    # Planned, active, completed scopes and decisions
│   ├── active/
│   ├── completed/
│   └── decisions/
├── ERROR_HANDLING.md             # Error-handling rules and behavior
└── MAINTENANCE_MODE.md           # Maintenance-mode setup and runtime notes
```

## Browse By Goal

### 1. I need to know which role owns a feature

Use the role docs first:

- Admin: [roles/admin/README.md](./roles/admin/README.md)
- Worker: [roles/worker/README.md](./roles/worker/README.md)
- Inspector: [roles/inspector/README.md](./roles/inspector/README.md)
- Delivery: [roles/delivery/README.md](./roles/delivery/README.md)
- Superadmin: [roles/superadmin/README.md](./roles/superadmin/README.md)

### 2. I need to know where implementation files live

Use [technical/README.md](./technical/README.md), then jump to code:

- UI routes: `src/app/<role>/**`
- Role UI modules: `src/components/module/<role>/**`
- Server actions: `src/lib/actions/**`
- Shared validation: `src/lib/validation/**`
- Data model: `prisma/schema.prisma`
- Middleware and auth: `src/middleware.ts`, `src/lib/auth.ts`

### 3. I need to understand planned or recently shipped work

Use [plan-spec/README.md](./plan-spec/README.md):

- `active/` for current implementation scopes
- `completed/` for shipped work and historical context
- `decisions/` for unresolved product or architecture decisions

## Browse By Role And Feature Area

This section is intentionally short so an AI agent can decide where to look next.

### Admin

Start here: [roles/admin/README.md](./roles/admin/README.md)

Primary feature areas:

- Master data: customers, suppliers, products, materials
- Planning and execution: customer orders, production, work centers, operations
- Commercial flow: billing, invoices, delivery receipts
- User management and support

Main code targets:

- `src/app/admin/(protected)/**`
- `src/components/module/admin/**`

### Worker

Start here: [roles/worker/README.md](./roles/worker/README.md)

Primary feature areas:

- Assigned tasks
- Production execution
- Inventory views and alerts
- QR scanning

Main code targets:

- `src/app/worker/(protected)/**`
- `src/components/module/worker/**`
- `src/lib/actions/worker/**`

### Inspector

Start here: [roles/inspector/README.md](./roles/inspector/README.md)

Primary feature areas:

- Quality review
- Production verification
- Inventory inspection and requests
- Activity logs and scan flows

Main code targets:

- `src/app/inspector/(protected)/**`
- `src/components/module/inspector/**`
- `src/lib/actions/inspector/**`

### Delivery

Start here: [roles/delivery/README.md](./roles/delivery/README.md)

Primary feature areas:

- Deliveries
- Delivery tasks
- Order review
- Profile and support

Main code targets:

- `src/app/delivery/(protected)/**`
- `src/components/module/delivery/**`
- `src/lib/actions/delivery/**`

### Superadmin

Start here: [roles/superadmin/README.md](./roles/superadmin/README.md)

Primary feature areas:

- Platform-wide analytics
- Audit and system monitoring
- Global users and organizations
- Broad cross-domain administration

Main code targets:

- `src/app/superadmin/(protected)/**`
- `src/components/module/superadmin/**`
- `src/lib/actions/superadmin/**`

Extra superadmin docs:

- [roles/superadmin/QUICKSTART.md](./roles/superadmin/QUICKSTART.md)
- [roles/superadmin/FEATURES.md](./roles/superadmin/FEATURES.md)
- [roles/superadmin/technical/README.md](./roles/superadmin/technical/README.md)

## Suggested Reading Order For AI Agents

When answering questions about this repo:

1. Read this file to choose the right documentation area.
2. Read the matching role doc if the question is portal-specific.
3. Read [technical/README.md](./technical/README.md) for shared architecture.
4. Open the matching code folders in `src/app`, `src/components/module`, and `src/lib/actions`.
5. Check [plan-spec/README.md](./plan-spec/README.md) if the question may involve recent changes, shipped fixes, or planned work.

## Source Of Truth

Docs are only a navigation layer. When docs and code disagree, prefer the code:

- Routes: `src/app/**`
- Role modules: `src/components/module/**`
- Server actions: `src/lib/actions/**`
- Database schema: `prisma/schema.prisma`
- Dependencies and scripts: `package.json`

## Maintenance Note

This docs index should stay concise. If new role docs, feature docs, or decision folders are added later, update this file so future readers and AI agents can find them quickly.
