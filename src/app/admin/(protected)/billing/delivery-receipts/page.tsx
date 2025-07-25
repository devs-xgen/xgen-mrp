import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, Truck, Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Import server actions, types, and new components
import { getAllDeliveryReceipts, getDeliveryAnalytics } from "@/lib/actions/delivery-receipts";
import { DeliveryReceiptList } from "@/components/module/admin/billing/delivery-receipt-list";
import { DeliveryReceiptsExportButton } from "@/components/module/admin/billing/delivery-receipts-export-button";

export const metadata: Metadata = {
  title: "Delivery Receipts",
  description: "Track delivery confirmations and manage delivery receipts",
};

function DeliveryReceiptsTableSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="bg-card border rounded-lg">
        <CardContent className="p-6">
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
        </CardContent>
      </Card>
    </div>
  );
}

async function DeliveryReceiptsContent() {
  try {
    // Fetch delivery receipts and analytics in parallel - display billing statement relationship (Requirement 4.4)
    const [receiptsResult, analytics] = await Promise.all([
      getAllDeliveryReceipts({}, 1, 50), // Get first 50 receipts
      getDeliveryAnalytics()
    ]);

    const receipts = receiptsResult.data;

    // Calculate additional metrics from actual data
    const inTransitReceipts = receipts.filter(receipt => receipt.deliveryStatus === 'IN_TRANSIT').length;
    const withSignature = receipts.filter(receipt => receipt.signatureImage).length;
    const withPhoto = receipts.filter(receipt => receipt.photoEvidence).length;

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Total Receipts
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analytics.totalDeliveries}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inTransitReceipts} In Transit
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-green-50/90 border border-green-200/70 dark:bg-green-950/30 dark:border-green-800/50 p-6">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Delivered
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analytics.successfulDeliveries}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.successRate.toFixed(1)}% Success Rate
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-red-50/90 border border-red-200/70 dark:bg-red-950/30 dark:border-red-800/50 p-6">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Failed Deliveries
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analytics.failedDeliveries}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Need Attention
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-purple-50/90 border border-purple-200/70 dark:bg-purple-950/30 dark:border-purple-800/50 p-6">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  With Proof
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {withSignature}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {withPhoto} With Photos
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Delivery Receipts List with billing statement relationship display */}
        <DeliveryReceiptList receipts={receipts} />
      </>
    );
  } catch (error) {
    console.error('Error loading delivery receipts:', error);
    return (
      <Card className="bg-card border rounded-lg p-8">
        <CardContent className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load delivery receipts. Please try refreshing the page.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }
}

export default function DeliveryReceiptsPage() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Track delivery confirmations linked to billing statements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeliveryReceiptsExportButton />
          <Button size="sm" asChild>
            <Link href="/admin/billing/delivery-receipts/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Receipt
            </Link>
          </Button>
        </div>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<DeliveryReceiptsTableSkeleton />}>
        <DeliveryReceiptsContent />
      </Suspense>
    </div>
  );
}