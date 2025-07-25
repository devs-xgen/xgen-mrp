"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Status } from "@prisma/client"
import { InspectorStatusChangeNotesDialog } from "./inspector-status-change-notes-dialog"

interface InspectorProductionOrderActionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (status: Status, notes?: string, actionTaken?: string) => void
  currentStatus: Status
}

export function InspectorProductionOrderActionDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
}: InspectorProductionOrderActionDialogProps) {
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null)

  const handleStatusSelect = (status: Status) => {
    setSelectedStatus(status)
    setShowNotesDialog(true)
  }

  const handleNotesConfirm = (notes?: string, actionTaken?: string) => {
    if (selectedStatus) {
      onConfirm(selectedStatus, notes, actionTaken)
    }
    setShowNotesDialog(false)
    setSelectedStatus(null)
    onClose() // Close the main dialog after confirmation
  }

  const getStatusOptions = (current: Status) => {
    const options: { status: Status; label: string; showActionTaken?: boolean }[] = []

    if (current === Status.PENDING) {
      options.push({ status: Status.IN_PROGRESS, label: "Start Production" })
      options.push({ status: Status.CANCELLED, label: "Cancel Production" })
      options.push({ status: Status.PENDING, label: "Put On Hold" })
    } else if (current === Status.IN_PROGRESS) {
      options.push({ status: Status.COMPLETED, label: "Complete Production", showActionTaken: true })
      options.push({ status: Status.PENDING, label: "Put On Hold" })
      options.push({ status: Status.CANCELLED, label: "Cancel Production" })
      options.push({ status: Status.QUALITY_CHECK, label: "Initiate Quality Check" })
    } else if (current === Status.PENDING) {
      options.push({ status: Status.IN_PROGRESS, label: "Resume Production" })
      options.push({ status: Status.CANCELLED, label: "Cancel Production" })
    } else if (current === Status.QUALITY_CHECK) {
      options.push({ status: Status.APPROVED, label: "Approve Quality Check", showActionTaken: true })
      options.push({ status: Status.REJECTED, label: "Reject Quality Check", showActionTaken: true })
    } else if (current === Status.APPROVED) {
      options.push({ status: Status.READY_FOR_DELIVERY, label: "Mark Ready for Delivery" })
    } else if (current === Status.READY_FOR_DELIVERY) {
      options.push({ status: Status.DELIVERED, label: "Mark as Delivered" })
    }

    // Add options for admin overrides if applicable (e.g., FAILED, SUBCON)
    // These might not be directly selectable by inspector, but good to list if they can be set by other means
    if (!options.some((opt) => opt.status === Status.FAILED)) {
      options.push({ status: Status.FAILED, label: "Mark as Failed (Admin Override)", showActionTaken: true })
    }
    if (!options.some((opt) => opt.status === Status.SUBCON)) {
      options.push({ status: Status.SUBCON, label: "Mark as Subcontracted (Admin Override)" })
    }

    return options.filter((option) => option.status !== current) // Filter out current status
  }

  const availableOptions = getStatusOptions(currentStatus)

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={onClose}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => (
              <DropdownMenuItem key={option.status} onClick={() => handleStatusSelect(option.status)}>
                {option.label}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No status changes available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedStatus && (
        <InspectorStatusChangeNotesDialog
          isOpen={showNotesDialog}
          onClose={() => setShowNotesDialog(false)}
          onConfirm={handleNotesConfirm}
          isPending={false} // This dialog doesn't handle its own pending state
          title={`Confirm Status Change to "${selectedStatus.replace(/_/g, " ")}"`}
          description={`You are about to change the production order status to "${selectedStatus.replace(/_/g, " ")}". Please add any relevant notes and describe the action taken.`}
          showActionTaken={
            selectedStatus === Status.COMPLETED ||
            selectedStatus === Status.APPROVED ||
            selectedStatus === Status.REJECTED ||
            selectedStatus === Status.FAILED
          }
        />
      )}
    </>
  )
}
