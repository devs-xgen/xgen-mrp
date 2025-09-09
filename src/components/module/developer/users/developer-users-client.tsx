"use client";

import { useRouter } from "next/navigation";
import type { UserData } from "@/types/admin/user";
import { DataTable } from "@/components/global/table";
import { createDeveloperUserColumns } from "./developer-columns";

interface DeveloperUsersClientProps {
  data: UserData[];
}

export default function DeveloperUsersClient({ data }: DeveloperUsersClientProps) {
  const router = useRouter();
  const refresh = async () => router.refresh();

  const columns = createDeveloperUserColumns(refresh);

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
    />
  );
}
