# Folder Structure Rules

## Root Directory Structure

```
xgen-mrp/
├── .cursor/                    # Cursor IDE settings
├── .git/                       # Git repository
├── .husky/                     # Git hooks
├── .next/                      # Next.js build output (gitignored)
├── .vscode/                    # VS Code settings
├── docs/                       # Documentation files
├── electron/                   # Electron app wrapper
├── node_modules/               # Dependencies (gitignored)
├── notes/                      # Development notes and PRDs
├── prisma/                     # Prisma schema and migrations
├── public/                     # Static assets
├── scripts/                    # Build and utility scripts
├── src/                        # Source code (PRIMARY)
├── tests/                      # Test files
├── .dockerignore              # Docker ignore rules
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── .nvmrc                     # Node version
├── components.json            # shadcn/ui config
├── docker-compose.yml         # Docker compose configuration
├── Dockerfile                 # Production Docker image
├── Dockerfile.dev             # Development Docker image
├── netlify.toml               # Netlify deployment config
├── next.config.js             # Next.js configuration
├── package.json               # NPM dependencies
├── postcss.config.mjs         # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── vitest.config.ts           # Vitest test configuration
```

## Source Directory (`src/`) - CRITICAL

### Complete Structure

```
src/
├── app/                        # Next.js App Router (PAGES & ROUTING)
│   ├── (root pages)           # Public/landing pages
│   ├── admin/                 # Admin portal
│   │   ├── (protected)/       # Protected admin routes (requires auth)
│   │   │   ├── dashboard/
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   ├── materials/
│   │   │   ├── production/
│   │   │   ├── billing/
│   │   │   ├── quality-checks/
│   │   │   ├── users/
│   │   │   ├── work-centers/
│   │   │   ├── customer-orders-v2/
│   │   │   ├── suppliers/
│   │   │   ├── inspectors/
│   │   │   ├── purchase-orders/
│   │   │   ├── purchase-orderline/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   ├── support/
│   │   │   └── layout.tsx     # Protected admin layout
│   │   └── (public)/          # Public admin routes
│   │       └── login/         # Admin login page
│   ├── worker/                # Worker portal
│   │   ├── (protected)/       # Protected worker routes
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   ├── support/
│   │   │   └── layout.tsx
│   │   └── (public)/
│   │       └── login/
│   ├── inspector/             # Inspector portal
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── quality-checks/
│   │   │   ├── production-orders/
│   │   │   ├── inventory/
│   │   │   ├── activity-log/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   ├── support/
│   │   │   └── layout.tsx
│   │   └── (public)/
│   │       └── login/
│   ├── delivery/              # Delivery portal
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── deliveries/
│   │   │   ├── orders/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   ├── support/
│   │   │   └── layout.tsx
│   │   └── (public)/
│   │       └── login/
│   ├── developer/             # Developer portal
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── database-studio/
│   │   │   └── layout.tsx
│   │   └── (public)/
│   │       └── login/
│   ├── superadmin/            # Superadmin portal
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── billing/
│   │   │   ├── users/
│   │   │   ├── system-health/
│   │   │   └── layout.tsx
│   │   └── (public)/
│   │       └── login/
│   ├── api/                   # API Routes (LEGACY - avoid for new features)
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── materials/
│   │   ├── support/
│   │   └── [other-legacy-routes]/
│   ├── billing-statement/     # Public billing statement pages
│   │   └── share/
│   ├── delivery-receipt/      # Public delivery receipt pages
│   │   └── share/
│   ├── sales-invoice/         # Public sales invoice pages
│   │   └── share/
│   ├── changelog/             # Public changelog
│   ├── maintenance/           # Maintenance mode page
│   ├── offline/               # Offline page (PWA)
│   ├── fonts/                 # Custom fonts
│   ├── layout.tsx             # Root layout (GLOBAL)
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
│
├── components/                # React Components
│   ├── ui/                    # shadcn/ui base components (DO NOT MODIFY DIRECTLY)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   └── [other-shadcn-components]
│   ├── shared/                # Shared components (cross-portal)
│   │   ├── page-layout.tsx    # Page layout components (PageContainer, PageHeader, etc.)
│   │   ├── AppSidebar.tsx     # Main sidebar component
│   │   ├── Breadcrumbs.tsx
│   │   ├── UnifiedLayout.tsx
│   │   ├── ShareLinkManager.tsx
│   │   ├── material/          # Material-related shared components
│   │   └── profile/           # Profile-related shared components
│   ├── global/                # Global components (app-wide)
│   │   ├── login/             # Login components
│   │   ├── table/             # Global table components
│   │   ├── support-chat/      # Support chat system
│   │   ├── rich-text-editor/  # Rich text editor
│   │   ├── maintenance-mode.tsx
│   │   ├── notification-bell.tsx
│   │   ├── error-boundary.tsx
│   │   └── require-auth.tsx
│   ├── module/                # Module-specific components (MAIN FEATURE COMPONENTS)
│   │   ├── admin/             # Admin portal components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── customers/     # Customer management components
│   │   │   ├── products/      # Product management components
│   │   │   │   └── bom/       # BOM sub-components
│   │   │   ├── materials/     # Material management components
│   │   │   ├── production/    # Production order components
│   │   │   │   ├── create/    # Create production order
│   │   │   │   └── planning/  # Production planning
│   │   │   ├── billing/       # Billing components
│   │   │   │   ├── billing-statements/
│   │   │   │   ├── delivery-receipts/
│   │   │   │   ├── sales-invoices/
│   │   │   │   ├── dashboard/
│   │   │   │   └── form-sections/
│   │   │   ├── customer-orders/
│   │   │   │   ├── create/
│   │   │   │   ├── analysis/
│   │   │   │   └── fulfillment/
│   │   │   ├── customer-order-ver/
│   │   │   ├── quality-checks/
│   │   │   ├── users/
│   │   │   ├── work-centers/
│   │   │   ├── inspectors/
│   │   │   ├── suppliers/
│   │   │   ├── purchase-orders/
│   │   │   ├── purchase-ordeline/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── workflow/
│   │   ├── worker/            # Worker portal components
│   │   ├── inspector/         # Inspector portal components (alias: inspectors/)
│   │   ├── inspectors/        # Inspector portal components
│   │   │   ├── dashboard/
│   │   │   ├── task/
│   │   │   ├── request/
│   │   │   ├── production/
│   │   │   └── quality-checks/
│   │   ├── delivery/          # Delivery portal components
│   │   ├── developer/         # Developer portal components
│   │   ├── superadmin/        # Superadmin portal components
│   │   ├── chat-support/      # Support chat module
│   │   └── history-logs/      # History logs module
│   ├── providers/             # React Context Providers
│   │   ├── auth-provider.tsx
│   │   └── maintenance-provider.tsx
│   └── [other-component-files]
│
├── lib/                       # Business Logic & Utilities
│   ├── actions/               # Server Actions (PRIMARY DATA LAYER)
│   │   ├── dashboard.ts       # Dashboard data actions
│   │   ├── customers.ts       # Customer CRUD actions
│   │   ├── product.ts         # Product CRUD actions
│   │   ├── materials.ts       # Material CRUD actions
│   │   ├── production-order.ts # Production order actions
│   │   ├── billing-statements.ts
│   │   ├── sales-invoices.ts
│   │   ├── delivery-receipts.ts
│   │   ├── customer-order.ts
│   │   ├── quality-checks.ts
│   │   ├── users.ts
│   │   ├── work-center.ts
│   │   ├── inspector.ts
│   │   ├── inspectors.ts
│   │   ├── bom.ts
│   │   ├── notifications.ts
│   │   ├── inventory-movement.ts
│   │   ├── material-consumption.ts
│   │   ├── order-analytics.ts
│   │   ├── delivery/          # Delivery-specific actions
│   │   ├── inspector/         # Inspector-specific actions
│   │   ├── worker/            # Worker-specific actions
│   │   ├── superadmin/        # Superadmin-specific actions
│   │   ├── history-log/       # History logging actions
│   │   └── shared/            # Shared action utilities
│   ├── validation/            # Zod validation schemas
│   │   ├── customer-order-create.ts
│   │   ├── customer-order-edit.ts
│   │   ├── production-create.ts
│   │   └── enhanced-billing-validation.ts
│   ├── utils/                 # Utility functions
│   │   ├── server-actions.ts  # Server action utilities
│   │   ├── decimal-serializer.ts
│   │   └── [other-utilities]
│   ├── config/                # Configuration files
│   ├── data/                  # Static data
│   ├── services/              # External services
│   ├── adapters/              # Database adapters
│   ├── api/                   # API helpers (legacy)
│   ├── auth.ts                # NextAuth configuration
│   ├── db.ts                  # Prisma client instance
│   ├── utils.ts               # General utilities (cn, etc.)
│   ├── constant.ts            # Constants
│   └── [domain-specific-files]
│
├── types/                     # TypeScript type definitions
│   ├── admin/                 # Admin portal types
│   │   ├── dashboard.ts
│   │   ├── product.ts
│   │   ├── materials.ts
│   │   ├── production-order.ts
│   │   ├── billing.ts
│   │   ├── customer-order.ts
│   │   ├── quality-checks.ts
│   │   └── [other-admin-types]
│   ├── worker/                # Worker portal types
│   ├── inspector/             # Inspector portal types
│   ├── delivery/              # Delivery portal types
│   ├── shared/                # Shared types
│   ├── next-auth.d.ts         # NextAuth type extensions
│   └── index.ts               # Type exports
│
├── hooks/                     # Custom React hooks
│   └── [custom-hooks]
│
├── context/                   # React contexts (rarely used - prefer server state)
│
├── config/                    # App configuration
│
├── data/                      # Static data files
│
├── styles/                    # Style files
│   ├── globals.css            # Global CSS
│   └── [other-styles]
│
├── assets/                    # Static assets (rarely used - prefer /public)
│
└── middleware.ts              # Next.js middleware (CRITICAL - handles auth & routing)
```

## Key Folder Rules

### 1. App Directory (`src/app/`)

#### Route Organization
- **File-based routing**: Every folder is a route segment
- **Route groups**: Use `(name)` for organization without affecting URL
- **Protected routes**: Use `(protected)` group with auth layout
- **Public routes**: Use `(public)` group for login pages

#### Page Files
- `page.tsx` - Route page component
- `layout.tsx` - Shared layout for route segment
- `loading.tsx` - Loading UI
- `error.tsx` - Error UI
- `not-found.tsx` - 404 UI

#### Naming Convention for Pages
- Use lowercase with hyphens: `customer-orders-v2/`
- Avoid underscores in route names
- Use descriptive names: `billing-statements/` not `billing/`

#### Server vs Client Pages
```typescript
// ✅ Server Component (default, preferred)
// src/app/admin/(protected)/customers/page.tsx
import { getAllCustomers } from '@/lib/actions/customers'

export default async function CustomersPage() {
  const customers = await getAllCustomers()
  return <CustomersTable data={customers} />
}

// ❌ Client Component (only if absolutely necessary)
"use client"
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  // Avoid this pattern - use server components instead
}
```

### 2. Components Directory (`src/components/`)

#### Component Hierarchy (Top to Bottom)
1. **ui/** - Base UI primitives from shadcn/ui
2. **shared/** - Cross-portal reusable components
3. **global/** - App-wide functionality components
4. **module/** - Feature-specific components organized by portal

#### Component Placement Rules

**When to put in `ui/`:**
- ONLY shadcn/ui components
- DO NOT create custom components here
- Use `npx shadcn-ui add [component]` to add new ones

**When to put in `shared/`:**
- Used by multiple portals
- Generic layouts (PageContainer, PageHeader)
- Common dialogs
- Shared data tables
- Material/profile components used across portals

**When to put in `global/`:**
- App-wide functionality
- Login systems
- Authentication guards
- Error boundaries
- Notification systems
- Maintenance mode
- Support chat (if accessible to all)

**When to put in `module/[portal]/`:**
- Portal-specific components
- Feature components tied to one portal
- Business logic components
- Forms specific to a feature
- Data tables for specific entities
- Dialogs for specific operations

#### Component File Naming
```
✅ Correct:
components/module/admin/customers/create-customer-dialog.tsx
components/module/admin/products/bom/EditMaterialDialog.tsx
components/shared/page-layout.tsx

❌ Incorrect:
components/admin/CreateCustomerDialog.tsx  (wrong location)
components/module/customers/dialog.tsx     (missing portal, vague name)
components/CreateDialog.tsx                (not in module, too generic)
```

#### Component Organization Pattern
```
module/
└── admin/
    └── customers/
        ├── create-customer-dialog.tsx    # Dialogs
        ├── edit-customer-dialog.tsx
        ├── customer-form.tsx              # Forms
        ├── customer-table.tsx             # Tables
        ├── customer-details.tsx           # Views
        └── index.ts                       # Exports (optional)
```

### 3. Server Actions Directory (`src/lib/actions/`)

#### Organization Rules

**Main actions files:**
```
lib/actions/
├── customers.ts           # Customer CRUD operations
├── product.ts             # Product operations
├── materials.ts           # Material operations
├── production-order.ts    # Production order operations
├── dashboard.ts           # Dashboard data fetching
└── [entity-name].ts       # Follow this pattern
```

**Subdirectories for complex features:**
```
lib/actions/
├── delivery/              # Delivery-specific actions
│   ├── assignments.ts
│   └── tracking.ts
├── inspector/             # Inspector-specific actions
│   ├── tasks.ts
│   └── quality-checks.ts
└── superadmin/            # Superadmin-specific actions
    └── system-health.ts
```

#### Server Action File Structure
```typescript
// ✅ Correct structure
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Type definitions (or import from types/)
export interface CustomerFilters {
  search?: string;
  status?: string;
}

// Action functions
export async function getAllCustomers(filters?: CustomerFilters) {
  try {
    const customers = await prisma.customer.findMany({
      where: buildWhereClause(filters),
    });
    return customers;
  } catch (error) {
    console.error("[GET_CUSTOMERS]", error);
    throw new Error("Failed to fetch customers");
  }
}

export async function createCustomer(data: CustomerCreateInput) {
  try {
    const customer = await prisma.customer.create({ data });
    revalidatePath("/admin/customers");
    return customer;
  } catch (error) {
    console.error("[CREATE_CUSTOMER]", error);
    throw error;
  }
}

// Helper functions (not exported)
function buildWhereClause(filters?: CustomerFilters) {
  // ...
}
```

#### Naming Conventions for Actions
- Use descriptive verb + noun: `getAllCustomers`, `createProduct`
- Prefix with action type: `get*`, `create*`, `update*`, `delete*`
- For complex operations: `generateBillingStatement`, `archiveCustomerOrder`

### 4. Types Directory (`src/types/`)

#### Organization by Portal
```
types/
├── admin/                 # Admin portal types
│   ├── dashboard.ts
│   ├── product.ts
│   ├── materials.ts
│   └── index.ts          # Re-exports
├── worker/               # Worker portal types
├── inspector/            # Inspector portal types
├── delivery/             # Delivery portal types
├── shared/               # Shared across portals
│   ├── profile.ts
│   └── common.ts
├── next-auth.d.ts        # NextAuth augmentation
└── index.ts              # Global exports
```

#### Type Definition Best Practices
```typescript
// ✅ Use Prisma types as base
import { Customer, Product, Prisma } from "@prisma/client";

// Extend Prisma types
export type CustomerWithOrders = Customer & {
  orders: Order[];
};

// Use Prisma's Decimal type, convert for client
export type ProductForClient = Omit<Product, "unitCost"> & {
  unitCost: number; // Converted from Decimal
};

// Form types
export interface CustomerFormData {
  name: string;
  email: string;
  // ... other fields
}
```

### 5. Validation Directory (`src/lib/validation/`)

#### Organization
```
lib/validation/
├── customer-order-create.ts
├── customer-order-edit.ts
├── production-create.ts
├── enhanced-billing-validation.ts
└── [feature]-[action].ts
```

#### Zod Schema Pattern
```typescript
import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^(\+63|0)[0-9]{10}$/, "Invalid PH phone"),
  // ... other fields
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
```

### 6. Lib Utilities (`src/lib/utils/`)

#### Common Utilities
```
lib/utils/
├── server-actions.ts      # Server action helpers
├── decimal-serializer.ts  # Decimal conversion
├── graph-loader.ts        # Graph/diagram loading
└── [specific-utility].ts
```

### 7. Public Directory (`public/`)

```
public/
├── favicon.ico
├── manifest.json          # PWA manifest
├── service-worker.js      # Service worker
├── browserconfig.xml      # Browser config
├── icons/                 # App icons (PWA)
├── images/                # Static images
└── [other-static-files]
```

## File Naming Conventions

### General Rules
- **TypeScript files**: `.ts` or `.tsx`
- **Lowercase with hyphens**: `customer-order.ts`, not `CustomerOrder.ts`
- **React components**: PascalCase filename allowed: `EditMaterialDialog.tsx`
- **Directories**: lowercase with hyphens

### Exceptions
- **UI components** (shadcn): lowercase with hyphens (e.g., `button.tsx`)
- **Module components**: PascalCase or lowercase (both acceptable)
- **Server actions**: lowercase with hyphens
- **Types**: lowercase with hyphens

## Import Path Aliases

```typescript
// Configured in tsconfig.json
{
  "@/*": ["./src/*"]
}

// Usage:
import { Button } from "@/components/ui/button"
import { getAllCustomers } from "@/lib/actions/customers"
import { CustomerType } from "@/types/admin/customer"
import { cn } from "@/lib/utils"
```

## What NOT to Do

❌ **Don't create API routes for new features** (use Server Actions)
❌ **Don't put business logic in components** (use lib/actions)
❌ **Don't mix server and client code without directives**
❌ **Don't create deep component nesting** (max 3-4 levels)
❌ **Don't put types in component files** (use types/ directory)
❌ **Don't modify shadcn/ui components directly** (extend instead)
❌ **Don't use relative imports** (use @/ alias)
❌ **Don't create util files in random places** (use lib/utils)

## Best Practices Summary

✅ **Server Components by default**
✅ **Server Actions for data operations**
✅ **Shared components in shared/**
✅ **Portal-specific in module/[portal]/**
✅ **Types organized by portal**
✅ **Validation schemas in lib/validation**
✅ **Utilities in lib/utils**
✅ **Import using @/ alias**
✅ **Follow naming conventions**
✅ **One feature, one file** (reasonable size)
