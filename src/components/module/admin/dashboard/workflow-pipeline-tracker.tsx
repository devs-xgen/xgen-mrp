// src/components/module/admin/dashboard/workflow-pipeline-tracker.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShoppingCart,
  Factory,
  Cog,
  ClipboardCheck,
  Truck,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { getWorkflowPipelineData } from "@/lib/actions/dashboard";
import { WorkflowPipelineData } from "@/types/admin/dashboard";
import { Badge } from "@/components/ui/badge";

const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  red: "#ef4444",
  slate: "#64748b",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: COLORS.amber,
  IN_PROGRESS: COLORS.blue,
  ACTIVE: COLORS.green,
  COMPLETED: COLORS.green,
  DELIVERED: COLORS.green,
  CANCELLED: COLORS.red,
  FAILED: COLORS.red,
};

export function WorkflowPipelineTracker() {
  const [data, setData] = useState<WorkflowPipelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const result = await getWorkflowPipelineData();
        if (mounted) {
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load workflow pipeline data:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Pipeline Tracker</CardTitle>
          <CardDescription>Loading workflow data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Pipeline Tracker</CardTitle>
          <CardDescription>Failed to load workflow data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare funnel data for the complete workflow
  const funnelData = [
    {
      name: "Customer Orders",
      value: data.summary.totalCustomerOrders,
      fill: COLORS.blue,
    },
    {
      name: "With Production",
      value: data.summary.customerOrdersWithProduction,
      fill: COLORS.green,
    },
    {
      name: "With Operations",
      value: data.summary.productionOrdersInWorkCenters,
      fill: COLORS.amber,
    },
    {
      name: "Quality Checked",
      value: data.summary.productionOrdersWithQualityChecks,
      fill: COLORS.purple,
    },
    {
      name: "With Delivery",
      value: data.summary.productionOrdersWithDelivery,
      fill: COLORS.slate,
    },
  ];

  // Prepare production status data
  const productionStatusData = data.productionOrdersByStatus.map((item) => ({
    name: item.status.replace(/_/g, " "),
    value: item.count,
    fill: STATUS_COLORS[item.status] || COLORS.slate,
  }));

  // Prepare work center data
  const workCenterData = data.workCenterDistribution.map((item) => ({
    name: item.workCenterName,
    orders: item.count,
  }));

  // Prepare quality checks data
  const qualityData = data.qualityChecksByStatus.map((item) => ({
    name: item.status.replace(/_/g, " "),
    value: item.count,
    fill: STATUS_COLORS[item.status] || COLORS.slate,
  }));

  // Prepare delivery data
  const deliveryData = data.deliveryStatusBreakdown.map((item) => ({
    name: item.status.replace(/_/g, " "),
    value: item.count,
    fill: STATUS_COLORS[item.status] || COLORS.slate,
  }));

  const conversionRate = data.summary.totalCustomerOrders > 0
    ? ((data.summary.customerOrdersWithProduction / data.summary.totalCustomerOrders) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCustomerOrders}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.customerOrdersWithProduction} with production orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Production Orders
            </CardTitle>
            <Factory className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalProductionOrders}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.productionOrdersInWorkCenters} with operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quality Checks
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.productionOrdersWithQualityChecks}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.pendingQualityChecks} pending inspections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Delivery Assigned
            </CardTitle>
            <Truck className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.productionOrdersWithDelivery}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders ready for delivery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Complete Workflow Pipeline</CardTitle>
              <CardDescription className="mt-1">
                Track orders through the entire manufacturing process
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <TrendingUp className="mr-2 h-4 w-4" />
              {conversionRate}% Conversion
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="funnel" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="funnel">Pipeline</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="workcenters">Work Centers</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>

            {/* Pipeline Funnel View */}
            <TabsContent value="funnel" className="space-y-4">
              <div className="space-y-3">
                {funnelData.map((stage, index) => {
                  const percentage = data.summary.totalCustomerOrders > 0
                    ? ((stage.value / data.summary.totalCustomerOrders) * 100).toFixed(1)
                    : "0";
                  const dropoff = index > 0
                    ? funnelData[index - 1].value - stage.value
                    : 0;
                  
                  return (
                    <div key={stage.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.fill }}
                          />
                          <span className="font-medium text-sm">{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {dropoff > 0 && (
                            <span className="text-xs text-red-600 font-medium">
                              -{dropoff} dropped
                            </span>
                          )}
                          <span className="text-sm font-bold min-w-[60px] text-right">
                            {stage.value}
                          </span>
                          <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${stage.fill} 0%, ${stage.fill}dd 100%)`,
                            minWidth: stage.value > 0 ? '60px' : '0px',
                          }}
                        >
                          {stage.value > 0 && (
                            <span className="drop-shadow-md">{stage.value}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Without Production</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {data.summary.customerOrdersWithoutProduction}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Orders pending production planning
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cog className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {data.summary.productionOrdersInWorkCenters}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently being manufactured
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Pending QC</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {data.summary.pendingQualityChecks}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting quality inspection
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Production Status View */}
            <TabsContent value="production" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productionStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Work Centers Distribution */}
            <TabsContent value="workcenters" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workCenterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill={COLORS.amber} name="Production Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {workCenterData.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No active work center operations
                </div>
              )}
            </TabsContent>

            {/* Quality Checks View */}
            <TabsContent value="quality" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Delivery Status View */}
            <TabsContent value="delivery" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deliveryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Count">
                      {deliveryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
