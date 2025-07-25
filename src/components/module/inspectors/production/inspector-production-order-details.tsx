"use client"

import React from "react"

import type { ReactElement } from "react"
import { useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CalendarDays,
  ShoppingCart,
  Clock,
  Hammer,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  CircleDotDashed,
  Truck,
  ClipboardList,
  FileText,
  ListChecks,
} from "lucide-react"
import { format } from "date-fns"
import { Status } from "@prisma/client" // Ensure Status enum is imported
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  updateProductionOrderStatus,
  addOperation,
  deleteOperation,
  updateOperationStatus,
  linkCustomerOrderToProduction,
  createMaterialRequest,
} from "@/lib/actions/inspector/production-order"
import { InspectorProductionOrderActionDialog } from "./inspector-production-order-action-dialog"
import { AddOperationDialog } from "@/components/module/shared/add-operation-dialog"
import { ConfirmDialog } from "@/components/module/shared/confirm-dialog"
import { UpdateOperationStatusDialog } from "@/components/module/shared/update-operation-status-dialog"
import { LinkCustomerOrderDialog } from "@/components/module/shared/link-customer-order-dialog"
import { CreateMaterialRequestDialog } from "@/components/module/shared/create-material-request-dialog"
import { InspectorProductionHistory } from "./inspector-production-history" // Import the inspector-specific history component

interface InspectorProductionOrderDetailsProps {
  productionOrder: any // Consider defining a more specific type for ProductionOrder
}

export default function InspectorProductionOrderDetails({
  productionOrder,
}: InspectorProductionOrderDetailsProps): ReactElement {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [isActionDialogOpen, setIsActionDialogOpen] = React.useState(false)
  const [isAddOperationDialogOpen, setIsAddOperationDialogOpen] = React.useState(false)
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = React.useState(false)
  const [operationToDelete, setOperationToDelete] = React.useState<string | null>(null)
  const [isUpdateOperationStatusDialogOpen, setIsUpdateOperationStatusDialogOpen] = React.useState(false)
  const [operationToUpdate, setOperationToUpdate] = React.useState<any>(null)
  const [isLinkCustomerOrderDialogOpen, setIsLinkCustomerOrderDialogOpen] = React.useState(false)
  const [isCreateMaterialRequestDialogOpen, setIsCreateMaterialRequestDialogOpen] = React.useState(false)

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A"
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return format(date, "MMM dd, yyyy HH:mm")
  }

  const getStatusBadgeVariant = (status: Status) => {
    switch (status) {
      case Status.COMPLETED:
      case Status.APPROVED:
      case Status.DELIVERED:
        return "default"
      case Status.IN_PROGRESS:
      case Status.READY_FOR_DELIVERY:
      case Status.QUALITY_CHECK:
      case Status.SUBCON: // Added
        return "secondary"
      case Status.CANCELLED:
      case Status.REJECTED:
      case Status.FAILED: // Added
        return "destructive"
      case Status.PENDING:
      case Status.ON_HOLD:
      case Status.ACTIVE: // Added
      case Status.INACTIVE: // Added
      case Status.SUSPENDED: // Added
      case Status.ARCHIVED: // Added
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.PENDING:
        return <CircleDotDashed className="h-4 w-4 text-muted-foreground" />
      case Status.IN_PROGRESS:
        return <Hammer className="h-4 w-4 text-blue-500" />
      case Status.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case Status.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />
      case Status.ON_HOLD:
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case Status.READY_FOR_DELIVERY:
        return <Truck className="h-4 w-4 text-purple-500" />
      case Status.DELIVERED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case Status.QUALITY_CHECK:
        return <ListChecks className="h-4 w-4 text-yellow-500" />
      case Status.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
      case Status.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case Status.FAILED:
        return <XCircle className="h-4 w-4 text-red-700" />
      case Status.SUBCON:
        return <Hammer className="h-4 w-4 text-indigo-500" />
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }

  const handleStatusUpdate = async (status: Status, notes?: string, actionTaken?: string) => {
    startTransition(async () => {
      try {
        await updateProductionOrderStatus(productionOrder.id, status, notes, actionTaken)
        toast({
          title: "Status Updated",
          description: `Production order status changed to ${status.replace(/_/g, " ")}.`,
        })
        // router.refresh() // Revalidate data - handled by server action revalidatePath
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update status.",
          variant: "destructive",
        })
      } finally {
        setIsActionDialogOpen(false)
      }
    })
  }

  const handleAddOperation = async (data: {
    workCenterId: string
    startTime: Date
    endTime: Date
    cost: number
    notes?: string
  }) => {
    startTransition(async () => {
      try {
        await addOperation(productionOrder.id, data)
        toast({
          title: "Operation Added",
          description: "New operation successfully added.",
        })
        // router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to add operation.",
          variant: "destructive",
        })
      } finally {
        setIsAddOperationDialogOpen(false)
      }
    })
  }

  const handleDeleteOperation = async () => {
    if (!operationToDelete) return
    startTransition(async () => {
      try {
        await deleteOperation(operationToDelete)
        toast({
          title: "Operation Deleted",
          description: "Operation successfully deleted.",
        })
        // router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete operation.",
          variant: "destructive",
        })
      } finally {
        setIsConfirmDeleteDialogOpen(false)
        setOperationToDelete(null)
      }
    })
  }

  const handleUpdateOperationStatus = async (status: Status, notes?: string) => {
    if (!operationToUpdate) return
    startTransition(async () => {
      try {
        await updateOperationStatus(operationToUpdate.id, status, notes)
        toast({
          title: "Operation Status Updated",
          description: `Operation status changed to ${status.replace(/_/g, " ")}.`,
        })
        // router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update operation status.",
          variant: "destructive",
        })
      } finally {
        setIsUpdateOperationStatusDialogOpen(false)
        setOperationToUpdate(null)
      }
    })
  }

  const handleLinkCustomerOrder = async (customerOrderId: string, notes?: string) => {
    startTransition(async () => {
      try {
        await linkCustomerOrderToProduction(productionOrder.id, customerOrderId, notes)
        toast({
          title: "Customer Order Linked",
          description: "Customer order successfully linked to production order.",
        })
        // router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to link customer order.",
          variant: "destructive",
        })
      } finally {
        setIsLinkCustomerOrderDialogOpen(false)
      }
    })
  }

  const handleCreateMaterialRequest = async (
    workCenterId: string,
    items: Array<{ materialId: string; quantity: number }>,
    notes?: string,
  ) => {
    startTransition(async () => {
      try {
        await createMaterialRequest(productionOrder.id, workCenterId, items, notes)
        toast({
          title: "Material Request Created",
          description: "Material request successfully submitted.",
        })
        // router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create material request.",
          variant: "destructive",
        })
      } finally {
        setIsCreateMaterialRequestDialogOpen(false)
      }
    })
  }

  const getPriorityBadgeVariant = (priority: string) => {
    // Implement priority badge variant logic here
    return "outline"
  }

  return (
    <div className="container mx-auto p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Production Order: {productionOrder.product.name}
            {productionOrder.productVariant && (
              <span className="text-gray-600 dark:text-gray-400"> - {productionOrder.productVariant.displayName}</span>
            )}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            SKU: {productionOrder.product.sku} • Quantity: {productionOrder.quantity}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            className="text-lg py-1.5 px-4 uppercase font-medium"
            variant={getStatusBadgeVariant(productionOrder.status)}
          >
            {productionOrder.status.replace(/_/g, " ")}
          </Badge>
          <Badge variant={getPriorityBadgeVariant(productionOrder.priority)}>
            {productionOrder.priority.toLowerCase()} priority
          </Badge>
          <Button onClick={() => setIsActionDialogOpen(true)}>Manage Production Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Details</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Product:</span> {productionOrder.product.name} (
              {productionOrder.product.sku})
            </p>
            {productionOrder.productVariant && (
              <p>
                <span className="font-semibold">Variant:</span> {productionOrder.productVariant.displayName} (
                {productionOrder.productVariant.sku})
              </p>
            )}
            <p>
              <span className="font-semibold">Quantity:</span> {productionOrder.quantity}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="font-semibold">Start Date:</span> {formatDate(productionOrder.startDate)}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="font-semibold">Due Date:</span> {formatDate(productionOrder.dueDate)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">Created At:</span> {formatDate(productionOrder.createdAt)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">Last Updated:</span> {formatDate(productionOrder.updatedAt)}
            </p>
            {productionOrder.notes && (
              <p>
                <span className="font-semibold">Notes:</span> {productionOrder.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer & Delivery</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {productionOrder.customerOrder ? (
              <>
                <p>
                  <span className="font-semibold">Customer Order #:</span> {productionOrder.customerOrder.orderNumber}
                </p>
                <p>
                  <span className="font-semibold">Customer:</span>{" "}
                  {productionOrder.customerOrder.customer?.name || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Required Date:</span>{" "}
                  {formatDate(productionOrder.customerOrder.requiredDate)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No customer order linked.</p>
            )}
            <Separator className="my-2" />
            {productionOrder.delivery ? (
              <>
                <p>
                  <span className="font-semibold">Delivery Status:</span>{" "}
                  {productionOrder.delivery.status.replace(/_/g, " ")}
                </p>
                <p>
                  <span className="font-semibold">Delivery Date:</span>{" "}
                  {formatDate(productionOrder.delivery.deliveryDate)}
                </p>
                <p>
                  <span className="font-semibold">Address:</span>{" "}
                  {productionOrder.delivery.deliveryAddress
                    ? `${productionOrder.delivery.deliveryAddress.street}, ${productionOrder.delivery.deliveryAddress.city}, ${productionOrder.delivery.deliveryAddress.state} ${productionOrder.delivery.deliveryAddress.zipCode}`
                    : "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Assigned To:</span>{" "}
                  {productionOrder.delivery.user
                    ? `${productionOrder.delivery.user.firstName} ${productionOrder.delivery.user.lastName}`
                    : "N/A"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No delivery assigned.</p>
            )}
            {!productionOrder.customerOrder && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => setIsLinkCustomerOrderDialogOpen(true)}
              >
                <ClipboardList className="h-4 w-4 mr-2" /> Link Customer Order
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Checks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {productionOrder.qualityChecks && productionOrder.qualityChecks.length > 0 ? (
              productionOrder.qualityChecks.map((qc: any) => (
                <div key={qc.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                  <p>
                    <span className="font-semibold">Check Date:</span> {formatDate(qc.checkDate)}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <Badge variant={getStatusBadgeVariant(qc.status)}>{qc.status.replace(/_/g, " ")}</Badge>
                  </p>
                  <p>
                    <span className="font-semibold">Defects Found:</span> {qc.defectsFound ? "Yes" : "No"}
                  </p>
                  {qc.notes && (
                    <p>
                      <span className="font-semibold">Notes:</span> {qc.notes}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No quality checks recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Operations</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAddOperationDialogOpen(true)}>
            <ClipboardList className="h-4 w-4 mr-2" /> Add Operation
          </Button>
        </CardHeader>
        <CardContent>
          {productionOrder.operations && productionOrder.operations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Work Center</th>
                    <th className="text-left py-2 pr-4">Start Time</th>
                    <th className="text-left py-2 pr-4">End Time</th>
                    <th className="text-left py-2 pr-4">Cost</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Notes</th>
                    <th className="text-left py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productionOrder.operations.map((op: any) => (
                    <tr key={op.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{op.workCenter?.name || "N/A"}</td>
                      <td className="py-2 pr-4">{formatDate(op.startTime)}</td>
                      <td className="py-2 pr-4">{formatDate(op.endTime)}</td>
                      <td className="py-2 pr-4">${op.cost.toFixed(2)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={getStatusBadgeVariant(op.status)}>{op.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{op.notes || "N/A"}</td>
                      <td className="py-2 pr-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setOperationToUpdate(op)
                            setIsUpdateOperationStatusDialogOpen(true)
                          }}
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span className="sr-only">Update Operation Status</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setOperationToDelete(op.id)
                            setIsConfirmDeleteDialogOpen(true)
                          }}
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span className="sr-only">Delete Operation</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No operations defined for this production order.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Material Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsCreateMaterialRequestDialogOpen(true)}>
            <ClipboardList className="h-4 w-4 mr-2" /> Create Material Request
          </Button>
        </CardHeader>
        <CardContent>
          {productionOrder.materialRequests && productionOrder.materialRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Request ID</th>
                    <th className="text-left py-2 pr-4">Work Center</th>
                    <th className="text-left py-2 pr-4">Requested By</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Items</th>
                    <th className="text-left py-2 pr-4">Notes</th>
                    <th className="text-left py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {productionOrder.materialRequests.map((req: any) => (
                    <tr key={req.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{req.id.substring(0, 8)}...</td>
                      <td className="py-2 pr-4">{req.workCenter?.name || "N/A"}</td>
                      <td className="py-2 pr-4">
                        {req.requestedBy?.profile
                          ? `${req.requestedBy.profile.firstName} ${req.requestedBy.profile.lastName}`
                          : req.requestedBy?.email || "N/A"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={getStatusBadgeVariant(req.status)}>{req.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        {req.items.map((item: any) => (
                          <div key={item.id}>
                            {item.inventoryItem?.name} ({item.quantity})
                          </div>
                        ))}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{req.notes || "N/A"}</td>
                      <td className="py-2 pr-4">{formatDate(req.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No material requests for this production order.</p>
          )}
        </CardContent>
      </Card>

      {/* Production BOM Section */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Production Bill of Materials</CardTitle>
          {/* Add BOM editing/viewing options here */}
        </CardHeader>
        <CardContent>
          {productionOrder.productionBOM && productionOrder.productionBOM.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Material</th>
                    <th className="text-left py-2 pr-4">SKU</th>
                    <th className="text-left py-2 pr-4">Quantity</th>
                    <th className="text-left py-2 pr-4">Unit Cost</th>
                    <th className="text-left py-2 pr-4">Total Cost</th>
                    <th className="text-left py-2 pr-4">Waste %</th>
                  </tr>
                </thead>
                <tbody>
                  {productionOrder.productionBOM.map((bomEntry: any) => (
                    <tr key={bomEntry.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{bomEntry.materialName}</td>
                      <td className="py-2 pr-4">{bomEntry.materialSku}</td>
                      <td className="py-2 pr-4">
                        {bomEntry.finalQuantity} {bomEntry.unitOfMeasure}
                      </td>
                      <td className="py-2 pr-4">${bomEntry.unitCost.toFixed(2)}</td>
                      <td className="py-2 pr-4">${bomEntry.currentTotalCost.toFixed(2)}</td>
                      <td className="py-2 pr-4">{bomEntry.wastePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No production BOM defined for this order.</p>
          )}
        </CardContent>
      </Card>

      {/* Delivery Assignment Section */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivery Assignment</CardTitle>
          {/* Add Delivery Assignment Dialog/Button here if needed */}
        </CardHeader>
        <CardContent>
          {productionOrder.delivery ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  Delivery #{productionOrder.delivery.id.substring(0, 8)}
                </h3>
                <Badge variant={getStatusBadgeVariant(productionOrder.delivery.status)}>
                  {productionOrder.delivery.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Scheduled: {formatDate(productionOrder.delivery.scheduledDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                Address: {productionOrder.delivery.deliveryAddress.street},{" "}
                {productionOrder.delivery.deliveryAddress.city}
              </p>
              {/* Add more delivery details as needed */}
            </Card>
          ) : (
            <p className="text-muted-foreground">No delivery assigned to this production order.</p>
          )}
        </CardContent>
      </Card>

      {/* Production History Section */}
      {productionOrder.activityLogs && <InspectorProductionHistory productionOrderId={productionOrder.id} />}

      <InspectorProductionOrderActionDialog
        isOpen={isActionDialogOpen}
        onClose={() => setIsActionDialogOpen(false)}
        onConfirm={handleStatusUpdate}
        currentStatus={productionOrder.status}
      />

      <AddOperationDialog
        isOpen={isAddOperationDialogOpen}
        onClose={() => setIsAddOperationDialogOpen(false)}
        onConfirm={handleAddOperation}
      />

      <ConfirmDialog
        isOpen={isConfirmDeleteDialogOpen}
        onClose={() => setIsConfirmDeleteDialogOpen(false)}
        onConfirm={handleDeleteOperation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this operation? This action cannot be undone."
      />

      {operationToUpdate && (
        <UpdateOperationStatusDialog
          isOpen={isUpdateOperationStatusDialogOpen}
          onClose={() => setIsUpdateOperationStatusDialogOpen(false)}
          onConfirm={handleUpdateOperationStatus}
          currentStatus={operationToUpdate.status}
        />
      )}

      <LinkCustomerOrderDialog
        isOpen={isLinkCustomerOrderDialogOpen}
        onClose={() => setIsLinkCustomerOrderDialogOpen(false)}
        onConfirm={handleLinkCustomerOrder}
      />

      <CreateMaterialRequestDialog
        isOpen={isCreateMaterialRequestDialogOpen}
        onClose={() => setIsCreateMaterialRequestDialogOpen(false)}
        onConfirm={handleCreateMaterialRequest}
      />
    </div>
  )
}
