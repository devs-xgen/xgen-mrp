"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MaterialConsumptionData } from "@/lib/actions/superadmin";

interface MaterialConsumptionChartProps {
  data: MaterialConsumptionData[];
}

export function MaterialConsumptionChart({ data }: MaterialConsumptionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Material Consumption</CardTitle>
        <CardDescription>Most consumed materials and current reservations</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'consumed') return [value.toFixed(2), 'Consumed'];
                if (name === 'reserved') return [value, 'Reserved'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="consumed" fill="#f59e0b" name="Consumed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reserved" fill="#8b5cf6" name="Reserved" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
