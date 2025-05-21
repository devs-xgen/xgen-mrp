'use client';

import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adjust the path if needed
import { getProductionOrders } from "@/lib/actions/production-order"; // fetches production orders
import { Key } from "react";

export const metadata: Metadata = {
  title: "Inspector Tasks",
  description: "Tasks assigned to the inspector",
};

export default async function InspectorTasksPage() {
  const session = await getServerSession(authOptions);

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

  const inspectorId = session.user.id;

  // const productionOrders = allProductionOrders.filter(
  //   (order: { inspectorId: string }) => order.inspectorId === inspectorId
  // );
  const productionOrders = allProductionOrders;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">View and manage your assigned tasks</p>
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
              // Make sure to type order correctly
              productionOrders.map((order: { id: Key; customerOrder?: { orderNumber?: string } | null; dueDate?: string | number | Date; status?: string; }) => {
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
                        <p className="text-sm text-muted-foreground">{dueDate}</p>
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