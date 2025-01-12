"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { CustomerActions } from "./customer-actions"
import { Customer } from "@prisma/client"

export const customerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={status === "ACTIVE" ? "success" : "destructive"}
        >
          {status.toLowerCase()}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CustomerActions row={row} />,
  },
] 