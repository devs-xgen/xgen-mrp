"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { createDateColumn, createSortableHeader } from "@/components/global/table";
import type { UserData } from "@/types/admin/user";
import { ResetPasswordDialog } from "./reset-password-dialog";

function getRoleLabel(role: UserData["role"]) {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export const useSuperAdminUserColumns = (
  onRefresh?: () => Promise<void>
): ColumnDef<UserData>[] =>
  useMemo(
    () => [
      {
        id: "name",
        header: createSortableHeader("Name"),
        accessorFn: (row) => `${row.profile?.firstName ?? ""} ${row.profile?.lastName ?? ""}`.trim(),
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
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "ACTIVE"
              ? "secondary"
              : status === "SUSPENDED"
                ? "outline"
                : "destructive";
          const label = status.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
          return <Badge variant={variant}>{label}</Badge>;
        },
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
          <ResetPasswordDialog userId={row.original.id} userEmail={row.original.email} onSuccess={onRefresh} />
        ),
        enableSorting: false,
      },
    ],
    [onRefresh]
  );
