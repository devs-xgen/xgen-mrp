import { Metadata } from "next";
import { Suspense } from "react";
import { getInventoryIssueReports } from "@/lib/actions/worker/inventory";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { InventoryAlertsList } from "@/components/module/worker/inventory/InventoryAlertsList";

export const metadata: Metadata = {
  title: "Inventory Alerts",
  description: "View inventory alerts and issue reports (Read-only)",
};

export default async function InventoryAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}) {
  const { page: pageParam, status } = await searchParams;
  // Parse params
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const statusFilter = status ? [status] : undefined;

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
            View inventory issue reports and alerts (Read-only access)
          </p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/worker/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Information</h3>
            <p className="text-sm text-blue-700">
              You have read-only access to inventory alerts. If you need to report an issue, please contact your supervisor.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div>Loading alerts...</div>}>
        <InventoryAlertsList
          issues={alertsData.issues}
          pagination={alertsData.pagination}
          viewOnly={true}
        />
      </Suspense>
    </div>
  );
}
