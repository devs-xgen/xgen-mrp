// src/app/inspector/(protected)/tasks/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adjust the path if needed
import { getProductionOrders } from "@/lib/actions/production-order"; // assume this fetches all production orders

export const metadata: Metadata = {
  title: "Inspector Tasks",
  description: "Tasks assigned to the inspector",
};

export default async function InspectorTasksPage() {
  const session = await getServerSession(authOptions);
  
  // Optional: Handle if not signed in
  if (!session || !session.user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">You must be signed in to view tasks.</p>
        </div>
      </div>
    );
  }

  const allProductionOrders = await getProductionOrders();

  // Filter production orders that DO NOT belong to the inspector
  // const inspectorId = session.user.id; // assuming session.user.id is the inspector's user id
  // const productionOrders = allProductionOrders.filter(order => order.inspectorId !== inspectorId);
  const productionOrders = allProductionOrders;

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
              productionOrders.map((order) => {
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
                          {order.customerOrder?.orderNumber ? `Order #${order.customerOrder.orderNumber}` : "Production Order"}
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
