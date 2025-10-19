"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Database,
  Server,
  HardDrive,
  Cpu,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { SystemHealthData } from "@/lib/actions/superadmin/system-health";

interface HealthOverviewProps {
  data: SystemHealthData;
}

export function HealthOverview({ data }: HealthOverviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return "text-green-600 bg-green-100 dark:bg-green-900";
      case "degraded":
      case "slow":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900";
      case "down":
      case "offline":
        return "text-red-600 bg-red-100 dark:bg-red-900";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return <CheckCircle2 className="h-5 w-5" />;
      case "degraded":
      case "slow":
        return <AlertTriangle className="h-5 w-5" />;
      case "down":
      case "offline":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${getStatusColor(data.status)}`}>
              {getStatusIcon(data.status)}
            </div>
            <div>
              <h3 className="text-2xl font-bold capitalize">{data.status}</h3>
              <p className="text-sm text-muted-foreground">
                System Status - Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {data.activeUsers} Active Users
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Activity className="h-3 w-3 mr-1" />
              {data.api.requestsPerMinute} req/min
            </Badge>
          </div>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Health */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <div className="mt-2">
                <Badge
                  variant={data.database.status === "online" ? "default" : "destructive"}
                  className="mb-2"
                >
                  {data.database.status}
                </Badge>
                <p className="text-2xl font-bold">{data.database.responseTime}ms</p>
                <p className="text-xs text-muted-foreground">Response Time</p>
              </div>
            </div>
          </div>
        </Card>

        {/* API Performance */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">API Performance</span>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">{data.api.avgResponseTime}ms</p>
                <p className="text-xs text-muted-foreground mb-2">Avg Response Time</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={data.api.errorRate < 1 ? "default" : data.api.errorRate < 5 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {data.api.errorRate.toFixed(2)}% Errors
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Memory Usage */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">{data.resources.memoryUsage}%</p>
                <Progress value={data.resources.memoryUsage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {data.resources.memoryUsage < 70 ? "Normal" : data.resources.memoryUsage < 85 ? "High" : "Critical"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Disk Usage */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">{data.resources.diskUsage}%</p>
                <Progress value={data.resources.diskUsage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {data.resources.diskUsage < 75 ? "Normal" : data.resources.diskUsage < 90 ? "High" : "Critical"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Uptime Statistics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">System Uptime</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Last 24 Hours</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.uptime.last24h.toFixed(2)}%</p>
              <Badge
                variant={data.uptime.last24h >= 99.5 ? "default" : data.uptime.last24h >= 95 ? "secondary" : "destructive"}
              >
                {data.uptime.last24h >= 99.5 ? "Excellent" : data.uptime.last24h >= 95 ? "Good" : "Poor"}
              </Badge>
            </div>
            <Progress value={data.uptime.last24h} className="mt-2" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Last 7 Days</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.uptime.last7d.toFixed(2)}%</p>
              <Badge
                variant={data.uptime.last7d >= 99.5 ? "default" : data.uptime.last7d >= 95 ? "secondary" : "destructive"}
              >
                {data.uptime.last7d >= 99.5 ? "Excellent" : data.uptime.last7d >= 95 ? "Good" : "Poor"}
              </Badge>
            </div>
            <Progress value={data.uptime.last7d} className="mt-2" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Last 30 Days</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.uptime.last30d.toFixed(2)}%</p>
              <Badge
                variant={data.uptime.last30d >= 99.5 ? "default" : data.uptime.last30d >= 95 ? "secondary" : "destructive"}
              >
                {data.uptime.last30d >= 99.5 ? "Excellent" : data.uptime.last30d >= 95 ? "Good" : "Poor"}
              </Badge>
            </div>
            <Progress value={data.uptime.last30d} className="mt-2" />
          </div>
        </div>
      </Card>
    </div>
  );
}
