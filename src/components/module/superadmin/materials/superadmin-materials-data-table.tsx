"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Material,
  MaterialType,
  UnitOfMeasure,
  Supplier,
} from "@/types/admin/materials";
import { DataTable } from "@/components/global/table/data-table";
import {
  createCurrencyColumn,
  createSelectionColumn,
  createStatusColumn,
} from "@/components/global/table/column-helpers";
import { getTableConfig } from "@/components/global/table";
import type { ColumnDef } from "@tanstack/react-table";
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
import { AlertTriangle, Eye, MoreHorizontal, Pencil, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SuperAdminMaterialsExportButton } from "./superadmin-materials-export-button";
import { SuperAdminEditMaterialDialog } from "./superadmin-edit-material-dialog";
import { archiveMaterialForSuperAdmin } from "@/lib/actions/superadmin/materials";

interface SuperAdminMaterialsDataTableProps {
  materials: Material[];
  materialTypes: MaterialType[];
  unitOfMeasures: UnitOfMeasure[];
  suppliers: Supplier[];
  onRefresh: () => Promise<void> | void;
}

export function SuperAdminMaterialsDataTable({
  materials,
  materialTypes,
  unitOfMeasures,
  suppliers,
  onRefresh,
}: SuperAdminMaterialsDataTableProps) {
  const columns = useMemo<ColumnDef<Material>[]>(
    () => [
      createSelectionColumn<Material>(),
      {
        accessorKey: "name",
        header: "Material",
        cell: ({ row }) => {
          const material = row.original;
          return (
            <div>
              <div className="font-medium text-foreground">{material.name}</div>
              <div className="text-xs text-muted-foreground">SKU: {material.sku}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => row.original.type?.name ?? "—",
      },
      {
        accessorKey: "unitOfMeasure",
        header: "Unit",
        cell: ({ row }) => {
          const unit = row.original.unitOfMeasure;
          return unit ? `${unit.name} (${unit.symbol})` : "—";
        },
      },
      createCurrencyColumn<Material>("costPerUnit", "Cost / Unit", "PHP"),
      {
        accessorKey: "currentStock",
        header: "Stock",
        cell: ({ row }) => {
          const stock = Number(row.original.currentStock ?? 0);
          const minStock = Number(row.original.minimumStockLevel ?? 0);
          const isLow = stock <= minStock;
          return (
            <div className="flex items-center gap-2">
              <span>{stock}</span>
              {isLow && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </div>
          );
        },
      },
      createStatusColumn<Material>("status"),
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <MaterialActionsCell
            material={row.original}
            materialTypes={materialTypes}
            unitOfMeasures={unitOfMeasures}
            suppliers={suppliers}
            onRefresh={onRefresh}
          />
        ),
      },
    ],
    [materialTypes, onRefresh, suppliers, unitOfMeasures]
  );

  const tableConfig = getTableConfig("materials");

  return (
    <DataTable
      columns={columns}
      data={materials}
      {...tableConfig}
      customToolbarActions={<SuperAdminMaterialsExportButton />}
    />
  );
}

interface MaterialActionsCellProps {
  material: Material;
  materialTypes: MaterialType[];
  unitOfMeasures: UnitOfMeasure[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

function MaterialActionsCell({
  material,
  materialTypes,
  unitOfMeasures,
  suppliers,
  onRefresh,
}: MaterialActionsCellProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const confirmationKeyword = "ARCHIVE";
  const canArchive = confirmationText.trim().toUpperCase() === confirmationKeyword;

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      await archiveMaterialForSuperAdmin(material.id, archiveReason || undefined);
      toast({
        title: "Material archived",
        description: `${material.name} has been archived successfully.`,
      });
      setConfirmOpen(false);
      setConfirmationText("");
      setArchiveReason("");
      onRefresh();
    } catch (error) {
      toast({
        title: "Archive failed",
        description:
          error instanceof Error ? error.message : "Unable to archive material.",
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
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={() => router.push(`/superadmin/materials/${material.id}`)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Archive className="mr-2 h-3.5 w-3.5" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SuperAdminEditMaterialDialog
        material={material}
        materialTypes={materialTypes}
        unitOfMeasures={unitOfMeasures}
        suppliers={suppliers}
        open={isEditing}
        onOpenChange={setIsEditing}
        onSuccess={onRefresh}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Archive Material
            </AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will hide "{material.name}" from active workflows. Existing records
              referencing this material are preserved.
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor={`archive-reason-${material.id}`}>
                    Archive reason (optional)
                  </Label>
                  <Textarea
                    id={`archive-reason-${material.id}`}
                    value={archiveReason}
                    onChange={(event) => setArchiveReason(event.target.value)}
                    placeholder="Add a brief reason for archiving..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor={`confirmation-${material.id}`}>
                    Type <code className="bg-muted px-1 rounded">{confirmationKeyword}</code> to
                    confirm:
                  </Label>
                  <Input
                    id={`confirmation-${material.id}`}
                    value={confirmationText}
                    onChange={(event) => setConfirmationText(event.target.value)}
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
              onClick={handleArchive}
              disabled={!canArchive || isArchiving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArchiving ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
