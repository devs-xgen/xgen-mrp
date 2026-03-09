# P1: Export and Import Stabilization

## Status

`Planned`

## Priority

`P1` - Highest priority

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Boss ma'am / project lead

## Why This Matters

Export and import are foundational operational features. The system already contains several export surfaces and some import-related work, but the experience is still incomplete or not working the way you want, especially for Excel, CSV, and Google-based workflows.

This should be the first active implementation scope because data extraction and data loading are cross-cutting needs that affect operations, reporting, cleanup, and migration work.

## Current State In Repo

- Superadmin already has an `Export Data` route at `/superadmin/export-data`.
- There are working or partial export flows across multiple domains, including products, materials, billing statements, sales invoices, delivery receipts, production, audit logs, and inventory exports.
- Several exports already generate CSV and true `.xlsx` files using `exceljs`.
- Some utility-based export helpers still fall back to CSV behavior even when labeled as Excel, which suggests inconsistent implementation quality across surfaces.
- There is at least one CSV import-style workflow in billing invoice items, but there is no clear, unified system-wide import/export standard.
- Existing backlog docs under superadmin mention richer future import/export tooling, including CSV, Excel, Google Sheets, and Google Drive style integrations, but that work is not the current source of truth for the implemented app.

## Target Outcome

Stabilize the project’s import/export capabilities so the supported data flows are clear, reliable, and intentionally scoped, with a defined standard for:

- CSV export
- real Excel export
- import flows where already intended or partially implemented
- future-facing Google file integration boundaries, if not shipped immediately

## In Scope

- Audit current export and import capabilities already present in the repo
- Identify which export flows are working, partial, misleading, or broken
- Standardize supported output formats and naming expectations
- Define the canonical import/export feature scope for the website
- Improve or finish incomplete Excel and CSV behaviors
- Decide how Google file support should be handled now: implement, defer, or document as future scope
- Define acceptance criteria for export/download success and import validation behavior

## Out Of Scope

- Building a full enterprise integration platform in this phase
- Adding every possible third-party sync provider
- Replacing all reporting and analytics features
- Large redesigns unrelated to import/export behavior

## Risks / Open Questions

- Export implementations are spread across many features, so behavior may be inconsistent by domain.
- Some surfaces may advertise Excel while effectively producing CSV-like output.
- Import support appears much less mature than export support and may need to be scoped carefully to avoid overcommitting.
- Google Sheets or Google Drive support may require external credentials, auth flows, and policy decisions that are larger than a stabilization pass.

## Phase Breakdown

### Phase 1: Capability Audit

- Inventory all current import and export entry points in admin, superadmin, inspector, worker, and developer surfaces.
- Classify each path as working, partial, misleading, broken, or deprecated.
- Identify which exports generate true `.xlsx` files and which only simulate Excel by renaming CSV output.
- Identify where import already exists or is partially implemented.

### Phase 2: Scope and Standards

- Define the supported file formats for each relevant domain.
- Decide which flows are officially in scope for this phase: CSV, Excel, and any limited import surfaces.
- Decide whether Google file support is included now or documented as a follow-up.
- Standardize filename, encoding, headers, and download behavior expectations.

### Phase 3: Implementation Stabilization

- Fix broken or misleading export flows.
- Align UI labels with actual file behavior.
- Complete high-priority import/export paths that are already partially built.
- Ensure data export handles common operational datasets cleanly and consistently.
- Add validation and error feedback for import flows where applicable.

### Phase 4: Verification and Documentation

- Add regression coverage for key export and import actions.
- Verify downloaded files open correctly in spreadsheet tools.
- Document the supported import/export matrix and current limitations.
- Create follow-up scope items for larger integrations that are intentionally deferred.

## Acceptance Checklist

- [ ] The repo has a clear inventory of implemented import/export surfaces.
- [ ] Supported CSV and Excel behavior is documented and aligned with actual output.
- [ ] High-priority broken or incomplete import/export flows are identified for implementation.
- [ ] UI labels do not claim Excel support where only CSV behavior exists.
- [ ] Google file support is explicitly categorized as in-scope now or deferred intentionally.
- [ ] A contributor can tell which import/export features are production-ready and which are not.

## Related Code Areas

- `src/app/superadmin/(protected)/export-data/page.tsx`
- `src/components/module/superadmin/export-data/**`
- `src/lib/actions/superadmin/data-export.ts`
- `src/lib/actions/product.ts`
- `src/lib/actions/materials.ts`
- `src/lib/actions/billing-statements.ts`
- `src/lib/actions/sales-invoices.ts`
- `src/lib/actions/delivery-receipts.ts`
- `src/lib/utils/report-export.ts`
- `src/lib/utils/audit-export.ts`

## Notes / Follow-Ups

- If Google Sheets or Google Drive export/import is not ready for this phase, capture it as a follow-up scope instead of implying partial support.
- Prefer one shared import/export behavior guide after the audit so future features do not reintroduce inconsistency.
