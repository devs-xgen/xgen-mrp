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
import { PurchaseOrderLine } from "@prisma/client";

interface DeletePurchaseOrderLineDialogProps {
    orderLine: PurchaseOrderLine;
    trigger: React.ReactNode;
    onSuccess?: () => void;
}

export function DeletePurchaseOrderLineDialog({
    orderLine,
    trigger,
    onSuccess,
}: DeletePurchaseOrderLineDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const onDelete = async () => {
        try {
            setLoading(true);
            // Simulate front-end only deletion logic
            toast({
                title: "Success",
                description: `Order line for material ${orderLine.materialId} deleted successfully`,
            });
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete order line",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the order line for material ID "{orderLine.materialId}".
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={onDelete} disabled={loading}>
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
