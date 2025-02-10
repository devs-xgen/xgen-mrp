"use client";

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
import { WorkCenter, Status } from "@prisma/client";
import { EditWorkCenterDialog } from "./edit-center-dialog";
import { DeleteWorkCenterDialog } from "./delete-center-dialog";
import React from "react";

interface DataTableColumnProps {
  onSuccess?: () => Promise<void>;
}

export const createColumns = ({ onSuccess }: DataTableColumnProps): ColumnDef<WorkCenter>[] => [
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
    accessorKey: "id",
    header: "Work Center Code",
    cell: ({ row }) => {
      const id = row.original.id;
      const formattedId = `WC-${id.substring(id.length - 4).toUpperCase()}`;
      return <span className="font-mono text-blue-600">{formattedId}</span>;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "capacityPerHour",
    header: "Capacity/Hour",
    cell: ({ row }) => <span>{row.original.capacityPerHour}</span>,
  },
  {
    accessorKey: "operatingHours",
    header: "Operating Hours",
    cell: ({ row }) => {
      const hours = row.original.operatingHours
        ? `${row.original.operatingHours} hrs`
        : "N/A";
      return <span>{hours}</span>;
    },
  },
  {
    accessorKey: "efficiencyRate",
    header: "Efficiency Rate (%)",
    cell: ({ row }) => {
      const efficiency = row.original.efficiencyRate
        ? Number(row.original.efficiencyRate)
        : 0;
      return <span>{efficiency.toFixed(2)}%</span>;
    },
  },
  {
    accessorKey: "utilizationRate",
    header: "Utilization Rate",
    cell: ({ row }) => {
      const { capacityPerHour, efficiencyRate } = row.original;
      const efficiency = efficiencyRate ? Number(efficiencyRate) : null;
      const capacity = capacityPerHour ? Number(capacityPerHour) : null;
      if (efficiency === null || capacity === null) return <span>N/A units/hr</span>;
      const utilization = (capacity * (efficiency / 100)).toFixed(2);
      return <span>{utilization} units/hr</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Status;
      return (
        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
          {status.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
      return <span>{date ? date.toLocaleString() : "N/A"}</span>;
    },
  },
  {
    accessorKey: "modifiedBy",
    header: "Modified By",
    cell: ({ row }) => <span>{row.original.modifiedBy || "N/A"}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const workCenter = row.original;
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

          <EditWorkCenterDialog
            workCenter={workCenter}
            onSuccess={onSuccess}
            trigger={ // Correct: Button *inside* DropdownMenuItem
              <Button variant="ghost" className="w-full justify-start"> {/* Style as needed */}
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            }
          >
          </EditWorkCenterDialog>

          <DeleteWorkCenterDialog
            workCenter={workCenter}
            onSuccess={onSuccess}
            trigger={ // Correct: Button *inside* DropdownMenuItem
              <Button variant="ghost" className="w-full justify-start"> {/* Style as needed */}
                <Trash className="mr-2 h-4 w-4" /> Delete
              </Button>
            }
          >
          </DeleteWorkCenterDialog>

        </DropdownMenuContent>
      </DropdownMenu>
      );
    },
  },
];