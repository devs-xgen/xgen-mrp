"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Package, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bulkReleaseMaterialReservations } from "@/lib/actions/superadmin/material-reservation";

const formSchema = z.object({
  reason: z.string().min(15, "Reason must be at least 15 characters for audit trail"),
});

interface BulkReleaseReservationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReservationIds: string[];
  reservations: any[];
  onSuccess?: () => void;
}

export function BulkReleaseReservationsDialog({
  open,
  onOpenChange,
  selectedReservationIds,
  reservations,
  onSuccess,
}: BulkReleaseReservationsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Group reservations by material
  const materialsSummary = useMemo(() => {
    const grouped = reservations.reduce((acc, reservation) => {
      const materialId = reservation.materialId;
      const releaseQty = Number(reservation.quantityReserved) - Number(reservation.quantityConsumed);

      const existing = acc.find(m => m.materialId === materialId);
      if (existing) {
        existing.totalReleased += releaseQty;
        existing.reservationCount++;
        existing.hasPartialConsumption = existing.hasPartialConsumption || Number(reservation.quantityConsumed) > 0;
      } else {
        acc.push({
          materialId,
          materialName: reservation.material.name,
          materialSku: reservation.material.sku,
          totalReleased: releaseQty,
          reservationCount: 1,
          unit: reservation.material.unitOfMeasure?.abbreviation || "units",
          hasPartialConsumption: Number(reservation.quantityConsumed) > 0,
        });
      }
      return acc;
    }, [] as Array<{
      materialId: string;
      materialName: string;
      materialSku: string;
      totalReleased: number;
      reservationCount: number;
      unit: string;
      hasPartialConsumption: boolean;
    }>);

    return grouped.sort((a, b) => b.totalReleased - a.totalReleased);
  }, [reservations]);

  const hasPartialConsumption = materialsSummary.some(m => m.hasPartialConsumption);
  const totalQuantityToRelease = materialsSummary.reduce((sum, m) => sum + m.totalReleased, 0);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const result = await bulkReleaseMaterialReservations(
        selectedReservationIds,
        values.reason
      );

      if (!result.success) {
        toast({
          title: "Bulk Release Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Show success toast with detailed info
      const skippedCount = result.skipped.length;
      const successCount = result.count;

      toast({
        title: "Bulk Release Successful",
        description: (
          <div className="space-y-1">
            <div>
              Released {successCount} reservation{successCount > 1 ? "s" : ""} across {result.materialsSummary.length} material{result.materialsSummary.length > 1 ? "s" : ""}
            </div>
            {skippedCount > 0 && (
              <div className="text-amber-600 text-xs mt-1">
                Skipped {skippedCount} reservation{skippedCount > 1 ? "s" : ""} (already released or fully consumed)
              </div>
            )}
          </div>
        ),
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Bulk Release Failed",
        description: error.message || "Failed to release reservations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Bulk Release Material Reservations
          </DialogTitle>
          <DialogDescription>
            Release multiple material reservations with a single audit reason
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          {/* Warning Banner */}
          <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Bulk Release Action
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              This action will release <strong>{selectedReservationIds.length} material reservations</strong>
              {" "}and update committed stock for <strong>{materialsSummary.length} materials</strong>.
              All changes will be logged in the audit trail.
            </AlertDescription>
          </Alert>

          {/* Partial Consumption Warning */}
          {hasPartialConsumption && (
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Package className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">
                Partial Consumption Detected
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                Some reservations have been partially consumed. Only the <strong>remaining unused quantity</strong> will be released.
              </AlertDescription>
            </Alert>
          )}

          {/* Selected Reservations Summary */}
          <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Selected Reservations:</span>
                <Badge>{selectedReservationIds.length}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Total to release: <strong>{totalQuantityToRelease.toLocaleString()}</strong> units
              </div>
            </div>
          </div>

          {/* Materials Summary Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Reservations</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialsSummary.map((material) => (
                  <TableRow key={material.materialId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{material.materialName}</div>
                        <div className="text-xs text-muted-foreground">
                          {material.materialSku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{material.reservationCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {material.totalReleased.toLocaleString()} {material.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      {material.hasPartialConsumption ? (
                        <Badge variant="secondary" className="text-xs">
                          Partial
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          Full
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Audit Reason Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="pt-4 border-t">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bulk Release Reason (Required - Min 15 characters)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain why you're releasing these material reservations in bulk..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This reason will apply to all {selectedReservationIds.length} reservations and will be logged in the audit trail
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? `Releasing ${selectedReservationIds.length} reservations...`
                    : `Release ${selectedReservationIds.length} Reservations`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
