"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { UserData } from "@/types/admin/user";
import type { ExtendedTableMeta } from "@/types/admin/table";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

async function updateUserStatus(userId: string, newStatus: string) {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: newStatus,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to update status");
  }

  return response.json();
}

export const columns: ColumnDef<UserData, unknown>[] = [
  {
    id: "name",
    header: "Name",
    accessorFn: (row) => `${row.profile?.firstName} ${row.profile?.lastName}`,
    cell: ({ row }) => {
      const firstName = row.original.profile?.firstName || "";
      const lastName = row.original.profile?.lastName || "";
      return <div>{`${firstName} ${lastName}`}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "employeeId",
    header: "Employee ID",
    accessorFn: (row) => row.profile?.employeeId,
  },
  {
    id: "department",
    header: "Department",
    accessorFn: (row) => row.profile?.department,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;

      // Define colors and labels for each role
      const roleStyles: Record<string, { color: string; label: string }> = {
        ADMIN: {
          color: "bg-purple-100 text-purple-800 hover:bg-purple-200",
          label: "Admin",
        },
        WORKER: {
          color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
          label: "Worker",
        },
        INSPECTOR: {
          color: "bg-green-100 text-green-800 hover:bg-green-200",
          label: "Inspector",
        },
        DELIVERY: {
          color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
          label: "Delivery",
        },
      };

      const { color, label } = roleStyles[role] || {
        color: "bg-gray-100 text-gray-800",
        label: role,
      };

      return (
        <Badge className={color} variant="outline">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row, table }) => {
      const [isLoading, setIsLoading] = useState(false);
      const { toast } = useToast();
      const status = row.getValue("status") as string;
      const user = row.original;
      const meta = table.options.meta as ExtendedTableMeta;

      const handleStatusChange = async (newStatus: string) => {
        try {
          setIsLoading(true);
          await updateUserStatus(user.id, newStatus);
          meta.onStatusChange(user.id, newStatus);
          toast({
            title: "Status Updated",
            description: "User status has been updated successfully.",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to update status",
          });
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-2 py-1"
              disabled={isLoading}
            >
              <Badge
                variant={
                  status === "ACTIVE"
                    ? "secondary"
                    : status === "SUSPENDED"
                    ? "outline"
                    : "destructive"
                }
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={status === "ACTIVE" || isLoading}
            >
              Set as Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("SUSPENDED")}
              disabled={status === "SUSPENDED" || isLoading}
            >
              Suspend User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("INACTIVE")}
              disabled={status === "INACTIVE" || isLoading}
              className="text-destructive"
            >
              Deactivate User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original;
      const meta = table.options.meta as ExtendedTableMeta;

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
            <DropdownMenuItem onClick={() => meta.onEdit(user)}>
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta.onDelete(user)}
              className="text-destructive"
            >
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
