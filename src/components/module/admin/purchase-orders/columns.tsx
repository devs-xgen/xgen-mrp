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
import { Product, ProductCategory, Status } from "@prisma/client"
import { EditPurchaseOrderDialog } from "./edit-purchase-dialog"
import { DeletePurchaseOrderDialog } from "./delete-purchase-dialog"

interface DataTableColumnProps {
    categories: ProductCategory[]
    onSuccess?: () => Promise<void>
}

export const createColumns = ({ categories, onSuccess }: DataTableColumnProps): ColumnDef<Product>[] => [
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
        accessorKey: "sku",
        header: "SKU",
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "currentStock",
        header: "Stock",
        cell: ({ row }) => {
            const stock = row.getValue("currentStock") as number
            const minStock = row.original.minimumStockLevel

            return (
                <div className="flex items-center gap-2">
                    <span>{stock}</span>
                    {stock <= minStock && (
                        <Badge variant="destructive">Low Stock</Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "sellingPrice",
        header: "Price",
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("sellingPrice"))
            const formatted = new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
            }).format(price)

            return formatted
        },
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
            const product = row.original

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
                        <EditPurchaseOrderDialog
                            product={product}
                            categories={categories}
                            onSuccess={onSuccess}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            }
                        />
                        <DeletePurchaseOrderDialog
                            product={product}
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