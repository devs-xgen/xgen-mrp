"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Play, FolderOpen, BarChart3 } from "lucide-react";
import { ReportBuilder } from "./ReportBuilder";
import { ReportPreview } from "./ReportPreview";
import { SavedReportTemplates } from "./SavedReportTemplates";
import {
  AuditReportConfig,
  AuditReportData,
} from "@/lib/actions/superadmin/audit-reports";

export function AuditReportsClient() {
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [config, setConfig] = useState<AuditReportConfig>({
    reportType: "all_activity",
    startDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 7); // Last 7 days
      return date;
    })(),
    endDate: new Date(),
    filters: {},
  });
  const [reportData, setReportData] = useState<AuditReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { getAuditStatistics } = await import("@/lib/actions/superadmin/audit-reports");
      const result = await getAuditStatistics(30);

      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { generateAuditReport } = await import("@/lib/actions/superadmin/audit-reports");
      const result = await generateAuditReport(config);

      if (result.success && result.data) {
        setReportData(result.data);
        setActiveTab("preview");
      } else {
        alert(result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadTemplate = (templateConfig: AuditReportConfig) => {
    setConfig(templateConfig);
    setActiveTab("builder");
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.totalLogs.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Audit Logs</p>
                <p className="text-xs text-muted-foreground mt-0.5">{statistics.period}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.superAdminLogs.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">SuperAdmin Actions</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {statistics.totalLogs > 0
                    ? ((statistics.superAdminLogs / statistics.totalLogs) * 100).toFixed(1)
                    : 0}
                  % of total
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <FolderOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-xs text-muted-foreground mt-0.5">With logged activity</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Generate Audit Report</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure filters and generate comprehensive audit reports
            </p>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Play className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">
            <FileText className="h-4 w-4 mr-2" />
            Report Builder
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!reportData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Preview {reportData && `(${reportData.entries.length})`}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FolderOpen className="h-4 w-4 mr-2" />
            Saved Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <ReportBuilder config={config} onConfigChange={setConfig} />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          {reportData && <ReportPreview data={reportData} />}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <SavedReportTemplates currentConfig={config} onLoadTemplate={handleLoadTemplate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
