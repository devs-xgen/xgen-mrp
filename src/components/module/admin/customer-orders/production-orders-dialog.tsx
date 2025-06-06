"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Factory, Package, Calendar, ArrowRight, ExternalLink } from "lucide-react"
import { getProductionOrdersByCustomerOrder } from "@/lib/actions/production-order"
import { ProductionOrderSummary } from "@/types/admin/customer-order"
import { formatDate } from "@/lib/utils"

interface ProductionOrdersDialogProps {
  customerOrderId: string
  customerOrderNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductionOrdersDialog({
  customerOrderId,
  customerOrderNumber,
  open,
  onOpenChange,
}: ProductionOrdersDialogProps) {
  const [productionOrders, setProductionOrders] = useState<ProductionOrderSummary[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open && customerOrderId) {
      fetchProductionOrders()
    }
  }, [open, customerOrderId])

  const fetchProductionOrders = async () => {
    try {
      setLoading(true)
      const orders = await getProductionOrdersByCustomerOrder(customerOrderId)
      setProductionOrders(orders)
    } catch (error) {
      console.error("Failed to fetch production orders:", error)
      setProductionOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToProduction = (productionOrderId: string) => {
    router.push(`/admin/production/${productionOrderId}`)
    onOpenChange(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { variant: "default" as const, className: "bg-green-500 text-white" },
      IN_PROGRESS: { variant: "secondary" as const, className: "bg-blue-500 text-white" },
      PENDING: { variant: "outline" as const, className: "bg-yellow-500 text-white" },
      CANCELLED: { variant: "destructive" as const, className: "" },
      ACTIVE: { variant: "secondary" as const, className: "bg-blue-500 text-white" },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toLowerCase().replace("_", " ")}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      HIGH: { variant: "destructive" as const, className: "bg-red-500 text-white" },
      MEDIUM: { variant: "secondary" as const, className: "bg-orange-500 text-white" },
      LOW: { variant: "outline" as const, className: "bg-gray-500 text-white" },
      URGENT: { variant: "destructive" as const, className: "bg-red-600 text-white" },
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {priority.toLowerCase()}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Production Orders for {customerOrderNumber}
          </DialogTitle>
          <DialogDescription>
            Click on any production order to view detailed information
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading production orders...</span>
            </div>
          ) : productionOrders.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Production Orders</h3>
              <p className="text-muted-foreground">
                This customer order doesn't have any production orders yet.
              </p>
            </div>
          ) : (
                         <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <p className="text-sm text-muted-foreground">
                                       Found {productionOrders.length} production order{productionOrders.length === 1 ? '' : 's'}
                 </p>
               </div>

              <div className="grid gap-4">
                {productionOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                    onClick={() => handleNavigateToProduction(order.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          {order.product.name}
                          <span className="text-sm font-normal text-muted-foreground">
                            ({order.product.sku})
                          </span>
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="p-1">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status and Priority */}
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(order.status)}
                        {getPriorityBadge(order.priority)}
                        <Badge variant="outline">
                          ID: {order.id.slice(-8)}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Production Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Quantity
                          </label>
                          <p className="text-lg font-semibold">
                            {order.completedQuantity} / {order.quantity}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((order.completedQuantity / order.quantity) * 100)}% complete
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Start Date
                          </label>
                          <p className="text-sm flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.startDate)}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Due Date
                          </label>
                          <p className={`text-sm flex items-center gap-1 ${
                            new Date(order.dueDate) < new Date() && order.status !== 'COMPLETED' 
                              ? 'text-destructive' 
                              : ''
                          }`}>
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.dueDate)}
                            {new Date(order.dueDate) < new Date() && order.status !== 'COMPLETED' && (
                              <span className="text-xs">(Overdue)</span>
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Progress
                          </label>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.round((order.completedQuantity / order.quantity) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Click instruction */}
                      <div className="flex items-center justify-end text-xs text-muted-foreground">
                        <span>Click to view details</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 