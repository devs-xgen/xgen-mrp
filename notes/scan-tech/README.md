# XGen MRP – System Intelligence Brief

## Mission & Value Proposition
XGen MRP is a manufacturing resource planning suite for apparel producers. It unifies production planning, real-time inventory control, quality assurance, delivery logistics, and billing to shorten lead times, increase throughput, and provide operational visibility across the shop floor to the executive office.@README.md#1-147

## Role-Driven Portals
The platform is organized into dedicated experiences per persona, with authentication and authorization enforcing least-privilege access.@CLAUDE.md#70-102

- **Admin (`/admin`)** – system configuration, production oversight, financial operations.
- **SuperAdmin (`/superadmin`)** – elevated controls, cross-tenant overrides, material adjustments.
- **Worker (`/worker`)** – task execution, inventory moves, production feedback.
- **Inspector (`/inspector`)** – quality queues, inspection capture, defect tracking.
- **Delivery (`/delivery`)** – routing, proof-of-delivery, customer updates.
- **Developer (`/developer`)** – diagnostics, database studio, support tooling.

## Core Functional Pillars
- **Customer & Order Management** – intake orders with variant-level detail, drive forecasts, and keep customers informed.@README.md#108-147
- **Production Planning** – explode BOMs, sequence routings, reserve capacity, and orchestrate resources across work centers.@README.md#108-162
- **Inventory & Procurement** – maintain live stock, trigger purchase requisitions, manage suppliers, and reconcile consumption vs. plan.@README.md#121-174
- **Quality Assurance** – enforce in-process and final checkpoints, log defects, and surface quality analytics.@README.md#135-174
- **Delivery & Logistics** – coordinate assignments, track deliveries, capture confirmations, and sync with billing.@README.md#142-147
- **Financial Operations** – generate billing statements, invoices, cost variances, and payment visibility.@README.md#169-174

## System Architecture Snapshot
- **Frontend**: Next.js App Router (v14+), React Server Components by default, TailwindCSS with shadcn/ui for presentation.@README.md#31-104
- **Backend**: Next.js server actions, Prisma ORM, PostgreSQL, with tRPC legacy integrations where required.@README.md#31-104
- **Authentication**: NextAuth.js with role-based access control, leveraging Clerk-aligned patterns per project standards.@README.md#31-104
- **Client Experience**: React Hook Form + Zod validation, TanStack Table for grids, React Query for selective client-side data hydration.@CLAUDE.md#5-18
- **Testing & Tooling**: Vitest, React Testing Library, and scripted lint/format/type checks ensure consistency across contributions.@CLAUDE.md#23-67

## Data Model Highlights
The relational schema (50+ tables) covers users, products, materials, production orders, operations, inventory transactions, quality records, financial documents, and supplier/customer relationships. Notable capabilities include multi-tenant separation, variant hierarchies, BOM inheritance, reservation-aware stock tracking, and comprehensive audit trails.@README.md#43-174

## Primary Workflow (Order → Cash)
1. **Customer Order Intake** – capture requirements and promise dates, automatically evaluating available stock and capacity.@README.md#108-147
2. **Production Planning** – explode materials, stage routings, reserve work centers, and issue purchase plans for shortages.@README.md#108-147
3. **Material Stewardship** – monitor inventory levels, requisition suppliers, and stage components for production windows.@README.md#121-147
4. **Production Execution** – workers follow routed tasks with live status updates, material backflushing, and in-line quality checks.@README.md#128-147
5. **Quality Control** – inspectors log findings, escalate defects, and release lots once pass criteria are met.@README.md#135-147
6. **Delivery & Billing** – logistics teams fulfill shipments, capture digital confirmations, and trigger billing artifacts.@README.md#142-147

## Cross-Cutting Concerns
- **Server-First Pattern** – server components and actions are default; client components are opt-in for interactivity, minimizing bundles and improving performance.@notes/AIRules/README.md#202-225
- **Validation & Type Safety** – strict TypeScript, Prisma types, and Zod schemas enforce correctness across data boundaries.@notes/AIRules/README.md#235-369
- **Security** – role-aware portals, secret management via `.env`, and shared links with expiration/analytics support secure collaboration across stakeholders.@CLAUDE.md#70-102
- **Performance & Caching** – leverages Next.js revalidation strategies, incremental data hydration, and targeted dynamic imports per project standards.@notes/AIRules/README.md#1-225
- **Philippine Compliance Features** – localized validation for phone numbers, TIN, and addresses to suit regional operations.@notes/AIRules/README.md#270-275

## Developer & Operational Enablement
- **Environment Setup** – Node 18+, PostgreSQL 14+, Prisma generate/migrate flows, and seeding scripts (comprehensive, worker demo, billing) accelerate onboarding.@CLAUDE.md#19-54
- **Workflow Tooling** – linting, formatting, type-checks, and test scripts maintain code hygiene; Docker and Netlify guides support multiple deployment targets.@README.md#175-320
- **Support & Diagnostics** – in-app support system (legacy API), cleanup scripts for shareable links, and developer portal database studio aid maintenance and triage.@CLAUDE.md#63-268

## Key Takeaways
XGen MRP delivers a vertically integrated operations backbone for apparel manufacturers, marrying deep production intelligence with role-specific UX. Its server-first Next.js architecture, robust data model, and opinionated developer tooling enable rapid iteration while maintaining compliance, security, and performance.
