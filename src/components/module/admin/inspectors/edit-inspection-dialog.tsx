"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { InspectorForm } from "./inspector-form";
import { updateInspector, Inspector } from "@/lib/actions/inspectors";
import { InspectorFormValues } from "./schema";

interface EditInspectorDialogProps {
  inspector: Inspector;
  departments: string[];
  specializations: string[];
  onSuccess?: () => Promise<void>;
}

export function EditInspectorDialog({
  inspector,
  departments = [],
  specializations = [],
  onSuccess,
}: EditInspectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: InspectorFormValues) {
    setIsSubmitting(true);
    try {
      await updateInspector(inspector.inspectorId, data);
      setOpen(false);
      if (onSuccess) await onSuccess();
      alert("Inspector updated successfully!");
    } catch (error) {
      console.error("Error updating inspector:", error);
      alert("Failed to update inspector. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Edit details
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Inspector</DialogTitle>
          <DialogDescription>
            Update inspector information and details.
          </DialogDescription>
        </DialogHeader>
        <InspectorForm
          initialData={inspector}
          departments={departments}
          specializations={specializations}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}