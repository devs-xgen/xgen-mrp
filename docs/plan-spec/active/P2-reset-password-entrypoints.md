# P2: Reset Password Entry Points For All Role Logins

## Status

`Planned`

## Priority

`P2` - High

## Owner / Decision Owner

- Implementation owner: Development
- Product decision owner: Project lead

## Why This Matters

Users need an obvious reset-password path from every role login screen. A reset flow already exists in the system, but this scope treats password reset as a first-class website feature and makes sure all role login experiences expose it consistently and safely.

## Current State In Repo

- The shared login form already includes a `Forgot password?` link to `/forgot-password`.
- Public login pages exist for admin, worker, inspector, delivery, superadmin, and developer.
- A global forgot-password page exists at `/forgot-password`.
- The current forgot-password UI performs a simplified reset flow without email verification.
- Superadmin also has force-reset capabilities for users in superadmin actions, but that is an admin tool, not the same as end-user self-service login recovery.

## Target Outcome

Make reset password clearly available and intentionally supported across all role login entry points, with documentation that defines the expected behavior and any security limitations.

## In Scope

- Verify all role login pages use the shared login form or otherwise expose reset-password access
- Confirm reset-password entry is visible and usable from admin, worker, inspector, delivery, superadmin, and developer login surfaces
- Review whether the current self-service reset behavior is acceptable for production use
- Define desired button/link wording and placement for consistency
- Document any required improvements to validation, role-aware routing, and post-reset return paths

## Out Of Scope

- Full email-token recovery redesign unless explicitly approved in this phase
- Account security redesign outside the reset-password path
- User-management force reset workflows unrelated to login screens

## Risks / Open Questions

- The current simplified reset flow may not meet the desired security level for production.
- If any login page does not use the shared login form, it may need separate treatment.
- The expected wording says “button,” but the current UI is a text link; implementation should confirm whether that should remain a link or become a more prominent action.
- Post-reset navigation should be predictable for each role.

## Phase Breakdown

### Phase 1: Login Surface Audit

- Inventory all role login pages and confirm how they render the login form.
- Verify whether each role currently exposes reset-password access.
- Confirm whether the entry point is visually sufficient or should become a stronger CTA.

### Phase 2: Reset Flow Review

- Audit the current `/forgot-password` behavior and security assumptions.
- Confirm whether role detection and post-reset navigation work correctly for all supported roles.
- Decide whether the current simplified flow is acceptable for now or needs hardening before rollout.

### Phase 3: UI and Routing Alignment

- Standardize reset-password entry across all role login pages.
- Align wording, placement, and interaction pattern.
- Ensure successful reset flows return users to the correct role login screen where appropriate.
- Clarify error states and invalid-account behavior.

### Phase 4: Verification and Documentation

- Add regression coverage for reset-password entry visibility and navigation.
- Document the reset-password behavior, supported roles, and any current security limitations.
- Create a follow-up scope if tokenized email verification is required later.

## Acceptance Checklist

- [ ] All role login entry points expose reset-password access consistently.
- [ ] Reset-password behavior is documented as a supported system feature.
- [ ] Post-reset return behavior is defined for each supported role.
- [ ] Any security limitations in the current flow are documented explicitly.
- [ ] Superadmin force-reset tooling remains clearly distinct from end-user self-service reset.

## Related Code Areas

- `src/components/global/login/login-form.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/forgot-password/forgot-password-client.tsx`
- `src/app/admin/(public)/login/page.tsx`
- `src/app/worker/(public)/login/page.tsx`
- `src/app/inspector/(public)/login/page.tsx`
- `src/app/delivery/(public)/login/page.tsx`
- `src/app/superadmin/(public)/login/page.tsx`
- `src/app/developer/(public)/login/page.tsx`

## Notes / Follow-Ups

- If the project later requires email verification tokens, this file should lead to a dedicated security-focused scope instead of expanding this one indefinitely.
- Keep end-user reset behavior separate from administrative password-reset tooling.
