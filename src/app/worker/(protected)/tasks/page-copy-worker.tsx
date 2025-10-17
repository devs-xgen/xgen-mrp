// import { Metadata } from "next";
// import { getMyTasks, getTaskStatistics, getProductionOrderDetailsWithPhases } from "@/lib/actions/worker/tasks";
// import { TasksList, TaskAnalyticsModal } from "@/components/module/worker/tasks";
// import { Suspense } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { AlertCircle, Settings } from "lucide-react";
// import Link from "next/link";
// import {
//   PageContainer,
//   PageHeader,
//   PageHeaderMain,
//   PageTitle,
//   PageDescription,
//   PageHeaderActions,
//   PageBody,
// } from "@/components/shared/page-layout";

// // Force dynamic rendering since this page uses authentication
// export const dynamic = 'force-dynamic'

// export const metadata: Metadata = {
//   title: "My Tasks",
//   description: "View and manage your assigned tasks",
// };

// export default async function TasksPage() {
//   const [tasks, stats] = await Promise.all([getMyTasks(), getTaskStatistics()]);

//   // Get unique production order IDs from tasks
//   const productionOrderIds = [...new Set(
//     tasks
//       .filter(task => task.productionOrderId)
//       .map(task => task.productionOrderId!)
//   )];

//   // Fetch workflow data for each production order
//   const workflowDataPromises = productionOrderIds.map(async (orderId) => {
//     try {
//       const orderDetails = await getProductionOrderDetailsWithPhases(orderId);
//       return {
//         productionOrderId: orderId,
//         workflowData: {
//           phaseStatus: orderDetails.phaseStatus,
//           workCenterStatus: orderDetails.workCenterStatus,
//           inspectionStatus: orderDetails.inspectionStatus,
//           currentPhase: orderDetails.currentPhase,
//           canStartInspection: orderDetails.canStartInspection,
//           canStartDelivery: orderDetails.canStartDelivery,
//         }
//       };
//     } catch (error) {
//       console.error(`Failed to fetch workflow data for order ${orderId}:`, error);
//       return {
//         productionOrderId: orderId,
//         workflowData: null
//       };
//     }
//   });

//   const workflowResults = await Promise.all(workflowDataPromises);
//   const workflowDataMap = new Map(
//     workflowResults.map(result => [result.productionOrderId, result.workflowData])
//   );

//   // Count inactive tasks
//   const inactiveTasks = tasks.filter(task => task.isActive === false);

//   return (
//     <PageContainer id="worker-tasks">
//       <PageHeader>
//         <PageHeaderMain>
//           <PageTitle>My Tasks</PageTitle>
//           <PageDescription>View and manage your assigned production tasks</PageDescription>
//         </PageHeaderMain>
//         <PageHeaderActions>
//           <div className="flex gap-2">
//             <Link href="/worker/tasks/operations">
//               <Button variant="outline" className="flex items-center gap-2">
//                 <Settings className="h-4 w-4" />
//                 Task Operations
//               </Button>
//             </Link>
//             <TaskAnalyticsModal tasks={tasks} stats={stats} />
//           </div>
//         </PageHeaderActions>
//       </PageHeader>

//       <PageBody className="space-y-6">
//         {/* Inactive Tasks Warning - Only show if there are inactive tasks */}
//         {inactiveTasks.length > 0 && (
//           <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
//             <CardContent className="pt-6 flex items-start gap-3">
//               <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
//               <div>
//                 <p className="font-medium text-amber-800 dark:text-amber-200">Some tasks are not active</p>
//                 <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
//                   {stats.inactiveTasks || inactiveTasks.length} task(s) are from production orders that have not been started by admin.
//                   These tasks will be available once the admin starts the production process.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Task List - Show immediately */}
//         <Suspense fallback={<div>Loading tasks...</div>}>
//           <TasksList tasks={tasks} workflowDataMap={workflowDataMap} />
//         </Suspense>
//       </PageBody>
//     </PageContainer>
//   );
// }
import { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Package } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
} from "@/components/shared/page-layout";
import { getWorkerProductionOrders, getWorkerProductionOrderStats } from "@/lib/actions/worker/task-worker";
import { ProductionOrdersList } from "@/components/module/worker/tasks/productionorderlist";

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "My Production Orders",
  description: "View production orders assigned to your work centers",
};

// Helper function to serialize data for client components
// This uses JSON stringify/parse to remove any non-serializable data
function serializeForClient(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Convert Decimal to number
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        return Number(value);
      }
      // Convert Date to ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      // Convert BigInt to string
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    })
  );
}

export default async function WorkerProductionOrdersPage() {
  try {
    // Fetch all production orders and stats
    const [orders, stats] = await Promise.all([
      getWorkerProductionOrders(),
      getWorkerProductionOrderStats(),
    ]);

    // Serialize orders to convert all Decimal fields to numbers
    const serializedOrders = serializeForClient(orders);

    // Count orders by status
    const activeOrders = serializedOrders.filter((order: any) => order.status === "ACTIVE");
    const pendingOrders = serializedOrders.filter((order: any) => order.status === "PENDING");
    const completedOrders = serializedOrders.filter((order: any) => order.status === "COMPLETED");

    return (
      <PageContainer id="worker-production-orders">
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>My Production Orders</PageTitle>
            <PageDescription>
              View all production orders with operations in your assigned work centers
            </PageDescription>
          </PageHeaderMain>
          <PageHeaderActions>
            <div className="flex gap-2">
              {/* Add any action buttons here if needed */}
            </div>
          </PageHeaderActions>
        </PageHeader>

        <PageBody className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Orders Warning - Only show if there are pending orders */}
          {pendingOrders.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Pending Production Orders
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    {pendingOrders.length} production order(s) are pending. These orders have 
                    not been started yet and will be available once activated.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Orders Message */}
          {serializedOrders.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No production orders found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You don't have any production orders assigned to your work centers yet.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Production Orders List */}
          {serializedOrders.length > 0 && (
            <Suspense fallback={<div>Loading production orders...</div>}>
              <ProductionOrdersList orders={serializedOrders} />
            </Suspense>
          )}
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Error loading production orders page:", error);
    
    return (
      <PageContainer id="worker-production-orders">
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>My Production Orders</PageTitle>
            <PageDescription>
              View production orders assigned to your work centers
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>

        <PageBody className="space-y-6">
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Failed to load production orders
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  There was an error loading your production orders. Please try refreshing the page.
                </p>
              </div>
            </CardContent>
          </Card>
        </PageBody>
      </PageContainer>
    );
  }
}