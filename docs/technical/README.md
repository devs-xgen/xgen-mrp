# Technical Overview

## Executive Summary

XGen MRP is a Next.js 15 App Router application for manufacturing operations. The current codebase is organized around role-specific portals, Prisma-backed domain models, server actions for business logic, and targeted route handlers for API-style integration points.

This repository is not a thin demo. It has a broad operational surface:

- 55 admin pages
- 12 worker pages
- 22 inspector pages
- 9 delivery pages
- 35 superadmin pages
- 6 developer pages
- 54 API route handlers
- 59 Prisma models

## Architecture

### Runtime Shape

- Frontend and server rendering: `next` with React 18
- Routing: App Router under `src/app/**`
- Business logic: mostly server actions under `src/lib/actions/**`
- API endpoints: route handlers under `src/app/api/**`
- Data access: Prisma client from `src/lib/db.ts`
- Auth: NextAuth credentials flow in `src/lib/auth.ts`
- Authorization guardrails: `src/middleware.ts`

### Role-Based Portals

The codebase has separate route trees and login pages for:

- `/admin`
- `/worker`
- `/inspector`
- `/delivery`
- `/superadmin`
- `/developer`

The Prisma `Role` enum includes `DEVELOPER` with hardcoded credentials:

- Email: `dev@xgen-mrp.local`
- Password: `dev123!@#`
- Access: All portals via role-gated middleware
- Bypasses rate limiting for system maintenance

### Shared Cross-Cutting Features

- PWA assets and service worker support (`public/manifest.json`, `public/sw.js`, `ServiceWorkerManager`)
- Share-link and public document access for billing and production
- PDF generation for billing and delivery documents
- QR code generation and QR scanning
- Support-ticket system with real-time messaging (`/support`, `/api/support/**`)
- Database Studio for backups and exports (`/developer/database-studio`)
- Maintenance mode and enhanced error handling

## Dependency Inventory

The package manifest currently shows the following major packages in use.

### Core Platform

- `next`
- `react`
- `react-dom`
- `typescript`

### Data and Validation

- `@prisma/client`
- `@prisma/extension-accelerate`
- `prisma`
- `zod`
- `dotenv`

### Authentication and Security

- `next-auth`
- `bcryptjs`

### UI and Styling

- `tailwindcss`
- `tailwindcss-animate`
- `@shadcn/ui`
- many `@radix-ui/*` packages
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`
- `@heroicons/react`
- `@headlessui/react`
- `vaul`
- `sonner`

### Forms, Tables, and State

- `react-hook-form`
- `@hookform/resolvers`
- `@tanstack/react-table`
- `@tanstack/react-query`
- `zustand`

### Dates, Charts, and Interaction

- `date-fns`
- `react-day-picker`
- `react-datepicker`
- `recharts`
- `@hello-pangea/dnd`
- `cmdk`

### Documents, Export, and Scanning

- `@react-pdf/renderer`
- `jspdf`
- `html2canvas`
- `html2pdf.js`
- `exceljs`
- `archiver`
- `html5-qrcode`
- `next-qrcode`
- `qrcode.react`
- `react-qr-code`
- `react-to-print`

### Rich Content

- `mermaid`
- `@types/mermaid`
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/pm`

### Tooling and Tests

- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `jsdom`
- `eslint`
- `eslint-config-next`
- `prettier`
- `husky`
- `lint-staged`
- `ts-node`

### Desktop Packaging

- `electron`
- `electron-builder`

## Data Model Summary

The schema in `prisma/schema.prisma` defines 59 models. Major domain clusters:

- Identity and audit: `User`, `UserProfile`, `LoginHistory`, `ActivityLog`
- Product and material master data: `Product`, `ProductVariant*`, `Material`, `BOM`, `ProductionBOM`
- Operations: `ProductionOrder`, `Operation`, `WorkCenter`, `WorkCenterAssignment`
- Inventory: `InventoryItem`, `Location`, `InventoryMovement`, `MaterialReservation`, `MaterialRequest`
- Commercial records: `Customer`, `CustomerOrder`, `OrderLine`, `Supplier`, `PurchaseOrder`, `Transaction`
- Document and finance: `BillingStatement`, `SalesInvoice`, `DeliveryReceipt`, `ShareableLink`
- Support system: `SupportTicket`, `SupportMessage` (with `SupportStatus`, `SupportPriority` enums)
- Platform/admin: `Organization`, `SavedReport`, `SystemMetric`, `SystemError`, `AlertRule`, `AlertHistory`

## Codebase Assessment

### Strengths

- Clear domain separation by role and feature area
- Broad test coverage folders across unit, integration, accessibility, performance, and e2e
- Consistent use of TypeScript and Prisma
- Strong support for document generation and sharing workflows
- Dedicated operational handling for maintenance mode, security headers, and error reporting

### Gaps and Drift Identified During Documentation Review

- Several existing markdown docs referenced files that do not exist, especially under `docs/technical/*`
- Earlier docs claimed tRPC, GPS routing, payment gateways, recurring billing, and other features that are not clearly represented in the current repository
- The root `README.md` still contains stale references and some missing-file links
- `electron/main.js` requires `electron-is-dev`, but that package is not listed in `package.json`; the Electron shell needs dependency reconciliation before it can be treated as fully documented/verified

## Developer Portal Features

### Database Studio (`/developer/database-studio`)

Rate-limited endpoints for PostgreSQL operations:

- `GET /api/developer/database/tables` - List all database tables with schema
- `POST /api/developer/database/backup` - Stream SQL backup (full or selective tables)
- `POST /api/developer/database/export` - Export to Excel (.xlsx)
- `POST /api/developer/database/export-csv` - Export to CSV ZIP archive

**Environment Variables:**

- `PG_BACKUP_URL` - Direct PostgreSQL connection (required for backups, bypasses Prisma Accelerate)
- `PG_DUMP_PATH` - Custom path to `pg_dump` executable

### Support System APIs (`/api/support/**`)

Universal support ticket system accessible by all roles:

- `GET /api/support/tickets` - List tickets (filtered by role: users see own, admins see all)
- `POST /api/support/tickets` - Create new ticket
- `GET /api/support/tickets/[id]` - Get ticket details with messages
- `PATCH /api/support/tickets/[id]` - Update status/priority (admin/developer only)
- `POST /api/support/tickets/[id]/messages` - Add message to ticket

**Status Flow:** OPEN → IN_PROGRESS → RESOLVED → CLOSED
**Priority Levels:** LOW, MEDIUM, HIGH, URGENT

### Practical Reading Order For Engineers

1. `package.json`
2. `prisma/schema.prisma`
3. `src/lib/auth.ts`
4. `src/middleware.ts`
5. `src/app/<role>/**`
6. `src/lib/actions/**`

## Related Docs

- [Documentation Home](../README.md)
- [Admin](../roles/admin/README.md)
- [Developer](../roles/developer/README.md)
- [Production](../features/production/README.md)
- [Billing](../features/billing/README.md)
