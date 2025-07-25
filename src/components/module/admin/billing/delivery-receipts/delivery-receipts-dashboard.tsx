"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { DeliveryReceiptWithBilling, DeliveryAnalytics } from "@/types/admin/billing";

interface DeliveryReceiptsDashboardProps {
  receipts: DeliveryReceiptWithBilling[];
  analytics: DeliveryAnalytics;
}

export function DeliveryReceiptsDashboard({ 
  receipts, 
  analytics 
}: DeliveryReceiptsDashboardProps) {
  const statusCounts = receipts.reduce((acc, receipt) => {
    acc[receipt.deliveryStatus] = (acc[receipt.deliveryStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      title: "Total Receipts",
      value: receipts.length,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending",
      value: statusCounts.PENDING || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "In Transit",
      value: statusCounts.IN_TRANSIT || 0,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Delivered",
      value: statusCounts.DELIVERED || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Cancelled",
      value: statusCounts.CANCELLED || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.title === "Total Receipts" 
                  ? "All delivery receipts"
                  : `${stat.title.toLowerCase()} receipts`
                }
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}