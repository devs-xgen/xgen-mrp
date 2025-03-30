"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { Material } from "@/types/admin/materials";
import { EditMaterialDialog } from "./edit-material-dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteMaterial } from "@/lib/actions/materials";

interface DataTableRowActionsProps {
  row: Row<Material>;
  materialTypes: { id: string; name: string }[];
  // Fix the type to match what's passed from DataTable
  unitOfMeasures: { id: string; name: string; symbol?: string }[];
  suppliers: { id: string; name: string }[];
  onSuccess?: () => Promise<void>;
}

export function DataTableRowActions({
  row,
  materialTypes,
  unitOfMeasures,
  suppliers,
  onSuccess,
}: DataTableRowActionsProps) {
  const material = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  console.log(`🔄 DataTableRowActions for ${material.name}`, {
    id: material.id,
    showEditDialog,
  });

  const supplierName =
    suppliers.find((s) => s.id === material.supplierId)?.name ||
    "Unknown Supplier";
  const materialTypeName =
    materialTypes.find((t) => t.id === material.typeId)?.name || "Unknown Type";
  const unitOfMeasureInfo = unitOfMeasures.find(
    (u) => u.id === material.unitOfMeasureId
  );

  // Create an enhanced material object with the related data
  const enhancedMaterial = {
    ...material,
    // Simply convert costPerUnit to a number
    costPerUnit: Number(material.costPerUnit),
    // Add the related data objects
    supplier: {
      id: material.supplierId,
      name: supplierName,
    },
    type: {
      id: material.typeId,
      name: materialTypeName,
    },
    unitOfMeasure: unitOfMeasureInfo
      ? {
          id: unitOfMeasureInfo.id,
          name: unitOfMeasureInfo.name,
          symbol: unitOfMeasureInfo.symbol || "", // Handle optional symbol
        }
      : undefined,
  };

  const handleDelete = async () => {
    try {
      await deleteMaterial(material.id);
      setShowDeleteDialog(false);
      if (onSuccess) await onSuccess();
      toast({
        title: "Material deleted",
        description: `${material.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    if (onSuccess) await onSuccess();
    toast({
      title: "Material updated",
      description: `${material.name} has been updated successfully.`,
    });
  };

  const handleEditClick = () => {
    console.log(`📝 Edit button clicked for ${material.name}`);
    setShowEditDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleEditClick}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditMaterialDialog
          material={enhancedMaterial}
          materialTypes={materialTypes}
          unitOfMeasures={unitOfMeasures}
          suppliers={suppliers}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the material "{material.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
