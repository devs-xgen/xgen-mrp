"use client"

import { Customer } from "@prisma/client"
import { DataTable } from "./data-table"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"

interface CustomerManagementProps {
    data: Customer[]
}

export function CustomerManagement({ data }: CustomerManagementProps) {
    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Customers (${data.length})`}
                    description="Manage your customers"
                />
            </div>
            <Separator />
            <DataTable data={data} />
        </>
    )
} 