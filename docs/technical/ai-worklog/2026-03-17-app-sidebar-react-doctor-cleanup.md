# Clean React Doctor warnings in AppSidebar

- Date: 2026-03-17
- Last Updated: 2026-03-17 09:00
- Status: completed
- Objective: Resolve the React Doctor warnings in the shared sidebar and related React routing issues without changing unrelated behavior.

## Files Changed
- src/components/shared/AppSidebar.tsx
- src/app/admin/(protected)/users/page.tsx
## Validation
- npx -y react-doctor@latest . --verbose --diff: pass (100/100); npm run lint: fail due to unrelated pre-existing repo lint issues outside AppSidebar
- npx eslint src/app/admin/(protected)/users/page.tsx: pass; npx -y react-doctor@latest . --verbose --diff: pass (100/100); npm run lint: still fails due to unrelated pre-existing repo issues outside changed files
## React Doctor
- Pass after fix; no issues found in changed files.
- Pass after sidebar and users page fixes; no issues found in changed files.
## Progress Log
- [08:56] Removed parent-state sync effects from AppSidebar nav items, dropped trivial memoization, and reran validation. React Doctor is now clean for the changed files.
- [09:00] Updated /admin/users to await Next.js searchParams before reading page, limit, and search values, matching the async page pattern used elsewhere in admin routes.
## Open Questions
