// src/components/module/admin/production/operations-management.tsx
"use client";

import { useState } from "react";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateOperationStatus } from "@/lib/actions/production-order";

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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Operations</CardTitle>
            <CardDescription>
              Manage production operations and their status
            </CardDescription>
          </div>
          <AddOperationDialog
            workCenters={workCenters}
            productionOrderId={productionOrderId}
            onOperationAdded={onRefresh}
          />
        </div>
      </CardHeader>
      <CardContent>
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
                return (
                  <TableRow key={operation.id}>
                    <TableCell>{operation.workCenter.name}</TableCell>
                    <TableCell>{formatDate(operation.startTime)}</TableCell>
                    <TableCell>{formatDate(operation.endTime)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(operation.status)}>
                        {operation.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{operation.notes || "—"}</TableCell>
                    <TableCell className="text-right">
                      {nextStatus && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(operation.id, nextStatus)
                          }
                          disabled={updatingId === operation.id || isLoading}
                        >
                          {updatingId === operation.id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {getActionButtonText(nextStatus)}
                        </Button>
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
