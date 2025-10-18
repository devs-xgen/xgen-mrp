// src/components/module/worker/tasks/operations-management.tsx
// src/components/module/worker/tasks/operations-management.tsx
"use client";

import { useState, useEffect } from "react";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Loader2, Trash2, ChevronDown, Factory, ClipboardList } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditOperationDialog } from "./edit-operation-dialog";

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

  if (isLoading) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading operations...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/10 pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center">
            <Factory className="h-5 w-5 mr-2 text-primary/80" />
            <div>
              <CardTitle className="text-lg font-bold">
                Production Operations
              </CardTitle>
              <CardDescription className="text-sm">
                Manage work center operations and track their progress
              </CardDescription>
            </div>
          </div>
          {/* <AddOperationDialog
            workCenters={workCenters}
            productionOrderId={productionOrderId}
            onOperationAdded={onRefresh}
          /> */}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {operations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4 opacity-60" />
            <h3 className="text-lg font-medium mb-1">No Operations Scheduled</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-4">
              Add a production operation to assign work centers and track manufacturing progress
            </p>
            <AddOperationDialog
              workCenters={workCenters}
              productionOrderId={productionOrderId}
              onOperationAdded={onRefresh}
            >
              <Button>Schedule First Operation</Button>
            </AddOperationDialog>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead>Work Center</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((operation) => {
                    const canEdit = operation.status === "PENDING";
                    const canDelete = operation.status === "PENDING";
                    return (
                      <TableRow
                        key={operation.id}
                        className={`${getRowBackgroundClass(operation.status)} hover:bg-muted/20 transition-colors`}
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
                                  className="h-8 p-0 px-2 font-normal"
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
                                  <ChevronDown className="h-3 w-3 opacity-70 ml-1" />
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
                        <TableCell className="max-w-[200px] truncate">
                          {operation.notes || <span className="text-muted-foreground text-sm italic">No notes</span>}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {canEdit && (
                            <EditOperationDialog
                              operation={operation}
                              workCenters={workCenters}
                              onOperationUpdated={onRefresh}
                            />
                          )}
                          {canDelete ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingId === operation.id}
                                >
                                  {deletingId === operation.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Delete</span>
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
                            !canEdit && <span className="text-xs text-muted-foreground px-2">Active</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}