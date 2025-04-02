"use client";

import { Inspector } from "@/lib/actions/inspector";
import { DataTable } from "./data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { columns } from "./columns";

interface InspectorManagementProps {
    data: Inspector[];
    isLoading?: boolean;
}

export function InspectorManagement({ data, isLoading = false }: InspectorManagementProps) {
    // Define handlers for the DataTable actions
    const handleEdit = (inspector: Inspector) => {
        console.log("Edit inspector:", inspector);
        // Implement edit logic
    };
    
    const handleDelete = (inspector: Inspector) => {
        console.log("Delete inspector:", inspector);
        // Implement delete logic
    };
    
    const handleStatusChange = async (inspectorId: string, newStatus: string) => {
        console.log("Change status for inspector:", inspectorId, "to", newStatus);
        // Implement status change logic
        return Promise.resolve();
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Inspectors (${data.length})`}
                    description="Manage your inspectors"
                />
            </div>
            <Separator />
            <DataTable 
                data={data} 
                columns={columns} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onStatusChange={handleStatusChange} 
                isLoading={isLoading} 
            />
        </>
    );
}