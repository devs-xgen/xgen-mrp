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
import { AlertTriangle, MoreHorizontal, Pencil, Archive, Eye, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Status } from "@prisma/client";

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
  const initialSearchValue = searchParams.get("search") ?? "";
  const initialStatus = searchParams.get("status") ?? "all";
  const initialType = searchParams.get("typeId") ?? "all";
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState(initialType);

  useEffect(() => {
    setSearchValue(initialSearchValue);
  }, [initialSearchValue]);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setTypeFilter(initialType);
  }, [initialType]);

  useEffect(() => {
    const currentSearchParam = searchParams.get("search") ?? "";
    if (searchValue === currentSearchParam) {
      return;
    }

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const normalized = searchValue.trim();

      if (normalized) {
        params.set("search", normalized);
      } else {
        params.delete("search");
      }

      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
  }, [pathname, router, searchParams, searchValue]);

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

  const applyFilters = (filters: {
    search?: string;
    status?: string;
    typeId?: string;
    page?: string;
    limit?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (filters.search !== undefined) {
      const normalized = filters.search.trim();
      if (normalized) {
        params.set("search", normalized);
      } else {
        params.delete("search");
      }
    }

    if (filters.status !== undefined) {
      if (filters.status && filters.status !== "all") {
        params.set("status", filters.status);
      } else {
        params.delete("status");
      }
    }

    if (filters.typeId !== undefined) {
      if (filters.typeId && filters.typeId !== "all") {
        params.set("typeId", filters.typeId);
      } else {
        params.delete("typeId");
      }
    }

    if (filters.page !== undefined) {
      params.set("page", filters.page);
    }

    if (filters.limit !== undefined) {
      params.set("limit", filters.limit);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const onPaginationChange = (
    updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)
  ) => {
    const previous = pagination;
    const next = typeof updaterOrValue === "function" ? updaterOrValue(previous) : updaterOrValue;

    applyFilters({
      page: (next.pageIndex + 1).toString(),
      limit: next.pageSize.toString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search materials by name or SKU"
                className="pl-8"
              />
            </div>
            {searchValue && (
              <Button variant="ghost" size="sm" onClick={() => setSearchValue("")}>
                Clear
              </Button>
            )}
          </div>
          {metadata && (
            <div className="text-sm text-muted-foreground text-right">
              Showing {materials.length} of {metadata.total} materials
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                applyFilters({ status: value, page: "1" });
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(Status)
                  .filter((statusValue) => statusValue !== Status.ARCHIVED)
                  .map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {statusValue.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                applyFilters({ typeId: value, page: "1" });
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Material Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {materialTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== "all" || typeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                applyFilters({ status: "all", typeId: "all", page: "1" });
              }}
            >
              Reset filters
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={materials}
        {...tableConfig}
        showSearchInput={false}
        customToolbarActions={<MaterialsExportButton />}
        manualPagination={!!metadata}
        pageCount={metadata?.totalPages ?? -1}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
      />
    </div>
  );
}
