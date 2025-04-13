"use client";

import { useState, useEffect } from "react";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateQualityCheck,
  deleteQualityCheck,
} from "@/lib/actions/quality-checks";
import { getInspector } from "@/lib/actions/inspector";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateQualityCheckDialog } from "./create-quality-check-dialog";
import { QualityCheck } from "@/types/admin/quality-checks";
import { useParams } from "next/navigation";
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

interface QualityChecksProps {
  productionOrderId: string;
  checks: QualityCheck[];
  onAddCheck?: () => void | undefined;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export function QualityChecks({
  productionOrderId: propId,
  checks,
  onRefresh,
  isLoading = false,
}: QualityChecksProps) {
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>(
    checks || []
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const params = useParams();

  const productionOrderId = propId || (params?.id as string);

  // Update local state when checks prop changes
  useEffect(() => {
    // Only update if checks is provided
    if (checks) {
      console.log("Quality checks received from props:", checks);
      console.log("Production order ID:", productionOrderId);
      setQualityChecks(checks);
    }
  }, [checks, productionOrderId]);

  const handleStatusUpdate = async (
    id: string,
    newStatus: Status,
    defectsFound: string | null = null,
    actionTaken: string | null = null,
    notes: string | null = null
  ) => {
    try {
      setUpdatingId(id);
      const data = {
        id,
        status: newStatus,
        defectsFound: defectsFound === null ? undefined : defectsFound,
        actionTaken: actionTaken === null ? undefined : actionTaken,
        notes: notes === null ? undefined : notes,
      };
      const updatedCheck = await updateQualityCheck(id, newStatus, data);

      if (updatedCheck) {
        setQualityChecks((prevChecks) =>
          prevChecks.map((check) =>
            check.id === updatedCheck.id ? updatedCheck : check
          )
        );
      }

      if (onRefresh) await onRefresh();

      toast({
        title: "Quality Check Updated",
        description: `Quality check status updated to ${newStatus
          .toLowerCase()
          .replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update quality check",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteQualityCheck = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteQualityCheck(id);

      // Remove from local state
      setQualityChecks((prevChecks) =>
        prevChecks.filter((check) => check.id !== id)
      );

      // Refresh from server if needed
      if (onRefresh) await onRefresh();

      toast({
        title: "Quality Check Deleted",
        description: "The quality check has been successfully removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete quality check",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getNextStatus = (currentStatus: Status): Status | null => {
    switch (currentStatus) {
      case "PENDING":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "COMPLETED";
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (
    status: Status
  ): "default" | "secondary" | "outline" => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getActionButtonText = (nextStatus: Status) => {
    switch (nextStatus) {
      case "IN_PROGRESS":
        return "Start";
      case "COMPLETED":
        return "Complete";
      default:
        return "Update";
    }
  };

  const handleQualityCheckCreated = async () => {
    console.log("Quality check created - refreshing data");
    // Simply refresh the data when a new check is created
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Filter checks for this specific production order
  const filteredChecks =
    qualityChecks?.filter(
      (check) => check.productionOrderId === productionOrderId
    ) || [];

  console.log("Filtered quality checks:", filteredChecks);
  console.log("All quality checks:", qualityChecks);

  return (
    <Card className="border-2 border-muted">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">
              Quality Inspections
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Quality control checks and inspection results
            </CardDescription>
          </div>
          <CreateQualityCheckDialog
            productionOrderId={productionOrderId}
            onRefresh={onRefresh || handleQualityCheckCreated}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading quality checks...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Defects Found</TableHead>
                <TableHead>Action Taken</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No quality checks recorded for this production order.
                  </TableCell>
                </TableRow>
              ) : (
                filteredChecks.map((check) => {
                  const nextStatus = getNextStatus(check.status);
                  const canDelete = check.status === "PENDING"; // Only allow deleting pending checks
                  const hasDefects =
                    check.defectsFound && check.defectsFound.trim() !== "";

                  return (
                    <TableRow
                      key={check.id}
                      className={
                        check.status === "COMPLETED"
                          ? hasDefects
                            ? "bg-red-50"
                            : "bg-green-50"
                          : check.status === "IN_PROGRESS"
                          ? "bg-secondary/10"
                          : ""
                      }
                    >
                      <TableCell>{formatDate(check.checkDate)}</TableCell>
                      <TableCell className="font-medium">
                        {check.inspectorName || check.inspectorId || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              check.status === "COMPLETED"
                                ? hasDefects
                                  ? "bg-red-500"
                                  : "bg-green-500"
                                : check.status === "IN_PROGRESS"
                                ? "bg-blue-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <Badge variant={getStatusBadgeVariant(check.status)}>
                            {check.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasDefects ? (
                          <span className="text-sm text-red-700">
                            {check.defectsFound}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            None found
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {check.actionTaken ? (
                          <span className="text-sm">{check.actionTaken}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No action required
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {nextStatus && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(
                                  check.id,
                                  nextStatus,
                                  check.defectsFound || null,
                                  check.actionTaken || null,
                                  check.notes || null
                                )
                              }
                              disabled={updatingId === check.id || isLoading}
                              className={
                                nextStatus === "COMPLETED"
                                  ? "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                                  : "border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              }
                            >
                              {updatingId === check.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {getActionButtonText(nextStatus)}
                            </Button>
                          )}

                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingId === check.id}
                                >
                                  {deletingId === check.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Quality Check
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this quality
                                    check? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteQualityCheck(check.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
