# Server Actions Guide

## Overview
Server Actions are the **PRIMARY** method for data operations in XGen MRP. They replace traditional API routes and provide a seamless server-client integration.

## Why Server Actions?

### Benefits Over API Routes
✅ **Type Safety** - Direct TypeScript integration
✅ **No API Layer** - Call functions directly from components
✅ **Automatic Serialization** - Next.js handles data serialization
✅ **Built-in Caching** - Next.js cache integration
✅ **Progressive Enhancement** - Works without JavaScript
✅ **Reduced Bundle Size** - Server code stays on server
✅ **Better DX** - No need to define endpoints

### When to Use Server Actions
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Data fetching for pages
- ✅ Form submissions
- ✅ Database queries
- ✅ File operations
- ✅ External API calls (server-side)

### When to Use API Routes
- ❌ New features (use Server Actions instead)
- ✅ Webhooks from external services
- ✅ Public endpoints without authentication
- ✅ Third-party integrations requiring specific endpoints

## Server Action Structure

### File Location
```
src/lib/actions/
├── customers.ts           # Customer operations
├── products.ts            # Product operations
├── materials.ts           # Material operations
├── dashboard.ts           # Dashboard data
├── production-order.ts    # Production orders
└── [entity-name].ts       # Entity-specific actions
```

### Basic Template
```typescript
// src/lib/actions/customers.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Type definitions
export interface CustomerFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address?: string;
  creditLimit?: number;
}

// READ - Get all customers
export async function getAllCustomers(filters?: CustomerFilters) {
  try {
    const { search, status = "ACTIVE", limit = 100, offset = 0 } = filters || {};

    const where: any = { status };

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return customers;
  } catch (error) {
    console.error("[GET_ALL_CUSTOMERS]", error);
    throw new Error("Failed to fetch customers");
  }
}

// READ - Get single customer
export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  } catch (error) {
    console.error("[GET_CUSTOMER_BY_ID]", error);
    throw error;
  }
}

// CREATE - Create customer
export async function createCustomer(data: CustomerInput) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Unauthorized");
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...data,
        createdBy: session.user.id,
        status: "ACTIVE",
      },
    });

    // Revalidate the customers page
    revalidatePath("/admin/customers");

    return customer;
  } catch (error) {
    console.error("[CREATE_CUSTOMER]", error);
    
    // Handle Prisma errors
    if (error.code === "P2002") {
      throw new Error("A customer with this information already exists");
    }
    
    throw error;
  }
}

// UPDATE - Update customer
export async function updateCustomer(id: string, data: Partial<CustomerInput>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        modifiedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${id}`);

    return customer;
  } catch (error) {
    console.error("[UPDATE_CUSTOMER]", error);
    throw error;
  }
}

// DELETE - Delete customer (soft delete)
export async function deleteCustomer(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Unauthorized");
    }

    // Soft delete by setting status to INACTIVE
    await prisma.customer.update({
      where: { id },
      data: {
        status: "INACTIVE",
        modifiedBy: session.user.id,
      },
    });

    revalidatePath("/admin/customers");

    return { success: true };
  } catch (error) {
    console.error("[DELETE_CUSTOMER]", error);
    throw error;
  }
}

// Helper function (not exported)
function buildWhereClause(filters: CustomerFilters) {
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  
  return where;
}
```

## Calling Server Actions

### From Server Components (Pages)
```typescript
// src/app/admin/(protected)/customers/page.tsx
import { getAllCustomers } from "@/lib/actions/customers";
import { CustomersTable } from "./customers-table";

export default async function CustomersPage() {
  // Direct call - runs on server
  const customers = await getAllCustomers();

  return <CustomersTable data={customers} />;
}
```

### From Client Components
```typescript
// src/components/module/admin/customers/create-customer-dialog.tsx
"use client";

import { useState } from "react";
import { createCustomer } from "@/lib/actions/customers";
import { useToast } from "@/components/ui/use-toast";

export function CreateCustomerDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(data: CustomerInput) {
    setIsLoading(true);
    try {
      // Call server action from client
      await createCustomer(data);
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    // Form UI
  );
}
```

### From Forms (Progressive Enhancement)
```typescript
// src/app/admin/(protected)/customers/create/page.tsx
import { createCustomer } from "@/lib/actions/customers";
import { redirect } from "next/navigation";

async function createAction(formData: FormData) {
  "use server";
  
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
  };

  await createCustomer(data);
  redirect("/admin/customers");
}

export default function CreateCustomerPage() {
  return (
    <form action={createAction}>
      <input name="name" required />
      <input name="email" type="email" required />
      <input name="phone" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Advanced Patterns

### 1. Transactions
```typescript
export async function createOrderWithItems(orderData: OrderInput, items: OrderItemInput[]) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.customerOrder.create({
        data: orderData,
      });

      // Create order items
      await tx.orderItem.createMany({
        data: items.map(item => ({
          ...item,
          orderId: order.id,
        })),
      });

      // Update inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockLevel: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });
  } catch (error) {
    console.error("[CREATE_ORDER_WITH_ITEMS]", error);
    throw error;
  }
}
```

### 2. Batch Operations
```typescript
export async function bulkUpdateProductPrices(updates: { id: string; price: number }[]) {
  try {
    const results = await Promise.all(
      updates.map(({ id, price }) =>
        prisma.product.update({
          where: { id },
          data: { unitPrice: price },
        })
      )
    );

    revalidatePath("/admin/products");
    return results;
  } catch (error) {
    console.error("[BULK_UPDATE_PRICES]", error);
    throw error;
  }
}
```

### 3. Pagination
```typescript
export async function getCustomersPaginated(page: number = 1, pageSize: number = 20) {
  try {
    const skip = (page - 1) * pageSize;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        take: pageSize,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count(),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("[GET_CUSTOMERS_PAGINATED]", error);
    throw error;
  }
}
```

### 4. Search with Filtering
```typescript
export async function searchProducts(query: string, filters: ProductFilters) {
  try {
    const where: any = {
      status: "ACTIVE",
    };

    // Search query
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      where.unitPrice = {};
      if (filters.minPrice) where.unitPrice.gte = filters.minPrice;
      if (filters.maxPrice) where.unitPrice.lte = filters.maxPrice;
    }

    // Stock level filter
    if (filters.inStock !== undefined) {
      where.stockLevel = filters.inStock ? { gt: 0 } : { lte: 0 };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return products;
  } catch (error) {
    console.error("[SEARCH_PRODUCTS]", error);
    throw error;
  }
}
```

### 5. Aggregations
```typescript
export async function getDashboardStats() {
  try {
    const [
      totalCustomers,
      activeOrders,
      totalRevenue,
      lowStockProducts,
    ] = await Promise.all([
      // Total customers
      prisma.customer.count({
        where: { status: "ACTIVE" },
      }),

      // Active orders
      prisma.customerOrder.count({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),

      // Total revenue this month
      prisma.salesInvoice.aggregate({
        where: {
          status: "PAID",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Low stock products
      prisma.product.count({
        where: {
          stockLevel: { lte: 10 },
          status: "ACTIVE",
        },
      }),
    ]);

    return {
      totalCustomers,
      activeOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      lowStockProducts,
    };
  } catch (error) {
    console.error("[GET_DASHBOARD_STATS]", error);
    throw error;
  }
}
```

## Data Serialization

### Handling Decimal Fields
Prisma's Decimal type needs conversion for client components:

```typescript
import { convertDecimals } from "@/lib/convertDecimals";

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  // If passing to client component, convert Decimals
  return convertDecimals(product);
}
```

### Handling Dates
```typescript
import { serializeDates } from "@/lib/serialization-helpers";

export async function getOrders() {
  const orders = await prisma.order.findMany();
  
  // Convert dates to ISO strings for client
  return orders.map(order => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));
}
```

## Caching & Revalidation

### Cache Revalidation
```typescript
import { revalidatePath, revalidateTag } from "next/cache";

export async function updateProduct(id: string, data: ProductInput) {
  const product = await prisma.product.update({
    where: { id },
    data,
  });

  // Revalidate specific paths
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  
  // Also revalidate related pages
  revalidatePath("/admin/dashboard");

  return product;
}
```

### Using Tags
```typescript
// Mark data with tags during fetch
export async function getProducts() {
  return await prisma.product.findMany({
    // Next.js will cache this
  });
}

// Revalidate by tag
import { revalidateTag } from "next/cache";

export async function createProduct(data: ProductInput) {
  const product = await prisma.product.create({ data });
  
  revalidateTag("products");
  
  return product;
}
```

### Opt Out of Caching
```typescript
import { unstable_noStore as noStore } from "next/cache";

export async function getRealTimeData() {
  noStore(); // Disable caching for this function
  
  return await prisma.liveData.findMany();
}
```

## Error Handling

### Standard Error Pattern
```typescript
export async function createCustomer(data: CustomerInput) {
  try {
    const customer = await prisma.customer.create({ data });
    return customer;
  } catch (error) {
    console.error("[CREATE_CUSTOMER]", error);
    
    // Prisma unique constraint violation
    if (error.code === "P2002") {
      throw new Error("Customer with this email already exists");
    }
    
    // Prisma foreign key violation
    if (error.code === "P2003") {
      throw new Error("Invalid reference to related record");
    }
    
    // Generic error
    throw new Error("Failed to create customer");
  }
}
```

### Validation Errors
```typescript
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
});

export async function createCustomer(data: unknown) {
  try {
    // Validate input
    const validated = customerSchema.parse(data);
    
    const customer = await prisma.customer.create({
      data: validated,
    });
    
    return customer;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors[0].message}`);
    }
    
    throw error;
  }
}
```

### Custom Error Types
```typescript
class CustomerNotFoundError extends Error {
  constructor(id: string) {
    super(`Customer with id ${id} not found`);
    this.name = "CustomerNotFoundError";
  }
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  
  if (!customer) {
    throw new CustomerNotFoundError(id);
  }
  
  return customer;
}
```

## Authentication & Authorization

### Session Check
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createOrder(data: OrderInput) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Unauthorized - Please login");
  }

  // Use session data
  const order = await prisma.order.create({
    data: {
      ...data,
      createdBy: session.user.id,
    },
  });

  return order;
}
```

### Role-Based Access
```typescript
export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Only ADMIN and SUPER_ADMIN can delete
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("Forbidden - Insufficient permissions");
  }

  await prisma.product.delete({ where: { id } });
  
  revalidatePath("/admin/products");
  
  return { success: true };
}
```

## Testing Server Actions

### Unit Test Example
```typescript
// __tests__/lib/actions/customers.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCustomer } from "@/lib/actions/customers";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    customer: {
      create: vi.fn(),
    },
  },
}));

describe("createCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a customer", async () => {
    const mockCustomer = {
      id: "1",
      name: "Test Customer",
      email: "test@example.com",
      phone: "1234567890",
    };

    vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer);

    const result = await createCustomer({
      name: "Test Customer",
      email: "test@example.com",
      phone: "1234567890",
    });

    expect(result).toEqual(mockCustomer);
    expect(prisma.customer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Test Customer",
        email: "test@example.com",
      }),
    });
  });

  it("should throw error on duplicate email", async () => {
    vi.mocked(prisma.customer.create).mockRejectedValue({
      code: "P2002",
    });

    await expect(
      createCustomer({
        name: "Test",
        email: "duplicate@example.com",
        phone: "1234567890",
      })
    ).rejects.toThrow("Customer with this email already exists");
  });
});
```

## Best Practices

### ✅ Do's
- Always add `"use server"` directive at the top
- Use try-catch for error handling
- Validate inputs with Zod
- Check authentication/authorization
- Revalidate paths after mutations
- Use transactions for multi-step operations
- Log errors with context
- Return serializable data only
- Use TypeScript for type safety
- Keep actions focused (single responsibility)

### ❌ Don'ts
- Don't return non-serializable data (functions, classes, Symbols)
- Don't expose sensitive information in errors
- Don't skip authentication checks
- Don't forget to revalidate cache
- Don't use client-side only APIs
- Don't make actions too complex (split if needed)
- Don't forget error handling
- Don't hardcode values (use env vars)
- Don't skip input validation
- Don't use server actions for real-time features

## Common Prisma Errors

```typescript
// P2002: Unique constraint failed
if (error.code === "P2002") {
  throw new Error("Record already exists");
}

// P2003: Foreign key constraint failed
if (error.code === "P2003") {
  throw new Error("Related record not found");
}

// P2025: Record not found
if (error.code === "P2025") {
  throw new Error("Record not found");
}

// P2000: Value too long
if (error.code === "P2000") {
  throw new Error("Input value too long");
}

// P2001: Record does not exist
if (error.code === "P2001") {
  throw new Error("Record does not exist");
}
```

## Migration from API Routes

### Before (API Route)
```typescript
// src/app/api/customers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const customer = await prisma.customer.create({ data: body });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### After (Server Action)
```typescript
// src/lib/actions/customers.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCustomer(data: CustomerInput) {
  try {
    const customer = await prisma.customer.create({ data });
    revalidatePath("/admin/customers");
    return customer;
  } catch (error) {
    console.error("[CREATE_CUSTOMER]", error);
    throw error;
  }
}
```

### Usage Comparison
```typescript
// Before (API Route)
const response = await fetch("/api/customers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
const customer = await response.json();

// After (Server Action)
const customer = await createCustomer(data);
```
