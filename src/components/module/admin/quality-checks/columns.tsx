"use client";

import { ColumnDef } from "@tanstack/react-table";
import { QualityCheckColumn } from "@/types/admin/quality-checks";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/utils";
import { Status } from "@prisma/client";

export const columns: ColumnDef<QualityCheckColumn>[] = [
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("productName")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.productSku}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "checkDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => formatDate(row.getValue("checkDate")),
  },
  {
    accessorKey: "inspector",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Inspector" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Status;
      return (
        <Badge
          variant={
            status === "COMPLETED"
              ? "default"
              : status === "IN_PROGRESS"
              ? "secondary"
              : "outline"
          }
        >
          {status.toLowerCase().replace("_", " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "defectsFound",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Defects" />
    ),
    cell: ({ row }) => {
      const defects = row.getValue("defectsFound") as string | null;
      return defects || "None";
    },
  },
  {
    accessorKey: "actionTaken",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action Taken" />
    ),
    cell: ({ row }) => {
      const action = row.getValue("actionTaken") as string | null;
      return action || "—";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
