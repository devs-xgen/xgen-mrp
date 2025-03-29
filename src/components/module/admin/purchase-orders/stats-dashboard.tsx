// src/components/module/admin/purchase-orders/stats-dashboard.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDollarSign,
  ClipboardList,
  Package,
  TrendingUp,
} from "lucide-react";
import { PurchaseOrder } from "@/types/admin/purchase-order";
import { Status } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrdersStatsProps {
  purchaseOrders: PurchaseOrder[];
}

export function PurchaseOrdersStats({
  purchaseOrders,
}: PurchaseOrdersStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate statistics
  const totalOrders = purchaseOrders.length;
  const pendingOrders = purchaseOrders.filter(
    (po) => po.status === "PENDING"
  ).length;
  const completedOrders = purchaseOrders.filter(
    (po) => po.status === "COMPLETED"
  ).length;
  const cancelledOrders = purchaseOrders.filter(
    (po) => po.status === "CANCELLED"
  ).length;

  const totalAmount = purchaseOrders.reduce(
    (sum, po) => sum + Number(po.totalAmount),
    0
  );
  const pendingAmount = purchaseOrders
    .filter((po) => po.status === "PENDING")
    .reduce((sum, po) => sum + Number(po.totalAmount), 0);

  // Get most recent order
  const mostRecentOrder =
    purchaseOrders.length > 0
      ? purchaseOrders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;

  // Get supplier with most orders
  const supplierCounts = purchaseOrders.reduce((acc, po) => {
    acc[po.supplier.name] = (acc[po.supplier.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSupplier = Object.entries(supplierCounts).sort(
    (a, b) => b[1] - a[1]
  )[0] || ["None", 0];

  // Calculate month-over-month comparison (simple version)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const currentMonthOrders = purchaseOrders.filter(
    (po) => new Date(po.createdAt).getMonth() === currentMonth
  ).length;

  const lastMonthOrders = purchaseOrders.filter(
    (po) => new Date(po.createdAt).getMonth() === lastMonth
  ).length;

  const orderGrowth =
    lastMonthOrders === 0
      ? 100
      : Math.round(
          ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        );

  return (
    <>
      {/* Collapsible Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <h3 className="text-2xl font-bold">{totalOrders}</h3>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <div>Pending: {pendingOrders}</div>
              <div>Completed: {completedOrders}</div>
              <div>Cancelled: {cancelledOrders}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Value
                </p>
                <h3 className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 0,
                  }).format(totalAmount)}
                </h3>
              </div>
              <CircleDollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Pending:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
              }).format(pendingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Month-over-Month
                </p>
                <h3 className="text-2xl font-bold flex items-center">
                  {orderGrowth}%
                  {orderGrowth >= 0 ? (
                    <TrendingUp className="ml-2 h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingUp className="ml-2 h-5 w-5 text-red-500 transform rotate-180" />
                  )}
                </h3>
              </div>
              <BarChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {currentMonthOrders} orders this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mb-4">
            <BarChart className="mr-2 h-4 w-4" />
            View Detailed Statistics
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Purchase Order Statistics</DialogTitle>
            <DialogDescription>
              Detailed analytics and metrics for your purchase orders
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Status Breakdown */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4">Status Breakdown</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Badge variant="warning" className="mr-2">
                        Pending
                      </Badge>
                      <span className="text-sm">Pending Orders</span>
                    </span>
                    <span className="font-medium">{pendingOrders}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Badge variant="success" className="mr-2">
                        Completed
                      </Badge>
                      <span className="text-sm">Completed Orders</span>
                    </span>
                    <span className="font-medium">{completedOrders}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Badge variant="destructive" className="mr-2">
                        Cancelled
                      </Badge>
                      <span className="text-sm">Cancelled Orders</span>
                    </span>
                    <span className="font-medium">{cancelledOrders}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4">
                  Financial Summary
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Order Value</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(totalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Value</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(pendingAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Order Value</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(
                        totalOrders > 0 ? totalAmount / totalOrders : 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Insights */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4">Top Insights</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Top Supplier
                    </p>
                    <p className="font-medium">
                      {topSupplier[0]} ({topSupplier[1]} orders)
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Most Recent Order
                    </p>
                    <p className="font-medium">
                      {mostRecentOrder ? (
                        <>
                          {mostRecentOrder.poNumber} -{" "}
                          {new Date(
                            mostRecentOrder.createdAt
                          ).toLocaleDateString()}
                        </>
                      ) : (
                        "No orders"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4">Monthly Trends</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Month Orders</span>
                    <span className="font-medium">{currentMonthOrders}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Previous Month Orders</span>
                    <span className="font-medium">{lastMonthOrders}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Month-over-Month Growth</span>
                    <span
                      className={`font-medium ${
                        orderGrowth >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {orderGrowth}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
