---
trigger: manual
---

# XGen MRP System Documentation

This directory contains comprehensive documentation for the XGen MRP system architecture, design patterns, and development guidelines.

## Documentation Files

### 1. [System Architecture](./system-architecture.md)
**Overview of the entire system**
- Technology stack and framework choices
- Role-based portal system
- Server-first architecture principles
- Security and authentication
- Performance and caching strategies
- Development workflow
- Key system features
- Best practices and future considerations

**Read this first** to understand the overall system design.

### 2. [Folder Structure Rules](./folder-structure-rules.md)
**Complete directory organization guide**
- Root directory structure
- Source code organization (`src/`)
- App Router structure with route groups
- Component hierarchy (ui/shared/global/module)
- Server actions placement
- Types and validation organization
- File naming conventions
- Import path aliases
- What NOT to do

**Essential for** understanding where files should be located.

### 3. [Page Creation Guide](./page-creation-guide.md)
**How to create new pages**
- Page structure patterns (server vs client)
- Page layout components
- Step-by-step page creation checklist
- Different page types (list, detail, create, dashboard, analytics)
- Dynamic routes and metadata
- Loading and error states
- Data fetching patterns
- Revalidation and caching
- Authentication and authorization
- Common patterns and best practices

**Use this when** creating new pages or routes.

### 4. [Component Creation Guide](./component-creation-guide.md)
**How to create and organize components**
- Component types and classification
- Component patterns (server vs client)
- Dialog, form, card, table components
- Component organization patterns
- Props and TypeScript interfaces
- Event handlers and loading states
- Error handling
- Styling guidelines (Tailwind CSS)
- Testing components
- Common mistakes to avoid

**Use this when** building new components or refactoring existing ones.

### 5. [Server Actions Guide](./server-actions-guide.md)
**Primary data interaction pattern**
- Why server actions over API routes
- Server action structure and templates
- CRUD operation patterns
- Advanced patterns (transactions, pagination, search)
- Data serialization (Decimal, Date)
- Caching and revalidation
- Error handling
- Authentication and authorization
- Testing server actions
- Migration from API routes

**Critical for** implementing any data operations.

## Quick Start for New Developers

### First Day Checklist
1. ✅ Read [System Architecture](./system-architecture.md) - Get the big picture
2. ✅ Review [Folder Structure Rules](./folder-structure-rules.md) - Know where things go
3. ✅ Set up development environment (see below)
4. ✅ Run the application locally
5. ✅ Explore the codebase using the documentation

### Development Environment Setup
```bash
# 1. Clone the repository
git clone <repository-url>
cd xgen-mrp

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database connection and other settings

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma db push
# OR
npx prisma migrate dev

# 6. (Optional) Seed database
npm run seed

# 7. Start development server
npm run dev

# 8. Open browser
# Navigate to http://localhost:3000
```

### Login Credentials
**Developer Account** (hardcoded for development):
- Email: `dev@xgen-mrp.local`
- Password: `dev123!@#`
- Role: DEVELOPER (has access to all portals)

## Common Development Tasks

### Creating a New Feature
1. **Plan the feature** - Determine which portal it belongs to
2. **Create server actions** - Define data operations in `src/lib/actions/`
3. **Create types** - Define TypeScript types in `src/types/`
4. **Create page** - Add page in appropriate portal route
5. **Create components** - Build UI components in `src/components/module/`
6. **Add navigation** - Update sidebar in `src/components/shared/AppSidebar.tsx`
7. **Test** - Write tests in `tests/`

### Adding a New Page
See: [Page Creation Guide](./page-creation-guide.md)

1. Create server action for data fetching
2. Create page file in appropriate route
3. Import server action and fetch data
4. Use page layout components
5. Add metadata
6. Test and verify

### Adding a New Component
See: [Component Creation Guide](./component-creation-guide.md)

1. Determine component type (ui/shared/global/module)
2. Create component file with TypeScript types
3. Implement functionality (server or client)
4. Add proper error handling
5. Style with Tailwind CSS
6. Export and use

### Adding Data Operations
See: [Server Actions Guide](./server-actions-guide.md)

1. Create action file in `src/lib/actions/`
2. Add `"use server"` directive
3. Implement CRUD functions
4. Add error handling
5. Add revalidation
6. Call from pages or components

## Project Structure Overview

```
xgen-mrp/
├── src/
│   ├── app/                    # Pages (Next.js App Router)
│   │   ├── admin/             # Admin portal
│   │   ├── worker/            # Worker portal
│   │   ├── inspector/         # Inspector portal
│   │   ├── delivery/          # Delivery portal
│   │   ├── developer/         # Developer portal
│   │   ├── superadmin/        # Superadmin portal
│   │   └── api/               # API routes (LEGACY)
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── shared/           # Cross-portal components
│   │   ├── global/           # App-wide components
│   │   └── module/           # Feature components by portal
│   ├── lib/                   # Business logic
│   │   ├── actions/          # Server actions (PRIMARY)
│   │   ├── validation/       # Zod schemas
│   │   ├── utils/            # Utility functions
│   │   ├── auth.ts           # Authentication config
│   │   └── db.ts             # Prisma client
│   ├── types/                # TypeScript types
│   ├── hooks/                # Custom React hooks
│   ├── styles/               # CSS files
│   └── middleware.ts         # Next.js middleware
├── prisma/                   # Database schema
├── public/                   # Static assets
├── tests/                    # Test files
└── docs/                     # Additional documentation
```

## Key Architectural Decisions

### 1. Server Actions Over API Routes
✅ **We use Server Actions** for all new features
- Direct function calls from components
- Type-safe
- Better developer experience
- Automatic caching integration

❌ **We avoid API Routes** for new features
- Existing API routes are legacy
- Only use for webhooks or external integrations

### 2. Server Components by Default
✅ **Server Components** are the default
- Better performance
- Reduced JavaScript bundle
- SEO-friendly
- Direct database access

🔄 **Client Components** only when needed
- Form interactivity
- Browser APIs
- React hooks (useState, useEffect)
- Event handlers

### 3. Role-Based Multi-Portal Architecture
Each user role has a dedicated portal:
- SUPER_ADMIN → `/superadmin`
- ADMIN → `/admin`
- DEVELOPER → `/developer`
- WORKER → `/worker`
- INSPECTOR → `/inspector`
- DELIVERY → `/delivery`

### 4. Type Safety Everywhere
- TypeScript for all code
- Zod for runtime validation
- Prisma for database types
- Proper error handling

## Important Notes

### API Routes Are Legacy
⚠️ The `src/app/api/` directory contains **LEGACY CODE**.
- Do NOT create new API routes
- Use Server Actions instead
- Existing routes maintained for backward compatibility

### Support System Uses API Routes
The support ticket system uses API routes (legacy implementation from memory):
- `/api/support/tickets`
- `/api/support/tickets/[id]`
- `/api/support/tickets/[id]/messages`

**Note**: New similar features should use Server Actions instead.

### Database Studio Feature
Developer portal has a Database Studio feature:
- List PostgreSQL tables
- Stream database backups via pg_dump
- Rate-limited access
- DEVELOPER role only
- UI at `/developer/database-studio`

Environment variables:
- `PG_BACKUP_URL` - Preferred connection for backups
- `DATABASE_URL` - Fallback connection
- `PG_DUMP_PATH` - Path to pg_dump executable (Windows)

### Philippine-Specific Features
The system includes PH-specific validations:
- Phone number validation (+63 format)
- TIN (Tax Identification Number) validation
- Address fields for Philippine locations

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── components/        # Component tests
├── lib/              # Library/utility tests
├── actions/          # Server action tests
└── integration/      # Integration tests
```

## Deployment

### Docker Deployment (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Deployment
```bash
# Build production
npm run build

# Start production server
npm start
```

See deployment guides:
- [Docker Deployment](../DEPLOYMENT_DOCKER.md)
- [Netlify Deployment](../NETLIFY_DEPLOYMENT_GUIDE.md)
- [Quick Install Guide](../QUICK_INSTALL.md)

## Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)

### Internal Documentation
- System feature docs in `/docs`
- Role-specific guides in `/docs/roles`
- Technical guides in `/docs/technical`
- Feature specifications in `/docs/features`

## Getting Help

### When Stuck
1. Check this documentation first
2. Search the codebase for similar examples
3. Check Git history for context
4. Review Prisma schema for data models
5. Use the support system (dogfooding)

### Code Review Checklist
- ✅ Follows folder structure rules
- ✅ Uses Server Actions (not API routes)
- ✅ Server Components by default
- ✅ Proper TypeScript types
- ✅ Error handling included
- ✅ Loading states handled
- ✅ Consistent styling (Tailwind)
- ✅ Proper authentication checks
- ✅ Cache revalidation after mutations
- ✅ Tests included

## Contributing Guidelines

### Code Style
- TypeScript strict mode
- ESLint configuration followed
- Prettier for formatting
- Consistent naming conventions
- Comments for complex logic

### Git Workflow
- Feature branches from main
- Descriptive commit messages
- Pull requests for review
- Husky pre-commit hooks

### Commit Message Format
```
feat: Add customer order analytics page
fix: Resolve decimal conversion issue in billing
docs: Update server actions guide
refactor: Simplify customer form component
test: Add tests for production order actions
```

## Maintenance

### Regular Tasks
- Review and update dependencies
- Monitor error logs
- Check database performance
- Review security settings
- Update documentation

### Database Maintenance
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate client after schema changes
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

## Version History

**Current Version**: 1.0.0 (Active Development)

Major features implemented:
- Multi-portal architecture
- Customer order management
- Production order system
- Quality control workflows
- Billing system
- Support ticket system
- Database studio (developer tools)
- Real-time notifications
- PWA support

## License & Contact

For questions or support, use the in-app support system or contact the development team.

---

**Last Updated**: 2025-10-01
**Maintained By**: XGen Development Team
