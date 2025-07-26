"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "./data-table";
import { SalesInvoiceWithItems, InvoiceStatus } from "@/types/admin/billing";

interface SalesInvoicesClientProps {
  initialData: SalesInvoiceWithItems[];
}

export function SalesInvoicesClient({ initialData }: SalesInvoicesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);

  // Handle filter changes
  const handleFiltersChange = (filters: {
    search?: string;
    status?: InvoiceStatus[];
    dateRange?: { start: Date; end: Date };
  }) => {
    const params = new URLSearchParams(searchParams);
    
    if (filters.search) {
      params.set("search", filters.search);
    } else {
      params.delete("search");
    }
    
    if (filters.status && filters.status.length > 0) {
      params.set("status", filters.status.join(","));
    } else {
      params.delete("status");
    }
    
    if (filters.dateRange) {
      params.set("dateFrom", filters.dateRange.start.toISOString());
      params.set("dateTo", filters.dateRange.end.toISOString());
    } else {
      params.delete("dateFrom");
      params.delete("dateTo");
    }
    
    router.push(`?${params.toString()}`);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <DataTable 
      data={data}
      onFiltersChange={handleFiltersChange}
      onPageChange={handlePageChange}
    />
  );
}