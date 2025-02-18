// src/components/module/admin/production/production-order-details.tsx
"use client"

import { useState } from "react"
import { Status, Priority } from "@prisma/client"
import { formatDate } from "@/lib/utils"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ProductionOrder } from "@/types/admin/production-order"
import { OperationsManagement } from "./operations-management"
import { QualityChecks } from "./quality-checks"

interface ProductionOrderDetailsProps {
  order: ProductionOrder
  onUpdateStatus?: (status: Status) => Promise<void>
  onUpdateOperation?: (operationId: string, status: Status) => Promise<void>
  onAddOperation?: () => void
  onAddQualityCheck?: () => void
  isLoading?: boolean
}

export function ProductionOrderDetails({
  order,
  onUpdateStatus,
  onUpdateOperation,
  onAddOperation,
  onAddQualityCheck,
  isLoading = false
}: ProductionOrderDetailsProps) {
  const [updating, setUpdating] = useState(false)

  const handleStatusUpdate = async (newStatus: Status) => {
    if (!onUpdateStatus) return
    try {
      setUpdating(true)
      await onUpdateStatus(newStatus)
    } finally {
      setUpdating(false)
    }
  }

  const getNextStatus = (currentStatus: Status): Status | null => {
    switch (currentStatus) {
      case "PENDING":
        return "IN_PROGRESS"
      case "IN_PROGRESS":
        return "COMPLETED"
      default:
        return null
    }
  }

  const nextStatus = getNextStatus(order.status)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Production Order Details</CardTitle>
              <CardDescription>
                Status and progress of production order
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  order.status === "COMPLETED"
                    ? "default"
                    : order.status === "IN_PROGRESS"
                    ? "secondary"
                    : "outline"
                }
                className="text-base py-1 px-3"
              >
                {order.status.toLowerCase().replace("_", " ")}
              </Badge>
              {nextStatus && onUpdateStatus && (
                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating || isLoading}
                >
                  {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {nextStatus === "IN_PROGRESS" ? "Start Production" : "Complete Production"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Product</h4>
                <p className="text-lg font-medium">{order.product.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {order.product.sku}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Quantity</h4>
                <p className="text-lg font-medium">{order.quantity} units</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Priority</h4>
                <Badge
                  variant={
                    order.priority === "HIGH" || order.priority === "URGENT"
                      ? "destructive"
                      : "default"
                  }
                >
                  {order.priority.toLowerCase()}
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                <p className="text-lg font-medium">{formatDate(order.startDate)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                <p className="text-lg font-medium">{formatDate(order.dueDate)}</p>
              </div>
              {order.customerOrder && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Customer Order</h4>
                  <p className="text-lg font-medium">{order.customerOrder.orderNumber}</p>
                </div>
              )}
            </div>
          </div>
          {order.notes && (
            <>
              <Separator className="my-6" />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OperationsManagement
        operations={order.operations}
        onAddOperation={onAddOperation}
        onUpdateOperation={onUpdateOperation}
        isLoading={isLoading}
      />

      <QualityChecks
        checks={order.qualityChecks}
        onAddCheck={onAddQualityCheck}
        isLoading={isLoading}
      />
    </div>
  )
}