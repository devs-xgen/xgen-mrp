"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Save, Play, FolderOpen } from "lucide-react";
import { ReportConfig } from "@/lib/actions/superadmin/analytics/reports";
import { FieldSelector } from "./FieldSelector";
import { FilterBuilder } from "./FilterBuilder";
import { ReportPreview } from "./ReportPreview";
import { SaveReportDialog } from "./SaveReportDialog";
import { SavedReportsManager } from "./SavedReportsManager";
import { ExportOptions } from "./ExportOptions";

export function ReportBuilderClient() {
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    entities: [],
    fields: [],
    filters: [],
    joins: [],
    sort: [],
    limit: 1000,
  });
  const [reportResults, setReportResults] = useState<any[] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedReports, setShowSavedReports] = useState(false);

  const handleExecuteReport = async () => {
    if (reportConfig.fields.length === 0) {
      alert("Please select at least one field");
      return;
    }

    setIsExecuting(true);
    try {
      const { executeReport } = await import("@/lib/actions/superadmin/analytics/reports");
      const result = await executeReport(reportConfig);

      if (result.success && result.data) {
        setReportResults(result.data.results);
        setActiveTab("preview");
      } else {
        alert(result.error || "Failed to execute report");
      }
    } catch (error) {
      console.error("Error executing report:", error);
      alert("An error occurred while executing the report");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLoadReport = (config: ReportConfig) => {
    setReportConfig(config);
    setReportResults(null);
    setShowSavedReports(false);
    setActiveTab("builder");
  };

  const handleSaveSuccess = () => {
    setShowSaveDialog(false);
    alert("Report saved successfully!");
  };

  const handleResetReport = () => {
    if (confirm("Are you sure you want to reset the report? All unsaved changes will be lost.")) {
      setReportConfig({
        entities: [],
        fields: [],
        filters: [],
        joins: [],
        sort: [],
        limit: 1000,
      });
      setReportResults(null);
      setActiveTab("builder");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSavedReports(true)}
              variant="outline"
              size="sm"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Load Report
            </Button>
            <Button
              onClick={() => setShowSaveDialog(true)}
              variant="outline"
              size="sm"
              disabled={reportConfig.fields.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
            <Button
              onClick={handleResetReport}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {reportResults && (
              <ExportOptions data={reportResults} config={reportConfig} />
            )}
            <Button
              onClick={handleExecuteReport}
              disabled={isExecuting || reportConfig.fields.length === 0}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              {isExecuting ? "Executing..." : "Run Report"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">
            <FileText className="h-4 w-4 mr-2" />
            Report Builder
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!reportResults}>
            <FileText className="h-4 w-4 mr-2" />
            Preview ({reportResults?.length || 0} rows)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">1. Select Fields</h3>
            <FieldSelector
              config={reportConfig}
              onConfigChange={setReportConfig}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">2. Add Filters (Optional)</h3>
            <FilterBuilder
              config={reportConfig}
              onConfigChange={setReportConfig}
            />
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3. Configuration Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Entities:</span>{" "}
                  {reportConfig.entities.length > 0
                    ? reportConfig.entities.join(", ")
                    : "None"}
                </div>
                <div>
                  <span className="font-medium">Fields:</span>{" "}
                  {reportConfig.fields.length} selected
                </div>
                <div>
                  <span className="font-medium">Filters:</span>{" "}
                  {reportConfig.filters.length} active
                </div>
                <div>
                  <span className="font-medium">Joins:</span>{" "}
                  {reportConfig.joins.length} configured
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {reportResults && (
            <ReportPreview data={reportResults} config={reportConfig} />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showSaveDialog && (
        <SaveReportDialog
          config={reportConfig}
          onClose={() => setShowSaveDialog(false)}
          onSuccess={handleSaveSuccess}
        />
      )}

      {showSavedReports && (
        <SavedReportsManager
          onClose={() => setShowSavedReports(false)}
          onLoadReport={handleLoadReport}
        />
      )}
    </div>
  );
}
