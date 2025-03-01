// src/components/module/admin/production/data-table-row-actions.tsx
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
import { ProductionOrderColumn } from "@/types/admin/production-order"

interface DataTableRowActionsProps {
  row: Row<ProductionOrderColumn>
  onSuccess?: () => Promise<void>
}

export function DataTableRowActions({ row, onSuccess }: DataTableRowActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Get the current status and determine the next possible status
  const currentStatus = row.original.status
  const nextStatus = currentStatus === "PENDING" 
    ? "IN_PROGRESS" 
    : currentStatus === "IN_PROGRESS" 
      ? "COMPLETED" 
      : null

  // Get the button text based on the next status
  const getActionText = (status: Status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "Start Production"
      case "COMPLETED":
        return "Complete Production"
      default:
        return "Update Status"
    }
  }

  const handleStatusUpdate = async (newStatus: Status) => {
    try {
      setIsLoading(true)
      await updateProductionOrder({
        id: row.original.id,
        status: newStatus
      })

      if (onSuccess) {
        await onSuccess()
      }

      toast({
        title: "Status Updated",
        description: `Production order status updated to ${newStatus.toLowerCase().replace("_", " ")}`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = () => {
    router.push(`/admin/production/${row.original.id}`)
  }

  return (
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
        
        {nextStatus && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isLoading}
              onClick={() => handleStatusUpdate(nextStatus)}
            >
              {nextStatus === "IN_PROGRESS" ? (
                <PlayCircle className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {getActionText(nextStatus)}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}