// src/components/module/inspector/request/data-table-row-actions.tsx
"use client"

import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { Status } from "@prisma/client"
import { MoreHorizontal, EyeIcon, PlayCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { updateProductionOrder } from "@/lib/actions/production-order"
import { ProductionOrderColumn } from "@/types/inspector/production-order"
import { ProductionOrderActionDialog } from "./production-order-action-dialog"
import { RequestMaterialDialog } from "./request-material-dialog"


interface DataTableRowActionsProps {
  row: Row<ProductionOrderColumn>
  onSuccess?: () => Promise<void>
}

export function DataTableRowActions({ row, onSuccess }: DataTableRowActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);


  const handleView = () => {
    router.push(`/inspector/request/${row.original.id}`)
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <EyeIcon className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isLoading}
            onClick={() => {
              setDialogOpen(true)
            }}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Manage
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isLoading}
            onClick={() => {
              setMaterialDialogOpen(true)
            }}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Request Material
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProductionOrderActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productionOrderId={row.original.id}
        onSuccess={onSuccess}
      />
      <RequestMaterialDialog
        open={materialDialogOpen} // ✅ boolean state value
        onOpenChange={setMaterialDialogOpen} // ✅ function to update state
        productionOrderId={row.original.id}
        onSubmit={() => {
          setMaterialDialogOpen(false);
          if (onSuccess) onSuccess();
        }}
      />
    </>
  )
}