import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { getAllDeliveryReceipts } from "@/lib/actions/delivery-receipts";
import { DeliveryReceiptsDashboard } from "./delivery-receipts-dashboard";
import { DataTable } from "./data-table";
import { DeliveryReceiptWithBilling, DeliveryAnalytics, DeliveryStatus } from "@/types/admin/billing";

// Server actions for data revalidation
async function revalidateDeliveryReceipts() {
  "use server";
  revalidatePath("/admin/billing/delivery-receipts");
}

async function refreshDeliveryReceipts() {
  "use server";
  revalidatePath("/admin/billing/delivery-receipts", "page");
}

interface DeliveryReceiptsPageProps {
  searchParams?: {
    page?: string;
    per_page?: string;
    sort?: string;
    status?: string;
    search?: string;
    courier?: string;
  };
}

export default async function DeliveryReceiptsPage({
  searchParams,
}: DeliveryReceiptsPageProps) {
  // Parse search parameters
  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 10;
  const sort = searchParams?.sort;
  const status = searchParams?.status;
  const search = searchParams?.search;
  const courier = searchParams?.courier;

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
  const pagination = deliveryReceiptsData?.pagination || {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  };

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
    <div className="space-y-6">
      {/* Dashboard Analytics */}
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DeliveryReceiptsDashboard 
          receipts={deliveryReceipts} 
          analytics={analytics}
        />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<div>Loading delivery receipts...</div>}>
        <DataTable data={deliveryReceipts} />
      </Suspense>
    </div>
  );
}