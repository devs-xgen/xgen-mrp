import { Metadata } from "next";
import { Suspense } from "react";
import { getInventoryIssueReports } from "@/lib/actions/inspector/inventory";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InventoryAlertsList } from "@/components/module/inspectors/inventory/InventoryAlertsList";

export const metadata: Metadata = {
  title: "Inventory Alerts",
  description: "View and manage inventory alerts and issue reports",
};

export default async function InventoryAlertsPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    page?: string;
  };
}) {
  // Parse params
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const statusFilter = searchParams.status ? [searchParams.status] : undefined;

  // Get alerts data
  const alertsData = await getInventoryIssueReports(statusFilter, page, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Inventory Alerts
          </h2>
          <p className="text-muted-foreground">
            View and manage inventory issue reports and alerts
          </p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/inspector/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading alerts...</div>}>
        <InventoryAlertsList
          issues={alertsData.issues}
          pagination={alertsData.pagination}
        />
      </Suspense>
    </div>
  );
}
