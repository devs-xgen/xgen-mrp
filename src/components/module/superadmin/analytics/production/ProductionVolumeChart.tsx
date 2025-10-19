"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import {
  VolumeDataPoint,
  StatusDistribution,
  PriorityDistribution,
} from "@/lib/actions/superadmin/analytics/production";

interface ProductionVolumeChartProps {
  volumeData: VolumeDataPoint[];
  statusData: StatusDistribution[];
  priorityData: PriorityDistribution[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", // amber
  IN_PROGRESS: "#3b82f6", // blue
  COMPLETED: "#10b981", // green
  ON_HOLD: "#ef4444", // red
  CANCELLED: "#6b7280", // gray
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#dc2626", // red-600
  URGENT: "#f97316", // orange-500
  HIGH: "#f59e0b", // amber-500
  MEDIUM: "#3b82f6", // blue-500
  LOW: "#6b7280", // gray-500
};

export function ProductionVolumeChart({
  volumeData,
  statusData,
  priorityData,
}: ProductionVolumeChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Volume Over Time - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Production Volume Trend</CardTitle>
          <CardDescription>Orders and value over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                className="text-xs"
              />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-2">
                        {format(new Date(payload[0].payload.date), "MMM dd, yyyy")}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Orders: {payload[0].value}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Value: ${Number(payload[1].value).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Orders"
                dot={{ fill: "#3b82f6" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                name="Value ($)"
                dot={{ fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders by Status - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
          <CardDescription>Distribution across statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="status" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-1">{payload[0].payload.status}</p>
                      <p className="text-sm">Count: {payload[0].value}</p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].payload.percentage}% of total
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders by Priority - Pie Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Orders by Priority</CardTitle>
          <CardDescription>Priority distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="count"
                nameKey="priority"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ priority, percentage }) => `${priority} (${percentage}%)`}
              >
                {priorityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PRIORITY_COLORS[entry.priority] || "#6b7280"}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-1">{payload[0].name}</p>
                      <p className="text-sm">Count: {payload[0].value}</p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].payload.percentage}% of total
                      </p>
                    </div>
                  );
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
