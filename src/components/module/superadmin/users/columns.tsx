"use client";

import { useMemo, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createDateColumn,
  createSortableHeader,
  DataTableRowActions,
} from "@/components/global/table";
import type { UserData } from "@/types/admin/user";
import { Eye, Pencil, Trash2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changeUserStatus } from "@/lib/actions/users";
import type { UserStatus } from "@prisma/client";

function getRoleLabel(role: UserData["role"]) {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

const STATUS_BADGE_VARIANT: Record<UserStatus, "secondary" | "outline" | "destructive"> = {
  ACTIVE: "secondary",
  INACTIVE: "destructive",
  SUSPENDED: "outline",
};

interface StatusMenuProps {
  user: UserData;
  onStatusChanged?: () => Promise<void> | void;
}

function StatusMenu({ user, onStatusChanged }: StatusMenuProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: UserStatus) => {
    if (status === user.status) {
      return;
    }

    startTransition(async () => {
      try {
        await changeUserStatus(user.id, status);
        toast({
          title: "Status updated",
          description: `${user.email} is now ${STATUS_LABELS[status].toLowerCase()}.`,
        });
        await onStatusChanged?.();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Unable to update status",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred.",
        });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 px-2"
          disabled={isPending}
        >
          <Badge variant={STATUS_BADGE_VARIANT[user.status]}>{STATUS_LABELS[user.status]}</Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Set status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <DropdownMenuItem
            key={value}
            disabled={user.status === value || isPending}
            onClick={() => handleStatusChange(value as UserStatus)}
            className={
              value === "INACTIVE" ? "text-destructive" : undefined
            }
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ColumnCallbacks {
  onView: (user: UserData) => void;
  onEdit: (user: UserData) => void;
  onResetPassword: (user: UserData) => void;
  onDelete: (user: UserData) => void;
  onRefresh?: () => Promise<void> | void;
  currentUserId?: string;
}

export const useSuperAdminUserColumns = ({
  onView,
  onEdit,
  onResetPassword,
  onDelete,
  onRefresh,
  currentUserId,
}: ColumnCallbacks): ColumnDef<UserData>[] =>
  useMemo(
    () => [
      {
        id: "name",
        header: createSortableHeader("Name"),
        accessorFn: (row) =>
          `${row.profile?.firstName ?? ""} ${row.profile?.lastName ?? ""}`.trim(),
        cell: ({ row }) => {
          const first = row.original.profile?.firstName ?? "";
          const last = row.original.profile?.lastName ?? "";
          const fullName = `${first} ${last}`.trim();
          return <span className="font-medium">{fullName || "—"}</span>;
        },
      },
      {
        accessorKey: "email",
        header: createSortableHeader("Email"),
        filterFn: (row, id, value) => {
          const search = String(value ?? "").toLowerCase();
          if (!search) return true;
          const email = String(row.getValue<string>(id)).toLowerCase();
          const first = row.original.profile?.firstName?.toLowerCase() ?? "";
          const last = row.original.profile?.lastName?.toLowerCase() ?? "";
          const fullName = `${first} ${last}`.trim();
          return (
            email.includes(search) ||
            fullName.includes(search) ||
            `${first} ${last}`.includes(search)
          );
        },
      },
      {
        id: "role",
        header: createSortableHeader("Role"),
        accessorFn: (row) => row.role,
        cell: ({ row }) => (
          <Badge variant="outline" className="uppercase tracking-wide">
            {getRoleLabel(row.original.role)}
          </Badge>
        ),
      },
      {
        id: "status",
        header: createSortableHeader("Status"),
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <StatusMenu user={row.original} onStatusChanged={onRefresh} />
        ),
      },
      createDateColumn<UserData>("createdAt", "Created"),
      {
        ...createDateColumn<UserData>("lastLoginAt", "Last Login"),
        enableSorting: true,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <DataTableRowActions
              row={row.original}
              actions={[
                {
                  label: "View details",
                  icon: Eye,
                  onClick: (user) => onView(user),
                },
                {
                  label: "Edit user",
                  icon: Pencil,
                  onClick: (user) => onEdit(user),
                },
                {
                  label: "Reset password",
                  icon: Lock,
                  onClick: (user) => onResetPassword(user),
                },
                {
                  label: "Delete user",
                  icon: Trash2,
                  variant: "destructive",
                  onClick: (user) => onDelete(user),
                  disabled: (user) => user.id === currentUserId,
                },
              ]}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [currentUserId, onDelete, onEdit, onRefresh, onResetPassword, onView]
  );
