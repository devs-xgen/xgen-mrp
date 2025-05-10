# XGen MRP System Architecture

**Last Updated:** 2023-05-23  
**Status:** In Progress  

## Overview

This document describes the technical architecture of the XGen MRP system, including application structure, database design, authentication, and key technologies used in the implementation.

## System Components

The XGen MRP system consists of the following major components:

### Frontend Framework

- **Next.js 14**: Server and client components architecture
- **TypeScript**: For type safety and improved developer experience
- **Shadcn/UI**: Component library based on Radix UI primitives
- **TailwindCSS**: Utility-first CSS framework for styling
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation library
- **Tanstack Table**: Data table component for structured data display

### Backend & Data Layer

- **Prisma ORM**: Database access and schema management
- **PostgreSQL**: Primary database
- **NextAuth.js**: Authentication framework
- **Server Actions**: For handling server-side operations
- **NextJS API Routes**: For specific API endpoints where needed

### Deployment & Infrastructure

- **Vercel**: Primary hosting platform
- **Docker**: Containerization for local development and alternative deployments
- **Electron**: For desktop application wrapping (optional)

## Application Structure

The application follows a modular structure organized by feature domains:

```
src/
├── app/                     # Next.js App Router
│   ├── admin/               # Admin interface
│   │   ├── (protected)/     # Protected admin routes
│   │   └── (public)/        # Public admin routes (login)
│   ├── worker/              # Worker interface
│   │   ├── (protected)/     # Protected worker routes
│   │   └── (public)/        # Public worker routes
│   ├── inspector/           # Inspector interface
│   │   ├── (protected)/     # Protected inspector routes
│   │   └── (public)/        # Public inspector routes
│   ├── delivery/            # Delivery interface
│   │   ├── (protected)/     # Protected delivery routes
│   │   └── (public)/        # Public delivery routes
│   └── api/                 # API routes
├── components/              # React components
│   ├── common/              # Shared components across modules
│   ├── global/              # Global components (navigation, layout)
│   ├── module/              # Module-specific components
│   │   ├── admin/           # Admin components
│   │   ├── worker/          # Worker components
│   │   ├── inspector/       # Inspector components
│   │   └── delivery/        # Delivery components
│   ├── providers/           # Context providers
│   ├── shared/              # Shared business components
│   └── ui/                  # UI primitives and basic components
├── config/                  # Application configuration
├── context/                 # React context definitions
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries and services
│   ├── actions/             # Server actions
│   │   ├── admin/           # Admin-specific actions
│   │   ├── worker/          # Worker-specific actions
│   │   ├── inspector/       # Inspector-specific actions
│   │   └── delivery/        # Delivery-specific actions
│   ├── api/                 # API utilities
│   ├── db.ts                # Database client
│   ├── auth.ts              # Authentication setup
│   └── utils/               # Utility functions
├── styles/                  # Global styles
└── types/                   # TypeScript type definitions
    ├── admin/               # Admin-specific types
    ├── worker/              # Worker-specific types
    ├── inspector/           # Inspector-specific types
    └── delivery/            # Delivery-specific types
```

### Key Directory Explanations

- **app/**: Contains route structure using Next.js App Router with nested folder conventions
- **components/module/**: Module-specific components organized by domain
- **lib/actions/**: Server actions organized by domain/role for server-side operations
- **types/**: TypeScript interfaces organized by domain for type consistency

## Authentication Architecture

The system uses NextAuth.js for authentication with the following configuration:

1. **Authentication Providers**:
   - Credentials Provider: Email/password authentication
   - (Future) OAuth Providers: For potential SSO integration

2. **Role-Based Access**:
   - Custom middleware ensures users can only access their assigned portals
   - Role-specific redirects based on user type
   - Route groups ((protected)/(public)) for fine-grained access control

3. **Session Management**:
   - JWT-based sessions stored in cookies
   - Role information embedded in JWT tokens
   - Custom session handlers to include role data

## Database Architecture

The database uses Prisma ORM with PostgreSQL and includes the following key models:

### Core Business Models

- **User**: System users with role-based permissions
- **Product**: Finished goods that can be manufactured
- **Material**: Raw materials and components used in production
- **Supplier**: External vendors that provide materials
- **Customer**: Clients who place orders for products
- **WorkCenter**: Production facilities/areas within the factory

### Operational Models

- **ProductionOrder**: Manufacturing orders for products
- **Operation**: Specific steps in the production process
- **CustomerOrder**: Orders placed by customers
- **PurchaseOrder**: Orders for materials from suppliers
- **QualityCheck**: Quality control inspections
- **Inventory**: Material stock levels and locations

### Relationship Diagram

```
User 1--* UserWorkCenter *--1 WorkCenter
Product 1--* BOM *--1 Material
Product 1--* ProductionOrder
ProductionOrder 1--* Operation *--1 WorkCenter
ProductionOrder 1--* QualityCheck *--1 Inspector
CustomerOrder 1--* ProductionOrder
CustomerOrder *--1 Customer
PurchaseOrder *--1 Supplier
PurchaseOrder 1--* PurchaseOrderLine *--1 Material
```

## Server Actions Pattern

The system uses React Server Actions for handling server-side operations:

1. **Organization**:
   - Actions are grouped by domain (admin, worker, etc.)
   - Each action file is a collection of related functions
   - Actions use server-side validation with Zod

2. **Patterns**:
   - Data fetching actions to retrieve data for pages/components
   - Mutation actions to create/update/delete data
   - Authentication is enforced at the action level
   - Revalidation is triggered after mutations

3. **Example Pattern**:

```typescript
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema for validation
const schema = z.object({
  // schema definition
})

// Action implementation
export async function exampleAction(data: z.infer<typeof schema>) {
  // Validate input
  const validated = schema.parse(data)
  
  // Authentication check
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")
  
  // Perform database operation
  const result = await prisma.someModel.create({
    data: {
      ...validated,
      createdBy: session.user.id
    }
  })
  
  // Revalidate affected paths
  revalidatePath('/affected/path')
  
  return result
}
```

## UI Component Architecture

The UI uses a combination of Shadcn/UI components with custom styling:

1. **Component Hierarchy**:
   - UI primitives (buttons, inputs) from Shadcn/UI
   - Shared business components (forms, data tables)
   - Module-specific composite components
   - Page layouts and templates

2. **Styling Approach**:
   - TailwindCSS for utility-first styling
   - CSS variables for theming and consistency
   - Mobile-first responsive design
   - Dark mode support

## Deployment Architecture

The system can be deployed in several configurations:

1. **Web Application**:
   - Deployed on Vercel for production
   - Uses Vercel's serverless functions for API routes
   - PostgreSQL database hosted on managed service

2. **Desktop Application**:
   - Electron wrapper for desktop usage
   - Local or networked database connection
   - Offline capabilities with synchronization

3. **Development Environment**:
   - Docker Compose for local development
   - Local PostgreSQL instance
   - Hot reloading for rapid iteration

## Performance Considerations

The system architecture addresses performance in several ways:

1. **Server Components**:
   - Using Next.js Server Components for reduced client-side JS
   - Streaming for improved perceived performance
   - Server-side data fetching to reduce client-side requests

2. **Data Loading**:
   - Pagination for large datasets
   - Incremental loading where appropriate
   - Caching strategies for frequently accessed data

3. **Optimization Techniques**:
   - Image optimization via Next.js Image component
   - Code splitting for reduced bundle size
   - Selective hydration for interactive components

## Security Architecture

Security is implemented at multiple levels:

1. **Authentication**:
   - CSRF protection
   - Secure HTTP-only cookies
   - Rate limiting for login attempts

2. **Authorization**:
   - Fine-grained permission checks
   - Role-based access control
   - Data access filtering based on user context

3. **Data Protection**:
   - Input validation with Zod
   - Output sanitization
   - SQL injection protection via Prisma

## Related Documents

- [Development Guidelines](./Development_Guidelines.md)
- [Server-Side Architecture](./read-server-way.md)
- [MRP System Guide](./MRP_System_Guide.md)

## Change History

| Date | Description of Change |
|------|------------------------|
| 2023-05-23 | Initial document creation |

## Open Issues

- Complete database schema documentation
- Add architectural decision records
- Document scaling strategy for larger deployments 