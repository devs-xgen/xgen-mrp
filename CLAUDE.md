# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XGen MRP is a comprehensive Manufacturing Resource Planning (MRP) system built for clothing manufacturers. It provides end-to-end production planning, inventory management, quality control, and delivery management through role-based interfaces.

**Tech Stack:**
- Next.js 15 (App Router) with TypeScript
- Prisma ORM with PostgreSQL database
- NextAuth.js for authentication with role-based access control
- TailwindCSS + Shadcn/UI component library
- React Hook Form + Zod for form validation
- TanStack Table for data tables
- Vitest for testing
- React Query (@tanstack/react-query) for data fetching

**Development Server:**
- Runs on port **3001** (not default 3000)
- Uses `npm run dev` to start

## Common Commands

### Development
```bash
npm run dev                    # Start dev server on port 3001
npm run build                  # Production build
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint issues
npm run format                 # Format code with Prettier
npm run type-check             # TypeScript type checking
```

### Database & Prisma
```bash
npm run prisma:generate        # Generate Prisma client (no engine)
npm run prisma:push            # Push schema to database
npm run prisma:studio          # Open Prisma Studio
npx prisma migrate dev         # Create and apply migration
npx prisma db pull             # Pull schema from database
```

### Seeding
```bash
npm run seed                           # Run main seed file
npm run seed:comprehensive             # Comprehensive seed with all data
npm run seed:worker-demo               # Worker-specific demo data
npm run seed:materials-products        # Materials and products only
npm run seed:customers-suppliers       # Customers and suppliers only
npm run seed:billing                   # Billing-related data
npm run link:inspectors                # Link inspector accounts
```

### Testing
```bash
npm test                       # Run all tests once
npm run test:watch             # Run tests in watch mode
npm run test:ui                # Open Vitest UI
```

### Cleanup & Maintenance
```bash
npm run cleanup:links          # Cleanup shareable links
npm run cleanup:links:dry      # Dry run cleanup
npm run cleanup:links:stats    # Show link statistics
```

## Architecture

### Multi-Portal Role-Based Architecture

The system is organized around **5 primary user roles**, each with dedicated portal interfaces:

1. **Admin** (`/admin`) - System management, production oversight, financial operations
2. **SuperAdmin** (`/superadmin`) - Enhanced admin capabilities with production order material overrides
3. **Worker** (`/worker`) - Production execution, task management, inventory operations
4. **Inspector** (`/inspector`) - Quality control, inspection workflows, defect tracking
5. **Delivery** (`/delivery`) - Delivery management, route optimization, customer interaction
6. **Developer** (`/developer`) - System diagnostics, database studio, user management, support tickets

**Portal Structure Pattern:**
```
src/app/{role}/
  /(protected)/          # Authenticated routes (uses layout.tsx for auth check)
    /dashboard/
    /[feature]/
  /(public)/             # Public routes (mainly login pages)
    /login/
```

**Special Routes:**
```
src/app/api/              # API routes for external integrations
src/app/billing-statement/share/[token]/   # Public shareable billing statements
src/app/sales-invoice/share/[token]/       # Public shareable invoices
src/app/delivery-receipt/share/[token]/    # Public shareable delivery receipts
src/app/changelog/                          # System changelog
src/app/support/                            # Support ticket system
src/app/install-app/                        # PWA installation instructions
src/app/offline/                            # Offline fallback page
```

### Authentication & Authorization

- **NextAuth.js** configuration in `src/lib/auth.ts`
- Portal-based authentication: Users authenticate to specific portals
- Role-to-portal mapping enforced during login
- Protected routes use server-side session checks in layout files
- JWT sessions with 8-hour expiration
- Rate limiting on login attempts (10 attempts per 15 minutes)

**Developer Account (Hardcoded):**
- Email: `dev@xgen-mrp.local`
- Password: `dev123!@#`
- Can access all portals

### Database Architecture (Prisma)

The system uses **50+ interconnected tables** organized into logical domains:

**Core Entity Groups:**
- **Users & Auth**: User, UserProfile, EmergencyContact, Role enums
- **Products**: Product, ProductVariant, ProductVariantBOM, ProductCategory
- **Materials**: Material, MaterialType, UnitOfMeasure, MaterialReservation
- **Production**: ProductionOrder, ProductionBOM, ProductionBatch, Operation, WorkCenter
- **Quality**: QualityCheck, Inspector, BatchStatus/QualityStatus enums
- **Inventory**: InventoryItem, InventoryMovement, MaterialConsumption, Location
- **Orders**: CustomerOrder, OrderLine, OrderLineVariant, fulfillment tracking
- **Billing**: BillingStatement, SalesInvoice, DeliveryReceipt, Transaction
- **Suppliers**: Supplier, PurchaseOrder, PurchaseOrderLine

**Key Database Patterns:**
- Soft deletes with `archivedAt`, `archivedBy`, `archivedReason` fields
- Audit trails with `createdBy`, `modifiedBy`, `createdAt`, `updatedAt`
- Status enums for workflow state management
- Material/product reservations for real-time inventory tracking
- Production order linking to customer orders for traceability
- Comprehensive cost tracking (planned vs actual, variance analysis)

### Server Actions Pattern

Business logic is implemented as **Next.js Server Actions** in `src/lib/actions/`:

```typescript
"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Define validation schema
const createEntitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  // ... other fields
})

export async function createEntity(data: FormData) {
  try {
    // 1. Validate session/permissions
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // 2. Parse and validate input (Zod)
    const validatedData = createEntitySchema.parse({
      name: data.get("name"),
      // ... other fields
    })

    // 3. Database operations (Prisma)
    const entity = await prisma.entity.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      }
    })

    // 4. Return success response
    return {
      success: true,
      data: entity,
      message: "Entity created successfully"
    }
  } catch (error) {
    console.error("Error creating entity:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create entity"
    }
  }
}
```

**Server Action Organization:**
- One file per entity/feature (e.g., `production-order.ts`, `materials.ts`)
- Nested folders for role-specific actions (`/worker/`, `/inspector/`, `/superadmin/`)
- Shared utilities in `/shared/` subdirectory
- Transaction-based operations for data consistency

**Server Action Response Format:**
All server actions should return an object with:
- `success: boolean` - Indicates if operation succeeded
- `data?: any` - The result data (if successful)
- `error?: string` - Error message (if failed)
- `message?: string` - Optional success message for user feedback

### Component Organization

```
src/components/
  /ui/                    # Shadcn/UI components (button, dialog, table, etc.)
  /module/                # Role-specific feature components
    /admin/              # Admin-specific components
    /worker/             # Worker-specific components
    /inspector/          # Inspector-specific components
    /delivery/           # Delivery-specific components
    /superadmin/         # SuperAdmin-specific components
  /shared/               # Cross-role shared components (data tables, forms)
  /global/               # App-wide components (navbar, sidebar, layouts)
  /providers/            # Context providers (theme, query client)
  /common/               # Common reusable components
  /worker/               # Additional worker-specific utilities
```

**Source Structure:**
```
src/
  /app/                  # Next.js App Router pages and API routes
  /components/           # React components (organized as above)
  /lib/                  # Business logic and utilities
    /actions/           # Next.js Server Actions
      /inspector/       # Inspector-specific actions
      /worker/          # Worker-specific actions
      /superadmin/      # SuperAdmin-specific actions
      /shared/          # Shared business logic
    /api/               # API helper functions
    /config/            # Configuration files
    /data/              # Static data and constants
    /services/          # External service integrations
    /utils/             # Utility functions
    /validation/        # Zod validation schemas
    /adapters/          # Data adapters
  /types/                # TypeScript type definitions
    /admin/             # Admin-specific types
    /worker/            # Worker-specific types
    /inspector/         # Inspector-specific types
    /delivery/          # Delivery-specific types
    /shared/            # Shared types
  /hooks/                # Custom React hooks
  /context/              # React context providers
  /styles/               # Global styles
  /assets/               # Static assets (images, etc.)
  /config/               # App configuration
  /data/                 # Static data files
```

**Component Patterns:**
- Data tables use TanStack Table with column definitions
- Forms use React Hook Form + Zod schemas
- Dialogs/Modals use Radix UI primitives (via Shadcn)
- Server actions called from client components with loading states

### Material/Product Variant System

**Key Concept:** Products can have variants (size/color combinations), and each variant can have:
- Its own BOM (Bill of Materials) via `ProductVariantBOM`
- BOM inheritance from parent product with optional overrides
- Independent stock levels and pricing
- Unique SKU generation

**When creating production orders:**
1. Check if product has variants
2. If yes, use variant-specific BOM (`ProductVariantBOM`)
3. If no variants, use base product BOM (`BOM`)
4. Copy to `ProductionBOM` with snapshot of costs at order creation
5. Material reservations created from ProductionBOM

### Production Order Workflow

1. **Order Creation** (from customer order or manual)
   - Generate ProductionBOM from product/variant BOM
   - Calculate material requirements
   - Create material reservations (updates `Material.committedStock`)

2. **Material Reservation** (automatic)
   - Reserve materials via `MaterialReservation` table
   - Track: quantityReserved, quantityConsumed, quantityReleased
   - Supports partial consumption and release

3. **Production Execution** (workers)
   - Assign operations to work centers
   - Workers report progress via operation status updates
   - Material consumption tracked in `ProductionMaterialConsumption`
   - Real-time inventory updates via `InventoryMovement`

4. **Quality Control** (inspectors)
   - Inspections via `QualityCheck` table
   - Defect tracking and approval workflows
   - Can halt production or require rework

5. **Completion**
   - Update inventory (add finished goods stock)
   - Release unused material reservations
   - Generate cost variance reports
   - Trigger billing and delivery workflows

### Inventory Movement Tracking

All inventory changes are tracked via `InventoryMovement` table:
- Supports both materials (`materialId`) and products (`productId`)
- Records: previous stock, new stock, movement type, cost tracking
- Linked to source transactions via `referenceId` + `referenceType`
- Audit trail with performedBy and approvedBy users

**Movement Types:** MATERIAL_RESERVATION, MATERIAL_CONSUMPTION, MATERIAL_RETURN, PRODUCTION_COMPLETE, PRODUCT_SHIPMENT, etc. (see MovementType enum)

### Stock Calculation

Products and materials have multiple stock fields:
- `currentStock`: Physical inventory count
- `committedStock`: Reserved for production orders
- `expectedStock`: Incoming stock (purchase orders)
- `availableStock`: currentStock - committedStock
- `calculatedStock`: currentStock + expectedStock - committedStock

**Important:** When allocating materials or products, always check `availableStock`, not just `currentStock`.

### Billing & Financial Flow

1. **Production Order Completion** → Create `BillingStatement`
2. **Billing Statement** → Generate `SalesInvoice` with line items
3. **Delivery** → Create `DeliveryReceipt` linked to billing statement
4. **Payment** → Record in `Transaction` table

**Shareable Links:**
- Billing statements, invoices, and delivery receipts can generate shareable links
- Tokens stored in `ShareableLink` table with expiration
- Public routes: `/billing-statement/share/[token]`, etc.

## Development Patterns

### TypeScript Path Aliases

```typescript
@/*                 → ./src/*
@/components/*      → ./src/components/*
@/lib/*             → ./src/lib/*
```

### Creating New Features

When adding a new admin feature:
1. Create server actions in `src/lib/actions/[feature].ts`
2. Create page in `src/app/admin/(protected)/[feature]/page.tsx`
3. Add components in `src/components/module/admin/[feature]/`
4. Update navigation in `src/components/global/admin-nav.tsx`

### Database Changes

When modifying schema:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate` to update client
3. Run `npx prisma db push` (dev) or `npx prisma migrate dev --name [description]` (production)
4. Update TypeScript types in `src/types/` if needed
5. Update affected server actions and components

### Form Validation Pattern

```typescript
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

const schema = z.object({
  name: z.string().min(1, "Required"),
  // ...
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})

async function onSubmit(values: z.infer<typeof schema>) {
  const result = await serverAction(values)
  // Handle result
}
```

### Session Access Pattern

```typescript
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// In server component or server action:
const session = await getServerSession(authOptions)
if (!session?.user) {
  redirect("/login")
}

// Check role:
if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
  throw new Error("Unauthorized")
}
```

## Important Implementation Notes

1. **Prisma Client Generation:** Always use `--no-engine` flag for Netlify compatibility
   ```bash
   npx prisma generate --no-engine
   ```

2. **Transaction Usage:** When updating stock levels, production orders, or material reservations, wrap in Prisma transactions:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // Multiple operations
   })
   ```

3. **Production Order with Material Overrides:** SuperAdmin can override material quantities in ProductionBOM. Check `isAdjusted` field and use `adjustedQuantity` if true.

4. **BOM Inheritance:** ProductVariants can inherit BOM from parent product. Check `inheritBOMFromParent` field. If false, use variant-specific BOMs.

5. **Soft Deletes:** Most entities support soft delete. Check for `archivedAt` field. Archived records should be excluded from active queries unless explicitly shown.

6. **Real-time Stock:** When displaying product/material stock, always recalculate from movements if accuracy is critical, or use the cached fields with appropriate refresh logic.

7. **Portal Security:** Each portal has its own login page. Never redirect users between portals without explicit re-authentication.

8. **Quality Checks:** Production orders can be blocked by quality holds. Check `QualityStatus` and `BatchStatus` before allowing completion.

9. **Worker Task Assignment:** Workers are assigned to WorkCenters via `WorkCenterAssignment`. Operations are assigned to WorkCenters, and workers see operations for their assigned centers.

10. **Customer Order Fulfillment:** OrderLines track fulfillment through `fulfillmentType` (STOCK, PRODUCTION, HYBRID) and `fulfillmentStatus`. System auto-determines fulfillment strategy based on available stock.

11. **TypeScript Configuration:** The project uses relaxed TypeScript settings (`strict: false`, `noImplicitAny: false`). Build errors and ESLint warnings are ignored during builds for faster iteration.

12. **Next.js Configuration:**
    - Output mode is `standalone` for containerized deployments
    - Images are unoptimized for Netlify compatibility
    - API routes have CORS headers enabled
    - Uses webpack customizations for SVG/asset handling
    - PWA-specific headers for service worker and manifest caching

13. **Scripts Organization:** Utility scripts in `/scripts/` directory include:
    - Database seeding scripts (comprehensive, worker-demo, billing)
    - Cleanup utilities (shareable links)
    - Migration scripts (billing schema)
    - Validation and testing scripts

## Testing

- Test files colocated in `/tests/` directory
- Use Vitest for unit and integration tests
- Test database operations using Prisma mocking or test database
- Test server actions by importing and calling directly

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL`: Prisma-compatible PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for JWT signing (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Base URL of application (e.g., `http://localhost:3001`)
- `PG_BACKUP_URL`: Optional backup database URL
- `NEXT_PUBLIC_APP_URL`: Public-facing application URL
- `NEXT_PUBLIC_APP_VERSION`: Application version (auto-populated from package.json)
- `NEXT_PUBLIC_ENABLE_ERROR_REPORTING`: Enable/disable error reporting in production

## Deployment

The application supports multiple deployment strategies:

1. **Netlify** (Primary)
   - Uses `npm run build:netlify` command
   - Prisma client generated with `--no-engine` flag
   - See `NETLIFY_DEPLOYMENT_GUIDE.md` for details
   - Husky git hooks disabled in CI (see `HUSKY_NETLIFY_FIX.md`)

2. **Docker** (Recommended for Production)
   - Complete Docker setup in `DOCKER_TUTORIAL.md`
   - Production deployment guide in `DEPLOYMENT_DOCKER.md`
   - Supports both development and production environments

3. **Traditional Deployment**
   - Standard Node.js deployment
   - See `DEPLOYMENT_GUIDE.md` for details
   - Uses `standalone` output mode

**Pre-deployment Checklist:**
- Run `npm run type-check` to verify TypeScript
- Run `npm run lint` to check code quality
- Run `npm test` to verify tests pass
- Ensure `DATABASE_URL` is properly configured
- Set `NEXTAUTH_SECRET` to a secure random value
- Configure `NEXTAUTH_URL` to match deployment URL

## Portal-to-Role Mapping & User Flows

**Portal-to-Role Mapping (defined in `src/lib/auth.ts`):**
- ADMIN_PORTAL: ADMIN, SUPER_ADMIN
- SUPERADMIN_PORTAL: SUPER_ADMIN
- WORKER_PORTAL: WORKER
- INSPECTOR_PORTAL: INSPECTOR
- DELIVERY_PORTAL: DELIVERY
- DEVELOPER_PORTAL: DEVELOPER

**User Flows:**
- **Admin:** Order reception → Production planning → Material procurement → Monitor production → Financial management
- **SuperAdmin:** All admin capabilities + Production order material override + Bulk operations + Export functionality
- **Worker:** View tasks → Execute operations → Report progress → Material consumption → Quality reporting
- **Inspector:** View quality checks → Perform inspections → Document defects → Approve/reject batches → Compliance reporting
- **Delivery:** View assignments → Prepare shipments → Track deliveries → Confirm delivery → Digital proof of delivery
- **Developer:** System monitoring → Database studio → User management → Support tickets → System diagnostics

## Common Development Workflows

### Adding a New Feature to Admin Portal

1. **Create Database Schema Changes (if needed):**
   ```bash
   # Edit prisma/schema.prisma
   npx prisma generate --no-engine
   npx prisma db push  # or npx prisma migrate dev --name feature_name
   ```

2. **Create Server Actions:**
   ```bash
   # Create: src/lib/actions/[feature-name].ts
   # Include validation, database operations, error handling
   ```

3. **Create Page Route:**
   ```bash
   # Create: src/app/admin/(protected)/[feature-name]/page.tsx
   ```

4. **Create Components:**
   ```bash
   # Create components in: src/components/module/admin/[feature-name]/
   # Common components: columns.tsx, data-table.tsx, create-dialog.tsx, edit-dialog.tsx
   ```

5. **Update Navigation:**
   ```bash
   # Update: src/components/global/admin-nav.tsx or sidebar component
   ```

6. **Add TypeScript Types (if needed):**
   ```bash
   # Create: src/types/admin/[feature-name].ts
   ```

### Running Tests for Specific Feature

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Open Vitest UI for interactive testing
npm run test:ui
```

### Database Workflow

```bash
# Pull current schema from database
npx prisma db pull

# Push schema changes to database (development)
npx prisma db push

# Create migration (production-ready)
npx prisma migrate dev --name descriptive_migration_name

# Generate Prisma client (after schema changes)
npx prisma generate --no-engine

# Open Prisma Studio to view/edit data
npm run prisma:studio

# Seed database with sample data
npm run seed:comprehensive
```

### Common Debugging Steps

1. **Database Connection Issues:**
   - Check `DATABASE_URL` in `.env` file
   - Ensure PostgreSQL is running
   - Verify connection string format: `postgresql://user:password@host:port/database`

2. **Build Errors:**
   - Clear Next.js cache: `rm -rf .next`
   - Regenerate Prisma client: `npx prisma generate --no-engine`
   - Clean build: `npm run build:clean`

3. **Authentication Issues:**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your deployment URL
   - Confirm user role matches portal access (check `src/lib/auth.ts` portal mappings)

4. **Type Errors:**
   - Run type check: `npm run type-check`
   - Note: TypeScript strict mode is disabled, so some type errors may be ignored during builds

## System Design Principles

1. **Role-Based Route Structure:** Protected routes use `(protected)` folder with auth layout, public routes use `(public)`

2. **Component Patterns:**
   - Data tables for CRUD operations (TanStack Table)
   - Dialogs for create/edit operations (Radix UI Dialog)
   - Server actions for backend operations
   - Form validation with React Hook Form + Zod
   - React Query for client-side data fetching and caching

3. **System Goals:**
   - Centralize manufacturing operations
   - Optimize resource allocation
   - Ensure quality control throughout production
   - Track production in real-time
   - Manage inventory accurately
   - Process orders efficiently
   - Support data-driven decision making

4. **Code Organization Principles:**
   - Server actions contain business logic, not components
   - Components are presentational and call server actions
   - Types are defined per-role in `/types/{role}/`
   - Reusable UI components in `/components/ui/`
   - Role-specific components in `/components/module/{role}/`
