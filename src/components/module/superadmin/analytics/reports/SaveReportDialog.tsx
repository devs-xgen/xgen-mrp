"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ReportConfig } from "@/lib/actions/superadmin/analytics/reports";
import { Loader2 } from "lucide-react";

interface SaveReportDialogProps {
  config: ReportConfig;
  onClose: () => void;
  onSuccess: () => void;
}

export function SaveReportDialog({ config, onClose, onSuccess }: SaveReportDialogProps) {
  const [name, setName] = useState(config.name || "");
  const [description, setDescription] = useState(config.description || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a report name");
      return;
    }

    setIsSaving(true);
    try {
      const { saveReport } = await import("@/lib/actions/superadmin/analytics/reports");
      const result = await saveReport({
        ...config,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || "Failed to save report");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("An error occurred while saving the report");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Report</DialogTitle>
          <DialogDescription>
            Save this report configuration for future use
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Report Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Monthly Production Summary"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of what this report shows..."
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
            <p>
              <strong>Configuration:</strong>
            </p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>{config.entities.length} entities</li>
              <li>{config.fields.length} fields</li>
              <li>{config.filters.length} filters</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
