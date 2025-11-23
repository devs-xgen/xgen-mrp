"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { UserData } from "@/types/admin/user";
import { createColumns } from "./columns";
import { DataTable, getTableConfig } from "@/components/global/table";
import { PaginationState } from "@tanstack/react-table";

interface UsersPageClientProps {
  data: UserData[];
  metadata?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function UsersPageClient({ data, metadata }: UsersPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const refresh = async () => {
    router.refresh();
  };

  const columns = createColumns(refresh);

  // Handle server-side pagination
  const pagination: PaginationState = {
    pageIndex: (metadata?.page ?? 1) - 1,
    pageSize: metadata?.limit ?? 10,
  };

  const onPaginationChange = (updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const previous = pagination;
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(previous) : updaterOrValue;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (next.pageIndex + 1).toString());
    params.set("limit", next.pageSize.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Filter by name or email..."
      enableSelection={true}
      enableFiltering={true}
      filterOptions={[
        {
          column: "role",
          title: "Role",
          options: [
            { value: "ADMIN", label: "Admin" },
            { value: "WORKER", label: "Worker" },
            { value: "INSPECTOR", label: "Inspector" },
            { value: "DELIVERY", label: "Delivery" },
            { value: "DEVELOPER", label: "Developer" },
          ],
        },
        {
          column: "status",
          title: "Status",
          options: [
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "SUSPENDED", label: "Suspended" },
          ],
        },
      ]}
      emptyMessage="No users found."
      manualPagination={!!metadata}
      pageCount={metadata?.totalPages ?? -1}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
}
