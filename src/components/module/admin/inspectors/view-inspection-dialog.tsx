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
                        <span className="col-span-3">{inspector.inspectorId}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Name:</span>
                        <span className="col-span-3">{inspector.firstName} {inspector.lastName}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Email:</span>
                        <span className="col-span-3">{inspector.email}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Phone:</span>
                        <span className="col-span-3">{inspector.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Department:</span>
                        <span className="col-span-3">{inspector.department || 'Not assigned'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Specialization:</span>
                        <span className="col-span-3">{inspector.specialization || 'None'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Certification:</span>
                        <span className="col-span-3">{inspector.certificationLevel || 'None'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Years of Experience:</span>
                        <span className="col-span-3">{inspector.yearsOfExperience !== null ? `${inspector.yearsOfExperience} ${inspector.yearsOfExperience === 1 ? 'year' : 'years'}` : 'Not specified'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Status:</span>
                        <span className="col-span-3">{inspector.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    {inspector.notes && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="font-medium">Notes:</span>
                            <span className="col-span-3">{inspector.notes}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Created:</span>
                        <span className="col-span-3">{inspector.createdAt.toLocaleDateString()}</span>
                    </div>
                    {inspector.updatedAt && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="font-medium">Last Updated:</span>
                            <span className="col-span-3">{inspector.updatedAt.toLocaleDateString()}</span>
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