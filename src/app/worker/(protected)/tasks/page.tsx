import { Metadata } from "next";
import { getMyTasks, getTaskStatistics, getProductionOrderDetailsWithPhases } from "@/lib/actions/worker/tasks";
import { TasksList, TaskAnalyticsModal } from "@/components/module/worker/tasks";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Status } from "@prisma/client";

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "My Tasks",
  description: "View and manage your assigned tasks",
};

export default async function TasksPage() {
  const [tasks, stats] = await Promise.all([getMyTasks(), getTaskStatistics()]);

  // Get unique production order IDs from tasks
  const productionOrderIds = [...new Set(
    tasks
      .filter(task => task.productionOrderId)
      .map(task => task.productionOrderId!)
  )];

  // Fetch workflow data for each production order
  const workflowDataPromises = productionOrderIds.map(async (orderId) => {
    try {
      const orderDetails = await getProductionOrderDetailsWithPhases(orderId);
      return {
        productionOrderId: orderId,
        workflowData: {
          phaseStatus: orderDetails.phaseStatus,
          workCenterStatus: orderDetails.workCenterStatus,
          inspectionStatus: orderDetails.inspectionStatus,
          currentPhase: orderDetails.currentPhase,
          canStartInspection: orderDetails.canStartInspection,
          canStartDelivery: orderDetails.canStartDelivery,
        }
      };
    } catch (error) {
      console.error(`Failed to fetch workflow data for order ${orderId}:`, error);
      return {
        productionOrderId: orderId,
        workflowData: null
      };
    }
  });

  const workflowResults = await Promise.all(workflowDataPromises);
  const workflowDataMap = new Map(
    workflowResults.map(result => [result.productionOrderId, result.workflowData])
  );

  // Count inactive tasks
  const inactiveTasks = tasks.filter(task => task.isActive === false);

  return (
    <div className="space-y-6">
      {/* Header with Analytics Button */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Tasks</h2>
          <p className="text-muted-foreground">
            View and manage your assigned production tasks
          </p>
        </div>
        <TaskAnalyticsModal tasks={tasks} stats={stats} />
      </div>

      {/* Inactive Tasks Warning - Only show if there are inactive tasks */}
      {inactiveTasks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Some tasks are not active</p>
              <p className="text-sm text-amber-700 mt-1">
                {stats.inactiveTasks || inactiveTasks.length} task(s) are from production orders that have not been started by admin.
                These tasks will be available once the admin starts the production process.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List - Show immediately */}
      <Suspense fallback={<div>Loading tasks...</div>}>
        <TasksList tasks={tasks} workflowDataMap={workflowDataMap} />
      </Suspense>
    </div>
  );
}
