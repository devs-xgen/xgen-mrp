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
import { AlertTriangle, MoreHorizontal, Pencil, Archive, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MaterialsExportButton } from "@/components/module/admin/materials/materials-export-button";
import { PaginationState } from "@tanstack/react-table";

interface MaterialsDataTableProps {
  materials: Material[];
  metadata?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [reason, setReason] = useState("");

  const confirmationRequired = "ARCHIVE";
  const isConfirmationValid = confirmationText.toUpperCase() === confirmationRequired;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMaterial(material.id, reason || undefined);

      toast({
        title: "✅ Success",
        description: `Material "${material.name}" has been archived successfully`,
      });

      setDeleteOpen(false);
      setConfirmationText("");
      setReason("");
      onRefresh();
    } catch (error) {
      toast({
        title: "❌ Archive Failed",
        description: error instanceof Error ? error.message : "Failed to archive material",
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
          <DropdownMenuItem onClick={() => router.push(`/admin/materials/${material.id}`)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Archive className="mr-2 h-3.5 w-3.5" />
            Archive
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
            <AlertDialogTitle className="text-destructive">Archive Material</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will hide &quot;{material.name}&quot; from listings and prevent future use in orders, BOMs, or purchases. Existing records that reference it will be preserved.
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="archive-reason">Archive Reason (optional)</Label>
                  <Textarea
                    id="archive-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Add a brief reason for archiving..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmation">
                    Type <code className="bg-muted px-1 rounded">{confirmationRequired}</code> to confirm:
                  </Label>
                  <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type ARCHIVE to confirm"
                    className="mt-2"
                  />
                </div>
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
              {isDeleting ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function MaterialsDataTable({
  materials,
  metadata,
  materialTypes,
  unitOfMeasures,
  suppliers,
  onRefresh
}: MaterialsDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create columns using global table helpers
  const columns = [
    createSelectionColumn<Material>(),
    {
      accessorKey: "name",
      header: "Material Name",
      cell: ({ row }) => {
        const material = row.original;
        return (
          <div>
            <div className="font-medium">{material.name}</div>
            <div className="text-xs text-muted-foreground">SKU: {material.sku}</div>
          </div>
        );
      },
    },
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

  // Handle server-side pagination
  const pagination: PaginationState = {
    pageIndex: (metadata?.page ?? 1) - 1,
    pageSize: metadata?.limit ?? 10,
  };

  const onPaginationChange = (updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const previous = pagination;
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(previous) : updaterOrValue;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (next.pageIndex + 1).toString());
    params.set("limit", next.pageSize.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={materials}
      {...tableConfig}
      customToolbarActions={<MaterialsExportButton />}
      manualPagination={!!metadata}
      pageCount={metadata?.totalPages ?? -1}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
}
