"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Edit,
  DollarSign,
  Calendar,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Factory,
  Users,
  CheckCircle,
  Truck,
  Clock,
  FileText,
} from "lucide-react";
import { SuperadminOverrideStatusDialog } from "./SuperadminOverrideStatusDialog";
import { SuperadminOverrideCostsDialog } from "./SuperadminOverrideCostsDialog";
import { SuperadminOverrideQuantityDialog } from "./SuperadminOverrideQuantityDialog";
import { SuperadminOverrideDatesDialog } from "./SuperadminOverrideDatesDialog";

interface SuperadminProductionOrderDetailProps {
  order: any; // Full production order with all relations
}

export function SuperadminProductionOrderDetail({
  order,
}: SuperadminProductionOrderDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [overrideDialog, setOverrideDialog] = useState<
    "status" | "costs" | "quantity" | "dates" | null
  >(null);

  const isOverdue = order.status !== "COMPLETED" && new Date(order.dueDate) < new Date();
  const hasHighVariance = Math.abs(order.materialVariance) > 1000;

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Override Actions</CardTitle>
            </div>
          </div>
          <CardDescription>Quick access to superadmin override functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideDialog("status")}
            >
              <Edit className="mr-2 h-4 w-4" />
              Override Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideDialog("costs")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Override Costs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideDialog("quantity")}
            >
              <Package className="mr-2 h-4 w-4" />
              Override Quantity
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideDialog("dates")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Override Dates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{order.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-mono text-sm">{order.product.sku}</span>
                </div>
                {order.productVariant && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variant:</span>
                      <Badge variant="outline">{order.productVariant.displayName}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variant SKU:</span>
                      <span className="font-mono text-sm">{order.productVariant.sku}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-medium">
                    {order.productVariant?.currentStock || order.product.currentStock} units
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        order.status === "COMPLETED"
                          ? "default"
                          : order.status === "IN_PROGRESS"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {order.status}
                    </Badge>
                    {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge
                    variant={
                      order.priority === "CRITICAL" || order.priority === "URGENT"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {order.priority}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">
                    {order.completedQuantity}/{order.quantity} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">
                    {Math.round((order.completedQuantity / order.quantity) * 100)}%
                  </span>
                </div>
                {order.customerOrder && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{order.customerOrder.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Order:</span>
                      <Badge variant="outline">#{order.customerOrder.orderNumber}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">
                    {format(new Date(order.startDate), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className={`font-medium ${isOverdue ? "text-destructive" : ""}`}>
                    {format(new Date(order.dueDate), "MMM dd, yyyy")}
                  </span>
                </div>
                {order.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">
                      {format(new Date(order.completedAt), "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-sm">
                    {format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="text-sm">
                    {format(new Date(order.updatedAt), "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Tracking */}
            <Card className={hasHighVariance ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Tracking
                  {hasHighVariance && (
                    <AlertTriangle className="h-4 w-4 text-destructive ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planned Cost:</span>
                  <span className="font-medium">
                    ₱{order.plannedMaterialCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual Cost:</span>
                  <span className="font-medium">
                    ₱{order.actualMaterialCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Variance:</span>
                  <div className="flex items-center gap-1">
                    {order.materialVariance > 0 && (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    )}
                    {order.materialVariance < 0 && (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    <span
                      className={`font-medium ${
                        order.materialVariance > 0
                          ? "text-red-600"
                          : order.materialVariance < 0
                          ? "text-green-600"
                          : ""
                      }`}
                    >
                      ₱{Math.abs(order.materialVariance).toLocaleString()}
                    </span>
                  </div>
                </div>
                {hasHighVariance && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                    High variance detected! This order requires attention.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created By:</span>
                  <span className="font-medium">
                    {order.createdByUser?.email || "System"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created At:</span>
                  <span>{format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modified By:</span>
                  <span className="font-medium">
                    {order.modifiedByUser?.email || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified:</span>
                  <span>{format(new Date(order.updatedAt), "MMM dd, yyyy HH:mm")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPERATIONS TAB */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Operations ({order.operations.length})
              </CardTitle>
              <CardDescription>Work center assignments and progress tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {order.operations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No operations assigned yet
                </div>
              ) : (
                <div className="space-y-4">
                  {order.operations.map((operation: any) => (
                    <Card key={operation.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Work Center:</span>
                              <span className="font-medium">{operation.workCenter.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              <Badge>{operation.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Cost:</span>
                              <span>₱{operation.cost.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Start:</span>
                              <span className="text-sm">
                                {format(new Date(operation.startTime), "MMM dd, HH:mm")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">End:</span>
                              <span className="text-sm">
                                {format(new Date(operation.endTime), "MMM dd, HH:mm")}
                              </span>
                            </div>
                            {operation.assignedTo && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Assigned:</span>
                                <span className="text-sm">{operation.assignedTo.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {operation.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">{operation.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MATERIALS TAB */}
        <TabsContent value="materials" className="space-y-4">
          {/* BOM */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bill of Materials ({order.ProductionBOM.length})
              </CardTitle>
              <CardDescription>Material requirements for this production order</CardDescription>
            </CardHeader>
            <CardContent>
              {order.ProductionBOM.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No BOM defined</div>
              ) : (
                <div className="space-y-3">
                  {order.ProductionBOM.map((bom: any) => (
                    <div key={bom.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{bom.material.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {bom.material.sku}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Qty: </span>
                          <span className="font-medium">{bom.quantityNeeded}</span>
                          {bom.isAdjusted && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Adjusted
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Cost: </span>
                          <span>₱{bom.totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Material Reservations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Material Reservations ({order.materialReservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.materialReservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No materials reserved
                </div>
              ) : (
                <div className="space-y-3">
                  {order.materialReservations.map((reservation: any) => (
                    <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{reservation.material.name}</div>
                        <Badge variant="outline" className="mt-1">
                          {reservation.status}
                        </Badge>
                      </div>
                      <div className="text-right text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Reserved: </span>
                          <span>{reservation.quantityReserved}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Consumed: </span>
                          <span>{reservation.quantityConsumed}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUALITY TAB */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Quality Checks ({order.qualityChecks.length})
              </CardTitle>
              <CardDescription>Inspection history and quality control</CardDescription>
            </CardHeader>
            <CardContent>
              {order.qualityChecks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No quality checks performed yet
                </div>
              ) : (
                <div className="space-y-4">
                  {order.qualityChecks.map((check: any) => (
                    <Card key={check.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Inspector:</span>
                              <span className="font-medium">{check.inspector.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              <Badge>{check.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Check Date:</span>
                              <span className="text-sm">
                                {format(new Date(check.checkDate), "MMM dd, yyyy")}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {check.defectsFound && (
                              <div>
                                <span className="text-sm text-muted-foreground">Defects:</span>
                                <p className="text-sm mt-1">{check.defectsFound}</p>
                              </div>
                            )}
                            {check.actionTaken && (
                              <div>
                                <span className="text-sm text-muted-foreground">Action Taken:</span>
                                <p className="text-sm mt-1">{check.actionTaken}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {check.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">{check.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DELIVERY TAB */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!order.delivery ? (
                <div className="text-center py-8 text-muted-foreground">
                  No delivery assignment yet
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">{order.delivery.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge>{order.delivery.status}</Badge>
                  </div>
                  {order.delivery.scheduledDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span>
                        {format(new Date(order.delivery.scheduledDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                  {order.delivery.deliveryAddress && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <p className="mt-1 text-sm">{order.delivery.deliveryAddress}</p>
                    </div>
                  )}
                  {order.delivery.notes && (
                    <div>
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-1 text-sm text-muted-foreground">{order.delivery.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT TRAIL TAB */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Production Order History ({order.productionHistoryLogs.length})
              </CardTitle>
              <CardDescription>Complete audit trail of all changes and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {order.productionHistoryLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No history logs yet</div>
              ) : (
                <div className="space-y-3">
                  {order.productionHistoryLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className={`p-3 border rounded-lg ${
                        log.changeType.includes("SUPERADMIN")
                          ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                log.changeType.includes("SUPERADMIN") ? "default" : "outline"
                              }
                            >
                              {log.changeType}
                            </Badge>
                            {log.status && <Badge variant="outline">{log.status}</Badge>}
                          </div>
                          {log.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">{log.notes}</p>
                          )}
                        </div>
                        <div className="text-right text-sm space-y-1">
                          <div className="font-medium">{log.user.email}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Override Dialogs */}
      <SuperadminOverrideStatusDialog
        open={overrideDialog === "status"}
        onOpenChange={(open) => !open && setOverrideDialog(null)}
        order={{
          id: order.id,
          productName: order.product.name,
          status: order.status,
          quantity: order.quantity,
          completedQuantity: order.completedQuantity,
        }}
      />
      <SuperadminOverrideCostsDialog
        open={overrideDialog === "costs"}
        onOpenChange={(open) => !open && setOverrideDialog(null)}
        order={{
          id: order.id,
          productName: order.product.name,
          plannedMaterialCost: order.plannedMaterialCost,
          actualMaterialCost: order.actualMaterialCost,
          materialVariance: order.materialVariance,
        }}
      />
      <SuperadminOverrideQuantityDialog
        open={overrideDialog === "quantity"}
        onOpenChange={(open) => !open && setOverrideDialog(null)}
        order={{
          id: order.id,
          productName: order.product.name,
          quantity: order.quantity,
          completedQuantity: order.completedQuantity,
        }}
      />
      <SuperadminOverrideDatesDialog
        open={overrideDialog === "dates"}
        onOpenChange={(open) => !open && setOverrideDialog(null)}
        order={{
          id: order.id,
          productName: order.product.name,
          startDate: new Date(order.startDate),
          dueDate: new Date(order.dueDate),
          status: order.status,
        }}
      />
    </div>
  );
}
