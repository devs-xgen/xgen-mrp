# Super Admin Portal Structure

This folder contains the Next.js routes that power the Super Admin portal. The portal follows a predictable structure so new features can be added quickly and consistently.

## Directory layout

- `page.tsx`
  Redirects `/superadmin` to the dashboard route.
- `(public)/`
  Public-only routes (e.g. `login`).
- `(protected)/`
  Routes that require an authenticated `SUPER_ADMIN` session. Each feature lives in its own subfolder. For example, `dashboard/`, `users/`, etc.
- `README.md`
  This file. Serves as a quick reference for contributors.

## Components

Super Admin–specific React components live under `src/components/module/superadmin/`.

- Shared widgets such as the sidebar and dashboard cards live directly inside this folder.
- Feature-specific components go into a matching subfolder. For example, user management components live in `src/components/module/superadmin/users/`.

## Server actions

Server actions that power Super Admin features are located at `src/lib/actions/superadmin/`. Group all Super Admin server logic here.

- `getSystemMetrics()` — Dashboard metrics.
- `getGlobalUsers()` — User directory for Super Admins.
- `updateUserPassword()` — Allows Super Admins to force-reset passwords.

When adding new server actions, make sure they call `ensureSuperAdmin()` for access control and revalidate any relevant routes.

## Adding a new feature

1. Create a folder inside `src/app/superadmin/(protected)/` for your route.
2. Add any client components inside `src/components/module/superadmin/<feature>/`.
3. Keep server-side logic in `src/lib/actions/superadmin/`.
4. Update navigation items in `src/config/nav.ts` if the feature needs a sidebar entry.

Keeping to this structure lets the Super Admin portal grow without becoming hard to maintain.
