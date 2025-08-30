import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText, Truck } from "lucide-react";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Import the new delivery receipts components
import { getAllDeliveryReceipts } from "@/lib/actions/delivery-receipts";
import { DeliveryReceiptsDashboard } from "@/components/module/admin/billing/delivery-receipts/delivery-receipts-dashboard";
import { DeliveryReceiptWithBilling, DeliveryAnalytics, DeliveryStatus } from "@/types/admin/billing";

// Import page layout components
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { DeliveryReceiptsDataTable } from "./delivery-receipts-data-table";

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Delivery Receipts",
  description: "Manage delivery receipts and tracking information",
};

// Server actions for data revalidation
async function revalidateDeliveryReceipts() {
  "use server";
  revalidatePath("/admin/billing/delivery-receipts");
}

async function refreshData() {
  "use server";
  revalidatePath("/admin/billing/delivery-receipts", "page");
}

interface DeliveryReceiptsPageProps {
  searchParams?: Promise<{
    page?: string;
    per_page?: string;
    sort?: string;
    status?: string;
    search?: string;
    courier?: string;
  }>;
}

function DeliveryReceiptsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DeliveryReceiptsPage({
  searchParams,
}: DeliveryReceiptsPageProps) {
  // Await search parameters before accessing properties
  const resolvedSearchParams = await searchParams;
  
  // Parse search parameters
  const page = Number(resolvedSearchParams?.page) || 1;
  const perPage = Number(resolvedSearchParams?.per_page) || 10;
  const sort = resolvedSearchParams?.sort;
  const status = resolvedSearchParams?.status;
  const search = resolvedSearchParams?.search;
  const courier = resolvedSearchParams?.courier;

  // Build filters object
  const filters = {
    ...(status && { status: status.split(",") as DeliveryStatus[] }),
    ...(courier && { courierService: courier.split(",") }),
    ...(search && { search }),
    ...(sort && {
      sortBy: sort.split(".")[0] as any,
      sortOrder: sort.split(".")[1] as "asc" | "desc",
    }),
  };

  // Fetch delivery receipts data
  const deliveryReceiptsData = await getAllDeliveryReceipts(
    filters,
    page,
    perPage
  );

  const deliveryReceipts = deliveryReceiptsData?.data || [];

  // Create analytics for dashboard
  const analytics: DeliveryAnalytics = {
    totalDeliveries: deliveryReceipts.length,
    successfulDeliveries: deliveryReceipts.filter(r => r.deliveryStatus === 'DELIVERED').length,
    failedDeliveries: deliveryReceipts.filter(r => r.deliveryStatus === 'FAILED').length,
    successRate: deliveryReceipts.length > 0 
      ? (deliveryReceipts.filter(r => r.deliveryStatus === 'DELIVERED').length / deliveryReceipts.length) * 100 
      : 0,
    deliveryMethodBreakdown: [],
    courierPerformance: [],
    recentDeliveries: deliveryReceipts.slice(0, 5).map(receipt => ({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      deliveryDate: receipt.deliveryDate,
      status: receipt.deliveryStatus,
      customerName: receipt.billingStatement?.customerName || 'Unknown',
      deliveryMethod: receipt.courierService || 'Standard',
    })),
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Delivery Receipts</PageTitle>
          <PageDescription>
            Manage delivery receipts and tracking information
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/admin/billing">
              <FileText className="h-4 w-4 mr-2" />
              Back to Billing
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/billing/delivery-receipts/create">
              <Truck className="h-4 w-4 mr-2" />
              Create Receipt
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {/* Dashboard Analytics */}
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DeliveryReceiptsDashboard 
          receipts={deliveryReceipts} 
          analytics={analytics}
        />
      </Suspense>

      {/* Data Table */}
      <SectionCard heading="All Delivery Receipts">
        <Suspense fallback={<DeliveryReceiptsTableSkeleton />}>
          <DeliveryReceiptsDataTable 
            data={deliveryReceipts}
            onRefresh={refreshData}
          />
        </Suspense>
      </SectionCard>
    </PageContainer>
  );
}