"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserData } from "@/types/admin/user";
import { DataTable } from "@/components/global/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSuperAdminUserColumns } from "./columns";

interface SuperAdminUsersClientProps {
  data: UserData[];
}

export function SuperAdminUsersClient({ data }: SuperAdminUsersClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRefresh = useCallback(async () => {
    startTransition(async () => {
      router.refresh();
    });
  }, [router]);

  const columns = useSuperAdminUserColumns(handleRefresh);

  const filteredData = searchTerm
    ? data.filter((user) => {
        const fullName = `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.toLowerCase();
        return (
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fullName.includes(searchTerm.toLowerCase())
        );
      })
    : data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full sm:max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button onClick={() => handleRefresh()} disabled={isPending}>
            {isPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredData} searchKey="email" enableFiltering={false} />
    </div>
  );
}
