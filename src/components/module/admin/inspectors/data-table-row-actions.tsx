"use client"

import { Row } from "@tanstack/react-table"
import { Inspector } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreHorizontal, Trash } from "lucide-react"
import { useState } from "react"
import { EditInspectorDialog } from "./edit-inspection-dialog"
import { DeleteInspectorDialog } from "./delete-inspection-dialog"
import { ViewInspectorDialog } from "./view-inspection-dialog"

interface DataTableRowActionsProps {
    row: Row<Inspector>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showViewDialog, setShowViewDialog] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ViewInspectorDialog
                inspector={row.original}
                open={showViewDialog}
                onOpenChange={setShowViewDialog}
                onEdit={() => {
                    setShowViewDialog(false)
                    setShowEditDialog(true)
                }}
                onDelete={() => {
                    setShowViewDialog(false)
                    setShowDeleteDialog(true)
                }}
            />

            <EditInspectorDialog
                inspector={row.original}
                departments={[]}
                specializations={[]}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />

            <DeleteInspectorDialog
                inspector={row.original}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            />
        </>
    )
}