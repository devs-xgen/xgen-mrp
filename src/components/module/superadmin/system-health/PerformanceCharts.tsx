"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Clock, Database, AlertCircle } from "lucide-react";
import { PerformanceMetrics } from "@/lib/actions/superadmin/system-health";
import { formatDistanceToNow } from "date-fns";

interface PerformanceChartsProps {
  data: PerformanceMetrics;
}

export function PerformanceCharts({ data }: PerformanceChartsProps) {
  return (
    <div className="space-y-6">
      {/* Response Time Trend */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Response Time Trend</h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.responseTimeChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={value => new Date(value).toLocaleTimeString()}
            />
            <YAxis label={{ value: "Response Time (ms)", angle: -90, position: "insideLeft" }} />
            <Tooltip
              labelFormatter={value => new Date(value).toLocaleString()}
              formatter={(value: number) => [`${value}ms`, ""]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgResponseTime"
              stroke="#3b82f6"
              name="Average"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="p95ResponseTime"
              stroke="#f59e0b"
              name="P95"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>P95 Response Time:</strong> 95% of requests complete within this time.
            Lower is better.
          </p>
        </div>
      </Card>

      {/* Error Rate Trend */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Error Rate Trend</h3>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.errorRateChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={value => new Date(value).toLocaleTimeString()}
            />
            <YAxis label={{ value: "Error Rate (%)", angle: -90, position: "insideLeft" }} />
            <Tooltip
              labelFormatter={value => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => {
                if (name === "errorRate") return [`${value.toFixed(2)}%`, "Error Rate"];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="errorRate" fill="#ef4444" name="Error Rate" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Slowest Endpoints Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Slowest Endpoints</h3>
          <Badge variant="outline" className="ml-auto">
            Top 10
          </Badge>
        </div>

        {data.endpoints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No endpoint metrics available</p>
            <p className="text-sm mt-1">Data will appear as requests are made</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Avg (ms)</TableHead>
                  <TableHead className="text-right">P50 (ms)</TableHead>
                  <TableHead className="text-right">P95 (ms)</TableHead>
                  <TableHead className="text-right">P99 (ms)</TableHead>
                  <TableHead className="text-right">Error Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.endpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {endpoint.path}
                    </TableCell>
                    <TableCell className="text-right">{endpoint.requestCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={endpoint.avgResponseTime < 500 ? "default" : endpoint.avgResponseTime < 1000 ? "secondary" : "destructive"}
                      >
                        {endpoint.avgResponseTime}ms
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{endpoint.p50}ms</TableCell>
                    <TableCell className="text-right">{endpoint.p95}ms</TableCell>
                    <TableCell className="text-right">{endpoint.p99}ms</TableCell>
                    <TableCell className="text-right">
                      {endpoint.errorRate > 0 ? (
                        <Badge variant="destructive">{endpoint.errorRate.toFixed(2)}%</Badge>
                      ) : (
                        <span className="text-muted-foreground">0%</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Slow Queries Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Slow Database Queries</h3>
          <Badge variant="outline" className="ml-auto">
            &gt; 1 second
          </Badge>
        </div>

        {data.slowQueries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No slow queries detected</p>
            <p className="text-sm mt-1">All queries are performing well!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Last Occurrence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slowQueries.map((query, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm max-w-md truncate">
                      {query.query}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={query.avgDuration < 2000 ? "secondary" : "destructive"}
                      >
                        {query.avgDuration}ms
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{query.count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDistanceToNow(new Date(query.lastOccurrence), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
