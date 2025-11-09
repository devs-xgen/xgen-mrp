# Admin Portal Technical Overview

## Mission & Scope
XGen MRP’s admin portal delivers end-to-end oversight for apparel operations—covering production planning, inventory stewardship, partner management, billing, and analytics—through a server-first Next.js experience tailored to strategic and supervisory roles.@notes/scan-tech/README.md#3-55 @docs/roles/admin/README.md#1-28

## Access Control & Entry Points
- **Protected Layout** – Only `ADMIN`, `SUPER_ADMIN`, and `DEVELOPER` roles are permitted; others are redirected to the worker dashboard. UnifiedLayout also wires the portal shell and theming behavior.@src/app/admin/(protected)/layout.tsx#1-18
- **Login Surface** – `/admin/login` provides credential capture, super-admin escalation link, and navigation back to the landing page.@src/app/admin/(public)/login/page.tsx#1-45

## Core Responsibilities
- Configure master data (products, materials, units, suppliers, work centers) and user accounts.@docs/roles/admin/README.md#7-73
- Direct production workflows, monitor capacity, and triage bottlenecks.@docs/roles/admin/README.md#64-125 @src/app/admin/(protected)/production/page.tsx#1-181
- Govern customer orders, procurement, and billing artifacts to ensure cash flow visibility.@docs/roles/admin/README.md#103-145 @src/app/admin/(protected)/billing/page.tsx#1-308
- Maintain partner relationships and quality enforcement through inspector oversight and supplier/customer profiling.@src/app/admin/(protected)/suppliers/page.tsx#1-52 @src/app/admin/(protected)/customers/page.tsx#1-52 @src/app/admin/(protected)/inspectors/page.tsx#1-70
- Provide system support coverage via in-portal ticketing and chat surfaces.@src/app/admin/(protected)/support/page.tsx#1-5

## Navigation Blueprint
The sidebar derives its hierarchy from `adminNavItems`, grouping modules by operational domain. Key branches include dashboard, item management, production, orders, billing, partner directories, user registry, support, and settings—each with Lucide iconography and descriptions for tooltip rendering.@src/config/nav.ts#1-182 @src/components/shared/AppSidebar.tsx#208-398

### Dashboard
Client-rendered analytics snapshot with workflow connections, order status comparisons, material/product leaders, and quick-action shortcuts for downstream modules.@src/app/admin/(protected)/dashboard/page.tsx#1-55

### Item Management
- **Products** – Lists products with category management, creation flows, archive access, and inventory flow education dialog; data is fetched via `getAllProducts` and `getCategories` with post-mutation revalidation.@src/app/admin/(protected)/products/page.tsx#1-60
- **Materials** – Combines inventory KPIs, supplier/unit/type dialogues, archive access, and table-level refresh using `getAllMaterials`, `getMaterialTypes`, `getUnitOfMeasures`, and `getSuppliers` server actions.@src/app/admin/(protected)/materials/page.tsx#1-107

### Production Operations
- **Production Orders** – Server component that aggregates Prisma data into analytics cards, quick filters, and a TanStack table while exposing creation CTA and embedded FloatingChatbox for live support.@src/app/admin/(protected)/production/page.tsx#1-181
- **Production Order Detail** – Dynamic route (e.g., `/admin/production/[id]`) hosts workflow progression controls, QR sharing, delivery coordination, inspector insights, and operations breakdown for end-to-end governance.@src/app/admin/(protected)/production/[id]/page.tsx#171-323

### Order Management
- **Customer Orders V2** – Suspense-driven page delegating to `CustomerOrderV2Client`, seeded by `getCustomerOrders`, `getAllCustomers`, and `getAllProducts`, and equipped with analytics, archives, and planning routes.@src/app/admin/(protected)/customer-orders-v2/page.tsx#1-52
- **Purchase Orders** – Linked via navigation for supplier procurement (implementation follows shared table pattern).@src/config/nav.ts#94-107

### Billing Suite
`/admin/billing` orchestrates revenue KPIs, status summaries, intelligent recommendations, quick links, and consolidated recents by loading billing statements, invoices, and delivery receipts concurrently through dedicated server actions (`getComprehensiveBillingAnalytics`, `getAllBillingStatements`, `getAllSalesInvoices`, `getAllDeliveryReceipts`).@src/app/admin/(protected)/billing/page.tsx#1-308
Child routes manage CRUD operations for billing statements, invoices, delivery receipts, and reports, aligning with the nav blueprint.@src/config/nav.ts#110-138

### Partner & User Management
- **Suppliers** – Read/write supplier registry with creation dialog and website-wide revalidation hooks.@src/app/admin/(protected)/suppliers/page.tsx#1-52
- **Customers** – Decimal-safe table, creation dialog, and revalidate server action for customer records.@src/app/admin/(protected)/customers/page.tsx#1-52
- **Inspectors** – Staffing console exposing department/specialization pickers and inspector creation dialog bound to `revalidatePath` for freshness.@src/app/admin/(protected)/inspectors/page.tsx#1-70
- **Users** – Global directory with create-user dialog for provisioning across roles.@src/app/admin/(protected)/users/page.tsx#1-45

### Analytics & Support
- **Order Analytics** – Breadcrumb-enabled dashboard combining fulfillment, order, and production planning metrics via dedicated analytics server actions.@src/app/admin/(protected)/analytics/orders/page.tsx#1-105
- **Support** – Embeds shared `ChatSupportPage` for ticket triage, inheriting admin privileges.@src/app/admin/(protected)/support/page.tsx#1-5

## Cross-Cutting Utilities
- **UnifiedLayout** – Applies RBAC, theme context, and layout wrappers for every protected admin route.@src/app/admin/(protected)/layout.tsx#1-18
- **Page Layout Primitives** – `PageContainer`, `PageHeader`, `SectionCard`, etc., provide consistent structure, spacing, and typography.@src/components/shared/page-layout.tsx#1-84
- **AppSidebar** – Collapsible nav with tooltip support, grouped sections, role-aware content, profile display, theme toggle, and sign-out control.@src/components/shared/AppSidebar.tsx#1-399
- **FloatingChatbox** – Optional support overlay surfaced on high-complexity pages (billing, production) for instant assistance.@src/app/admin/(protected)/billing/page.tsx#25-305 @src/app/admin/(protected)/production/page.tsx#21-179

## Data & Server Action Highlights
- Production, billing, and materials modules rely heavily on Prisma-backed server actions for data hydration and safe revalidation patterns (`revalidatePath`).@src/app/admin/(protected)/production/page.tsx#32-176 @src/app/admin/(protected)/billing/page.tsx#54-308 @src/app/admin/(protected)/materials/page.tsx#31-104
- Role-specific dashboards orchestrate parallel data fetching using `Promise.all` to minimize latency and maintain atomic loading states.@src/app/admin/(protected)/billing/page.tsx#54-228

## Design Patterns & UX Notes
- Server components form the baseline; client components handle interactivity (graphs, dialogs, tooltips).@notes/AIRules/README.md#202-238 @src/app/admin/(protected)/dashboard/page.tsx#1-55
- Analytics cards (`AnalyticsCard`) and SectionCard wrappers deliver consistent visual language across modules.@src/app/admin/(protected)/billing/page.tsx#69-227 @src/app/admin/(protected)/production/page.tsx#110-176
- Suspense is leveraged for progressive hydration where data dependencies are heavier (billing dashboard, customer orders v2 list).@src/app/admin/(protected)/billing/page.tsx#284-302 @src/app/admin/(protected)/customer-orders-v2/page.tsx#33-48

## Reference Materials
- Admin role operations playbook.@docs/roles/admin/README.md#1-234
- Navigation taxonomy and icon mapping.@src/config/nav.ts#1-182
- Layout and theming guidelines for AI agents.@notes/AIRules/README.md#1-563
