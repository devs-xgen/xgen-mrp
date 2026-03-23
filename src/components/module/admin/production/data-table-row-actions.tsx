"use client";

import { useState } from "react";
import type { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  EyeIcon,
  PlayCircle,
  Archive,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  updateProductionOrderStatus,
  softDeleteProductionOrder,
} from "@/lib/actions/production-order";
import type { ProductionOrderColumn } from "@/types/admin/production-order";
import { ProductionOrderActionDialog } from "./production-order-action-dialog";
import { PreProductionVerificationDialog } from "./pre-production-verification-dialog";

interface DataTableRowActionsProps {
  row: Row<ProductionOrderColumn>;
  onSuccess?: () => Promise<void>;
}

export function DataTableRowActions({
  row,
  onSuccess,
}: DataTableRowActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  const productionOrder = row.original;

  const handleView = () => {
    router.push(`/admin/production/${productionOrder.id}`);
  };

  const handleStartProduction = async (notes?: string) => {
    try {
      setIsLoading(true);
      await updateProductionOrderStatus(
        productionOrder.id,
        "IN_PROGRESS",
        notes,
      );

      toast({
        title: "✅ Production Started",
        description: `Production for "${productionOrder.productName}" has been started successfully. ${notes ? `Notes: ${notes}` : ""}`,
      });

      if (onSuccess) {
        await onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      await softDeleteProductionOrder(
        productionOrder.id,
        archiveReason || undefined,
      );
      toast({
        title: "Archived",
        description:
          "Production order moved to Trash. Restorable within 30 days.",
      });
      setArchiveDialogOpen(false);
      setArchiveReason("");

      if (onSuccess) {
        await onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to archive production order",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={handleView}>
            <EyeIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Details
          </DropdownMenuItem>

          {productionOrder.status === "PENDING" && (
            <DropdownMenuItem
              disabled={isLoading}
              onClick={() => setVerificationDialogOpen(true)}
            >
              <ShieldAlert className="mr-2 h-3.5 w-3.5 text-blue-600" />
              Verify & Start
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            disabled={isLoading}
            onClick={() => setDialogOpen(true)}
          >
            <PlayCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Manage
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={productionOrder.status === "IN_PROGRESS" || isArchiving}
            onClick={() => setArchiveDialogOpen(true)}
            className="text-amber-600 focus:text-amber-600"
            title={
              productionOrder.status === "IN_PROGRESS"
                ? "Cannot archive in-progress orders"
                : "Archive to Trash (restorable)"
            }
          >
            <Archive className="mr-2 h-3.5 w-3.5" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PreProductionVerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        productionOrderId={productionOrder.id}
        onProceedToProduction={handleStartProduction}
      />

      <ProductionOrderActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productionOrderId={productionOrder.id}
        onSuccess={onSuccess}
      />

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Production Order</AlertDialogTitle>
            <AlertDialogDescription>
              Archive the production order for &quot;{productionOrder.productName}
              &quot; by moving it to Trash. It can be restored within 30 days
              before being permanently deleted.
              {productionOrder.status === "IN_PROGRESS" && (
                <p className="mt-2 text-destructive font-medium">
                  Cannot archive in-progress orders. Complete or cancel it first.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2 space-y-2">
            <Label htmlFor="archive-reason-prod">Reason (optional)</Label>
            <Input
              id="archive-reason-prod"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Why is this production order being archived?"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setArchiveDialogOpen(false);
                setArchiveReason("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isArchiving || productionOrder.status === "IN_PROGRESS"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
