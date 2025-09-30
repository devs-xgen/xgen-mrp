# Page Creation Guide

## Overview
This guide covers how to create new pages in the XGen MRP system, following Next.js 14 App Router conventions and our established patterns.

## Page Structure Pattern

### Server Component Page (Preferred)
```typescript
// src/app/admin/(protected)/customers/page.tsx
import { Metadata } from "next";
import { getAllCustomers } from "@/lib/actions/customers";
import { convertDecimals } from "@/lib/convertDecimals";
import { revalidatePath } from "next/cache";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { CreateCustomerDialog } from "@/components/module/admin/customers/create-customer-dialog";
import { CustomersDataTable } from "./customers-data-table";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customers and their information",
};

// Server action for inline refresh (optional)
async function refreshData() {
  "use server";
  revalidatePath("/admin/customers");
}

export default async function CustomersPage() {
  // Fetch data using server action
  const customersRaw = await getAllCustomers();
  
  // Convert Decimal fields for client compatibility
  const customers = convertDecimals(customersRaw);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customers</PageTitle>
          <PageDescription>
            Manage your customers and their information
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateCustomerDialog onSuccess={refreshData} />
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Customers">
        <CustomersDataTable data={customers} onRefresh={refreshData} />
      </SectionCard>
    </PageContainer>
  );
}
```

### Client Component Page (Only When Necessary)
```typescript
// src/app/admin/(protected)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getStats } from "@/lib/actions/dashboard";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
} from "@/components/shared/page-layout";
import { DashboardCharts } from "@/components/module/admin/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    async function loadStats() {
      const data = await getStats();
      setStats(data);
    }
    loadStats();
  }, []);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            Overview of your inventory management system
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        {stats ? <DashboardCharts data={stats} /> : <LoadingSkeleton />}
      </PageBody>
    </PageContainer>
  );
}
```

## Page Layout Components

### Standard Layout Hierarchy
```typescript
<PageContainer>           // Main container with padding
  <PageHeader>            // Header section
    <PageHeaderMain>      // Left side content
      <PageTitle>         // Main heading (h1/h2)
      <PageDescription>   // Subtitle/description
    </PageHeaderMain>
    <PageHeaderActions>   // Right side actions (buttons)
  </PageHeader>

  <PageBody>              // Main content area
    // Page content
  </PageBody>
  
  {/* OR */}
  
  <SectionCard heading="Section Title">
    // Card-based content
  </SectionCard>
</PageContainer>
```

### Layout Component Reference
Located in: `src/components/shared/page-layout.tsx`

- **PageContainer** - Main page wrapper with responsive padding
- **PageHeader** - Page header with title and actions
- **PageHeaderMain** - Left side of header (title area)
- **PageTitle** - Page title (h2 with specific styling)
- **PageDescription** - Subtitle/description text
- **PageHeaderActions** - Right side action buttons area
- **PageBody** - Main content container
- **SectionCard** - Card wrapper with optional heading

## Creating a New Page Checklist

### 1. Determine Page Location
```
For Admin Portal:
  src/app/admin/(protected)/[feature-name]/page.tsx

For Worker Portal:
  src/app/worker/(protected)/[feature-name]/page.tsx

For Inspector Portal:
  src/app/inspector/(protected)/[feature-name]/page.tsx

For Public Pages:
  src/app/[page-name]/page.tsx
```

### 2. Create Server Action (if new feature)
```typescript
// src/lib/actions/feature-name.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getFeatureData() {
  try {
    const data = await prisma.featureModel.findMany();
    return data;
  } catch (error) {
    console.error("[GET_FEATURE_DATA]", error);
    throw new Error("Failed to fetch feature data");
  }
}

export async function createFeatureItem(data: FeatureInput) {
  try {
    const item = await prisma.featureModel.create({ data });
    revalidatePath("/admin/feature-name");
    return item;
  } catch (error) {
    console.error("[CREATE_FEATURE_ITEM]", error);
    throw error;
  }
}
```

### 3. Create Page Component
```typescript
// src/app/admin/(protected)/feature-name/page.tsx
import { Metadata } from "next";
import { getFeatureData } from "@/lib/actions/feature-name";
import { PageContainer, PageHeader, PageHeaderMain, PageTitle, PageDescription } from "@/components/shared/page-layout";
import { FeatureTable } from "@/components/module/admin/feature-name/feature-table";

export const metadata: Metadata = {
  title: "Feature Name",
  description: "Manage your feature items",
};

export default async function FeaturePage() {
  const data = await getFeatureData();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Feature Name</PageTitle>
          <PageDescription>Manage your feature items</PageDescription>
        </PageHeaderMain>
      </PageHeader>
      <FeatureTable data={data} />
    </PageContainer>
  );
}
```

### 4. Create Module Components
```
src/components/module/admin/feature-name/
├── feature-table.tsx          # Main data table
├── create-feature-dialog.tsx  # Create dialog
├── edit-feature-dialog.tsx    # Edit dialog
└── feature-form.tsx           # Shared form component
```

### 5. Add Navigation Link
```typescript
// Update src/components/shared/AppSidebar.tsx
// Add menu item to appropriate portal section

{
  title: "Feature Name",
  url: "/admin/feature-name",
  icon: IconComponent,
}
```

## Page Types & Patterns

### 1. List/Index Page
**Purpose**: Display list of items with CRUD operations

**Example**: `/admin/customers`

```typescript
export default async function CustomersPage() {
  const customers = await getAllCustomers();
  
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customers</PageTitle>
          <PageDescription>Manage your customers</PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreateCustomerDialog />
        </PageHeaderActions>
      </PageHeader>
      <CustomersDataTable data={customers} />
    </PageContainer>
  );
}
```

### 2. Detail/View Page
**Purpose**: Display single item details

**Example**: `/admin/customers/[id]`

```typescript
export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerById(params.id);
  
  if (!customer) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>{customer.name}</PageTitle>
          <PageDescription>Customer Details</PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <EditCustomerDialog customer={customer} />
          <DeleteCustomerButton customerId={customer.id} />
        </PageHeaderActions>
      </PageHeader>
      <CustomerDetails customer={customer} />
    </PageContainer>
  );
}
```

### 3. Create Page
**Purpose**: Form to create new item

**Example**: `/admin/products/create`

```typescript
import { createProduct } from "@/lib/actions/product";
import { redirect } from "next/navigation";

async function handleCreate(formData: FormData) {
  "use server";
  const data = Object.fromEntries(formData);
  await createProduct(data);
  redirect("/admin/products");
}

export default function CreateProductPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Create Product</PageTitle>
          <PageDescription>Add a new product to inventory</PageDescription>
        </PageHeaderMain>
      </PageHeader>
      <ProductForm action={handleCreate} />
    </PageContainer>
  );
}
```

### 4. Dashboard Page
**Purpose**: Display metrics and charts

**Example**: `/admin/dashboard`

```typescript
export default async function DashboardPage() {
  const [stats, alerts, recentOrders] = await Promise.all([
    getStats(),
    getInventoryAlerts(),
    getRecentOrders(),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>Overview of your system</PageDescription>
        </PageHeaderMain>
      </PageHeader>
      <PageBody>
        <div className="space-y-6">
          <StatsCards data={stats} />
          <AlertsSection alerts={alerts} />
          <RecentOrdersTable orders={recentOrders} />
        </div>
      </PageBody>
    </PageContainer>
  );
}
```

### 5. Analytics Page
**Purpose**: Data visualization and reports

**Example**: `/admin/analytics/orders`

```typescript
"use client";

import { useState } from "react";
import { DateRangePicker } from "@/components/ui/date-time-picker";

export default function OrderAnalyticsPage() {
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Order Analytics</PageTitle>
          <PageDescription>Analyze order performance</PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </PageHeaderActions>
      </PageHeader>
      <AnalyticsCharts dateRange={dateRange} />
    </PageContainer>
  );
}
```

## Dynamic Routes

### Single Dynamic Segment
```typescript
// src/app/admin/(protected)/products/[id]/page.tsx

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductById(params.id);
  
  return (
    <PageContainer>
      <PageTitle>{product.name}</PageTitle>
      {/* ... */}
    </PageContainer>
  );
}
```

### Multiple Dynamic Segments
```typescript
// src/app/admin/(protected)/work-centers/[centerId]/operations/[operationId]/page.tsx

interface PageProps {
  params: { 
    centerId: string;
    operationId: string;
  };
}

export default async function OperationPage({ params }: PageProps) {
  const operation = await getOperation(params.centerId, params.operationId);
  // ...
}
```

### Catch-all Routes
```typescript
// src/app/docs/[...slug]/page.tsx

interface PageProps {
  params: { slug: string[] };
}

export default function DocsPage({ params }: PageProps) {
  const path = params.slug.join('/');
  // ...
}
```

## Metadata Configuration

### Static Metadata
```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customers and their information",
};
```

### Dynamic Metadata
```typescript
import { Metadata } from "next";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  
  return {
    title: product.name,
    description: product.description,
  };
}
```

### Metadata Template
Defined in root layout (`src/app/layout.tsx`):
```typescript
export const metadata: Metadata = {
  title: {
    default: "XGen MRP - Inventory Management System",
    template: "%s | XGen MRP",
  },
};
```

Page titles automatically use template:
- Page: "Customers"
- Browser: "Customers | XGen MRP"

## Loading & Error States

### Loading UI
```typescript
// src/app/admin/(protected)/products/loading.tsx
import { PageContainer } from "@/components/shared/page-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <Skeleton className="h-12 w-48 mb-4" />
      <Skeleton className="h-96 w-full" />
    </PageContainer>
  );
}
```

### Error UI
```typescript
// src/app/admin/(protected)/products/error.tsx
"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <h2>Something went wrong!</h2>
      <Button onClick={() => reset()}>Try again</Button>
    </PageContainer>
  );
}
```

### Not Found UI
```typescript
// src/app/admin/(protected)/products/[id]/not-found.tsx
import { PageContainer } from "@/components/shared/page-layout";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageContainer>
      <h2>Product Not Found</h2>
      <p>Could not find the requested product.</p>
      <Link href="/admin/products">Return to Products</Link>
    </PageContainer>
  );
}
```

## Data Fetching Patterns

### Sequential Fetching
```typescript
export default async function Page() {
  const customer = await getCustomer();
  const orders = await getCustomerOrders(customer.id); // Waits for customer
  
  return <CustomerView customer={customer} orders={orders} />;
}
```

### Parallel Fetching (Recommended)
```typescript
export default async function Page() {
  const [customer, orders, payments] = await Promise.all([
    getCustomer(),
    getOrders(),
    getPayments(),
  ]);
  
  return <CustomerView customer={customer} orders={orders} payments={payments} />;
}
```

### Streaming with Suspense
```typescript
import { Suspense } from "react";

export default async function Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
      </PageHeader>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardStats />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <RecentOrders />
      </Suspense>
    </PageContainer>
  );
}
```

## Revalidation & Caching

### On-Demand Revalidation
```typescript
import { revalidatePath } from "next/cache";

async function createCustomer(data: CustomerInput) {
  "use server";
  
  await prisma.customer.create({ data });
  
  // Revalidate the customers page
  revalidatePath("/admin/customers");
  
  // Revalidate specific customer page
  revalidatePath(`/admin/customers/${data.id}`);
}
```

### Force Dynamic Rendering
```typescript
// At top of page.tsx
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Always fresh data, no caching
}
```

### Time-based Revalidation
```typescript
export const revalidate = 3600; // Revalidate every hour

export default async function Page() {
  // Cached for 1 hour
}
```

## Common Patterns

### Search & Filter Page
```typescript
interface PageProps {
  searchParams: { 
    search?: string;
    status?: string;
    page?: string;
  };
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const customers = await getAllCustomers({
    search: searchParams.search,
    status: searchParams.status,
    page: parseInt(searchParams.page || "1"),
  });

  return (
    <PageContainer>
      <CustomersTable data={customers} />
    </PageContainer>
  );
}
```

### Tabbed Interface
```typescript
export default function ProductDetailsPage({ params }: PageProps) {
  return (
    <PageContainer>
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="bom">Bill of Materials</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <ProductDetails id={params.id} />
        </TabsContent>
        
        <TabsContent value="bom">
          <BillOfMaterials id={params.id} />
        </TabsContent>
        
        <TabsContent value="inventory">
          <InventoryLevels id={params.id} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
```

## Authentication & Authorization

Pages in `(protected)` route groups are automatically protected by layout:

```typescript
// src/app/admin/(protected)/layout.tsx
import UnifiedLayout from "@/components/shared/UnifiedLayout";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedLayout
      allowedRoles={["ADMIN", "DEVELOPER", "SUPER_ADMIN"]}
      fallbackRoute="/worker/dashboard"
      loginRoute="/admin/login"
    >
      {children}
    </UnifiedLayout>
  );
}
```

No additional auth checks needed in page components.

## Best Practices

✅ **Use Server Components by default**
✅ **Fetch data in page component, not in client components**
✅ **Use PageContainer and layout components for consistency**
✅ **Add proper metadata for SEO**
✅ **Handle loading and error states**
✅ **Use parallel data fetching when possible**
✅ **Revalidate paths after mutations**
✅ **Keep pages thin - move logic to server actions**
✅ **Use TypeScript for props and params**
✅ **Follow established naming conventions**

❌ **Don't use "use client" unless necessary**
❌ **Don't fetch data in client components**
❌ **Don't create inline styles**
❌ **Don't skip metadata**
❌ **Don't mix different layout patterns**
❌ **Don't put business logic in page components**
