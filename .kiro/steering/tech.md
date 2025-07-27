# Technology Stack

## Core Framework
- **Next.js 15**: Full-stack React framework with App Router
- **TypeScript**: Strict typing disabled for flexibility
- **React 18**: UI library with Server Components

## Database & ORM
- **PostgreSQL**: Primary database
- **Prisma**: ORM with client generation
- **Database URL**: Configured via `DATABASE_URL` environment variable

## Authentication
- **NextAuth.js**: Session-based authentication with role-based access control
- **bcryptjs**: Password hashing

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI components
- **Lucide React**: Icon library
- **Custom theme**: Extended with subtle backgrounds and borders

## State Management & Data Fetching
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **React Hook Form**: Form handling with Zod validation

## Development Tools
- **ESLint**: Linting (build errors ignored)
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting
- **Vitest**: Testing framework with jsdom

## Build & Deployment
- **Vercel**: Primary deployment platform
- **Electron**: Desktop application support
- **Docker**: Containerization support

## Common Commands

### Development
```bash
npm run dev              # Start development server on port 3001
npm run dev:https        # Start with HTTPS
npm run build            # Production build
npm run start            # Start production server
```

### Database
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema changes
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Run database seeding
```

### Testing & Quality
```bash
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
```

### Seeding & Scripts
```bash
npm run seed:comprehensive  # Comprehensive database seeding
npm run seed:billing       # Billing-specific seeding
npm run link:inspectors    # Link inspector data
```

## Key Libraries
- **@react-pdf/renderer**: PDF generation
- **html2pdf.js**: HTML to PDF conversion
- **react-to-print**: Print functionality
- **date-fns**: Date manipulation
- **lodash**: Utility functions
- **recharts**: Data visualization
- **html5-qrcode**: QR code scanning
- **libphonenumber-js**: Phone number formatting

## Configuration Notes
- TypeScript strict mode disabled for flexibility
- Build errors ignored for faster development
- Standalone output for deployment
- CORS enabled for API routes
- Custom webpack configuration for asset handling