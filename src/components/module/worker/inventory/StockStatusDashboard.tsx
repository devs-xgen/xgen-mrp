"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StockStatus } from "@/types/worker/inventory";
import {
  CircleAlert,
  Package,
  AlertTriangle,
  CheckCircle,
  PackageX,
} from "lucide-react";

interface StockStatusDashboardProps {
  stockStatus: StockStatus;
}

export function StockStatusDashboard({
  stockStatus,
}: StockStatusDashboardProps) {
  const {
    total,
    normal,
    low,
    critical,
    outOfStock,
    percentageLow,
    percentageCritical,
    materialsRequiringAction,
  } = stockStatus;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Materials in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Normal Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{normal}</div>
            <p className="text-xs text-muted-foreground">
              {total > 0
                ? `${((normal / total) * 100).toFixed(0)}% of inventory`
                : "No items"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{low}</div>
            <p className="text-xs text-muted-foreground">
              {low > 0
                ? `${percentageLow.toFixed(0)}% of inventory`
                : "No items"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Stock
            </CardTitle>
            <CircleAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{critical}</div>
            <p className="text-xs text-muted-foreground">
              {critical > 0
                ? `${percentageCritical.toFixed(0)}% of inventory`
                : "No items"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              {outOfStock > 0
                ? `${((outOfStock / total) * 100).toFixed(0)}% of inventory`
                : "No items"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Inventory Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>Normal Stock Level</div>
              <div className="font-medium">
                {total > 0 ? `${((normal / total) * 100).toFixed(0)}%` : "0%"}
              </div>
            </div>
            <Progress
              value={total > 0 ? (normal / total) * 100 : 0}
              className="h-2 bg-gray-200"
            />

            <div className="mt-4 flex items-center justify-between text-sm">
              <div>Materials Requiring Action</div>
              <div className="font-medium">
                {materialsRequiringAction} items
              </div>
            </div>
            <div className="flex h-2 w-full gap-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-amber-400"
                style={{ width: `${total > 0 ? (low / total) * 100 : 0}%` }}
              />
              <div
                className="bg-red-500"
                style={{
                  width: `${total > 0 ? (critical / total) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-gray-400"
                style={{
                  width: `${total > 0 ? (outOfStock / total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-start gap-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-amber-400" />
                Low ({low})
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-red-500" />
                Critical ({critical})
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-gray-400" />
                Out of Stock ({outOfStock})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
