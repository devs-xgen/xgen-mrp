# Plan Spec

This folder is the canonical planning area for implementation scopes that are not yet shipped. It is designed so the team can choose one scope, complete it, then move to the next without mixing unrelated work.

## Non-Negotiable Safety Rules

- Do not erase existing database data.
- Do not plan features in a way that assumes destructive resets, wipe-and-reseed workflows, or losing live records.
- Treat existing data preservation as a hard requirement for all implementation scopes in this folder.
- If a schema or data change introduces any risk to existing records, the plan must call that risk out explicitly before implementation starts.

## Prisma And Database Change Guidance

- Prefer the Prisma commands already defined in `package.json` instead of ad hoc commands.
- Use `npm run prisma:generate` for Prisma client generation.
- Use `npm run prisma:push` when schema synchronization is needed and the change is confirmed to be safe for the current database.
- Use `npm run prisma:studio` for inspection when checking data manually.
- Do not default to Prisma migrations for planned work in this project.
- Do not introduce migration-first instructions into these plan specs unless explicitly approved later.
- Any database-related implementation plan must assume that preserving current data is more important than forcing schema history workflows.

## Planning Constraint For This Project

- If a feature can be implemented without risky schema churn, prefer that path.
- If schema updates are required, the plan should prefer the least disruptive path and explicitly avoid steps that could delete current data.
- If a proposed implementation would require destructive operations, stop and redesign the approach before continuing.

## Changelog Update Rule

- Always update [src/data/changelog.json](../../src/data/changelog.json) when new features, improvements, fixes, or meaningful progress are added to the system.
- Each changelog update should include a version and date so users can clearly see progress over time.
- Treat changelog maintenance as part of shipping work, not as an optional follow-up.
- When a scope in `docs/plan-spec` results in visible system changes, add a matching progress entry to the changelog.
- Changelog entries should help users understand what was added, improved, fixed, or stabilized.

## How To Use This Folder

- Keep one Markdown file per scope.
- Keep implementation scopes under `active/`.
- Keep pending product or architecture decisions under `decisions/`.
- Move finished scope files into `completed/`.
- Only one active implementation scope should be worked at a time unless explicitly approved.

## Status Values

- `Decision Needed`
- `Planned`
- `In Progress`
- `Blocked`
- `Done`

## Current Priority Order

1. ~~Export and import stabilization~~ — **Done (v1.5.14)**
2. ~~Reset password entry points for all role logins~~ — **Done (v1.5.15)**
3. Soft delete and restore
4. Customer orders homepage route fix
5. Delivery task view error
6. Superadmin role scope decision

## Scope Index

| Priority | Type      | Status          | Scope                                                                                   | File                                                                                                 | Notes                                                                                        |
| -------- | --------- | --------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --- |
| P1       | Completed | Done            | Export and import stabilization across the system                                       | [completed/P1-export-import-stabilization.md](./completed/P1-export-import-stabilization.md)         | Shipped v1.5.14 — fixed fake Excel, added Customer Orders + Production Orders exports        |
| P2       | Completed | Done            | Reset password entry points for all role logins                                         | [completed/P2-reset-password-entrypoints.md](./completed/P2-reset-password-entrypoints.md)           | Shipped v1.5.15 — security guard, portal context, portal-aware back link, disclaimer in card |     |
| P3       | Active    | Planned         | Soft delete and restore for customer orders, production orders, materials, and products | [active/P3-soft-delete-and-restore.md](./active/P3-soft-delete-and-restore.md)                       | Separate from existing archive behavior                                                      |
| P4       | Active    | Planned         | Customer orders homepage 404 and route consistency                                      | [active/P4-customer-orders-homepage-route-fix.md](./active/P4-customer-orders-homepage-route-fix.md) | Admin route surface already centers on `customer-orders-v2`                                  |
| P5       | Active    | Planned         | Delivery task detail error investigation and stabilization                              | [active/P5-delivery-task-view-error.md](./active/P5-delivery-task-view-error.md)                     | Delivery detail currently routes through `/delivery/orders/[id]`                             |
| D1       | Decision  | Decision Needed | Superadmin role scope review                                                            | [decisions/D1-superadmin-role-scope.md](./decisions/D1-superadmin-role-scope.md)                     | On hold pending discussion with boss ma'am                                                   |

## Planning File Template

Every new planning file in this folder should follow this section order:

1. Title
2. Status
3. Priority
4. Owner / decision owner
5. Why this matters
6. Current state in repo
7. Target outcome
8. In scope
9. Out of scope
10. Risks / open questions
11. Phase breakdown
12. Acceptance checklist
13. Related code areas
14. Notes / follow-ups

## Completion Workflow

When a scope is finished:

1. Move the file from `active/` to `completed/`.
2. Update this index so the current status and location stay accurate.
3. Add a short completion note at the top of the moved file with completion date and shipped outcome.
4. If follow-up work is discovered, create a new scope file in `active/` or `decisions/` instead of reopening the completed file.
