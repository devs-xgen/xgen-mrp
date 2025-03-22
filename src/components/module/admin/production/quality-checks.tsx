"use client";

import { useState } from "react";
import { Status } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateQualityCheck } from "@/lib/actions/quality-checks";

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
import { useParams } from "next/dist/client/components/navigation";

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
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>(checks);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const params = useParams();

  const productionOrderId = propId || (params?.id as string);

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
    // Simply refresh the data when a new check is created
    if (onRefresh) {
      await onRefresh();
    }
  };

  const filteredChecks = qualityChecks.filter(
    (check) => check.productionOrderId === productionOrderId
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Quality Checks</CardTitle>
            <CardDescription>
              Quality inspection reports and actions
            </CardDescription>
          </div>
          <CreateQualityCheckDialog
            productionOrderId={productionOrderId}
            onRefresh={onRefresh || handleQualityCheckCreated}
          />
        </div>
      </CardHeader>
      <CardContent>
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
                return (
                  <TableRow key={check.id}>
                    <TableCell>{formatDate(check.checkDate)}</TableCell>
                    <TableCell>{check.inspectorName || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(check.status)}>
                        {check.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{check.defectsFound || "None"}</TableCell>
                    <TableCell>{check.actionTaken || "—"}</TableCell>
                    <TableCell className="text-right">
                      {nextStatus && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(
                              check.id,
                              nextStatus,
                              check.defectsFound,
                              check.actionTaken
                            )
                          }
                          disabled={updatingId === check.id || isLoading}
                        >
                          {updatingId === check.id && (
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
