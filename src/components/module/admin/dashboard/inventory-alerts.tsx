"use client";

// src/components/module/admin/dashboard/inventory-alerts.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { getInventoryAlerts } from "@/lib/actions/dashboard";
import { InventoryAlert } from "@/types/admin/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getInventoryAlerts();
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching inventory alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return "bg-red-500";
      case "WARNING":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              Products with low stock levels that need attention
            </CardDescription>
          </div>
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No inventory alerts at this time
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Minimum Level</TableHead>
                <TableHead className="text-right">Days Left</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.slice(0, 5).map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">
                    {alert.name}
                    <div className="text-xs text-muted-foreground">
                      {alert.sku}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {alert.currentStock}
                  </TableCell>
                  <TableCell className="text-right">
                    {alert.minimumStockLevel}
                  </TableCell>
                  <TableCell className="text-right">
                    {alert.daysUntilStockout === null
                      ? "N/A"
                      : `${alert.daysUntilStockout} days`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={getBadgeColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
