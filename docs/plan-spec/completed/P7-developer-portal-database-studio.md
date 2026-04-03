# P7: Developer Portal with Database Studio

> **Status**: Done — Shipped  
> **Completed**: 2025

## Summary

Implemented a dedicated Developer Portal with Database Studio for system-level administrative tasks. Provides PostgreSQL backup, export functionality, and cross-cutting diagnostic tools.

## What Was Shipped

### Developer Portal Structure

- **Route**: `/developer` with protected sub-routes
- **Authentication**: Hardcoded credentials (dev@xgen-mrp.local / dev123!@#)
- **Middleware**: Explicit protection for `/developer` routes

### Portal Features

#### 1. Dashboard (`/developer/dashboard`)
- System overview and quick access tiles
- Navigation to all developer tools

#### 2. Database Studio (`/developer/database-studio`)
PostgreSQL management interface with:

**Table Management:**
- List all database tables with schema information
- Search and filter tables
- Multi-select tables for selective operations

**Backup Operations:**
- Full database backup (SQL dump)
- Selective table backup
- Streaming download to prevent memory issues

**Export Operations:**
- Excel export (.xlsx) using in-app Prisma queries
- CSV export (ZIP archive with separate CSV per table)
- Full or selective table export

**API Endpoints:**
- `GET /api/developer/database/tables` — List tables
- `POST /api/developer/database/backup` — Stream SQL backup
- `POST /api/developer/database/export` — Excel export
- `POST /api/developer/database/export-csv` — CSV ZIP export

#### 3. Login History (`/developer/login-history`)
- System-wide login audit logs
- Browser, device, and IP tracking
- Portal access tracking
- Success/failure logging

#### 4. Support (`/developer/support`)
- Admin-level view of all support tickets
- Full ticket management capabilities

#### 5. Users (`/developer/users`)
- Cross-portal user lookup
- Basic user management

### Environment Variables

```
# Required for database backups (bypasses Prisma Accelerate)
PG_BACKUP_URL=postgres://user:pass@host:port/dbname

# Optional: Custom pg_dump path if not on system PATH
PG_DUMP_PATH=/usr/bin/pg_dump
```

### Technical Implementation

**Rate Limiting:**
- Database endpoints rate-limited for safety
- Developer role bypasses standard rate limits

**Backup Process:**
- Uses `pg_dump` for SQL generation
- Streams response to handle large databases
- Waits for first stdout chunk before sending response
- Returns HTTP 500 with stderr details if pg_dump fails early
- SSL mode propagated from `PGSSLMODE` in database URL

**Export Process:**
- Excel: Uses `exceljs` for in-memory generation
- CSV: Uses `archiver` for ZIP creation
- Both support full or selective table export

## Security Considerations

- DEVELOPER role access only via middleware (`PORTAL_ROLES.DEVELOPER_PORTAL`)
- Hardcoded credentials require database user record
- Backup endpoints require direct PostgreSQL connection (not Prisma Accelerate)
- Rate limiting on all database operations
- No sensitive data exposed in API responses

## Code Areas

- Portal Routes: `src/app/developer/(protected)/**`
- API Routes: `src/app/api/developer/**`
- Auth: `src/lib/auth.ts` (hardcoded credentials)
- Middleware: `src/middleware.ts` (portal protection)

## Prerequisites

1. PostgreSQL client tools installed on server (`pg_dump`)
2. Direct database connection URL (not Prisma Accelerate proxy)
3. Developer user record in database with DEVELOPER role

## Acceptance Checklist

- [x] /developer portal accessible with DEVELOPER role
- [x] Database Studio page functional
- [x] Table listing API working
- [x] SQL backup endpoint streaming correctly
- [x] Excel export endpoint working
- [x] CSV export endpoint working
- [x] Selective table operations working
- [x] Login history page functional
- [x] Support page with admin access working
- [x] Users page functional
- [x] Environment variables documented
- [x] Rate limiting implemented
- [x] Error handling for pg_dump failures
