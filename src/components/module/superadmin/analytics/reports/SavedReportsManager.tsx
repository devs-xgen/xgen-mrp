"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ReportConfig,
  SavedReportData,
} from "@/lib/actions/superadmin/analytics/reports";
import { FileText, Trash2, Download, Loader2, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SavedReportsManagerProps {
  onClose: () => void;
  onLoadReport: (config: ReportConfig) => void;
}

export function SavedReportsManager({ onClose, onLoadReport }: SavedReportsManagerProps) {
  const [reports, setReports] = useState<SavedReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { getSavedReports } = await import("@/lib/actions/superadmin/analytics/reports");
      const result = await getSavedReports();

      if (result.success && result.data) {
        setReports(result.data);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadReport = (report: SavedReportData) => {
    onLoadReport(report.config);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setDeletingId(reportId);
    try {
      const { deleteReport } = await import("@/lib/actions/superadmin/analytics/reports");
      const result = await deleteReport(reportId);

      if (result.success) {
        setReports(reports.filter(r => r.id !== reportId));
      } else {
        alert(result.error || "Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("An error occurred while deleting the report");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVisibility = async (reportId: string, currentVisibility: boolean) => {
    try {
      const { updateReportVisibility } = await import("@/lib/actions/superadmin/analytics/reports");
      const result = await updateReportVisibility(reportId, !currentVisibility);

      if (result.success) {
        setReports(reports.map(r =>
          r.id === reportId ? { ...r, isPublic: !currentVisibility } : r
        ));
      } else {
        alert(result.error || "Failed to update visibility");
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      alert("An error occurred while updating visibility");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved Reports</DialogTitle>
          <DialogDescription>
            Load a previously saved report or delete reports you no longer need
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No Saved Reports</p>
                <p className="text-sm mt-1">
                  Create and save a report to see it here
                </p>
              </div>
            </Card>
          ) : (
            reports.map(report => (
              <Card key={report.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{report.name}</h4>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {report.description}
                          </p>
                        )}
                      </div>
                      {report.isPublic && (
                        <Badge variant="secondary">
                          <Share2 className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {report.config.entities.length} entities
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {report.config.fields.length} fields
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {report.config.filters.length} filters
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      Created by {report.creatorName} •{" "}
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleLoadReport(report)}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Load
                    </Button>
                    <Button
                      onClick={() => handleToggleVisibility(report.id, report.isPublic)}
                      size="sm"
                      variant="outline"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {report.isPublic ? "Private" : "Share"}
                    </Button>
                    <Button
                      onClick={() => handleDeleteReport(report.id)}
                      size="sm"
                      variant="outline"
                      disabled={deletingId === report.id}
                    >
                      {deletingId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
