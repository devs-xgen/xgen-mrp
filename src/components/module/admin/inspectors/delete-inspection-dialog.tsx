"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { deleteInspector } from "@/lib/actions/inspector";
import { Inspector } from "@/lib/actions/inspector";
import { Link, UserMinus, AlertTriangle } from "lucide-react";

interface DeleteInspectorDialogProps {
    inspector: Inspector;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => Promise<void>;
}

export function DeleteInspectorDialog({
    inspector,
    open,
    onOpenChange,
    onSuccess,
}: DeleteInspectorDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteInspector(inspector.inspectorId);

            if (result.wasLinkedToUser) {
                toast({
                    title: "Inspector Deleted Successfully",
                    description: `Inspector record deleted. The linked user (${result.userEmail}) has been converted to a Worker role.`,
                });
            } else {
                toast({
                    title: "Inspector Deleted Successfully",
                    description: "Inspector record has been permanently deleted.",
                });
            }
            
            onOpenChange(false);
            await onSuccess?.();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete inspector",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[95vw] sm:max-w-[500px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Delete Inspector Record
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3 pt-2">
                        <div className="space-y-2">
                            <p className="font-medium">
                                You are about to delete the inspector record for:
                            </p>
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="font-semibold text-foreground">
                                    {inspector.firstName} {inspector.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{inspector.email}</p>
                                {inspector.department && (
                                    <Badge variant="outline" className="mt-1">
                                        {inspector.department}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                                {inspector.userId ? (
                                    <>
                                        <Link className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-medium text-blue-800">
                                                Linked User Account Detected
                                            </p>
                                            <p className="text-blue-700 mt-1">
                                                The linked user account will <strong>remain active</strong> and their role will be changed to <strong>Worker</strong>. They can still access the system but no longer as an inspector.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <UserMinus className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-medium text-blue-800">
                                                Standalone Inspector Record
                                            </p>
                                            <p className="text-blue-700 mt-1">
                                                This inspector has no linked user account. Only the inspector record will be deleted.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> This action cannot be undone. The inspector record will be permanently removed from the system.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isDeleting ? "Deleting..." : "Delete Inspector"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}