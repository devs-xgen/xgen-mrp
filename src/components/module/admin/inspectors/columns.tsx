"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  deleteInspector,
  toggleInspectorStatus,
  type Inspector,
} from "@/lib/actions/inspector";
import { formatPhoneNumber } from "@/lib/utils";

export const columns: ColumnDef<Inspector>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    id: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName;
      return (
        <div>
          <div className="font-medium">
            {firstName} {lastName}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "isActive",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return isActive ? (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="mr-1 h-3 w-3" /> Active
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="mr-1 h-3 w-3" /> Inactive
        </Badge>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => {
      const department = row.getValue("department");
      return department ? (
        <div>{department as string}</div>
      ) : (
        <div className="text-muted-foreground text-sm">Not assigned</div>
      );
    },
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
    cell: ({ row }) => {
      const specialization = row.getValue("specialization");
      return specialization ? (
        <div>{specialization as string}</div>
      ) : (
        <div className="text-muted-foreground text-sm">None</div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => {
      const phoneNumber = row.getValue("phoneNumber") as string | null;
      return phoneNumber ? (
        <div>{formatPhoneNumber(phoneNumber)}</div>
      ) : (
        <div className="text-muted-foreground text-sm">Not provided</div>
      );
    },
  },
  {
    accessorKey: "yearsOfExperience",
    header: "Experience",
    cell: ({ row }) => {
      const years = row.getValue("yearsOfExperience") as number | null;
      return years !== null && years !== undefined ? (
        <div>
          {years} {years === 1 ? "year" : "years"}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">N/A</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const inspector = row.original;
      const isActive = inspector.isActive;

      const handleStatusToggle = async () => {
        try {
          await toggleInspectorStatus(inspector.inspectorId, !isActive);
        } catch (error) {
          console.error("Error toggling inspector status:", error);
          alert(`Failed to ${isActive ? "deactivate" : "activate"} inspector.`);
        }
      };

      const handleDelete = async () => {
        if (
          window.confirm(
            "Are you sure you want to permanently delete this inspector? This action cannot be undone."
          )
        ) {
          try {
            await deleteInspector(inspector.inspectorId);
          } catch (error) {
            console.error("Error deleting inspector:", error);
            alert("Failed to delete inspector.");
          }
        }
      };

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
            <DropdownMenuItem
              onClick={() => {
                // Will be replaced with proper edit dialog trigger
                alert(
                  `Edit inspector: ${inspector.firstName} ${inspector.lastName}`
                );
              }}
            >
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleStatusToggle}>
              {isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={handleDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
