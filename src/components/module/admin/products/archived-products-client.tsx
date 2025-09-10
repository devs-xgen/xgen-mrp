"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, getTableConfig } from "@/components/global/table";
import type { Product, ProductCategory } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { unarchiveProduct } from "@/lib/actions/product";
import { useToast } from "@/hooks/use-toast";

export type ArchivedProductRow = Product & {
  category?: Pick<ProductCategory, "id" | "name"> | null;
};

interface ArchivedProductsClientProps {
  data: ArchivedProductRow[];
}

export default function ArchivedProductsClient({ data }: ArchivedProductsClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const onUnarchive = async (id: string, name: string) => {
    try {
      const result = await unarchiveProduct(id);
      if (result?.success) {
        toast({ title: "Success", description: `Product "${name}" unarchived` });
        router.refresh();
      } else {
        throw new Error(result?.error || "Failed to unarchive product");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to unarchive product",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<ArchivedProductRow>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">SKU: {row.original.sku}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name || "-",
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
      cell: ({ row }) => <Badge variant="secondary">archived</Badge>,
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

  const tableConfig = getTableConfig("products");

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
      searchPlaceholder="Filter by name or SKU..."
    />
  );
}
