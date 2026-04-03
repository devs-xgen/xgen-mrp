# P6: Customer Support Ticket System

> **Status**: Done — Shipped  
> **Completed**: 2025

## Summary

Implemented a complete customer support chat system accessible by all user roles. The system enables real-time messaging between users and administrators for issue resolution.

## What Was Shipped

### Database Schema Changes

- **DEVELOPER** role added to Role enum
- **SupportTicket** model:
  - `id`, `userId`, `title`, `description`
  - `status` (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
  - `priority` (LOW, MEDIUM, HIGH, URGENT)
  - Timestamps: `createdAt`, `updatedAt`, `resolvedAt`
  - Relations to User and SupportMessage
  
- **SupportMessage** model:
  - `id`, `ticketId`, `userId`, `message`
  - `isAdmin` flag for admin responses
  - `createdAt` timestamp
  - Relations to User and SupportTicket

### Authentication & Authorization

- Hardcoded developer credentials in `src/lib/auth.ts`:
  - Email: `dev@xgen-mrp.local`
  - Password: `dev123!@#`
  - Role: DEVELOPER
- Developer authentication bypasses database lookup and rate limiting
- Updated middleware to allow DEVELOPER role access to admin portal

### API Routes

- `GET /api/support/tickets` — List tickets (filtered by role)
- `POST /api/support/tickets` — Create new ticket
- `GET /api/support/tickets/[id]` — Get ticket with messages
- `PATCH /api/support/tickets/[id]` — Update status/priority (admin/dev only)
- `POST /api/support/tickets/[id]/messages` — Add message to ticket

### User Interface

- **Universal `/support` page** — All roles can access to create and view tickets
  - Ticket creation dialog
  - Filter by status/priority
  - Real-time messaging interface
  - Message threading with admin indicators
  
- **Admin `/admin/support` page** — Dashboard with:
  - Statistics overview (total, open, in-progress, resolved)
  - Advanced filtering and search
  - Status/priority management
  - Full message history access

- **Developer `/developer/support` page** — Admin-level access to all tickets

### Navigation Updates

- "Support" link added to all role navigation menus:
  - Admin, Worker, Inspector, Delivery portals: route to `/support`
  - Developer portal: route to `/developer/support` (admin view)

## Key Features

- **Role-based permissions**: Users see only their tickets; admins/developers see all
- **Ticket lifecycle**: Open → In Progress → Resolved → Closed
- **Priority management**: Visual indicators for LOW, MEDIUM, HIGH, URGENT
- **Real-time messaging**: Threaded conversations between users and admins
- **Search and filtering**: By status, priority, and user
- **Audit trail**: Full message history with timestamps and user info

## Code Areas

- Database: `prisma/schema.prisma`
- Auth: `src/lib/auth.ts`
- Middleware: `src/middleware.ts`
- API: `src/app/api/support/**`
- UI: `src/app/support/page.tsx`, `src/app/admin/support/page.tsx`, `src/app/developer/support/page.tsx`
- Components: Support ticket cards, message threads, filters

## Environment Requirements

No additional environment variables required.

## Acceptance Checklist

- [x] DEVELOPER role exists in database
- [x] SupportTicket and SupportMessage models created
- [x] Support status enum working
- [x] Support priority enum working
- [x] User relations working
- [x] API routes functional with role-based access
- [x] Universal /support page accessible by all roles
- [x] Admin support dashboard functional
- [x] Navigation links added to all portals
- [x] Real-time messaging working
- [x] Ticket status updates working
- [x] Priority management working
