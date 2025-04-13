// src/components/module/admin/production/operations-management.tsx
"use client";

import { useState } from "react";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateOperationStatus,
  deleteOperation,
} from "@/lib/actions/production-order";

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
import { AddOperationDialog } from "./add-operation-dialog";
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

interface WorkCenter {
  id: string;
  name: string;
  capacityPerHour: number;
}

interface Operation {
  id: string;
  workCenterId: string;
  startTime: Date;
  endTime: Date;
  status: Status;
  notes?: string | null;
  workCenter: {
    name: string;
  };
}

interface OperationsManagementProps {
  productionOrderId: string;
  operations: Operation[];
  workCenters: WorkCenter[];
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export function OperationsManagement({
  productionOrderId,
  operations,
  workCenters,
  onRefresh,
  isLoading = false,
}: OperationsManagementProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusUpdate = async (id: string, newStatus: Status) => {
    try {
      setUpdatingId(id);
      await updateOperationStatus(id, newStatus);
      if (onRefresh) await onRefresh();

      toast({
        title: "Operation Updated",
        description: `Operation status updated to ${newStatus
          .toLowerCase()
          .replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update operation",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOperation = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteOperation(id);
      if (onRefresh) await onRefresh();

      toast({
        title: "Operation Deleted",
        description: "The operation has been successfully removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete operation",
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

  return (
    <Card className="border-2 border-muted">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">
              Production Operations
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Manage work center operations and track their progress
            </CardDescription>
          </div>
          <AddOperationDialog
            workCenters={workCenters}
            productionOrderId={productionOrderId}
            onOperationAdded={onRefresh}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Center</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No operations scheduled
                </TableCell>
              </TableRow>
            ) : (
              operations.map((operation) => {
                const nextStatus = getNextStatus(operation.status);
                const canDelete = operation.status === "PENDING";
                return (
                  <TableRow
                    key={operation.id}
                    className={
                      operation.status === "COMPLETED"
                        ? "bg-muted/30"
                        : operation.status === "IN_PROGRESS"
                        ? "bg-secondary/10"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {operation.workCenter.name}
                    </TableCell>
                    <TableCell>{formatDate(operation.startTime)}</TableCell>
                    <TableCell>{formatDate(operation.endTime)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            operation.status === "COMPLETED"
                              ? "bg-green-500"
                              : operation.status === "IN_PROGRESS"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <Badge
                          variant={getStatusBadgeVariant(operation.status)}
                        >
                          {operation.status.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {operation.notes ? (
                        <span className="text-sm">{operation.notes}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          None
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
                              handleStatusUpdate(operation.id, nextStatus)
                            }
                            disabled={updatingId === operation.id || isLoading}
                            className={
                              nextStatus === "COMPLETED"
                                ? "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                                : "border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            }
                          >
                            {updatingId === operation.id && (
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
                                disabled={
                                  deletingId === operation.id || isLoading
                                }
                              >
                                {deletingId === operation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Operation
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this
                                  operation? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteOperation(operation.id)
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
      </CardContent>
    </Card>
  );
}
