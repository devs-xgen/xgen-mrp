"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FolderOpen, Save, Trash2, Download, Loader2 } from "lucide-react";
import { ReportTemplate, AuditReportConfig } from "@/lib/actions/superadmin/audit-reports";
import { formatDistanceToNow } from "date-fns";

interface SavedReportTemplatesProps {
  currentConfig: AuditReportConfig;
  onLoadTemplate: (config: AuditReportConfig) => void;
}

export function SavedReportTemplates({ currentConfig, onLoadTemplate }: SavedReportTemplatesProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { getReportTemplates } = await import("@/lib/actions/superadmin/audit-reports");
      const result = await getReportTemplates();

      if (result.success && result.data) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      const { saveReportTemplate } = await import("@/lib/actions/superadmin/audit-reports");
      const result = await saveReportTemplate(name, description || null, currentConfig);

      if (result.success) {
        setShowSaveDialog(false);
        setName("");
        setDescription("");
        await loadTemplates();
      } else {
        alert(result.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("An error occurred while saving the template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (template: ReportTemplate) => {
    onLoadTemplate(template.config);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    setDeletingId(templateId);
    try {
      const { deleteReportTemplate } = await import("@/lib/actions/superadmin/audit-reports");
      const result = await deleteReportTemplate(templateId);

      if (result.success) {
        await loadTemplates();
      } else {
        alert(result.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("An error occurred while deleting the template");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Saved Report Templates</h3>
          </div>
          <Button onClick={() => setShowSaveDialog(true)} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Current Config
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No Saved Templates</p>
            <p className="text-sm mt-1">Save your current report configuration to reuse later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <div
                key={template.id}
                className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{template.name}</h4>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {template.config.reportType}
                    </Badge>
                    {template.config.filters?.userId && (
                      <Badge variant="outline" className="text-xs">
                        Filtered by User
                      </Badge>
                    )}
                    {template.config.filters?.actionTypes && template.config.filters.actionTypes.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Action Type Filter
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleLoad(template)} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                  <Button
                    onClick={() => handleDelete(template.id)}
                    size="sm"
                    variant="outline"
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? (
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
            ))}
          </div>
        )}
      </Card>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <Dialog open onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Report Template</DialogTitle>
              <DialogDescription>
                Save your current report configuration for future use
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Monthly SuperAdmin Audit"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description (Optional)</Label>
                <Textarea
                  id="templateDescription"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this report template..."
                  rows={3}
                />
              </div>

              <div className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                <p>
                  <strong>Current Configuration:</strong>
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Report Type: {currentConfig.reportType}</li>
                  <li>
                    Date Range:{" "}
                    {currentConfig.startDate.toLocaleDateString() +
                      " - " +
                      currentConfig.endDate.toLocaleDateString()}
                  </li>
                  {currentConfig.filters?.userId && <li>Filtered by specific user</li>}
                  {currentConfig.filters?.actionTypes && currentConfig.filters.actionTypes.length > 0 && (
                    <li>{currentConfig.filters.actionTypes.length} action type filters</li>
                  )}
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
