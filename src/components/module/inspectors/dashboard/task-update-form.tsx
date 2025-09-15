// src/components/module/inspectors/task-update-form.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Status, QualityCheck } from "@prisma/client";
import { InspectorsTask } from "@/types/inspector/task";
import { QualityCheckFormData } from "@/lib/actions/inspector/production-order";

interface TaskUpdateFormProps {
  task: InspectorsTask;
  initialData?: QualityCheck | null;
  onClose: () => void;
  onSubmit: (data: QualityCheckFormData, qualityCheckId?: string) => void;
}

export function TaskUpdateForm({ task, initialData, onClose, onSubmit }: TaskUpdateFormProps) {
  const [defectsFound, setDefectsFound] = useState(initialData?.defectsFound || "");
  const [actionTaken, setActionTaken] = useState(initialData?.actionTaken || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [status, setStatus] = useState<Status>(initialData?.status || Status.COMPLETED);

  // Use useEffect to update state if initialData changes
  useEffect(() => {
    setDefectsFound(initialData?.defectsFound || "");
    setActionTaken(initialData?.actionTaken || "");
    setNotes(initialData?.notes || "");
    setStatus(initialData?.status || Status.COMPLETED);
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      taskId: task.id,
      defectsFound,
      actionTaken,
      notes,
      status,
    }, initialData?.id);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Quality Check" : "Add Quality Check"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value: Status) => setStatus(value)} value={status}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Status.COMPLETED}>Pass/Completed</SelectItem>
                <SelectItem value={Status.CANCELLED}>Rework/Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defectsFound">Defects Found</Label>
            <Textarea
              id="defectsFound"
              value={defectsFound}
              onChange={(e) => setDefectsFound(e.target.value)}
              placeholder="Describe any defects found..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actionTaken">Action Taken</Label>
            <Textarea
              id="actionTaken"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Describe the action taken to resolve defects..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update Check" : "Submit Check"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}