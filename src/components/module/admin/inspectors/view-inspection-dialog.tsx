"use client"

import { Inspector } from "@prisma/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"

interface ViewInspectorDialogProps {
    inspector: Inspector
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (inspector: Inspector) => void
    onDelete: (inspector: Inspector) => void
}

export function ViewInspectorDialog({
    inspector,
    open,
    onOpenChange,
    onEdit,
    onDelete
}: ViewInspectorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Inspector Details</DialogTitle>
                    <DialogDescription>
                        View inspector information
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">ID:</span>
                        <span className="col-span-3">{inspector.employeeId}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Name:</span>
                        <span className="col-span-3">{inspector.name}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Email:</span>
                        <span className="col-span-3">{inspector.email}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Phone:</span>
                        <span className="col-span-3">{inspector.phone}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Certification:</span>
                        <span className="col-span-3">{inspector.certification}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Specialization:</span>
                        <span className="col-span-3">{inspector.specialization}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Years of Experience:</span>
                        <span className="col-span-3">{inspector.yearsOfExperience}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Status:</span>
                        <span className="col-span-3">{inspector.status}</span>
                    </div>
                    {inspector.availability && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="font-medium">Availability:</span>
                            <span className="col-span-3">{inspector.availability}</span>
                        </div>
                    )}
                    {inspector.notes && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="font-medium">Notes:</span>
                            <span className="col-span-3">{inspector.notes}</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onEdit(inspector)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onOpenChange(false)
                            onDelete(inspector)
                        }}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}