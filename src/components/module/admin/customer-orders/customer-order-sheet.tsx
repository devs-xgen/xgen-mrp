// src/components/module/admin/customer-orders/customer-order-sheet.tsx
"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CustomerOrderColumn } from "@/types/admin/customer-order"
import { formatCurrencyPHP } from "@/lib/constant"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Package, DollarSign, Factory, User, Mail, Clock } from "lucide-react"

interface CustomerOrderSheetProps {
  customerOrder: CustomerOrderColumn
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerOrderSheet({ 
    customerOrder, 
    open, 
    onOpenChange
  }: CustomerOrderSheetProps) {

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { variant: "default" as const, className: "bg-green-500 text-white" },
      IN_PROGRESS: { variant: "secondary" as const, className: "bg-blue-500 text-white" },
      PENDING: { variant: "outline" as const, className: "bg-yellow-500 text-white" },
      CANCELLED: { variant: "destructive" as const, className: "" },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toLowerCase().replace("_", " ")}
      </Badge>
    )
  }

  const isOverdue = new Date(customerOrder.requiredDate) < new Date() && customerOrder.status !== "COMPLETED"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[540px] lg:max-w-[720px] overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0 pb-4">
          <SheetTitle className="text-xl">Order {customerOrder.orderNumber}</SheetTitle>
          <SheetDescription>
            Customer order details and information
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-6">
            {/* Status and Key Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(customerOrder.status)}
                {isOverdue && (
                  <Badge variant="destructive">
                    Overdue
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatCurrencyPHP(customerOrder.totalAmount)}
                </p>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                    <p className="text-base font-medium">{customerOrder.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {customerOrder.customerEmail || "No email provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Order Items</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Package className="h-4 w-4" />
                        <span className="text-base font-medium">
                          {customerOrder.itemCount} items
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({customerOrder.totalQuantity} units)
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Production Status</label>
                      <div className="mt-1">
                        {customerOrder.productionOrderCount > 0 ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Factory className="h-3 w-3 mr-1" />
                            {customerOrder.productionOrderCount} production orders
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Factory className="h-3 w-3 mr-1" />
                            No production orders
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-base">{formatDate(customerOrder.orderDate)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                      <div className={`flex items-center gap-2 mt-1 ${isOverdue ? 'text-destructive' : ''}`}>
                        <Clock className="h-4 w-4" />
                        <span className="text-base">{formatDate(customerOrder.requiredDate)}</span>
                        {isOverdue && <span className="text-xs">(Overdue)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrencyPHP(customerOrder.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{customerOrder.itemCount}</p>
                    <p className="text-sm text-muted-foreground">Line Items</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{customerOrder.totalQuantity}</p>
                    <p className="text-sm text-muted-foreground">Total Units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            {customerOrder.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {customerOrder.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Last Updated */}
            <div className="text-center text-xs text-muted-foreground pb-4">
              Last updated: {formatDate(customerOrder.lastUpdated)}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
