// src/components/module/admin/work-centers/delete-work-center-dialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteWorkCenter } from "@/lib/actions/work-center";
import { useState } from "react";

interface DeleteWorkCenterDialogProps {
  workCenterId: string;
  workCenterName: string;
  onSuccess?: () => Promise<void>;
  children?: React.ReactNode;
}

export function DeleteWorkCenterDialog({
  workCenterId,
  workCenterName,
  onSuccess,
  children,
}: DeleteWorkCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handleDelete() {
    try {
      await deleteWorkCenter(workCenterId);
      setOpen(false);
      if (onSuccess) await onSuccess();

      toast({
        title: "Work Center Deleted",
        description: `Successfully deleted work center "${workCenterName}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children || <Button variant="destructive">Delete</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Work Center</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the work center "{workCenterName}"?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
