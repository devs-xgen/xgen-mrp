import { Suspense } from "react";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
} from "@/components/shared/page-layout";
import { CustomerOrderV2Client } from "@/components/module/admin/customer-order-ver/CustomerOrderV2Client";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { getAllCustomers } from "@/lib/actions/customers";
import { getAllProducts } from "@/lib/actions/product";
import { Skeleton } from "@/components/ui/skeleton";

async function CustomerOrderV2PageContent() {
  // Fetch initial data for the page
  const [orders, customers, products] = await Promise.all([
    getCustomerOrders(),
    getAllCustomers(),
    getAllProducts(),
  ]);

  return (
    <CustomerOrderV2Client
      initialOrders={orders}
      customers={customers}
      products={products}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 p-4 border-b">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 p-4 border-b">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CustomerOrderV2Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customer Orders V2</PageTitle>
          <PageDescription>
            Enhanced customer order management with advanced features, real-time fulfillment tracking, and integrated production planning
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<LoadingSkeleton />}>
          <CustomerOrderV2PageContent />
        </Suspense>
      </PageBody>
    </PageContainer>
  );
}
