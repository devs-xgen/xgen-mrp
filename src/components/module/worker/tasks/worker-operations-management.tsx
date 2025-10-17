"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings, Clock, CheckCircle, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { ProductionOrder, Status } from "@prisma/client"

// NOTE: We need a placeholder for the WorkCenter type used in the main component's props
interface WorkCenter {
    id: string
    name: string
    capacityPerHour: number
}

interface WorkerOperationsManagementProps {
    productionOrder: ProductionOrder // The full order object
    workCenters: WorkCenter[] // Work centers data (if needed)
    onRefresh: () => void // Function to refresh the parent order details
    isLoading: boolean
}

// Placeholder for the current worker's ID (in a real app, this comes from context/session)
const CURRENT_WORKER_ID = "worker_sid_123" 

// Placeholder action to simulate updating an operation status (e.g., calling an API)
const updateOperationStatus = async (operationId: string, newStatus: Status) => {
    // In a real application, this would be an API call like:
    // await fetch('/api/worker/operations/update-status', { method: 'POST', body: JSON.stringify({ operationId, newStatus }) });
    console.log(`[SIMULATED API] Operation ${operationId} status updated to: ${newStatus}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
    if (Math.random() > 0.9) { // 10% chance of failure for simulation
        throw new Error("Simulated network failure while updating operation.");
    }
}

export function WorkerOperationsManagement({
    productionOrder,
    onRefresh,
    isLoading,
}: WorkerOperationsManagementProps) {
    const { toast } = useToast()
    const [isUpdating, setIsUpdating] = useState<string | null>(null) // To track which operation is being updated
    const operations = productionOrder.operations || []

    const handleStatusChange = async (operationId: string, currentStatus: Status) => {
        let newStatus: Status;
        if (currentStatus === Status.PENDING) {
            newStatus = Status.IN_PROGRESS;
        } else if (currentStatus === Status.IN_PROGRESS) {
            newStatus = Status.COMPLETED;
        } else {
            return; // Cannot change from COMPLETED or other final statuses
        }

        setIsUpdating(operationId);
        try {
            await updateOperationStatus(operationId, newStatus);
            onRefresh(); // Refresh parent to get updated data
            toast({
                title: "Operation Status Updated",
                description: `Operation successfully marked as ${newStatus.toLowerCase().replace('_', ' ')}.`,
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Failed to update operation status.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(null);
        }
    }

    const getStatusVariant = (status: Status) => {
        switch (status) {
            case Status.COMPLETED:
                return "default";
            case Status.IN_PROGRESS:
                return "secondary";
            case Status.PENDING:
                return "outline";
            default:
                return "destructive";
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    Loading operations...
                </CardContent>
            </Card>
        )
    }

    if (operations.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-3 text-primary/50" />
                    <p className="font-medium">No Operations Defined</p>
                    <p className="text-sm">Please check with a manager to assign operations to this production order.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1">
                    <CardTitle className="text-xl">Assigned Production Steps</CardTitle>
                    <CardDescription>
                        Track the status and clock in/out for each step in the production process.
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                    Refresh
                </Button>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {operations.map((op, index) => (
                        <div key={op.id} className="border p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center bg-white shadow-sm">
                            <div className="space-y-1 md:space-y-0 flex-grow">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs font-semibold px-2 py-1 bg-muted">
                                        Step {index + 1}
                                    </Badge>
                                    <h3 className="text-lg font-semibold text-primary/90">
                                        {op.workCenter.name}
                                    </h3>
                                    <Badge variant={getStatusVariant(op.status)} className="uppercase text-xs">
                                        {op.status.toLowerCase().replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-medium">Schedule:</span> {formatDate(op.startTime)} - {formatDate(op.endTime)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Planned Cost: {op.cost.toFixed(2)}
                                </div>
                            </div>

                            <div className="mt-3 md:mt-0 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                                {op.status === Status.PENDING && (
                                    <Button
                                        size="sm"
                                        className="bg-green-500 hover:bg-green-600 w-full md:w-auto"
                                        onClick={() => handleStatusChange(op.id, Status.PENDING)}
                                        disabled={isUpdating === op.id}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        {isUpdating === op.id ? 'Starting...' : 'Start Job'}
                                    </Button>
                                )}
                                {op.status === Status.IN_PROGRESS && (
                                    <Button
                                        size="sm"
                                        className="bg-blue-500 hover:bg-blue-600 w-full md:w-auto"
                                        onClick={() => handleStatusChange(op.id, Status.IN_PROGRESS)}
                                        disabled={isUpdating === op.id}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {isUpdating === op.id ? 'Completing...' : 'Complete Job'}
                                    </Button>
                                )}
                                {op.status === Status.COMPLETED && (
                                    <Button size="sm" variant="outline" disabled>
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Completed
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}