"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TopProductsData } from "@/lib/actions/superadmin";

interface TopProductsChartProps {
  data: TopProductsData[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Products</CardTitle>
        <CardDescription>Best performing products by order count and revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'orders') return [value, 'Orders'];
                if (name === 'revenue') return [`₱${value.toLocaleString()}`, 'Revenue'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[0, 4, 4, 0]} />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue (₱)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
