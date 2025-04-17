"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { InspectorForm } from "./inspector-form";
import { updateInspector, Inspector } from "@/lib/actions/inspector";
import { InspectorFormValues } from "./schema";

interface EditInspectorDialogProps {
  inspector: Inspector;
  departments: string[];
  specializations: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void>;
}

export function EditInspectorDialog({
  inspector,
  departments = [],
  specializations = [],
  open,
  onOpenChange,
  onSuccess,
}: EditInspectorDialogProps) {
  // const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: InspectorFormValues) {
    setIsSubmitting(true);
    try {
      await updateInspector(inspector.inspectorId, data);
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Edit details
        </DropdownMenuItem>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Inspector</DialogTitle>
          <DialogDescription>
            Update inspector information and details.
          </DialogDescription>
        </DialogHeader>
        {open && (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
              <div className="bg-white p-6 rounded shadow-md">
                <h2 className="text-lg font-bold">Edit Inspector</h2>
                <InspectorForm
                  initialData={inspector}
                  departments={departments}
                  specializations={specializations}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}
