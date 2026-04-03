# Developer Documentation

## Role Scope

The developer portal provides **system-level administrative tools** for developers and technical staff. It is a **DEVELOPER-only** access portal containing database management utilities, system diagnostics, and cross-cutting administrative functions.

Primary route areas under `src/app/developer/(protected)`:

- `dashboard` - Developer overview and system status
- `database-studio` - PostgreSQL backup, export, and table management
- `login-history` - System-wide login audit logs
- `support` - Access to all support tickets (admin-level view)
- `users` - Cross-portal user management and lookup

## What Developer Actually Manages

- **Database Operations**: Full and selective PostgreSQL backups via `pg_dump`, Excel/CSV exports
- **System Diagnostics**: Login history tracking, session monitoring
- **Support Escalation**: Full access to support ticket system across all users
- **User Administration**: Cross-portal user lookup and basic management
- **Development Tasks**: Technical utilities not exposed to other roles

## Authentication

Developers use **hardcoded credentials** for system access:

- **Email**: `dev@xgen-mrp.local`
- **Password**: `dev123!@#`
- **Role**: `DEVELOPER` (database-backed, bypasses rate limiting)

> **Note**: The developer user must exist in the database. Run the developer seed script if not present.

## Database Studio Features

### Backup Operations
- **Full Backup**: Download complete PostgreSQL dump (`.sql`)
- **Selective Backup**: Choose specific tables/schemas to backup
- **Requirements**: 
  - PostgreSQL client tools (`pg_dump`) installed on server
  - Environment variable `PG_DUMP_PATH` if not on system PATH
  - `PG_BACKUP_URL` for direct DB connection (bypasses Prisma Accelerate)

### Export Operations
- **Excel Export**: `.xlsx` format using in-app Prisma queries
- **CSV Export**: `.zip` archive containing CSV files per table
- **Selective Export**: Export only chosen tables

### Environment Variables
```
PG_BACKUP_URL=postgres://user:pass@host:port/dbname  # Preferred over DATABASE_URL for backups
PG_DUMP_PATH=/usr/bin/pg_dump                       # Optional: custom pg_dump location
```

## Main Code Areas

- Pages: `src/app/developer/(protected)/**`
- UI modules: `src/components/module/developer/**`
- API routes: `src/app/api/developer/**`
  - `/api/developer/database/tables` - List database tables
  - `/api/developer/database/backup` - Stream SQL backups
  - `/api/developer/database/export` - Excel exports
  - `/api/developer/database/export-csv` - CSV zip exports

## Security & Access Control

- Middleware explicitly protects `/developer` routes (`PORTAL_ROLES.DEVELOPER_PORTAL`)
- Rate-limited API endpoints for database operations
- Backup endpoints require `DEVELOPER` role
- Database operations stream responses to prevent memory issues

## Operational Notes

- **Database Studio** is the flagship feature for system maintenance
- Developer can access **all support tickets** (like admin support view)
- Login history provides **audit trail** for security monitoring
- Database backups **cannot use Prisma Accelerate URL** - requires direct PostgreSQL connection

## Related Docs

- [Documentation Home](../../README.md)
- [Admin](../admin/README.md) - Similar operational scope
- [Support System](../../features/support/README.md) - Ticket management details
- [Technical Overview](../../technical/README.md) - Architecture details
- [Error Handling](../../ERROR_HANDLING.md) - Failure behavior
