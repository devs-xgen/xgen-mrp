"use client"

import { DataTable } from "@/components/global/table"
import { createColumns } from "./columns"
import { CustomerOrderColumn } from "@/types/admin/customer-order"

interface CustomerOrdersTableProps {
  data: CustomerOrderColumn[]
}

export function CustomerOrdersTable({ data }: CustomerOrdersTableProps) {
  const columns = createColumns()

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="customerName"
      searchPlaceholder="Filter orders..."
      enableSelection={true}
    />
  )
}
