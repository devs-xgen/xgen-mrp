"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, Box, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlertsCardProps {
  lowStockAlerts: {
    materials: number;
    products: number;
  };
  productionEfficiency: {
    onTime: number;
    delayed: number;
    total: number;
  };
}

export function AlertsCard({ lowStockAlerts, productionEfficiency }: AlertsCardProps) {
  const efficiencyRate = productionEfficiency.total > 0
    ? (productionEfficiency.onTime / productionEfficiency.total) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Alerts & Efficiency</CardTitle>
        <CardDescription>Critical alerts and production performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Low Stock Alerts */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Low Stock Alerts
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Materials</p>
                <p className="text-xl font-bold">{lowStockAlerts.materials}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-xl font-bold">{lowStockAlerts.products}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Production Efficiency */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Production Efficiency
          </h4>

          <div className="space-y-3">
            {/* Efficiency Rate */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  efficiencyRate >= 80
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : efficiencyRate >= 60
                    ? 'bg-yellow-100 dark:bg-yellow-900/20'
                    : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {efficiencyRate >= 80 ? (
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">On-Time Delivery Rate</p>
                  <p className="text-2xl font-bold">{efficiencyRate.toFixed(1)}%</p>
                </div>
              </div>
              <Badge variant={efficiencyRate >= 80 ? "default" : "destructive"}>
                {efficiencyRate >= 80 ? "Excellent" : efficiencyRate >= 60 ? "Good" : "Needs Attention"}
              </Badge>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg border bg-card text-center">
                <p className="text-xs text-muted-foreground">On Time</p>
                <p className="text-lg font-bold text-green-600">{productionEfficiency.onTime}</p>
              </div>
              <div className="p-2 rounded-lg border bg-card text-center">
                <p className="text-xs text-muted-foreground">Delayed</p>
                <p className="text-lg font-bold text-red-600">{productionEfficiency.delayed}</p>
              </div>
              <div className="p-2 rounded-lg border bg-card text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{productionEfficiency.total}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
