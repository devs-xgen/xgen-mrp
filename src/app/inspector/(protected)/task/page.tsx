// src/app/worker/(protected)/tasks/page.tsx
import { Metadata } from "next";
import { getProductionOrdersForInspector } from "@/lib/actions/inspectors"; // adjust the path!
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { Key } from "react";

export const metadata: Metadata = {
  title: "Worker Tasks",
  description: "Manage your assigned tasks",
};

export default async function TasksPage() {
  const productionOrders = await getProductionOrdersForInspector();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">
          View and manage your assigned tasks
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productionOrders.length === 0 ? (
              <p className="text-muted-foreground">No tasks assigned yet.</p>
            ) : (
              productionOrders.map((order: { dueDate: string | number | Date; id: Key | null | undefined; orderNumber: any; status: any; }) => {
                const dueDate = order.dueDate
                  ? new Date(order.dueDate).toLocaleDateString()
                  : "No due date";

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center space-x-4">
                      <ClipboardList className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">
                          {order.orderNumber ? `Order #${order.orderNumber}` : "Production Order"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {order.status || "Pending"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
