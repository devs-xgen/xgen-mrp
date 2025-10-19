"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Activity, TrendingUp, AlertCircle, Bell } from "lucide-react";
import { HealthOverview } from "./HealthOverview";
import { PerformanceCharts } from "./PerformanceCharts";
import { ErrorLog } from "./ErrorLog";
import { AlertRulesManager } from "./AlertRulesManager";
import {
  SystemHealthData,
  PerformanceMetrics,
  SystemErrorData,
} from "@/lib/actions/superadmin/system-health";
import { AlertRuleData } from "@/lib/actions/superadmin/alerts";

export function SystemHealthClient() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [errors, setErrors] = useState<SystemErrorData[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRuleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceTimeRange, setPerformanceTimeRange] = useState<number>(24);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds for health overview
    const interval = setInterval(() => {
      if (activeTab === "overview") {
        loadHealthData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === "performance") {
      loadPerformanceData();
    }
  }, [performanceTimeRange]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadHealthData(),
      loadPerformanceData(),
      loadErrors(),
      loadAlertRules(),
    ]);
    setIsLoading(false);
  };

  const loadHealthData = async () => {
    try {
      const { getSystemHealth } = await import("@/lib/actions/superadmin/system-health");
      const result = await getSystemHealth();

      if (result.success && result.data) {
        setHealthData(result.data);
      }
    } catch (error) {
      console.error("Error loading health data:", error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const { getPerformanceMetrics } = await import("@/lib/actions/superadmin/system-health");
      const result = await getPerformanceMetrics(performanceTimeRange);

      if (result.success && result.data) {
        setPerformanceData(result.data);
      }
    } catch (error) {
      console.error("Error loading performance data:", error);
    }
  };

  const loadErrors = async () => {
    try {
      const { getRecentErrors } = await import("@/lib/actions/superadmin/system-health");
      const result = await getRecentErrors(100);

      if (result.success && result.data) {
        setErrors(result.data);
      }
    } catch (error) {
      console.error("Error loading errors:", error);
    }
  };

  const loadAlertRules = async () => {
    try {
      const { getAlertRules } = await import("@/lib/actions/superadmin/alerts");
      const result = await getAlertRules();

      if (result.success && result.data) {
        setAlertRules(result.data);
      }
    } catch (error) {
      console.error("Error loading alert rules:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleResolveError = async (errorId: string, notes: string) => {
    try {
      const { resolveError } = await import("@/lib/actions/superadmin/system-health");
      const result = await resolveError(errorId, notes);

      if (result.success) {
        await loadErrors();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error resolving error:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab === "performance" && (
            <Select
              value={performanceTimeRange.toString()}
              onValueChange={value => setPerformanceTimeRange(Number(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Last 6 Hours</SelectItem>
                <SelectItem value="24">Last 24 Hours</SelectItem>
                <SelectItem value="168">Last 7 Days</SelectItem>
                <SelectItem value="720">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertCircle className="h-4 w-4 mr-2" />
            Errors ({errors.filter(e => !e.resolved).length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alert Rules ({alertRules.filter(r => r.enabled).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {healthData && <HealthOverview data={healthData} />}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          {performanceData && <PerformanceCharts data={performanceData} />}
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <ErrorLog errors={errors} onResolveError={handleResolveError} />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <AlertRulesManager rules={alertRules} onRefresh={loadAlertRules} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
