"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserData } from "@/types/admin/user";
import { DataTable, getTableConfig } from "@/components/global/table";
import { Button } from "@/components/ui/button";
import { useSuperAdminUserColumns } from "./columns";
import { DeleteUserDialog } from "@/components/module/admin/users/delete-user-dialog";
import { EditUserDialog } from "@/components/module/admin/users/edit-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { SuperAdminUserViewDialog } from "./superadmin-user-view-dialog";

interface SuperAdminUsersClientProps {
  data: UserData[];
  currentUserId?: string;
}

export function SuperAdminUsersClient({ data, currentUserId }: SuperAdminUsersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [resettingUser, setResettingUser] = useState<UserData | null>(null);

  const handleRefresh = useCallback(async () => {
    startTransition(async () => {
      router.refresh();
    });
  }, [router]);

  const tableConfig = useMemo(() => getTableConfig("superadmin-users"), []);

  const columns = useSuperAdminUserColumns({
    currentUserId,
    onView: (user) => setViewingUser(user),
    onEdit: (user) => setEditingUser(user),
    onResetPassword: (user) => setResettingUser(user),
    onDelete: (user) => setDeletingUser(user),
    onRefresh: handleRefresh,
  });

  const toolbarActions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled>
        Export
      </Button>
      <Button size="sm" onClick={() => handleRefresh()} disabled={isPending}>
        {isPending ? "Refreshing..." : "Refresh"}
      </Button>
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey={tableConfig.searchKey}
        searchPlaceholder={tableConfig.searchPlaceholder}
        emptyMessage={tableConfig.emptyMessage}
        enableSelection={tableConfig.enableSelection}
        enableFiltering={tableConfig.enableFiltering}
        enablePagination={tableConfig.enablePagination}
        pageSize={tableConfig.pageSize}
        filterOptions={tableConfig.filterOptions}
        customToolbarActions={toolbarActions}
      />

      <SuperAdminUserViewDialog
        user={viewingUser}
        open={!!viewingUser}
        onOpenChange={(open) => {
          if (!open) {
            setViewingUser(null);
          }
        }}
        onEdit={() => {
          if (viewingUser) {
            setEditingUser(viewingUser);
          }
        }}
      />

      {deletingUser && (
        <DeleteUserDialog
          open={!!deletingUser}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingUser(null);
            }
          }}
          user={deletingUser}
          onSuccess={() => {
            setDeletingUser(null);
            handleRefresh();
          }}
        />
      )}

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUser(null);
            }
          }}
          user={editingUser}
          onSuccess={() => {
            setEditingUser(null);
            handleRefresh();
          }}
        />
      )}

      {resettingUser && (
        <ResetPasswordDialog
          userId={resettingUser.id}
          userEmail={resettingUser.email}
          onSuccess={async () => {
            setResettingUser(null);
            await handleRefresh();
          }}
          open={!!resettingUser}
          onOpenChange={(open) => {
            if (!open) {
              setResettingUser(null);
            }
          }}
        />
      )}
    </>
  );
}
