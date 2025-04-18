// src/app/worker/(protected)/orders/page.tsx
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Package, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Orders",
  description: "View orders and requirements",
};

export default function OrdersPage() {
  // Sample orders data
  const orders = [
    {
      id: "ORD-2023-1001",
      customer: "Acme Clothing Co.",
      date: "2023-11-10",
      items: [
        { name: "T-Shirt (Large)", quantity: 50 },
        { name: "Polo Shirt (Medium)", quantity: 30 },
      ],
      status: "Processing",
      priority: "High",
    },
    {
      id: "ORD-2023-1002",
      customer: "Fashion Outlet",
      date: "2023-11-12",
      items: [
        { name: "Jeans (32x34)", quantity: 25 },
        { name: "Jackets", quantity: 15 },
      ],
      status: "Pending",
      priority: "Medium",
    },
    {
      id: "ORD-2023-1003",
      customer: "Retail Partners Inc.",
      date: "2023-11-15",
      items: [{ name: "Dress Shirts", quantity: 40 }],
      status: "Ready for Packing",
      priority: "Medium",
    },
    {
      id: "ORD-2023-1004",
      customer: "Global Styles",
      date: "2023-11-18",
      items: [
        { name: "Hoodies", quantity: 60 },
        { name: "Sweatpants", quantity: 60 },
      ],
      status: "Processing",
      priority: "Urgent",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">
          View and process customer orders
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              Currently in production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ready for Shipping
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Awaiting shipment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Active Orders</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3">{order.id}</td>
                    <td className="py-3 font-medium">{order.customer}</td>
                    <td className="py-3">{order.date}</td>
                    <td className="py-3">
                      <div className="text-sm">
                        {order.items.map((item, index) => (
                          <div key={index}>
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          order.status === "Ready for Packing"
                            ? "success"
                            : order.status === "Processing"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          order.priority === "Urgent"
                            ? "destructive"
                            : order.priority === "High"
                            ? "warning"
                            : "outline"
                        }
                      >
                        {order.priority}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
