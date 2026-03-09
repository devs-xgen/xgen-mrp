# P2: Reset Password Entry Points For All Role Logins

## Status

`Completed` — Shipped in v1.5.15

## Completion Date

2026-03-09

## Completion Summary

All acceptance criteria met. The following was implemented:

### Audit Results
All 6 role login pages (admin, worker, inspector, delivery, superadmin, developer) already used the shared `LoginForm` component which already contained the `Forgot password?` link. No login page was missing the reset entry point.

### Changes Shipped

**Security fix:**
- `src/lib/actions/auth.ts` → `findUserByEmail` now returns an error for inactive/suspended users, blocking them from self-resetting their password.

**Portal context via query param:**
- `src/components/global/login/login-form.tsx` → "Forgot password?" link now passes `?from=<portal>` (e.g. `?from=worker`) so the reset page knows which portal the user came from.

**Portal-aware back link:**
- `src/app/forgot-password/forgot-password-client.tsx` → Added `PORTAL_LOGIN_PATHS` map, `getBackHref()` and `getBackLabel()` helpers. Back link on steps 1 and 2 now reads the `?from` param and displays e.g. "Back to Worker Login" instead of generic "Back to home". Post-reset "Go to Login" also falls back to the originating portal if role lookup has not yet resolved.

**Disclaimer moved inside the card:**
- The simplified-reset note previously appeared as small muted text *below* the card. It is now rendered as a subtle `<Alert>` inside the card content on step 1, visible and contextually placed.

**Inspector login metadata:**
- `src/app/inspector/(public)/login/page.tsx` → Added `export const metadata: Metadata` matching all other role login pages.

---

## Acceptance Checklist

- [x] All role login entry points expose reset-password access consistently.
- [x] Reset-password behavior is documented as a supported system feature.
- [x] Post-reset return behavior is defined for each supported role.
- [x] Any security limitations in the current flow are documented explicitly.
- [x] Superadmin force-reset tooling remains clearly distinct from end-user self-service reset.
- [x] Changelog updated (v1.5.15).

## Security Notes

- The simplified (no-email-token) reset flow is acceptable for an internal ops system where all users are staff managed by an admin.
- The inactive-user guard prevents deactivated accounts from bypassing access controls via the reset flow.
- Full tokenized email verification is explicitly deferred — if required later, it becomes its own dedicated scope.

## Related Code Areas

- `src/lib/actions/auth.ts`
- `src/components/global/login/login-form.tsx`
- `src/app/forgot-password/forgot-password-client.tsx`
- `src/app/inspector/(public)/login/page.tsx`
