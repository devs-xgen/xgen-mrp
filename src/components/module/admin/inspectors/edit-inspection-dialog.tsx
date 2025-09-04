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
import { InspectorForm } from "./inspector-form";
import { updateInspector, Inspector } from "@/lib/actions/inspector";
import { InspectorFormValues } from "./schema";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: InspectorFormValues) {
    setIsSubmitting(true);
    try {
      await updateInspector(inspector.inspectorId, data);
      
      toast({
        title: "Success",
        description: "Inspector updated successfully",
      });
      
      onOpenChange(false);
      
      if (onSuccess) {
        await onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating inspector:", error);
      
      toast({
        title: "Error",
        description: 
          error instanceof Error 
            ? error.message 
            : "Failed to update inspector. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-4 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Edit Inspector</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update inspector information and details. Changes will be saved to the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <InspectorForm
            initialData={inspector}
            departments={departments}
            specializations={specializations}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
