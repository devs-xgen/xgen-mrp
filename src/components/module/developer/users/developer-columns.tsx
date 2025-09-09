"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserData } from "@/types/admin/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateUser } from "@/lib/actions/users";
import { 
  createSelectionColumn,
  createSortableHeader,
  createDateColumn,
} from "@/components/global/table";
import { EditUserDialog } from "@/components/module/admin/users/edit-user-dialog";
import { useToast } from "@/hooks/use-toast";

const ROLE_OPTIONS: { value: UserData["role"]; label: string; badge: string }[] = [
  { value: "ADMIN", label: "Admin", badge: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
  { value: "WORKER", label: "Worker", badge: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
  { value: "INSPECTOR", label: "Inspector", badge: "bg-green-100 text-green-800 hover:bg-green-200" },
  { value: "DELIVERY", label: "Delivery", badge: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
  { value: "DEVELOPER", label: "Developer", badge: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" },
];

const STATUS_OPTIONS: { value: UserData["status"]; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

function RoleCell({ user, onSuccess }: { user: UserData; onSuccess?: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const current = ROLE_OPTIONS.find((r) => r.value === user.role);

  async function setRole(role: UserData["role"]) {
    try {
      setLoading(true);
      await updateUser({ id: user.id, role: role as any });
      await onSuccess?.();
      toast({ title: "Role updated", description: `${user.email} is now ${role}` });
      setOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to update role", description: e?.message || "Try again" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 px-2 py-1">
          <Badge className={cn(current?.badge)} variant="outline">
            {current?.label ?? user.role}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="text-xs font-medium text-muted-foreground px-2 pb-1">Change Role</div>
        <div className="space-y-1">
          {ROLE_OPTIONS.map((r) => (
            <Button
              key={r.value}
              variant={r.value === user.role ? "secondary" : "ghost"}
              className="w-full justify-start"
              disabled={loading}
              onClick={() => setRole(r.value)}
            >
              <Badge className={cn(r.badge, "mr-2")}>{r.label}</Badge>
              {r.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StatusCell({ user, onSuccess }: { user: UserData; onSuccess?: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const current = STATUS_OPTIONS.find((s) => s.value === user.status);

  async function setStatus(status: UserData["status"]) {
    try {
      setLoading(true);
      await updateUser({ id: user.id, status: status as any });
      await onSuccess?.();
      toast({ title: "Status updated", description: `${user.email} → ${status}` });
      setOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to update status", description: e?.message || "Try again" });
    } finally {
      setLoading(false);
    }
  }

  const badgeVariant =
    user.status === "ACTIVE" ? "secondary" : user.status === "SUSPENDED" ? "outline" : "destructive";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 px-2 py-1" disabled={loading}>
          <Badge variant={badgeVariant as any}>{current?.label ?? user.status}</Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="text-xs font-medium text-muted-foreground px-2 pb-1">Change Status</div>
        <div className="space-y-1">
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s.value}
              variant={s.value === user.status ? "secondary" : "ghost"}
              className="w-full justify-start"
              disabled={loading}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RowActions({ user, onSuccess }: { user: UserData; onSuccess?: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" className="h-8 px-2" onClick={() => setOpen(true)}>
        <Edit className="w-4 h-4 mr-1" /> Edit
      </Button>
      <EditUserDialog open={open} onOpenChange={setOpen} user={user} onSuccess={onSuccess} />
    </>
  );
}

export function createDeveloperUserColumns(onSuccess?: () => Promise<void>): ColumnDef<UserData>[] {
  return [
    createSelectionColumn<UserData>(),
    {
      id: "name",
      header: createSortableHeader("Name"),
      accessorFn: (row) => `${row.profile?.firstName ?? ""} ${row.profile?.lastName ?? ""}`.trim(),
      cell: ({ row }) => {
        const fn = row.original.profile?.firstName ?? "";
        const ln = row.original.profile?.lastName ?? "";
        return <div className="font-medium">{`${fn} ${ln}`.trim() || "-"}</div>;
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
      cell: ({ row }) => <div>{row.original.profile?.employeeId ?? "-"}</div>,
    },
    {
      id: "department",
      header: createSortableHeader("Department"),
      accessorFn: (row) => row.profile?.department,
      cell: ({ row }) => <div>{row.original.profile?.department ?? "-"}</div>,
    },
    {
      accessorKey: "role",
      header: createSortableHeader("Role"),
      cell: ({ row }) => <RoleCell user={row.original} onSuccess={onSuccess} />,
    },
    {
      accessorKey: "status",
      header: createSortableHeader("Status"),
      cell: ({ row }) => <StatusCell user={row.original} onSuccess={onSuccess} />,
    },
    createDateColumn<UserData>("createdAt", "Created", false),
    {
      id: "actions",
      cell: ({ row }) => <RowActions user={row.original} onSuccess={onSuccess} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
