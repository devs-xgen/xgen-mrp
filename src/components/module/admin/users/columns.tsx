"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  createSelectionColumn, 
  createSortableHeader, 
  createDateColumn
} from "@/components/global/table";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { updateUser } from "@/lib/actions/users";

async function updateUserStatus(userId: string, newStatus: string) {
  return await updateUser({
    id: userId,
    status: newStatus as any,
  });
}

// User Row Actions Component
interface UserRowActionsProps {
  user: UserData;
  onSuccess?: () => Promise<void>;
}

function UserRowActions({ user, onSuccess }: UserRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        onSuccess={onSuccess}
      />
      
      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={user}
        onSuccess={onSuccess}
      />
    </>
  );
}

// Status Column Component
function StatusColumn({ user, onSuccess }: { user: UserData; onSuccess?: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const status = user.status;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);
      await updateUserStatus(user.id, newStatus);
      if (onSuccess) {
        await onSuccess();
      }
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
}

export const createColumns = (
  onSuccess?: () => Promise<void>
): ColumnDef<UserData>[] => [
  createSelectionColumn<UserData>(),
  {
    id: "name",
    header: createSortableHeader("Name"),
    accessorFn: (row) => `${row.profile?.firstName} ${row.profile?.lastName}`,
    cell: ({ row }) => {
      const firstName = row.original.profile?.firstName || "";
      const lastName = row.original.profile?.lastName || "";
      return <div className="font-medium">{`${firstName} ${lastName}`}</div>;
    },
  },
  {
    accessorKey: "email",
    header: createSortableHeader("Email"),
  },
  {
    id: "employeeId",
    header: createSortableHeader("Employee ID"),
    accessorFn: (row) => row.profile?.employeeId,
    cell: ({ row }) => {
      const employeeId = row.original.profile?.employeeId;
      return <div>{employeeId || "-"}</div>;
    },
  },
  {
    id: "department",
    header: createSortableHeader("Department"),
    accessorFn: (row) => row.profile?.department,
    cell: ({ row }) => {
      const department = row.original.profile?.department;
      return <div>{department || "-"}</div>;
    },
  },
  {
    accessorKey: "role",
    header: createSortableHeader("Role"),
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
        DEVELOPER: {
          color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
          label: "Developer",
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
    header: createSortableHeader("Status"),
    cell: ({ row }) => (
      <StatusColumn user={row.original} onSuccess={onSuccess} />
    ),
  },
  createDateColumn<UserData>("createdAt", "Created", false),
  {
    id: "actions",
    cell: ({ row }) => (
      <UserRowActions user={row.original} onSuccess={onSuccess} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
