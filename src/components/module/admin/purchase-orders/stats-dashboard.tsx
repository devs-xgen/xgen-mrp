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
  ClipboardList,
  Package,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyPHP } from "@/lib/constant";

interface PurchaseOrdersStatsProps {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalAmount: number;
    pendingAmount: number;
    topSupplier: {
      name: string;
      count: number;
    };
    mostRecentOrder: {
      poNumber: string;
      date: Date;
    } | null;
    monthlyTrends: {
      currentMonth: number;
      lastMonth: number;
      growth: number;
    };
  };
}

export function PurchaseOrdersStats({ stats }: PurchaseOrdersStatsProps) {
  const {
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalAmount,
    pendingAmount,
    topSupplier,
    mostRecentOrder,
    monthlyTrends,
  } = stats;

  const orderGrowth = monthlyTrends.growth;

  return (
    <>
      {/* Statistics Cards - Following Design System Pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <ClipboardList className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Total Orders
                </p>
                <p className="text-2xl font-bold mt-1">{totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {pendingOrders} pending, {completedOrders} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <CircleDollarSign className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Total Value
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrencyPHP(totalAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {formatCurrencyPHP(pendingAmount)} pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <BarChart className="h-8 w-8 text-amber-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Month Growth
                </p>
                <p className="text-2xl font-bold mt-1 flex items-center">
                  {orderGrowth}%
                  {orderGrowth >= 0 ? (
                    <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingUp className="ml-2 h-4 w-4 text-red-500 transform rotate-180" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {monthlyTrends.currentMonth} orders this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Package className="h-8 w-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  Top Supplier
                </p>
                <p className="text-2xl font-bold mt-1">{topSupplier.count}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {topSupplier.name}
                </p>
              </div>
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
                      {topSupplier.name} ({topSupplier.count} orders)
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
                            mostRecentOrder.date
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
                    <span className="font-medium">{monthlyTrends.currentMonth}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Previous Month Orders</span>
                    <span className="font-medium">{monthlyTrends.lastMonth}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Month-over-Month Growth</span>
                    <span
                      className={`font-medium ${orderGrowth >= 0 ? "text-green-500" : "text-red-500"
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
