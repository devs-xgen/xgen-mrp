"use client";

// src/components/module/admin/dashboard/operational-alerts.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOperationalAlerts } from "@/lib/actions/dashboard";
import { OperationalAlerts as OperationalAlertsType } from "@/types/admin/dashboard";
import {
  AlertTriangle,
  Package,
  Clock,
  AlertCircle,
  TruckIcon,
  ClipboardCheck,
} from "lucide-react";

export function OperationalAlerts() {
  const [alerts, setAlerts] = useState<OperationalAlertsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getOperationalAlerts();
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching operational alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const alertItems = [
    {
      icon: Package,
      color: "text-orange-500",
      label: "Product Stock Alerts",
      value: alerts?.productStockAlerts || 0,
    },
    {
      icon: Package,
      color: "text-red-500",
      label: "Material Stock Alerts",
      value: alerts?.materialStockAlerts || 0,
    },
    {
      icon: Clock,
      color: "text-amber-500",
      label: "Late Production Orders",
      value: alerts?.lateProductionOrders || 0,
    },
    {
      icon: AlertCircle,
      color: "text-purple-500",
      label: "Quality Issues",
      value: alerts?.qualityIssues || 0,
    },
    {
      icon: TruckIcon,
      color: "text-blue-500",
      label: "Late Deliveries",
      value: alerts?.lateDeliveries || 0,
    },
    {
      icon: ClipboardCheck,
      color: "text-green-500",
      label: "Pending Approvals",
      value: alerts?.pendingApprovals || 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Operational Alerts</CardTitle>
            <CardDescription>
              Issues requiring attention across the system
            </CardDescription>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {alertItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-2xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
