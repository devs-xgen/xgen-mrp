# Guide to Building Data Table Features with Next.js, Prisma, and shadcn/ui

## Project Structure
```
src/
├── app/
│   └── admin/
│       └── (protected)/
│           └── [feature]/
│               └── page.tsx
├── components/
│   └── module/
│       └── admin/
│           └── [feature]/
│               ├── data-table.tsx
│               ├── columns.tsx
│               ├── data-table-toolbar.tsx
│               ├── data-table-column-header.tsx
│               ├── data-table-pagination.tsx
│               ├── data-table-row-actions.tsx
│               └── create-dialog.tsx
├── lib/
│   └── actions/
│       └── [feature].ts
└── types/
    └── admin/
        └── [feature].ts
```

## Development Steps

### 1. Define Types First
```typescript
// src/types/admin/[feature].ts
import { Status } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export interface MainType {
  id: string
  // ... other fields
  status: Status
  amount: Decimal
  // ... relationships
}

export interface CreateInput {
  // ... fields for creation
}

export interface UpdateInput {
  id: string
  // ... fields that can be updated
}
```

### 2. Create Server Actions
```typescript
// src/lib/actions/[feature].ts
'use server'

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { MainType, CreateInput, UpdateInput } from "@/types/admin/[feature]"

export async function getItems(): Promise<MainType[]> {
  try {
    return await prisma.table.findMany({
      include: {
        // ... relationships
      }
    })
  } catch (error) {
    throw new Error('Failed to fetch items')
  }
}

export async function createItem(data: CreateInput) {
  try {
    const result = await prisma.table.create({
      data: {
        // ... creation data
      },
      include: {
        // ... relationships
      }
    })
    revalidatePath('/admin/[feature]')
    return result
  } catch (error) {
    throw new Error('Failed to create item')
  }
}

// ... other CRUD operations
```

### 3. Create Table Components
```typescript
// columns.tsx
export const columns: ColumnDef<MainType>[] = [
  // ... column definitions
]

// data-table.tsx
export function DataTable({
  columns,
  data,
}: DataTableProps) {
  // ... table implementation
}

// data-table-row-actions.tsx
export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  // ... row actions implementation
}
```

### 4. Required UI Components
Make sure these components are set up:

```typescript
// src/components/ui/toast.tsx
// src/components/ui/toaster.tsx
// Add Toaster to root layout:
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### 5. Page Implementation
```typescript
// src/app/admin/(protected)/[feature]/page.tsx
export default async function FeaturePage() {
  const data = await getItems()
  
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feature Title</h2>
          <p className="text-muted-foreground">Description</p>
        </div>
        <CreateDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
          <CardDescription>Manage your items</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Required Packages
```bash
# Core packages
next
@prisma/client
@tanstack/react-table

# UI Components
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-icons
@radix-ui/react-slot
class-variance-authority
clsx
tailwind-merge
```

## Prompts for Building Features

1. "Create types for [feature] with these fields: [list fields] including Prisma Decimal handling"
2. "Create server actions for [feature] including getAll, create, update, and delete operations with proper error handling and revalidation"
3. "Create data table components for [feature] with sorting, filtering, and pagination"
4. "Create dialogs for [feature] CRUD operations using shadcn/ui components"
5. "Create the main page for [feature] with proper layout and data fetching"

## Key Points to Remember
- No need for API routes - use server actions
- Put use-toast in hooks directory
- Place table-related components in feature module directory
- Use proper type handling for Prisma Decimal fields
- Always revalidate paths after mutations
- Include proper error handling in server actions
- Use shadcn/ui components for consistent UI
- Remember to add toaster to root layout

## Common Patterns
- Use server actions for data operations
- Transform data at the server action level
- Handle Decimal types explicitly
- Maintain consistent component structure
- Follow shadcn/ui patterns for dialogs and forms
- Use Prisma includes for related data
- Keep types separate from components
- Implement proper client-side validation