"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Material, MaterialType, Status } from "@prisma/client"
import { EditMaterialDialog } from "./edit-material-dialog"
import { DeleteMaterialDialog } from "./delete-material-dialog"

interface DataTableColumnProps {
    materialTypes: MaterialType[]
    onSuccess?: () => Promise<void>
}

export const createColumns = ({ materialTypes, onSuccess }: DataTableColumnProps): ColumnDef<Material>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "type.name",
        header: "Type",
    },
    {
        accessorKey: "currentStock",
        header: "Stock",
        cell: ({ row }) => {
            const stock = row.getValue("currentStock") as number
            const minStock = row.original.minimumStockLevel

            return (
                <div className="flex items-center gap-2">
                    <span>{stock} {row.original.unitOfMeasure.symbol}</span>
                    {stock <= minStock && (
                        <Badge variant="destructive">Low Stock</Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "costPerUnit",
        header: "Cost Per Unit",
        cell: ({ row }) => {
            const cost = parseFloat(row.getValue("costPerUnit"))
            const formatted = new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
            }).format(cost)

            return formatted
        },
    },
    {
        accessorKey: "supplier.name",
        header: "Supplier",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as Status
            return (
                <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                    {status.toLowerCase()}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const material = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <EditMaterialDialog
                            material={material}
                            materialTypes={materialTypes}
                            onSuccess={onSuccess}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            }
                        />
                        <DeleteMaterialDialog
                            material={material}
                            onSuccess={onSuccess}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            }
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]