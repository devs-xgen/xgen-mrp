"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { WorkCenter } from "@prisma/client"; // Import WorkCenter

interface DeleteWorkCenterDialogProps {
  workCenter: WorkCenter;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function DeleteWorkCenterDialog({
  workCenter,
  trigger,
  onSuccess,
}: DeleteWorkCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/work-centers/${workCenter.id}`, { // Updated API endpoint
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json(); // Get error details if available
        throw new Error(errorData.message || "Failed to delete work center"); // Use more specific error message
      }

      toast({
        title: "Success",
        description: "Work center deleted successfully", // Updated message
      });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) { // Type the error as any
      toast({
        title: "Error",
        description: error.message || "Failed to delete work center", // Display potentially more specific error
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the work center &quot;{workCenter.name}&quot;.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}