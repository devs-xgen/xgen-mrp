// src/components/module/admin/dashboard/order-status-comparison.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { getProductionStatus, getCustomerOrderStatus } from "@/lib/actions/dashboard";

export function OrderStatusComparison() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<{ status: string; customer: number; production: number }>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [prod, cust] = await Promise.all([
          getProductionStatus(),
          getCustomerOrderStatus(),
        ]);
        if (!mounted) return;
        setData([
          { status: "Pending", customer: cust.pendingOrders, production: prod.pendingOrders },
          { status: "In Progress", customer: cust.inProgressOrders, production: prod.inProgressOrders },
          { status: "Completed", customer: cust.completedOrders, production: prod.completedOrders },
        ]);
      } catch (e) {
        console.error("Failed to load status comparison", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Custom tooltip with dark-neutral styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            padding: "8px 10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ opacity: 0.85 }}>{entry.name}</span>
              <span style={{ fontWeight: 600 }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Order Status Comparison</CardTitle>
        <CardDescription>
          Breakdown of Customer Orders vs Production Orders by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-[320px] w-full" />
          </div>
        ) : (
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#475569" }} />
                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#475569" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "#cbd5e1" }} iconType="circle" />
                <Bar dataKey="customer" name="Customer Orders" fill="#64748b" radius={[6,6,0,0]} isAnimationActive={!loading} />
                <Bar dataKey="production" name="Production Orders" fill="#475569" radius={[6,6,0,0]} isAnimationActive={!loading} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
