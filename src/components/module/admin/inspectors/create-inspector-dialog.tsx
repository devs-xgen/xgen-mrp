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
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InspectorForm } from "./inspector-form";
import { createInspector } from "@/lib/actions/inspector";
import { InspectorFormValues } from "./schema";

interface CreateInspectorDialogProps {
  departments: string[];
  specializations: string[];
  onSuccess?: () => Promise<void>;
}

export function CreateInspectorDialog({
  departments = [],
  specializations = [],
  onSuccess,
}: CreateInspectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: InspectorFormValues) {
    setIsSubmitting(true);
    try {
      await createInspector(data);
      setOpen(false);
      if (onSuccess) await onSuccess();
      alert("Inspector created successfully!");
    } catch (error) {
      console.error("Error creating inspector:", error);
      alert("Failed to create inspector. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Inspector
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Inspector</DialogTitle>
          <DialogDescription>
            Create a new inspector record. Fill in the information below to add
            an inspector to the system.
          </DialogDescription>
        </DialogHeader>
        <InspectorForm
          departments={departments}
          specializations={specializations}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
