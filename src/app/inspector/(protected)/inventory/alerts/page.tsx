"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getWorkerInventory } from "@/lib/actions/worker/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Simple component to display alerts from inventory items with critical/low stock levels
export default function InventoryAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        // Get inventory with critical/low stock
        const data = await getWorkerInventory(
          { isActive: true },
          { field: "currentStock", direction: "asc" },
          { page: 1, pageSize: 100 }
        );
        
        // Filter to only get critical and out of stock items
        const alertItems = data.items.filter(
          item => item.stockLevel === "critical" || item.stockLevel === "outOfStock"
        );
        
        setAlerts(alertItems);
      } catch (error) {
        console.error("Error loading alerts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Alerts</h2>
          <p className="text-muted-foreground">
            View critical inventory level notifications
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/inspector/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div>Loading alerts...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.length === 0 ? (
            <div className="col-span-full p-4 text-center">
              No alerts at this time
            </div>
          ) : (
            alerts.map((item) => (
              <Card key={item.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant={item.stockLevel === "outOfStock" ? "destructive" : "warning"}>
                      {item.stockLevel === "outOfStock" ? "Out of Stock" : "Critical"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>SKU:</div>
                    <div className="font-medium">{item.sku}</div>
                    <div>Current Stock:</div>
                    <div className="font-medium">{item.currentStock} {item.unitOfMeasure}</div>
                    <div>Reorder Point:</div>
                    <div className="font-medium">{item.reorderPoint} {item.unitOfMeasure}</div>
                    <div>Critical Point:</div>
                    <div className="font-medium">{item.criticalPoint} {item.unitOfMeasure}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
} 