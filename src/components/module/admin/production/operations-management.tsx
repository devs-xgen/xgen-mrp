// src/components/module/admin/production/operations-management.tsx
"use client";

import { useState, useEffect } from "react";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Loader2, Trash2, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// Valid statuses for operations
const OPERATION_STATUSES: Status[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
];

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

  // Debug logging
  useEffect(() => {
    console.log("Operations:", operations);
    operations.forEach(operation => {
      const canDelete = operation.status === "PENDING";
      console.log("Operation:", operation.id, "canDelete:", canDelete);
    });
  }, [operations]);

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

  const getStatusBadgeVariant = (
    status: Status
  ): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Function to format status for display
  const formatStatus = (status: Status): string => {
    return status.toLowerCase().replace("_", " ");
  };

  // Status indicator dot color
  const getStatusDotColor = (status: Status): string => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  // Row background color
  const getRowBackgroundClass = (status: Status): string => {
    switch (status) {
      case "COMPLETED":
        return "bg-muted/30";
      case "IN_PROGRESS":
        return "bg-secondary/10";
      case "CANCELLED":
        return "bg-destructive/10";
      default:
        return "";
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
              <TableHead className="text-right font-bold bg-muted/30">Actions</TableHead>
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
                const canDelete = operation.status === "PENDING";
                return (
                  <TableRow
                    key={operation.id}
                    className={getRowBackgroundClass(operation.status)}
                  >
                    <TableCell className="font-medium">
                      {operation.workCenter.name}
                    </TableCell>
                    <TableCell>{formatDate(operation.startTime)}</TableCell>
                    <TableCell>{formatDate(operation.endTime)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(operation.status)}`}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 p-0 font-normal"
                            >
                              <Badge
                                variant={getStatusBadgeVariant(operation.status)}
                                className="mr-1"
                              >
                                {updatingId === operation.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : null}
                                {formatStatus(operation.status)}
                              </Badge>
                              <ChevronDown className="h-3 w-3 opacity-70" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            {OPERATION_STATUSES.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusUpdate(operation.id, status)}
                                disabled={operation.status === status}
                                className={operation.status === status ? "bg-muted" : ""}
                              >
                                {formatStatus(status)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                    <TableCell className="text-right border border-dashed border-gray-200 p-2">
                      {canDelete ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full h-9 px-3"
                              disabled={deletingId === operation.id || isLoading}
                            >
                              {deletingId === operation.id ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
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
                      ) : (
                        <span className="text-sm text-muted-foreground">On Going Task</span>
                      )}
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
