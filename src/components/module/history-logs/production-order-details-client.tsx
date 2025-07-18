"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, User } from "lucide-react"
import ProductionOrderHistoryLink from "./production-order-history-link"

// Define types for the simplified history log
interface ProductionHistoryLogEntry {
  id: string
  productionOrderId: string
  userId: string
  user: {
    id: string
    email: string
    profile?: {
      firstName: string
      lastName: string
    } | null
  } | null
  timestamp: Date
  status?: string // Corresponds to Status enum
  changeType: string
  notes?: string
}

// Define types for the ProductionOrder data passed from the server
interface ProductionOrderData {
  id: string
  productId: string
  quantity: number
  startDate: Date
  dueDate: Date
  status: string
  priority: string
  customerOrderId: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  product: {
    name: string
    sku: string
  }
  operations: Array<{
    id: string
    workCenterId: string
    productionOrderId: string
    startTime: Date
    endTime: Date
    status: string
    cost: number
    workCenter: {
      name: string
    }
  }>
  qualityChecks: Array<{
    id: string
    productionOrderId: string
    inspectorId: string
    checkDate: Date
    status: string
    defectsFound: string | null
    inspector: {
      email: string
      profile?: {
        firstName: string
        lastName: string
      } | null
    }
  }>
  createdByUser: {
    email: string
    profile?: {
      firstName: string
      lastName: string
    } | null
  } | null
  historyLogs: ProductionHistoryLogEntry[] // Array of simplified history logs
  bom: any // Placeholder for BOM data
}

interface ProductionOrderDetailsClientProps {
  productionOrder: ProductionOrderData
}

export default function ProductionOrderDetailsClient({ productionOrder }: ProductionOrderDetailsClientProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Order Details</h1>
          <p className="text-muted-foreground">Detailed view of production order {productionOrder.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={productionOrder.status === "COMPLETED" ? "default" : "secondary"}>
            {productionOrder.status}
          </Badge>
          {/* Trigger the modal */}
          <ProductionOrderHistoryLink
            productionOrderId={productionOrder.id}
            variant="button"
            onClick={() => setShowHistoryModal(true)}
          />
        </div>
      </div>

      {/* Production Order Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Production Order Information</CardTitle>
            <CardDescription>Basic details and current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product</label>
                <div className="font-medium">{productionOrder.product.name}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                <div className="font-medium">{productionOrder.quantity}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <div className="font-medium">{new Date(productionOrder.startDate).toLocaleDateString()}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <div className="font-medium">{new Date(productionOrder.dueDate).toLocaleDateString()}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <Badge variant="outline">{productionOrder.priority}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created By</label>
                <div className="font-medium">
                  {productionOrder.createdByUser?.profile
                    ? `${productionOrder.createdByUser.profile.firstName} ${productionOrder.createdByUser.profile.lastName}`
                    : productionOrder.createdByUser?.email || "Unknown"}
                </div>
              </div>
            </div>

            {productionOrder.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="mt-1 text-sm">{productionOrder.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Trigger the modal */}
            <ProductionOrderHistoryLink
              productionOrderId={productionOrder.id}
              variant="link"
              className="block"
              onClick={() => setShowHistoryModal(true)}
            />
            <ProductionOrderHistoryLink
              productionOrderId={productionOrder.id}
              variant="badge"
              className="block w-fit"
              onClick={() => setShowHistoryModal(true)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
          <CardDescription>Production operations and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productionOrder.operations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Operation #{operation.id.slice(-8)}</div>
                  <div className="text-sm text-muted-foreground">Work Center: {operation.workCenter.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Scheduled: {new Date(operation.startTime).toLocaleString()} -{" "}
                    {new Date(operation.endTime).toLocaleString()}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={operation.status === "COMPLETED" ? "default" : "secondary"}>{operation.status}</Badge>
                  <div className="text-sm text-muted-foreground">Cost: ${operation.cost.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Checks */}
      {productionOrder.qualityChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Checks</CardTitle>
            <CardDescription>Quality inspection results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionOrder.qualityChecks.map((check) => (
                <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Quality Check #{check.id.slice(-8)}</div>
                    <div className="text-sm text-muted-foreground">
                      Inspector:{" "}
                      {check.inspector.profile
                        ? `${check.inspector.profile.firstName} ${check.inspector.profile.lastName}`
                        : check.inspector.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Date: {new Date(check.checkDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={check.status === "COMPLETED" ? "default" : "secondary"}>{check.status}</Badge>
                    {check.defectsFound && (
                      <div className="text-sm text-muted-foreground">Defects: {check.defectsFound}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Production History Log for {productionOrder.id}</DialogTitle>
            <DialogDescription>
              A chronological record of all changes and activities related to this production order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {productionOrder.historyLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">No history logs found for this order.</div>
            ) : (
              <ScrollArea className="h-full pr-4">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

                  <div className="space-y-6">
                    {productionOrder.historyLogs.map((log, index) => (
                      <div key={log.id} className="relative flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Clock className="h-3 w-3" />
                        </div>

                        {/* Log content */}
                        <div className="flex-1 min-w-0 pb-6">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-semibold">{log.changeType.replace(/_/g, " ")}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">{log.notes}</p>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {log.user?.profile
                                ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
                                : log.user?.email || "Unknown User"}
                            </span>
                            {log.status && (
                              <Badge variant="secondary" className="text-xs">
                                Status: {log.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
