"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, getTableConfig } from "@/components/global/table";
import type { Material, MaterialType, UnitOfMeasure, Supplier } from "@/types/admin/materials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { unarchiveMaterial } from "@/lib/actions/materials";
import { useToast } from "@/hooks/use-toast";

export type ArchivedMaterialRow = Material & {
  type?: Pick<MaterialType, "id" | "name"> | null;
  unitOfMeasure?: Pick<UnitOfMeasure, "id" | "name" | "symbol"> | null;
  supplier?: Pick<Supplier, "id" | "name"> | null;
};

interface ArchivedMaterialsClientProps {
  data: ArchivedMaterialRow[];
}

export default function ArchivedMaterialsClient({ data }: ArchivedMaterialsClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const onUnarchive = async (id: string, name: string) => {
    try {
      const result = await unarchiveMaterial(id);
      if (result?.success) {
        toast({ title: "Success", description: `Material "${name}" unarchived` });
        router.refresh();
      } else {
        throw new Error(result?.error || "Failed to unarchive material");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to unarchive material",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<ArchivedMaterialRow>[] = [
    {
      accessorKey: "name",
      header: "Material Name",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">SKU: {row.original.sku}</div>
        </div>
      ),
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
    {
      accessorKey: "archivedAt",
      header: "Archived At",
      cell: ({ row }) => {
        const v = row.original as any;
        const dt = v.archivedAt ? new Date(v.archivedAt) : null;
        return dt ? dt.toLocaleString() : "-";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => <Badge variant="secondary">archived</Badge>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="default"
          onClick={() => onUnarchive(row.original.id, row.original.name)}
        >
          Unarchive
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const tableConfig = getTableConfig("materials");

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
      searchPlaceholder="Filter by name or SKU..."
    />
  );
}
