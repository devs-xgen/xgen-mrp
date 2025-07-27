# Project Structure

## Root Directory Organization

### Configuration Files
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration with custom webpack setup
- `tailwind.config.ts` - Tailwind CSS configuration with custom theme
- `components.json` - Shadcn/UI configuration
- `tsconfig.json` - TypeScript configuration (strict mode disabled)
- `vitest.config.ts` - Testing configuration
- `prisma/schema.prisma` - Database schema definition

### Key Directories
- `src/` - Main application source code
- `prisma/` - Database schema, migrations, and seeding
- `docs/` - Project documentation
- `notes/` - Comprehensive system documentation organized by role
- `scripts/` - Database seeding and utility scripts
- `tests/` - Test files organized by type
- `public/` - Static assets

## Source Code Structure (`src/`)

### Application Layer (`src/app/`)
- **App Router structure** with route groups for role-based access
- `(protected)` and `(public)` route groups for access control
- Role-specific modules: `admin/`, `worker/`, `inspector/`, `delivery/`
- `api/` - Server-side API routes organized by domain
- `globals.css` - Global styles and CSS variables

### Components (`src/components/`)
- `ui/` - Reusable UI components (Shadcn/UI based)
- `shared/` - Shared components across modules
- `module/` - Role-specific components organized by user type
- `global/` - Application-wide components (auth, notifications)
- `providers/` - React context providers

### Business Logic (`src/lib/`)
- `actions/` - Server actions organized by domain (billing, production, etc.)
- `utils/` - Utility functions and helpers
- `services/` - Business services (PDF generation, etc.)
- `validation/` - Zod validation schemas
- `auth.ts` - Authentication configuration
- `db.ts` - Database connection and utilities

### Type Definitions (`src/types/`)
- Organized by role: `admin/`, `worker/`, `inspector/`, `delivery/`
- `next-auth.d.ts` - NextAuth type extensions
- Domain-specific type definitions

### Hooks (`src/hooks/`)
- Custom React hooks for common functionality
- Form persistence, validation, mobile detection, notifications

## Database Structure (`prisma/`)

### Schema Organization
- Comprehensive schema with role-based access patterns
- Audit trails and history logging
- Material tracking and production workflows
- Quality control and inspection models

### Migrations
- Timestamped migration files
- Schema evolution tracking
- Data migration scripts

### Seeding
- `seed.ts` - Basic seeding
- `comprehensive-seed.ts` - Full system seeding
- Role-specific seeding scripts

## Documentation (`notes/`)

### Role-Based Documentation
- `admin/` - Administrative user guides
- `worker/` - Production worker documentation
- `inspector/` - Quality control guides
- `delivery/` - Logistics documentation

### Technical Documentation
- `technical/` - System architecture and development guides
- `processes/` - Business process documentation
- `frontend-design-schema/` - UI/UX design guidelines

## Testing Structure (`tests/`)

### Test Organization
- `components/` - Component unit tests
- `integration/` - Integration tests
- `e2e/` - End-to-end tests
- `accessibility/` - Accessibility compliance tests
- `performance/` - Performance tests
- `setup/` - Test configuration and mocks

## Path Aliases

```typescript
"@/*": ["./src/*"]
"@/components/*": ["./src/components/*"]
"@/modules/*": ["./src/components/modules/*"]
"@/lib/*": ["./src/lib/*"]
```

## Naming Conventions

### Files and Directories
- **kebab-case** for directories and regular files
- **PascalCase** for React components
- **camelCase** for utility functions and hooks
- **UPPER_CASE** for constants and environment variables

### Components
- UI components in `src/components/ui/` follow Shadcn/UI patterns
- Module components organized by user role
- Shared components for cross-module functionality

### API Routes
- RESTful patterns in `src/app/api/`
- Organized by domain (customers, materials, production, etc.)
- Consistent response patterns and error handling

## Architecture Patterns

### Role-Based Access Control
- Route groups for protected/public access
- Middleware for authentication and authorization
- Role-specific layouts and navigation

### Server Actions Pattern
- Business logic in `src/lib/actions/`
- Type-safe server-client communication
- Organized by domain functionality

### Component Composition
- Radix UI primitives as foundation
- Custom styling with Tailwind CSS
- Consistent design system implementation