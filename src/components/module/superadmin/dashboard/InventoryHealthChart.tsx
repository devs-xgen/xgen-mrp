"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { InventoryHealthData } from "@/lib/actions/superadmin";

interface InventoryHealthChartProps {
  data: InventoryHealthData[];
}

export function InventoryHealthChart({ data }: InventoryHealthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Health</CardTitle>
        <CardDescription>Materials and products distribution by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="category"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar dataKey="materials" fill="#8b5cf6" name="Materials" radius={[4, 4, 0, 0]} />
            <Bar dataKey="products" fill="#10b981" name="Products" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
