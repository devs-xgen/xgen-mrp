# XGen-MRP System Organization and Standards

## Project Overview
XGen-MRP is a comprehensive Inventory and Manufacturing Resource Planning system built with Next.js, TypeScript, Prisma, and PostgreSQL. The system serves multiple user roles (Admin, Worker, Inspector, Delivery) with role-specific portals.

## Technology Stack
- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS with Shadcn/UI components
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation

## Directory Structure

### Core Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin portal
│   ├── worker/             # Worker portal
│   ├── inspector/          # Inspector portal
│   ├── delivery/           # Delivery portal
│   └── api/                # API routes
├── components/             # React components
│   ├── common/             # Common components used across modules
│   ├── global/             # Global components (auth, layout)
│   ├── module/             # Module-specific components
│   │   ├── admin/          # Admin module components
│   │   ├── worker/         # Worker module components
│   │   ├── inspector/      # Inspector module components
│   │   └── delivery/       # Delivery module components
│   ├── providers/          # Context providers
│   ├── shared/             # Shared utility components
│   └── ui/                 # Base UI components (shadcn)
├── config/                 # Configuration files
├── context/                # React contexts
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and services
│   ├── actions/            # Server actions
│   ├── api/                # API client functions
│   └── utils/              # Utility functions
├── styles/                 # Global styles
└── types/                  # TypeScript type definitions
    ├── admin/              # Admin-specific types
    ├── worker/             # Worker-specific types
    ├── inspector/          # Inspector-specific types
    └── delivery/           # Delivery-specific types
```

## Component Organization Standards

### Rule 1: Module-Based Component Structure
All role-specific components must be placed in the appropriate module directory:
- `components/module/admin/` for Admin components
- `components/module/worker/` for Worker components
- `components/module/inspector/` for Inspector components
- `components/module/delivery/` for Delivery components

### Rule 2: Feature-Based Subdirectories
Within each module directory, organize components by feature or page:
```
components/module/admin/
├── dashboard/            # Dashboard-related components
├── products/             # Product management components
├── materials/            # Material management components
└── users/                # User management components
```

### Rule 3: Component File Naming
- Use PascalCase for component files
- Use kebab-case for directory names
- Name files based on their function plus the component type
- Examples: `ProductTable.tsx`, `UserForm.tsx`, `InventoryCard.tsx`

### Rule 4: Component Structure
Each component should follow this structure:
1. Imports (grouped by: React/Next.js, external libraries, internal components, types, utils)
2. Types/interfaces definition
3. Component definition with JSDoc comment
4. Export statement

Example:
```tsx
// Import groups
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types/admin/product";
import { formatCurrency } from "@/lib/utils";

// Type definition
interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: Product) => void;
}

/**
 * Product form component for creating or editing products
 */
export function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  // Component implementation
  return (
    // JSX
  );
}
```

## Type Definitions

### Rule 5: Type Organization
- Place shared types in `/types/index.ts`
- Place role-specific types in corresponding directories: `/types/admin`, `/types/worker`, etc.
- Use interfaces for objects with methods or that you might want to extend
- Use type aliases for unions, intersections, or simple object types

### Rule 6: Type Naming Conventions
- Use PascalCase for type and interface names
- Use descriptive names that indicate the purpose
- Add `Props` suffix for component props
- Add `Response` suffix for API responses
- Add `Request` suffix for API requests

Example:
```ts
// types/admin/product.ts
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  categoryId: string;
}

export type ProductFormValues = Omit<Product, "id"> & {
  isActive: boolean;
};

export interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}
```

## API and Data Fetching

### Rule 7: API Organization
- Place API route handlers in `/app/api/`
- Group routes by entity (e.g., `/api/products`, `/api/materials`)
- Place API client functions in `/lib/api/`
- Use consistent error handling and response formatting

### Rule 8: Data Fetching
- Prefer React Server Components for initial data loading where possible
- Use SWR or React Query for client-side data fetching with caching
- Implement proper loading and error states

## State Management

### Rule 9: State Management Approach
- Use React's built-in state for simple component state
- Use React Context for shared state across a feature
- Use Zustand for global application state
- Place Zustand stores in `/lib/stores/`

## Styling

### Rule 10: CSS and Styling
- Use Tailwind CSS for styling
- Follow utility-first approach
- Use shadcn/UI components as base building blocks
- Custom styles should be minimal and placed in component-specific CSS modules when necessary

## Error Handling

### Rule 11: Error Handling
- Implement proper error boundaries at the page/feature level
- Use try/catch blocks for async operations
- Provide user-friendly error messages
- Log errors appropriately

## Testing

### Rule 12: Testing
- Write unit tests for critical utility functions
- Write component tests for complex, reusable components
- Place tests adjacent to the code they test with `.test.ts` or `.test.tsx` extension

## Code Quality

### Rule 13: Linting and Formatting
- Follow ESLint rules configured in the project
- Use TypeScript strictly with no `any` types unless absolutely necessary
- Run linter checks before committing code
- Maintain consistent code formatting with Prettier

### Rule 14: Documentation
- Add JSDoc comments for exported functions and components
- Keep README documentation up to date
- Document complex logic with inline comments

## Development Workflow

### Rule 15: Branching Strategy
- Create feature branches from `main`
- Use descriptive branch names prefixed with type: `feature/`, `bugfix/`, `chore/`
- Create pull requests for review before merging

## Performance Considerations

### Rule 16: Performance
- Lazy load components that are not needed for initial render
- Use proper memoization (useMemo, useCallback) for expensive operations
- Optimize images and assets
- Implement proper pagination for large data sets

## Linting and Code Quality Standards

### Rule 17: ESLint Configuration
Ensure the following ESLint rules are enforced:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "plugins": [
    "@typescript-eslint",
    "import"
  ],
  "rules": {
    // Error prevention
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-debugger": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": ["warn", { "allowExpressions": true }],
    "@typescript-eslint/no-non-null-assertion": "error",
    
    // Code style
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", ["parent", "sibling"], "index", "object", "type"],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-sort-props": ["warn", { "callbacksLast": true, "shorthandLast": true }],
    "react/self-closing-comp": "warn"
  }
}
```

### Rule 18: TypeScript Configuration
Enforce strict TypeScript checks in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Rule 19: Prettier Configuration
Use consistent code formatting with Prettier:

```json
{
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "singleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

## Deployment Standards

### Rule 20: Environment Variables
- Store all environment variables in `.env` files
- Use `.env.local` for local development
- Use `.env.production` for production settings
- Document required environment variables in README
- Never commit `.env` files containing secrets

### Rule 21: Pre-deployment Checklist
Before deployment, ensure:
1. All TypeScript errors are resolved
2. All ESLint warnings are addressed
3. Tests pass successfully
4. Build completes without errors
5. Environment variables are properly configured
6. Database migrations are prepared

### Rule 22: Docker Deployment
When deploying with Docker:
- Use multi-stage builds for smaller images
- Set NODE_ENV to production
- Use appropriate caching strategies
- Include health checks
- Set proper resource limits

## Security Standards

### Rule 23: Security Best Practices
- Sanitize all user inputs
- Implement proper CORS policies
- Use HTTPS for all connections
- Keep dependencies updated
- Implement rate limiting for API routes
- Use Content-Security-Policy headers
- Store secrets securely in environment variables

## Accessibility

### Rule 24: Accessibility Requirements
- Use semantic HTML elements
- Provide proper aria attributes
- Ensure sufficient color contrast
- Support keyboard navigation
- Add alt text to all images
- Test with screen readers
- Follow WCAG 2.1 AA guidelines

## Internationalization

### Rule 25: i18n Support
- Use Next.js i18n routing
- Extract all user-facing strings
- Store translations in separate files
- Support right-to-left languages when needed
- Handle date and number formatting based on locale