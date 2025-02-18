// src/components/module/admin/work-centers/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { WorkCenterColumn } from "@/types/admin/work-center";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatDate } from "@/lib/utils";

export const columns: ColumnDef<WorkCenterColumn>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
  },
  {
    accessorKey: "capacityPerHour",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Capacity/Hour" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("capacityPerHour")} units</div>
    ),
  },
  {
    accessorKey: "operatingHours",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Operating Hours" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("operatingHours")} hrs</div>
    ),
  },
  {
    accessorKey: "efficiencyRate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Efficiency" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("efficiencyRate")}%</div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={status === "ACTIVE" ? "default" : "secondary"}
          className="capitalize"
        >
          {status.toLowerCase()}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    cell: ({ row }) => {
      return <div>{formatDate(row.getValue("updatedAt"))}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
