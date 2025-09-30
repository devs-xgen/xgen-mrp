# XGen MRP System Architecture

## Overview
XGen MRP is a Next.js 14+ application using the App Router, Prisma ORM with PostgreSQL, and TypeScript. The system follows a role-based multi-portal architecture with server-side rendering and server actions as the primary data interaction method.

## Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Framework**: React 18+ with TailwindCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **PDF Generation**: React-PDF

## Role-Based Portal System

### User Roles
The system supports six distinct roles, each with dedicated portals:
1. **SUPER_ADMIN** - Full system access (`/superadmin`)
2. **ADMIN** - Administrative functions (`/admin`)
3. **DEVELOPER** - Development tools and database access (`/developer`)
4. **WORKER** - Production operations (`/worker`)
5. **INSPECTOR** - Quality control and inspection (`/inspector`)
6. **DELIVERY** - Delivery and logistics (`/delivery`)

### Portal Structure
Each portal has its own:
- Dedicated route prefix (e.g., `/admin`, `/worker`)
- Authentication requirements
- Role-based middleware protection
- Shared layout components
- Portal-specific navigation

## Application Architecture Principles

### Server-First Approach
- **Primary Data Pattern**: Server Actions (NOT API routes)
- **Server Components**: Default for all pages
- **Client Components**: Only when necessary (interactivity, hooks, browser APIs)
- **Data Fetching**: Server Actions in `src/lib/actions/`
- **Caching Strategy**: Next.js automatic caching with `revalidatePath`

### API Routes Policy
⚠️ **IMPORTANT**: API routes in `src/app/api/` are **LEGACY** and should NOT be used for new features.
- Existing API routes are maintained for backward compatibility
- New features MUST use Server Actions
- Exceptions: External webhooks, public share links, third-party integrations

### Data Flow Pattern
```
Page (Server Component) 
  ↓ calls
Server Action (src/lib/actions/)
  ↓ queries
Prisma Client (src/lib/db.ts)
  ↓ returns data
Page renders with data
  ↓ passes to
Client Component (if needed)
```

## Security & Authentication

### Middleware Protection
File: `src/middleware.ts`
- Role-based route protection
- Rate limiting (in-memory, Redis recommended for production)
- Security headers (X-Frame-Options, CSP, etc.)
- IP-based access control

### Authentication Flow
- NextAuth.js with custom credentials provider
- Session-based authentication
- JWT tokens
- Hardcoded developer credentials for development
- Protected routes via middleware and layout components

### Session Management
- Server-side session validation
- Role-based access control in layouts
- Automatic redirect to login on unauthorized access
- Portal-specific login pages

## Development Workflow

### Environment Setup
1. Clone repository
2. Copy `.env.example` to `.env`
3. Configure database connection string
4. Run `npm install`
5. Run `npx prisma generate`
6. Run `npx prisma db push` (or migrate)
7. Run `npm run dev`

### Database Management
- **Schema**: `prisma/schema.prisma`
- **Migrations**: Use Prisma Migrate
- **Seeding**: Scripts in `prisma/seed.ts`
- **Client**: Generated in `node_modules/.prisma/client`

### Code Organization
- **Strict separation**: Server code vs Client code
- **Type safety**: Full TypeScript coverage
- **Zod validation**: For forms and server actions
- **Error handling**: Try-catch with proper logging
- **Decimal handling**: Use `convertDecimals()` utility for Prisma Decimal fields

## Performance & Optimization

### Caching Strategy
- Server Component caching (automatic)
- `revalidatePath()` for manual cache invalidation
- Dynamic rendering where needed (`export const dynamic = 'force-dynamic'`)
- Static generation for public pages

### Data Serialization
- Decimal conversion for client components
- Date serialization for JSON
- Utility: `src/lib/convertDecimals.ts`
- Utility: `src/lib/serialization-helpers.ts`

### Code Splitting
- Automatic with Next.js App Router
- Dynamic imports for heavy components
- Route-based splitting

## Error Handling

### Client-Side
- Error boundaries at root and page levels
- Toast notifications for user feedback
- Form validation with real-time feedback
- Debug panel in development mode

### Server-Side
- Try-catch blocks in all server actions
- Prisma error handling (P2002, P2000, etc.)
- Custom error messages for users
- Error logging to console (or external service)

## Testing Strategy
- Vitest for unit tests
- Test directory: `tests/`
- Component tests
- Server action tests
- Integration tests

## Build & Deployment

### Production Build
```bash
npm run build
```

### Docker Support
- `Dockerfile` for production
- `Dockerfile.dev` for development
- `docker-compose.yml` for full stack
- Environment variables via `.env`

### Deployment Targets
- Docker containers (recommended)
- Netlify (with adapter)
- Vercel
- Any Node.js hosting

## Key System Features

### Multi-Portal Architecture
- Unified authentication across portals
- Role-based access control
- Shared components library
- Portal-specific features

### Inventory Management
- Materials and products tracking
- Stock levels and reservations
- Inventory movements
- Bill of Materials (BOM)

### Production Management
- Production orders
- Work centers and operations
- Material consumption tracking
- Production planning

### Quality Control
- Quality checks and inspections
- Inspector assignments
- Task management
- Defect tracking

### Billing System
- Sales invoices
- Billing statements
- Delivery receipts
- Payment tracking
- PDF generation

### Customer Order Management
- Order creation and tracking
- Order fulfillment
- Order archiving
- Order analytics

### Support System
- Ticket management
- Real-time messaging
- Priority levels
- Status tracking

### Database Studio (Developer Portal)
- Table browser
- Database backups via pg_dump
- Rate-limited access
- DEVELOPER role only

## Best Practices

### 1. Server Actions Over API Routes
✅ Use Server Actions for all new features
❌ Avoid creating new API routes

### 2. Type Safety
✅ Define types in `src/types/`
✅ Use Zod for runtime validation
✅ Use Prisma generated types

### 3. Component Organization
✅ Server Components by default
✅ Mark client components with `"use client"`
✅ Minimal client-side JavaScript

### 4. Error Messages
✅ User-friendly messages
✅ Detailed logs for debugging
✅ Toast notifications for feedback

### 5. Database Queries
✅ Use Prisma Client
✅ Optimize with proper includes/selects
✅ Handle Decimal type conversions
✅ Use transactions for multi-step operations

### 6. Security
✅ Validate all inputs (server-side)
✅ Sanitize user data
✅ Use parameterized queries (Prisma handles this)
✅ Implement proper authentication checks

### 7. Performance
✅ Minimize client-side JavaScript
✅ Optimize images
✅ Use streaming where appropriate
✅ Implement proper loading states

## Monitoring & Maintenance

### Development Tools
- Error Debug Panel (dev mode only)
- Performance monitoring script
- Connection error handler
- Maintenance mode support

### Production Monitoring
- Error reporting API endpoint
- Activity logging
- Seed logs for database changes
- User activity tracking

## Migration Notes

### From API Routes to Server Actions
When migrating legacy code:
1. Identify the API route handler
2. Move logic to `src/lib/actions/`
3. Add `"use server"` directive
4. Update page to call server action directly
5. Remove API route file
6. Update any client components

### Decimal Field Handling
Always convert Prisma Decimal to number for client:
```typescript
const data = await serverAction()
const serialized = convertDecimals(data)
return <ClientComponent data={serialized} />
```

## Future Considerations

### Planned Improvements
- Redis for rate limiting
- External error tracking (Sentry)
- Real-time updates (WebSockets/SSE)
- Enhanced caching strategy
- Mobile app (React Native)
- Electron desktop app (in progress)

### Scalability
- Database connection pooling
- Read replicas for heavy queries
- Background job processing
- Microservices for specific features
- CDN for static assets
