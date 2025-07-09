"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Settings,
  CheckSquare,
  Truck,
  Zap,
  Users,
  Calendar,
  Target,
  Activity,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface WorkflowAnalytics {
  overview: {
    totalProductionOrders: number;
    activeOrders: number;
    completedToday: number;
    averageCompletionTime: number;
    overdueOrders: number;
    blockedOrders: number;
  };
  phaseMetrics: {
    workCenters: {
      averageCompletionTime: number;
      completionRate: number;
      bottleneckOperations: Array<{
        workCenterName: string;
        averageTime: number;
        backlogCount: number;
      }>;
    };
    inspections: {
      averageCompletionTime: number;
      completionRate: number;
      defectRate: number;
      bottleneckInspectors: Array<{
        inspectorName: string;
        averageTime: number;
        backlogCount: number;
      }>;
    };
    delivery: {
      averageCompletionTime: number;
      completionRate: number;
      onTimeDeliveryRate: number;
    };
  };
  blockingIncidents: Array<{
    productionOrderId: string;
    productName: string;
    blockedPhase: string;
    blockingReason: string;
    blockingDuration: number;
    priority: string;
    dueDate: string;
  }>;
  trends: {
    completionTimes: Array<{
      date: string;
      workCenters: number;
      inspections: number;
      delivery: number;
      total: number;
    }>;
    throughput: Array<{
      date: string;
      started: number;
      completed: number;
      blocked: number;
    }>;
  };
  overrides: {
    totalOverrides: number;
    overridesToday: number;
    overridesByType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    recentOverrides: Array<{
      id: string;
      type: string;
      reason: string;
      adminName: string;
      timestamp: string;
      productionOrderId: string;
    }>;
  };
}

interface WorkflowAnalyticsDashboardProps {
  onRefresh?: () => Promise<void>;
}

// Mock data for demonstration - in real implementation, this would come from API
const mockAnalytics: WorkflowAnalytics = {
  overview: {
    totalProductionOrders: 156,
    activeOrders: 42,
    completedToday: 8,
    averageCompletionTime: 4.2,
    overdueOrders: 3,
    blockedOrders: 7,
  },
  phaseMetrics: {
    workCenters: {
      averageCompletionTime: 1.8,
      completionRate: 89,
      bottleneckOperations: [
        { workCenterName: "Assembly Line A", averageTime: 3.2, backlogCount: 5 },
        { workCenterName: "Quality Station B", averageTime: 2.8, backlogCount: 3 },
        { workCenterName: "Finishing Dept", averageTime: 2.1, backlogCount: 2 },
      ],
    },
    inspections: {
      averageCompletionTime: 0.8,
      completionRate: 94,
      defectRate: 4.2,
      bottleneckInspectors: [
        { inspectorName: "John Smith", averageTime: 1.2, backlogCount: 4 },
        { inspectorName: "Jane Doe", averageTime: 0.9, backlogCount: 2 },
      ],
    },
    delivery: {
      averageCompletionTime: 1.2,
      completionRate: 96,
      onTimeDeliveryRate: 88,
    },
  },
  blockingIncidents: [
    {
      productionOrderId: "PO-2024-001",
      productName: "Product A",
      blockedPhase: "Work Centers",
      blockingReason: "No assigned workers",
      blockingDuration: 2.5,
      priority: "HIGH",
      dueDate: "2024-01-15",
    },
    {
      productionOrderId: "PO-2024-002",
      productName: "Product B",
      blockedPhase: "Inspections",
      blockingReason: "Work centers incomplete",
      blockingDuration: 1.8,
      priority: "MEDIUM",
      dueDate: "2024-01-16",
    },
  ],
  trends: {
    completionTimes: [
      { date: "2024-01-08", workCenters: 1.9, inspections: 0.9, delivery: 1.3, total: 4.1 },
      { date: "2024-01-09", workCenters: 1.7, inspections: 0.8, delivery: 1.1, total: 3.6 },
      { date: "2024-01-10", workCenters: 2.1, inspections: 0.7, delivery: 1.4, total: 4.2 },
      { date: "2024-01-11", workCenters: 1.8, inspections: 0.8, delivery: 1.2, total: 3.8 },
      { date: "2024-01-12", workCenters: 1.6, inspections: 0.9, delivery: 1.0, total: 3.5 },
    ],
    throughput: [
      { date: "2024-01-08", started: 12, completed: 10, blocked: 2 },
      { date: "2024-01-09", started: 15, completed: 13, blocked: 1 },
      { date: "2024-01-10", started: 8, completed: 11, blocked: 3 },
      { date: "2024-01-11", started: 14, completed: 9, blocked: 2 },
      { date: "2024-01-12", started: 10, completed: 8, blocked: 1 },
    ],
  },
  overrides: {
    totalOverrides: 23,
    overridesToday: 2,
    overridesByType: [
      { type: "START_PRODUCTION", count: 12, percentage: 52 },
      { type: "BYPASS_WORK_CENTERS", count: 5, percentage: 22 },
      { type: "BYPASS_INSPECTIONS", count: 4, percentage: 17 },
      { type: "FORCE_STATUS", count: 2, percentage: 9 },
    ],
    recentOverrides: [
      {
        id: "1",
        type: "START_PRODUCTION",
        reason: "Emergency order for high-priority customer",
        adminName: "Admin User",
        timestamp: "2024-01-12T10:30:00Z",
        productionOrderId: "PO-2024-003",
      },
      {
        id: "2",
        type: "BYPASS_INSPECTIONS",
        reason: "Delivery deadline cannot be missed",
        adminName: "Admin User",
        timestamp: "2024-01-12T09:15:00Z",
        productionOrderId: "PO-2024-004",
      },
    ],
  },
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export const WorkflowAnalyticsDashboard: React.FC<WorkflowAnalyticsDashboardProps> = ({
  onRefresh,
}) => {
  const [analytics, setAnalytics] = useState<WorkflowAnalytics>(mockAnalytics);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // In real implementation, this would fetch from API
      // const data = await getWorkflowAnalytics(selectedTimeRange);
      // setAnalytics(data);
      
      // For now, use mock data
      setTimeout(() => {
        setAnalytics(mockAnalytics);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const getStatusColor = (phase: string, value: number) => {
    const thresholds = {
      workCenters: { good: 85, warning: 70 },
      inspections: { good: 90, warning: 80 },
      delivery: { good: 90, warning: 85 },
    };
    
    const threshold = thresholds[phase as keyof typeof thresholds];
    if (value >= threshold.good) return "text-green-600";
    if (value >= threshold.warning) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor production workflow performance, bottlenecks, and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{analytics.overview.activeOrders}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {analytics.overview.totalProductionOrders} total orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">{analytics.overview.completedToday}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Avg. {analytics.overview.averageCompletionTime} days completion
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{analytics.overview.overdueOrders}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Require immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blocked</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.overview.blockedOrders}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Workflow dependencies unmet
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Phase Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Work Centers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Work Centers</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className={getStatusColor('workCenters', analytics.phaseMetrics.workCenters.completionRate)}>
                        {analytics.phaseMetrics.workCenters.completionRate}%
                      </span>
                    </div>
                    <Progress value={analytics.phaseMetrics.workCenters.completionRate} className="mt-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg. {analytics.phaseMetrics.workCenters.averageCompletionTime} days
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inspections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Inspections</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className={getStatusColor('inspections', analytics.phaseMetrics.inspections.completionRate)}>
                        {analytics.phaseMetrics.inspections.completionRate}%
                      </span>
                    </div>
                    <Progress value={analytics.phaseMetrics.inspections.completionRate} className="mt-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {analytics.phaseMetrics.inspections.defectRate}% defect rate
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>On-Time Rate</span>
                      <span className={getStatusColor('delivery', analytics.phaseMetrics.delivery.onTimeDeliveryRate)}>
                        {analytics.phaseMetrics.delivery.onTimeDeliveryRate}%
                      </span>
                    </div>
                    <Progress value={analytics.phaseMetrics.delivery.onTimeDeliveryRate} className="mt-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg. {analytics.phaseMetrics.delivery.averageCompletionTime} days
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Center Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Work Center Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.phaseMetrics.workCenters.bottleneckOperations.map((operation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <div>
                        <p className="font-medium">{operation.workCenterName}</p>
                        <p className="text-sm text-muted-foreground">
                          {operation.averageTime} days avg. • {operation.backlogCount} in backlog
                        </p>
                      </div>
                      <Badge variant="outline">{operation.backlogCount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blocking Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Current Blocking Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.blockingIncidents.map((incident, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{incident.productName}</p>
                          <p className="text-sm text-muted-foreground">{incident.productionOrderId}</p>
                          <p className="text-xs text-red-600 mt-1">{incident.blockingReason}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={incident.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                            {incident.priority}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {incident.blockingDuration} days blocked
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Times Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Times Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends.completionTimes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="workCenters" stroke="#8884d8" name="Work Centers" />
                    <Line type="monotone" dataKey="inspections" stroke="#82ca9d" name="Inspections" />
                    <Line type="monotone" dataKey="delivery" stroke="#ffc658" name="Delivery" />
                    <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} name="Total" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Throughput Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Production Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.trends.throughput}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="started" stackId="1" stroke="#8884d8" fill="#8884d8" name="Started" />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Completed" />
                    <Area type="monotone" dataKey="blocked" stackId="1" stroke="#ff7300" fill="#ff7300" name="Blocked" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Override Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Override Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Overrides</span>
                    <Badge variant="outline">{analytics.overrides.totalOverrides}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Today</span>
                    <Badge variant="secondary">{analytics.overrides.overridesToday}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Override Types</h4>
                    {analytics.overrides.overridesByType.map((override, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{override.type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span>{override.count}</span>
                          <span className="text-muted-foreground">({override.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Overrides */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Override Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.overrides.recentOverrides.map((override) => (
                    <div key={override.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{override.type.replace('_', ' ')}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {override.productionOrderId}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{override.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {override.adminName} • {formatDate(new Date(override.timestamp))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 