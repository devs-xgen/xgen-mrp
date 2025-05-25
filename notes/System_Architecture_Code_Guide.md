# System Architecture & Code Guide

**Date:** 2024-12-19  
**Status:** ✅ CURRENT  
**Purpose:** Complete guide to system architecture, codebase structure, and coding patterns

## Project Overview

### Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **UI:** Tailwind CSS + shadcn/ui components
- **Language:** TypeScript
- **Deployment:** Docker + Standalone build

## Directory Structure

### Root Level
```
xgen-mrp/
├── src/                    # Main source code
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── notes/                  # Documentation
├── scripts/                # Build and deployment scripts
├── electron/               # Desktop app (if needed)
└── docker files           # Containerization
```

### Source Code Organization (`src/`)

#### 1. App Directory (`src/app/`)
**Next.js 14 App Router structure**
```
app/
├── (role-based routes)/
│   ├── admin/(protected)/     # Admin dashboard and features
│   ├── worker/(protected)/    # Worker interface
│   ├── inspector/(protected)/ # Quality control interface
│   └── delivery/(protected)/  # Delivery management
├── api/                       # API routes
└── globals.css               # Global styles
```

#### 2. Components (`src/components/`)
```
components/
├── ui/                    # Base UI components (shadcn/ui)
├── common/                # Shared components across roles
├── global/                # App-wide components (login, etc.)
├── module/                # Role-specific feature components
│   ├── admin/            # Admin-specific components
│   ├── worker/           # Worker-specific components
│   ├── inspector/        # Inspector-specific components
│   └── delivery/         # Delivery-specific components
├── providers/            # Context providers
└── shared/               # Reusable business components
```

#### 3. Server Actions (`src/lib/actions/`)
```
actions/
├── (core business logic)/
│   ├── production-order.ts      # Production management
│   ├── material-reservation.ts  # Material tracking
│   ├── material-consumption.ts  # Material usage
│   ├── inventory-movement.ts    # Stock movements
│   └── cost-variance.ts         # Cost analysis
├── worker/                      # Worker-specific actions
├── delivery/                    # Delivery-specific actions
└── (other domain actions)       # Various business domains
```

#### 4. Types (`src/types/`)
```
types/
├── admin/                # Admin interface types
├── worker/               # Worker interface types
├── inspector/            # Inspector interface types
└── delivery/             # Delivery interface types
```

## Key Architectural Patterns

### 1. Role-Based Architecture
**File Pattern:** `src/app/(role)/(protected)/feature/page.tsx`
- Each role has isolated routes and components
- Shared business logic in `src/lib/actions/`
- Role-specific types in `src/types/(role)/`

### 2. Server Actions Pattern
**Location:** `src/lib/actions/`
**Pattern:**
```typescript
'use server'

export async function actionName(data: InputType): Promise<ResponseType> {
  // Authentication check
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')
  
  // Business logic
  // Database operations
  // Revalidate paths
  
  return result
}
```

### 3. Component Organization
**Module Components:** `src/components/module/(role)/feature/`
- Role-specific UI components
- Feature-based organization
- Reusable across pages within role

**Shared Components:** `src/components/shared/`
- Cross-role business components
- Domain-specific reusable components

### 4. Database Layer
**Schema:** `prisma/schema.prisma`
- Single source of truth for data model
- Comprehensive relationships
- Audit fields (createdAt, updatedAt, createdBy, modifiedBy)

## Core Business Domains

### 1. Material Resource Planning (MRP)
**Key Files:**
- `src/lib/actions/material-reservation.ts` - Material allocation
- `src/lib/actions/material-consumption.ts` - Usage tracking
- `src/lib/actions/inventory-movement.ts` - Stock movements
- `src/types/admin/mrp.ts` - MRP type definitions

**Flow:**
1. Production Order Created → Materials Reserved & Deducted
2. Production Started → Material Consumption Tracked
3. Production Completed → Product Stock Increased
4. Production Cancelled → Materials Returned to Stock

### 2. Production Management
**Key Files:**
- `src/lib/actions/production-order.ts` - Production lifecycle
- `src/lib/actions/worker/tasks.ts` - Worker task management
- `src/components/module/admin/production/` - Admin production UI
- `src/components/module/worker/` - Worker production UI

### 3. Quality Control
**Key Files:**
- `src/lib/actions/quality-checks.ts` - Quality management
- `src/lib/actions/inspector.ts` - Inspector operations
- `src/components/module/inspectors/` - Inspector UI

### 4. Inventory Management
**Key Files:**
- `src/lib/actions/materials.ts` - Material CRUD
- `src/lib/actions/inventory-movement.ts` - Stock tracking
- `src/components/module/admin/materials/` - Material management UI

## Authentication & Authorization

### Implementation
**File:** `src/lib/auth.ts`
**Pattern:** NextAuth.js with database sessions

### Role-Based Access
```typescript
// Page level protection
export const dynamic = 'force-dynamic' // For auth pages

// Action level protection
const session = await getServerSession(authOptions)
if (!session?.user || session.user.role !== 'ADMIN') {
  throw new Error('Unauthorized')
}
```

### Roles
- **ADMIN:** Full system access
- **WORKER:** Production tasks and inventory
- **INSPECTOR:** Quality control and inspections
- **DELIVERY:** Order fulfillment and logistics

## Database Design

### Core Entities
1. **Users & Profiles** - User management and authentication
2. **Products & Materials** - Inventory items and BOMs
3. **Production Orders** - Manufacturing workflow
4. **Operations** - Work center tasks
5. **Quality Checks** - Inspection records
6. **Customer Orders** - Sales orders
7. **Suppliers & Purchase Orders** - Procurement

### MRP Enhancement Tables
1. **MaterialReservation** - Material allocation tracking
2. **ProductionMaterialConsumption** - Usage records
3. **InventoryMovement** - All stock movements
4. **CostVariance** - Cost analysis
5. **ProductionBatch** - Batch tracking

## API Design

### RESTful Patterns
**Location:** `src/app/api/`
**Pattern:**
```
/api/entity/          # GET (list), POST (create)
/api/entity/[id]/     # GET (read), PUT (update), DELETE
```

### Server Actions (Preferred)
**Location:** `src/lib/actions/`
**Benefits:**
- Type-safe
- Server-side execution
- Automatic revalidation
- Better error handling

## UI/UX Patterns

### Design System
**Base:** shadcn/ui components
**Customization:** `src/components/ui/`
**Styling:** Tailwind CSS

### Layout Structure
```
Layout (role-based)
├── Navigation (sidebar/header)
├── Main Content Area
│   ├── Page Header (title, actions)
│   ├── Stats Cards (dashboard)
│   ├── Data Tables (lists)
│   └── Forms (create/edit)
└── Modals/Dialogs (actions)
```

### Component Patterns
1. **Page Components:** Full page layouts
2. **Feature Components:** Specific functionality
3. **UI Components:** Reusable interface elements
4. **Form Components:** Data input handling

## Development Guidelines

### File Naming
- **Pages:** `page.tsx`
- **Components:** `PascalCase.tsx`
- **Actions:** `kebab-case.ts`
- **Types:** `kebab-case.ts`

### Code Organization
1. **Imports:** External → Internal → Relative
2. **Exports:** Named exports preferred
3. **Types:** Co-located with implementation
4. **Constants:** Uppercase with underscores

### Error Handling
```typescript
try {
  // Business logic
  return { success: true, data: result }
} catch (error) {
  console.error('Context:', error)
  return { success: false, error: 'User-friendly message' }
}
```

## Build & Deployment

### Build Process
1. **Prisma Generate** - Database client generation
2. **Next.js Build** - Application compilation
3. **Type Checking** - TypeScript validation
4. **Linting** - Code quality checks

### Environment Configuration
- **Development:** Local PostgreSQL + Next.js dev server
- **Production:** Docker containers + standalone build

### Key Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run db:migrate   # Database migrations
```

## Performance Considerations

### Next.js Optimizations
- **Static Generation:** For public pages
- **Dynamic Rendering:** For authenticated pages (`export const dynamic = 'force-dynamic'`)
- **Server Components:** Default for data fetching
- **Client Components:** Only when needed

### Database Optimizations
- **Indexes:** On frequently queried fields
- **Relations:** Proper foreign key constraints
- **Pagination:** For large data sets
- **Caching:** Strategic use of revalidation

## Security Measures

### Authentication
- **Session-based:** Secure server-side sessions
- **Role-based:** Granular permission system
- **Route Protection:** Middleware and page-level guards

### Data Protection
- **Input Validation:** Zod schemas
- **SQL Injection:** Prisma ORM protection
- **XSS Prevention:** React's built-in protection
- **CSRF Protection:** NextAuth.js built-in

## Testing Strategy

### Unit Testing
- **Actions:** Business logic testing
- **Components:** UI component testing
- **Utils:** Utility function testing

### Integration Testing
- **API Routes:** End-to-end API testing
- **Database:** Migration and query testing
- **Authentication:** Login flow testing

## Monitoring & Logging

### Application Logging
- **Server Actions:** Error logging with context
- **API Routes:** Request/response logging
- **Database:** Query performance monitoring

### Activity Tracking
**Table:** `ActivityLog`
**Purpose:** User action auditing and system monitoring

## Future Considerations

### Scalability
- **Database:** Read replicas for reporting
- **Caching:** Redis for session storage
- **CDN:** Static asset delivery

### Features
- **Real-time Updates:** WebSocket integration
- **Mobile App:** React Native or PWA
- **Analytics:** Business intelligence dashboard

This architecture provides a solid foundation for the MRP system with clear separation of concerns, role-based access, and maintainable code organization. 