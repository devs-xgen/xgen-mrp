# SuperAdmin Technical Documentation

Technical implementation details for SuperAdmin portal features.

**Last Updated:** 2025-10-19

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Actions](#server-actions)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Audit Logging](#audit-logging)
6. [API Patterns](#api-patterns)

---

## Architecture Overview

### Portal Structure

The SuperAdmin portal follows the Next.js 15 App Router structure:

```
/app/superadmin/
  /(protected)/          # Authenticated routes
    /dashboard/
    /production/
    /users/
    /materials/
    /billing/
    /export-data/
    /audit-logs/
  /(public)/             # Public routes
    /login/
```

### Route Protection

All protected routes use the `ensureSuperAdmin()` utility for authorization:

```typescript
// src/lib/utils/auth-helpers.ts
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/superadmin/login")
  }

  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: SuperAdmin access required")
  }

  return session
}
```

### Database Access Pattern

SuperAdmin queries differ from Admin queries by removing tenant filters:

```typescript
// Admin Query (Tenant-Scoped)
const orders = await prisma.productionOrder.findMany({
  where: {
    tenantId: session.user.tenantId  // Filtered to specific tenant
  }
})

// SuperAdmin Query (Cross-Tenant)
const orders = await prisma.productionOrder.findMany({
  // No tenant filter - sees all data
})
```

---

## Server Actions

### Location

SuperAdmin server actions are located in:
- `src/lib/actions/superadmin/` - SuperAdmin-specific actions
- Organized by feature domain (production, users, materials, etc.)

### Action Pattern

```typescript
"use server"

import { ensureSuperAdmin } from "@/lib/utils/auth-helpers"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation
const schema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(15, "Reason must be at least 15 characters"),
  // ... other fields
})

export async function superAdminAction(data: unknown) {
  // 1. Authenticate
  const session = await ensureSuperAdmin()

  // 2. Validate input
  const validated = schema.parse(data)

  // 3. Perform operation with audit logging
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Business logic
      const entity = await tx.entity.update({
        where: { id: validated.id },
        data: { /* ... */ }
      })

      // Create audit log
      await tx.activityLog.create({
        data: {
          type: "SUPERADMIN_ACTION",
          userId: session.user.id,
          details: {
            action: "specific_action",
            entityId: validated.id,
            reason: validated.reason,
            before: { /* ... */ },
            after: { /* ... */ }
          }
        }
      })

      return entity
    })

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
```

### Override Actions

Override actions bypass normal business logic validation:

**Key Characteristics:**
- Require `reason` parameter (minimum 15 characters)
- Create comprehensive audit trails
- Use database transactions for atomicity
- Support rollback on failure

---

## Database Schema

### Key Tables

**Production Orders:**
- `ProductionOrder` - Main production order table
- `ProductionBOM` - Bill of materials snapshot
- `ProductionOrderHistoryLog` - Change history

**Audit & Activity:**
- `ActivityLog` - System-wide activity tracking
- `ProductionOrderHistoryLog` - Production-specific history
- All tables include: `createdBy`, `modifiedBy`, `createdAt`, `updatedAt`

**Materials:**
- `Material` - Material master data
- `MaterialReservation` - Reserved materials for production
- `ProductionMaterialConsumption` - Actual consumption tracking

### Soft Deletes

Many entities support soft deletion:

```typescript
{
  archivedAt: DateTime?
  archivedBy: String?
  archivedReason: String?
}
```

Archived records are excluded from default queries:

```typescript
const activeRecords = await prisma.entity.findMany({
  where: {
    archivedAt: null  // Only active records
  }
})
```

---

## Authentication & Authorization

### Session Management

NextAuth.js configuration:
- JWT-based sessions
- 8-hour expiration
- Role-based access control
- Portal-specific authentication

### Role Enum

```typescript
enum Role {
  SUPER_ADMIN
  ADMIN
  WORKER
  INSPECTOR
  DELIVERY
  DEVELOPER
}
```

### Portal Access Matrix

| Role | Admin Portal | SuperAdmin Portal | Worker Portal | Inspector Portal | Delivery Portal |
|------|-------------|-------------------|---------------|------------------|-----------------|
| SUPER_ADMIN | ✅ | ✅ | ❌ | ❌ | ❌ |
| ADMIN | ✅ | ❌ | ❌ | ❌ | ❌ |
| WORKER | ❌ | ❌ | ✅ | ❌ | ❌ |
| INSPECTOR | ❌ | ❌ | ❌ | ✅ | ❌ |
| DELIVERY | ❌ | ❌ | ❌ | ❌ | ✅ |
| DEVELOPER | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Audit Logging

### Activity Log Schema

```typescript
{
  id: string
  type: string            // Action type (enum)
  userId: string          // User who performed action
  details: JSON           // Flexible details object
  timestamp: DateTime
  ipAddress: string?
  userAgent: string?
}
```

### Production History Log Schema

```typescript
{
  id: string
  productionOrderId: string
  changeType: string      // STATUS_CHANGE, COST_OVERRIDE, etc.
  userId: string
  previousValue: JSON
  newValue: JSON
  reason: string
  timestamp: DateTime
}
```

### Audit Trail Requirements

**For Override Operations:**
1. Reason field mandatory (min 15 characters)
2. Before/after state capture
3. User ID and timestamp
4. IP address and user agent (optional)
5. Immutable logs (no delete capability)

**Activity Types:**
- `SUPERADMIN_PRODUCTION_ORDER_CREATED`
- `SUPERADMIN_STATUS_OVERRIDE`
- `SUPERADMIN_COST_OVERRIDE`
- `SUPERADMIN_QUANTITY_OVERRIDE`
- `SUPERADMIN_DATE_OVERRIDE`
- `SUPERADMIN_FORCE_DELETE`
- `SUPERADMIN_BULK_UPDATE`
- `SUPERADMIN_BULK_QUANTITY_UPDATE`
- `SUPERADMIN_BULK_COST_UPDATE`
- `SUPERADMIN_BULK_DATE_UPDATE`
- `USER_PASSWORD_RESET`
- `MATERIAL_RESERVATION_RELEASED`

---

## API Patterns

### Response Format

Standard response format for server actions:

```typescript
type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

### Error Handling

```typescript
try {
  // Operation
  return { success: true, data: result }
} catch (error) {
  console.error("Action failed:", error)
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error"
  }
}
```

### Transaction Pattern

All multi-step operations use Prisma transactions:

```typescript
await prisma.$transaction(async (tx) => {
  // Step 1: Update entity
  const updated = await tx.entity.update({ /* ... */ })

  // Step 2: Create audit log
  await tx.activityLog.create({ /* ... */ })

  // Step 3: Update related entities
  await tx.relatedEntity.updateMany({ /* ... */ })

  return updated
})
```

### Pagination Pattern

```typescript
export async function getPaginatedData(
  page: number = 1,
  pageSize: number = 50,
  filters?: FilterType
) {
  const skip = (page - 1) * pageSize

  const [data, totalCount] = await Promise.all([
    prisma.entity.findMany({
      where: { /* filters */ },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.entity.count({
      where: { /* filters */ }
    })
  ])

  return {
    data,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page
  }
}
```

---

## Security Considerations

### Input Validation

- All inputs validated using Zod schemas
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via React automatic escaping
- CSRF protection via NextAuth.js tokens

### Rate Limiting

Login attempts rate-limited:
- 10 attempts per 15 minutes per IP
- Temporary lockout after threshold

### Session Security

- HTTPOnly cookies
- Secure flag in production
- SameSite=Lax
- 8-hour expiration

### Audit Compliance

- All SuperAdmin actions logged
- Logs are immutable
- Reason required for sensitive operations
- Minimum reason length: 15 characters

---

## Performance Optimization

### Database Queries

**Best Practices:**
- Use indexes on frequently queried fields
- Include only necessary relationships
- Paginate large result sets
- Use database-level aggregations

**Example:**
```typescript
// Good: Selective includes
const orders = await prisma.productionOrder.findMany({
  include: {
    product: { select: { name: true, sku: true } },
    customer: { select: { name: true } }
  }
})

// Bad: Overfetching
const orders = await prisma.productionOrder.findMany({
  include: {
    product: true,  // Returns all fields
    customer: true,
    operations: true,
    qualityChecks: true
  }
})
```

### Caching Strategy

- Server-side React cache for repeated queries
- Revalidation on mutations
- Time-based revalidation for dashboard metrics

---

## Related Documentation

- [Main README](../README.md) - User documentation
- [FEATURES.md](../FEATURES.md) - Complete feature reference
- [QUICKSTART.md](../QUICKSTART.md) - Getting started guide
- [Project CLAUDE.md](../../../CLAUDE.md) - Project-wide technical docs

---

*Last Updated: 2025-10-19*
