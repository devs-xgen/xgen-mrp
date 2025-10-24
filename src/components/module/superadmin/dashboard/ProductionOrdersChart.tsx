"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ProductionOrderStatusData } from "@/lib/actions/superadmin";

interface ProductionOrdersChartProps {
  data: ProductionOrderStatusData[];
}

const statusColors: Record<string, string> = {
  PENDING: "#fbbf24",
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#10b981",
  DELIVERED: "#06b6d4",
  CANCELLED: "#ef4444",
  ON_HOLD: "#f97316",
};

export function ProductionOrdersChart({ data }: ProductionOrdersChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    status: item.status.replace(/_/g, " "),
    fill: statusColors[item.status] || "#6b7280",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Orders by Status</CardTitle>
        <CardDescription>Overview of production orders across different statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="status"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'count') return [value, 'Orders'];
                if (name === 'value') return [`₱${value.toLocaleString()}`, 'Total Value'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Order Count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
