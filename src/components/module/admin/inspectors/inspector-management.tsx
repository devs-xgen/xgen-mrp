"use client"

import { Inspector } from "@prisma/client"
import { DataTable } from "./data-table"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"

interface InspectorManagementProps {
    data: Inspector[]
}

export function InspectorManagement({ data }: InspectorManagementProps) {
    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Inspectors (${data.length})`}
                    description="Manage your inspectors"
                />
            </div>
            <Separator />
            <DataTable data={data} columns={[]} onEdit={function (inspector: Inspector): void {
                throw new Error("Function not implemented.")
            } } onDelete={function (inspector: Inspector): void {
                throw new Error("Function not implemented.")
            } } onStatusChange={function (inspectorId: string, newStatus: string): Promise<void> {
                throw new Error("Function not implemented.")
            } } isLoading={false} />
        </>
    )
}