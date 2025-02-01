'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Status, Material, PurchaseOrder } from "@prisma/client";
import { EditPurchaseOrderLineDialog } from "./edit-orderline-dialog";
import { DeletePurchaseOrderLineDialog } from "./delete-orderline-dialog";

interface PurchaseOrderLineWithRelations {
  id: string;
  poId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  status: Status;
  notes?: string;
  createdBy?: string;
  modifiedBy?: string;
  material: Material;
  purchaseOrder: PurchaseOrder;
}

interface DataTableColumnProps {
  onSuccess?: () => Promise<void>;
}

export const createColumns = ({ onSuccess }: DataTableColumnProps): ColumnDef<PurchaseOrderLineWithRelations>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "poId",
    header: "Purchase Order ID",
  },
  {
    accessorKey: "material.name",
    header: "Material",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = Number(row.getValue("unitPrice"));
      return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Status;
      return <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{status.toLowerCase()}</Badge>;
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
  },
  {
    accessorKey: "modifiedBy",
    header: "Modified By",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const purchaseOrderLine = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <EditPurchaseOrderLineDialog
              purchaseOrderLine={purchaseOrderLine}
              onSuccess={onSuccess}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              }
            />
            <DeletePurchaseOrderLineDialog
              purchaseOrderLine={purchaseOrderLine}
              onSuccess={onSuccess}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
