# Component Creation Guide

## Component Types & Classification

### 1. UI Components (`src/components/ui/`)
**Source**: shadcn/ui library
**DO NOT create manually** - Use CLI to add components

```bash
npx shadcn-ui add button
npx shadcn-ui add dialog
npx shadcn-ui add table
```

**Available Components**:
- Forms: button, input, select, checkbox, radio-group, textarea, form
- Overlays: dialog, sheet, popover, dropdown-menu, alert-dialog
- Data: table, card, badge, avatar
- Feedback: alert, toast, progress, skeleton
- Layout: separator, tabs, collapsible, scroll-area
- Navigation: sidebar

**When to modify**:
- ✅ Extend with variants (e.g., AnalyticsCard extends Card)
- ❌ Never modify the base component files directly

### 2. Shared Components (`src/components/shared/`)
**Purpose**: Reusable across multiple portals
**Examples**: Page layouts, common dialogs, shared tables

```typescript
// src/components/shared/page-layout.tsx
export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col w-full space-y-6 p-4 md:p-8 pt-6">{children}</div>;
}

export function PageHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between space-y-2">{children}</div>;
}
```

**When to create**:
- Used by 2+ portals
- Generic functionality (not business-specific)
- Layout components
- Common UI patterns

### 3. Global Components (`src/components/global/`)
**Purpose**: App-wide functionality
**Examples**: Auth guards, error boundaries, notifications

```typescript
// src/components/global/require-auth.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export function RequireAuth({ children, roles }: { children: React.ReactNode; roles: Role[] }) {
  const { data: session } = useSession();
  
  if (!session || !roles.includes(session.user.role)) {
    redirect("/login");
  }
  
  return <>{children}</>;
}
```

**When to create**:
- Authentication/authorization
- Error handling
- Notifications
- Service workers
- Maintenance mode
- Global state management

### 4. Module Components (`src/components/module/[portal]/`)
**Purpose**: Feature-specific components for each portal
**Most components go here**

```
module/
├── admin/
│   ├── customers/
│   │   ├── create-customer-dialog.tsx
│   │   ├── edit-customer-dialog.tsx
│   │   ├── customer-form.tsx
│   │   └── customer-table.tsx
│   ├── products/
│   │   ├── bom/
│   │   │   ├── AddMaterialDialog.tsx
│   │   │   └── EditMaterialDialog.tsx
│   │   ├── create-product-dialog.tsx
│   │   └── product-details.tsx
│   └── dashboard/
│       ├── workflow-connections.tsx
│       └── stats-card.tsx
├── worker/
├── inspector/
└── delivery/
```

## Component Patterns

### Server Component (Default)
```typescript
// src/components/module/admin/customers/customer-details.tsx
import { getCustomerById } from "@/lib/actions/customers";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CustomerDetailsProps {
  customerId: string;
}

export async function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const customer = await getCustomerById(customerId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{customer.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div>
            <dt className="font-medium">Email</dt>
            <dd className="text-muted-foreground">{customer.email}</dd>
          </div>
          <div>
            <dt className="font-medium">Phone</dt>
            <dd className="text-muted-foreground">{customer.phone}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
```

### Client Component (Interactive)
```typescript
// src/components/module/admin/customers/create-customer-dialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCustomer } from "@/lib/actions/customers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CreateCustomerDialogProps {
  onSuccess?: () => void;
}

export function CreateCustomerDialog({ onSuccess }: CreateCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  async function onSubmit(data: CustomerFormData) {
    setIsLoading(true);
    try {
      await createCustomer(data);
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Customer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Data Table Component
```typescript
// src/components/module/admin/customers/customer-table.tsx
"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { DeleteCustomerButton } from "./delete-customer-button";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface CustomersTableProps {
  data: Customer[];
  onRefresh?: () => void;
}

export function CustomersTable({ data, onRefresh }: CustomersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-1 rounded text-xs",
          row.original.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        )}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <EditCustomerDialog customer={row.original} onSuccess={onRefresh} />
          <DeleteCustomerButton customerId={row.original.id} onSuccess={onRefresh} />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter customers..."
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

## Component Organization Patterns

### Feature-Based Organization
```
module/admin/customers/
├── create-customer-dialog.tsx    # Create dialog
├── edit-customer-dialog.tsx      # Edit dialog
├── delete-customer-button.tsx    # Delete button
├── customer-form.tsx              # Shared form
├── customer-table.tsx             # Data table
├── customer-details.tsx           # Detail view
└── index.ts                       # Exports (optional)
```

### Complex Feature with Subfolders
```
module/admin/billing/
├── billing-statements/
│   ├── create-billing-statement-dialog.tsx
│   ├── billing-statement-table.tsx
│   └── columns.tsx
├── delivery-receipts/
│   ├── create-delivery-receipt-dialog.tsx
│   └── delivery-receipt-table.tsx
├── sales-invoices/
│   ├── create-sales-invoice-dialog.tsx
│   └── sales-invoice-table.tsx
├── dashboard/
│   └── billing-dashboard.tsx
└── form-sections/
    ├── customer-section.tsx
    ├── items-section.tsx
    └── summary-section.tsx
```

## Common Component Types

### 1. Dialog Components
**Pattern**: Modal overlays for forms

```typescript
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreateDialogProps {
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

export function CreateDialog({ onSuccess, triggerButton }: CreateDialogProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || <Button>Create</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Item</DialogTitle>
        </DialogHeader>
        {/* Form content */}
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Form Components
**Pattern**: Shared forms used by create/edit dialogs

```typescript
"use client";

import { UseFormReturn } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface CustomerFormProps {
  form: UseFormReturn<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  isLoading?: boolean;
}

export function CustomerForm({ form, onSubmit, isLoading }: CustomerFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields */}
        
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 3. Card Components
**Pattern**: Display grouped information

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.value > 0 ? "text-green-600" : "text-red-600"}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
            {" "}{trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4. List/Grid Components
**Pattern**: Display collections of items

```typescript
interface ItemListProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
}

export function ItemList({ items, onItemClick }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onItemClick?.(item)}
        >
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
```

### 5. Loading Components
**Pattern**: Skeletons and loading states

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Props Interface
Always define explicit prop interfaces:

```typescript
interface ComponentProps {
  data: DataType;
  onAction?: () => void;
  className?: string;
}

export function Component({ data, onAction, className }: ComponentProps) {
  // ...
}
```

### 2. Default Props
Use default parameters:

```typescript
export function Component({ 
  variant = "default",
  size = "md",
  disabled = false 
}: ComponentProps) {
  // ...
}
```

### 3. Conditional Rendering
Use early returns for clarity:

```typescript
export function Component({ data }: ComponentProps) {
  if (!data) {
    return <div>No data available</div>;
  }
  
  if (data.length === 0) {
    return <EmptyState />;
  }
  
  return <DataView data={data} />;
}
```

### 4. Event Handlers
Name handlers with `handle` prefix:

```typescript
function handleSubmit(data: FormData) {
  // ...
}

function handleCancel() {
  // ...
}

function handleDelete(id: string) {
  // ...
}
```

### 5. Loading States
Always handle loading:

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(data: FormData) {
  setIsLoading(true);
  try {
    await action(data);
  } finally {
    setIsLoading(false);
  }
}

return <Button disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>;
```

### 6. Error Handling
Always handle errors with user feedback:

```typescript
const { toast } = useToast();

try {
  await action(data);
  toast({ title: "Success", description: "Operation completed" });
} catch (error) {
  toast({ 
    title: "Error", 
    description: error.message || "Operation failed",
    variant: "destructive" 
  });
}
```

### 7. Cleanup
Clean up effects:

```typescript
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 8. Memoization
Use React.memo for expensive components:

```typescript
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Expensive rendering logic
});
```

Use useMemo for expensive calculations:

```typescript
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);
```

## Styling Guidelines

### 1. Use Tailwind Classes
```typescript
<div className="flex items-center justify-between p-4 rounded-lg border bg-card">
  {/* content */}
</div>
```

### 2. Use cn() for Conditional Styles
```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  {/* content */}
</div>
```

### 3. Component Variants
Use class-variance-authority (cva):

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## Testing Components

### Unit Test Example
```typescript
// __tests__/components/customer-form.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerForm } from "../customer-form";

describe("CustomerForm", () => {
  it("renders all fields", () => {
    render(<CustomerForm />);
    
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
  });
  
  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<CustomerForm />);
    
    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);
    
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });
});
```

## Component Checklist

When creating a new component:

✅ Place in correct directory (ui/shared/global/module)
✅ Use TypeScript with explicit prop types
✅ Add proper exports
✅ Handle loading states
✅ Handle error states
✅ Add accessibility attributes (aria-label, etc.)
✅ Use semantic HTML
✅ Follow naming conventions
✅ Add JSDoc comments for complex logic
✅ Clean up side effects
✅ Optimize performance (memo, useMemo, useCallback)
✅ Test component functionality
✅ Ensure responsive design
✅ Use consistent styling (Tailwind)

## Common Mistakes to Avoid

❌ **Fetching data in client components** - Use server components or server actions
❌ **Not handling loading/error states** - Always provide feedback
❌ **Deeply nested components** - Keep hierarchy flat
❌ **Inline styles** - Use Tailwind classes
❌ **Missing TypeScript types** - Always type props
❌ **Not cleaning up effects** - Return cleanup functions
❌ **Mutating props** - Props are read-only
❌ **Not using keys in lists** - Always provide unique keys
❌ **Overusing client components** - Default to server components
❌ **Mixing concerns** - Separate presentation from logic
