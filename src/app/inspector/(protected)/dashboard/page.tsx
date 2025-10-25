// src/app/inspector/(protected)/dashboard/page.tsx

import { getProductionOrders } from "@/lib/actions/production-order";
import { getInspectorTasks, getTaskStatistics } from "@/lib/actions/inspector/tasks";
import { getInspectorQualityChecks } from "@/lib/actions/inspector/production-order"; // 👈 Import the action
import { Suspense } from "react";
import { InspectorDashboardClient } from "@/components/module/inspectors/dashboard/InspectorDashboardClient";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Inspector Dashboard",
  description: "Overview of tasks, progress, and production orders for inspectors.",
};

export default async function InspectorDashboard() {
  // Use Promise.all to fetch all necessary data in parallel
  const [initialInspectorTasks, initialStats, fetchedProductionOrders, initialQualityChecks] = await Promise.all([
    getInspectorTasks(),
    getTaskStatistics(),
    getProductionOrders(),
    getInspectorQualityChecks(), // 👈 Fetch the quality checks
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
          <InspectorDashboardClient
            initialInspectorTasks={initialInspectorTasks}
            initialStats={initialStats}
            productionOrders={fetchedProductionOrders}
            initialQualityChecks={initialQualityChecks}
          />
      </Suspense>
    </div>
  );
}