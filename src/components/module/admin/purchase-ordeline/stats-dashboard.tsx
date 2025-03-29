// src/components/module/admin/purchase-ordeline/stats-dashboard.tsx
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
  CircleDollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { PurchaseOrder, PurchaseOrderLine } from "@/types/admin/purchase-order";
import { Status } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrderLinesStatsProps {
  orderLines: PurchaseOrderLine[];
  purchaseOrders: PurchaseOrder[];
  selectedPoId?: string;
}

export function PurchaseOrderLinesStats({
  orderLines,
  purchaseOrders,
  selectedPoId,
}: PurchaseOrderLinesStatsProps) {
  // Calculate statistics
  const totalLines = orderLines.length;
  const pendingLines = orderLines.filter(
    (line) => line.status === "PENDING"
  ).length;
  const completedLines = orderLines.filter(
    (line) => line.status === "COMPLETED"
  ).length;
  const cancelledLines = orderLines.filter(
    (line) => line.status === "CANCELLED"
  ).length;

  // Calculate total value of all order lines
  const totalValue = orderLines.reduce((sum, line) => {
    return sum + line.quantity * Number(line.unitPrice);
  }, 0);

  // Calculate value of pending order lines
  const pendingValue = orderLines
    .filter((line) => line.status === "PENDING")
    .reduce((sum, line) => sum + line.quantity * Number(line.unitPrice), 0);

  // Get counts for top materials
  const materialCounts = orderLines.reduce((acc, line) => {
    const materialName = line.material.name;
    acc[materialName] = (acc[materialName] || 0) + line.quantity;
    return acc;
  }, {} as Record<string, number>);

  const topMaterials = Object.entries(materialCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate quantities by status
  const pendingQuantity = orderLines
    .filter((line) => line.status === "PENDING")
    .reduce((sum, line) => sum + line.quantity, 0);

  const completedQuantity = orderLines
    .filter((line) => line.status === "COMPLETED")
    .reduce((sum, line) => sum + line.quantity, 0);

  // Calculate average item price
  const averageUnitPrice =
    totalLines > 0
      ? orderLines.reduce((sum, line) => sum + Number(line.unitPrice), 0) /
        totalLines
      : 0;

  // Calculate current month versus previous month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const currentMonthLines = orderLines.filter(
    (line) => new Date(line.createdAt).getMonth() === currentMonth
  ).length;

  const previousMonthLines = orderLines.filter(
    (line) => new Date(line.createdAt).getMonth() === previousMonth
  ).length;

  const monthGrowth =
    previousMonthLines === 0
      ? 100
      : Math.round(
          ((currentMonthLines - previousMonthLines) / previousMonthLines) * 100
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
                  Total Order Lines
                </p>
                <h3 className="text-2xl font-bold">{totalLines}</h3>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <div>Pending: {pendingLines}</div>
              <div>Completed: {completedLines}</div>
              <div>Cancelled: {cancelledLines}</div>
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
                  }).format(totalValue)}
                </h3>
              </div>
              <CircleDollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Pending Value:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
              }).format(pendingValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Quantity
                </p>
                <h3 className="text-2xl font-bold">
                  {pendingQuantity + completedQuantity}
                </h3>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Pending: {pendingQuantity} | Completed: {completedQuantity}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mb-4">
            <BarChart className="mr-2 h-4 w-4" />
            View Detailed Line Statistics
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Purchase Order Line Statistics</DialogTitle>
            <DialogDescription>
              Detailed analytics and metrics for your order lines
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
                      <span className="text-sm">Pending Lines</span>
                    </span>
                    <span className="font-medium">{pendingLines}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Badge variant="success" className="mr-2">
                        Completed
                      </Badge>
                      <span className="text-sm">Completed Lines</span>
                    </span>
                    <span className="font-medium">{completedLines}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Badge variant="destructive" className="mr-2">
                        Cancelled
                      </Badge>
                      <span className="text-sm">Cancelled Lines</span>
                    </span>
                    <span className="font-medium">{cancelledLines}</span>
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
                    <span className="text-sm">Total Line Value</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(totalValue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Value</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(pendingValue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Unit Price</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PHP",
                      }).format(averageUnitPrice)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Materials */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4">Top Materials</h4>
                <div className="space-y-4">
                  {topMaterials.length > 0 ? (
                    topMaterials.map(([material, quantity], index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm truncate max-w-[70%]">
                          {material}
                        </span>
                        <span className="font-medium">{quantity} units</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No materials data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4">Monthly Trends</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Month Lines</span>
                    <span className="font-medium">{currentMonthLines}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Previous Month Lines</span>
                    <span className="font-medium">{previousMonthLines}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Month-over-Month Growth</span>
                    <span
                      className={`font-medium ${
                        monthGrowth >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {monthGrowth}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Order Context */}
            {selectedPoId && (
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <h4 className="text-sm font-semibold mb-4">
                    Purchase Order Context
                  </h4>
                  {(() => {
                    const po = purchaseOrders.find(
                      (po) => po.id === selectedPoId
                    );
                    if (!po) return <p>Purchase order not found</p>;

                    return (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Purchase Order
                          </p>
                          <p className="font-medium">{po.poNumber}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Supplier
                          </p>
                          <p className="font-medium">{po.supplier.name}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Order Date
                          </p>
                          <p className="font-medium">
                            {new Date(po.orderDate).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Expected Delivery
                          </p>
                          <p className="font-medium">
                            {new Date(po.expectedDelivery).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Amount
                          </p>
                          <p className="font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "PHP",
                            }).format(Number(po.totalAmount))}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <p>
                            <Badge
                              variant={
                                po.status === "COMPLETED"
                                  ? "success"
                                  : po.status === "PENDING"
                                  ? "warning"
                                  : "destructive"
                              }
                            >
                              {po.status.toLowerCase()}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
