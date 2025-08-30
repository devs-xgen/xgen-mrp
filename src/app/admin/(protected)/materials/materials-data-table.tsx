"use client";

import { DataTable } from "@/components/global/table/data-table";
import { 
  createSelectionColumn,
  createTextColumn,
  createStatusColumn,
  createCurrencyColumn,
} from "@/components/global/table/column-helpers";
import { getTableConfig } from "@/components/global/table/table-utils";
import { EditMaterialDialog } from "@/components/module/admin/materials/edit-material-dialog";
import { deleteMaterial } from "@/lib/actions/materials";
import { Material, MaterialType, UnitOfMeasure, Supplier } from "@/types/admin/materials";
import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";

interface MaterialsDataTableProps {
  materials: Material[];
  materialTypes: MaterialType[];
  unitOfMeasures: UnitOfMeasure[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

// Material Actions Cell Component
function MaterialActionsCell({ 
  material, 
  materialTypes, 
  unitOfMeasures, 
  suppliers, 
  onRefresh 
}: { 
  material: Material; 
  materialTypes: MaterialType[];
  unitOfMeasures: UnitOfMeasure[];
  suppliers: Supplier[];
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const confirmationRequired = "DELETE";
  const isConfirmationValid = confirmationText.toUpperCase() === confirmationRequired;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMaterial(material.id);

      toast({
        title: "✅ Success",
        description: `Material "${material.name}" has been deleted successfully`,
      });

      setDeleteOpen(false);
      setConfirmationText("");
      onRefresh();
    } catch (error) {
      toast({
        title: "❌ Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete material",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
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
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditMaterialDialog
        material={material}
        materialTypes={materialTypes}
        unitOfMeasures={unitOfMeasures}
        suppliers={suppliers}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onRefresh}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{material.name}"? This action cannot be undone.
              <div className="mt-4">
                <Label htmlFor="confirmation">
                  Type <code className="bg-muted px-1 rounded">{confirmationRequired}</code> to confirm:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function MaterialsDataTable({ 
  materials, 
  materialTypes, 
  unitOfMeasures, 
  suppliers, 
  onRefresh 
}: MaterialsDataTableProps) {
  // Create columns using global table helpers
  const columns = [
    createSelectionColumn<Material>(),
    createTextColumn<Material>("name", "Material Name", "sku"),
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => row.original.type?.name || "-",
    },
    {
      accessorKey: "unitOfMeasure",
      header: "Unit",
      cell: ({ row }) => {
        const uom = row.original.unitOfMeasure;
        return uom ? `${uom.name} (${uom.symbol})` : "-";
      },
    },
    createCurrencyColumn<Material>("costPerUnit", "Cost / Unit", "PHP"),
    {
      accessorKey: "currentStock",
      header: "Current Stock",
      cell: ({ row }) => {
        const stock = Number(row.getValue("currentStock"));
        const minStock = row.original.minimumStockLevel;
        const isLowStock = stock <= minStock;

        return (
          <div className="flex items-center">
            <span>{stock}</span>
            {isLowStock && (
              <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
            )}
          </div>
        );
      },
    },
    createStatusColumn<Material>("status"),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const material = row.original;
        return (
          <MaterialActionsCell
            material={material}
            materialTypes={materialTypes}
            unitOfMeasures={unitOfMeasures}
            suppliers={suppliers}
            onRefresh={onRefresh}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Get predefined table config
  const tableConfig = getTableConfig("materials");

  return (
    <DataTable
      columns={columns}
      data={materials}
      {...tableConfig}
    />
  );
}
