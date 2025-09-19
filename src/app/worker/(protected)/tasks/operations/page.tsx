import { Metadata } from "next";
import { getMyTasks, getProductionOrderDetailsWithPhases } from "@/lib/actions/worker/tasks";
import { OperationTaskManager } from "@/components/module/worker/tasks/OperationTaskManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Package, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
} from "@/components/shared/page-layout";

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Task Operations | Worker Portal",
  description: "Manage your production order operations and tasks",
};

export default async function TaskOperationsPage() {
  try {
    // Get worker's tasks
    const tasks = await getMyTasks();
    
    // Group tasks by production order
    const productionOrderGroups = new Map();
    
    for (const task of tasks) {
      if (!task.productionOrderId) continue;
      
      if (!productionOrderGroups.has(task.productionOrderId)) {
        // Get detailed production order information
        try {
          const productionOrderDetails = await getProductionOrderDetailsWithPhases(task.productionOrderId);
          productionOrderGroups.set(task.productionOrderId, {
            ...productionOrderDetails,
            operations: productionOrderDetails.operations || []
          });
        } catch (error) {
          console.error(`Error fetching production order ${task.productionOrderId}:`, error);
          // Skip this production order if we can't fetch details
          continue;
        }
      }
    }

    const productionOrders = Array.from(productionOrderGroups.values());
    
    // Calculate statistics
    const stats = {
      totalOrders: productionOrders.length,
      totalOperations: productionOrders.reduce((sum, order) => sum + order.operations.length, 0),
      completedOperations: productionOrders.reduce((sum, order) => 
        sum + order.operations.filter(op => op.status === 'COMPLETED').length, 0
      ),
      inProgressOperations: productionOrders.reduce((sum, order) => 
        sum + order.operations.filter(op => op.status === 'IN_PROGRESS').length, 0
      ),
    };

    return (
      <PageContainer id="worker-task-operations">
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Task Operations</PageTitle>
            <PageDescription>
              Manage your production order operations and update task status
            </PageDescription>
          </PageHeaderMain>
          <PageHeaderActions>
            <Link href="/worker/tasks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Tasks
              </Button>
            </Link>
          </PageHeaderActions>
        </PageHeader>

        <PageBody className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Active orders assigned to you
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOperations}</div>
              <p className="text-xs text-muted-foreground">
                Operations across all orders
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressOperations}</div>
              <p className="text-xs text-muted-foreground">
                Currently working on
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOperations}</div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>
          </div>

          {/* Production Orders */}
          {productionOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Active Production Orders</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any active production orders assigned to you at the moment.
                </p>
                <div className="mt-4">
                  <Link href="/worker/tasks">
                    <Button variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Tasks
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {productionOrders.map((productionOrder, index) => (
                <div key={productionOrder.id} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <OperationTaskManager
                    productionOrder={productionOrder}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Help Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                How to Use Task Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ul className="space-y-2 text-sm">
                <li>• <strong>Click on any operation card</strong> to open the task management dialog</li>
                <li>• <strong>Update status</strong> by selecting a new status from the dropdown</li>
                <li>• <strong>Add notes</strong> to document your progress or any issues</li>
                <li>• <strong>Tablet-friendly design</strong> - optimized for touch interactions</li>
                <li>• <strong>Real-time updates</strong> - changes are immediately reflected in the system</li>
              </ul>
            </CardContent>
          </Card>
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error('Error loading task operations:', error);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/worker/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tasks
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Task Operations</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your task operations. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
} 