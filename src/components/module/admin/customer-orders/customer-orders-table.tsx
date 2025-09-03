"use client"

import { useState } from "react"
import { DataTable } from "@/components/global/table"
import { createColumns } from "./columns"
import { CustomerOrderColumn } from "@/types/admin/customer-order"
import { deleteCustomerOrder } from "@/lib/actions/customer-order"
import { archiveCustomerOrder } from "@/lib/actions/order-archiving"

interface CustomerOrdersTableProps {
  data: CustomerOrderColumn[]
}

export function CustomerOrdersTable({ data }: CustomerOrdersTableProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    try {
      await deleteCustomerOrder(id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async (id: string, reason: string) => {
    setIsLoading(true)
    try {
      return await archiveCustomerOrder(id, reason)
    } finally {
      setIsLoading(false)
    }
  }

  const columns = createColumns({
    onDelete: handleDelete,
    onArchive: handleArchive,
  })

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
