"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BillingStatementWithRelations, BillingStatus, PaginatedResponse, BillingAnalytics } from "@/types/admin/billing";
import { SerializableData } from "@/lib/utils/decimal-serializer";
import { BillingStatementsDashboard } from "./billing-statements-dashboard";
import { DataTable } from "./data-table";

interface BillingStatementsClientProps {
  data: PaginatedResponse<SerializableData<BillingStatementWithRelations>>;
  analytics: BillingAnalytics;
}

export function BillingStatementsClient({ data, analytics }: BillingStatementsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFiltersChange = (filters: {
    search?: string;
    status?: BillingStatus[];
    dateRange?: { start: Date; end: Date };
  }) => {
    const params = new URLSearchParams(searchParams);
    
    if (filters.search !== undefined) {
      if (filters.search) {
        params.set("search", filters.search);
      } else {
        params.delete("search");
      }
    }
    
    if (filters.status !== undefined) {
      if (filters.status.length > 0) {
        params.set("status", filters.status.join(","));
      } else {
        params.delete("status");
      }
    }
    
    if (filters.dateRange !== undefined) {
      if (filters.dateRange.start && filters.dateRange.end) {
        params.set("dateFrom", filters.dateRange.start.toISOString());
        params.set("dateTo", filters.dateRange.end.toISOString());
      } else {
        params.delete("dateFrom");
        params.delete("dateTo");
      }
    }
    
    // Reset to first page when filters change
    params.set("page", "1");
    
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <BillingStatementsDashboard analytics={analytics} />
      <DataTable 
        data={data.data} 
        pagination={data.pagination}
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}