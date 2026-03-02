# Quality Feature Documentation

## Scope

Quality is implemented as a cross-role domain touching admin production oversight, dedicated quality-check pages, inspector workflows, and production history.

## Primary Admin Routes

Under `src/app/admin/(protected)/quality-checks`:

- `page.tsx`
- `[id]/page.tsx`
- `[id]/edit/page.tsx`

Quality functionality also appears inside admin production components and detail pages.

## Related Role Routes

- Inspector: production detail, quality history, task/request flows, activity log
- Worker: issue reporting hooks into task and production flows
- SuperAdmin: audit and analytics surfaces provide visibility into quality-adjacent data

## Core Data Models

- `QualityCheck`
- `InventoryIssueReport`
- `ProductionOrderHistoryLog`
- `ActivityLog`

## Main Code Areas

- Admin UI: `src/components/module/admin/quality-checks/**`
- Production quality UI: `src/components/module/admin/production/quality-checks.tsx`
- Actions: `src/lib/actions/quality-checks.ts`, `src/lib/actions/inspector/enhanced-production-operations.ts`, `src/lib/actions/history-log/**`
- Types: `src/types/admin/quality-checks.ts`, `src/types/inspector/quality-checks.ts`

## What Is Implemented

- Dedicated quality-check CRUD/detail screens for admin
- Quality controls embedded in production order screens
- Inspector production review and quality-history pages
- Audit/history logging around production and operational events

## Documentation Boundary

This codebase has substantial quality-related structure, but the documentation no longer assumes formal SPC suites, calibration programs, or compliance frameworks unless they are visible in code.

## Related Docs

- [Admin](../../roles/admin/README.md)
- [Inspector](../../roles/inspector/README.md)
- [Production](../production/README.md)
- [Technical Overview](../../technical/README.md)
