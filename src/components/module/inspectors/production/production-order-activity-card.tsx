"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { type ActivityLog, Status } from "@prisma/client" // Import ActivityLog and Status types
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProductionOrderActivityCardProps {
  order: {
    id: string
    product: { name: string; sku: string }
    quantity: number
    status: Status
  }
  activityLogs: ActivityLog[]
}

// Helper to render details based on log type
const renderLogDetails = (log: ActivityLog) => {
  const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details // Ensure details is an object

  switch (log.type) {
    case "PRODUCTION_STATUS_CHANGE":
      return (
        <>
          <p>
            Status changed from <span className="font-medium">{details.previousStatus}</span> to{" "}
            <span className="font-medium">{details.newStatus}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.actionTaken && <p className="text-xs text-muted-foreground">Action Taken: {details.actionTaken}</p>}
        </>
      )
    case "OPERATION_CREATED":
      return (
        <>
          <p>
            Operation created for work center: <span className="font-medium">{details.workCenterId}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "OPERATION_DELETED":
      return (
        <>
          <p>
            Operation <span className="font-medium">{details.operationId}</span> deleted.
          </p>
          {details.workCenterName && (
            <p className="text-xs text-muted-foreground">Work Center: {details.workCenterName}</p>
          )}
        </>
      )
    case "OPERATION_STATUS_CHANGE":
      return (
        <>
          <p>
            Operation <span className="font-medium">{details.operationId}</span> status changed from{" "}
            <span className="font-medium">{details.previousStatus}</span> to{" "}
            <span className="font-medium">{details.newStatus}</span>.
          </p>
          {details.workCenterName && (
            <p className="text-xs text-muted-foreground">Work Center: {details.workCenterName}</p>
          )}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "CUSTOMER_ORDER_LINKED":
      return (
        <>
          <p>
            Linked to customer order: <span className="font-medium">{details.customerOrderId}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "MATERIAL_REQUEST_CREATED":
      return (
        <>
          <p>
            Material request created for {details.itemCount} items. Request ID:{" "}
            <span className="font-medium">{details.materialRequestId?.substring(0, 8)}...</span>
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "PRODUCTION_ORDER_CREATED":
      return (
        <>
          <p>
            Production order created for <span className="font-medium">{details.productName}</span> ({details.quantity}{" "}
            units).
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "PRODUCTION_ORDER_UPDATED":
      return (
        <>
          <p>Production order details updated.</p>
          {details.changes && Array.isArray(details.changes) && (
            <ul className="list-disc list-inside text-xs text-muted-foreground">
              {details.changes.map((change: any, i: number) => (
                <li key={i}>
                  {change.field}: {String(change.oldValue)} {"->"} {String(change.newValue)}
                </li>
              ))}
            </ul>
          )}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "MATERIAL_RELEASED":
      return (
        <>
          <p>
            Materials released for <span className="font-medium">{details.productName}</span> ({details.quantity}{" "}
            units).
          </p>
          {details.reason && <p className="text-xs text-muted-foreground">Reason: {details.reason}</p>}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.actionTaken && <p className="text-xs text-muted-foreground">Action Taken: {details.actionTaken}</p>}
        </>
      )
    case "PRODUCT_STOCK_INCREMENT":
      return (
        <>
          <p>
            Product stock incremented for <span className="font-medium">{details.productName}</span> by{" "}
            <span className="font-medium">{details.change}</span> units.
          </p>
          {details.reason && <p className="text-xs text-muted-foreground">Reason: {details.reason}</p>}
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.actionTaken && <p className="text-xs text-muted-foreground">Action Taken: {details.actionTaken}</p>}
        </>
      )
    case "PRODUCTION_ORDER_DELETED":
      return (
        <>
          <p>
            Production order for <span className="font-medium">{details.productName}</span> ({details.productSku})
            deleted.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "PRODUCTION_BOM_CREATED":
      return (
        <>
          <p>
            Production Bill of Materials created for <span className="font-medium">{details.productName}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
        </>
      )
    case "MATERIAL_RESERVED":
      return (
        <>
          <p>
            Materials reserved for <span className="font-medium">{details.productName}</span> ({details.quantity}{" "}
            units).
          </p>
          {details.reason && <p className="text-xs text-muted-foreground">Reason: {details.reason}</p>}
        </>
      )
    case "QUALITY_CHECK_CREATED":
      return (
        <>
          <p>
            Quality check <span className="font-medium">{details.qualityCheckId?.substring(0, 8)}...</span> created.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.takenAction && <p className="text-xs text-muted-foreground">Action Taken: {details.takenAction}</p>}
        </>
      )
    case "QUALITY_CHECK_STATUS_UPDATED":
      return (
        <>
          <p>
            Quality check <span className="font-medium">{details.qualityCheckId?.substring(0, 8)}...</span> status
            updated from <span className="font-medium">{details.previousStatus}</span> to{" "}
            <span className="font-medium">{details.newStatus}</span>.
          </p>
          {details.notes && <p className="text-xs text-muted-foreground">Notes: {details.notes}</p>}
          {details.takenAction && <p className="text-xs text-muted-foreground">Action Taken: {details.takenAction}</p>}
        </>
      )
    default:
      return <p>{log.summary || `Unknown action: ${log.type}`}</p>
  }
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
    case Status.SUBCON:
      return "secondary"
    case Status.CANCELLED:
    case Status.REJECTED:
    case Status.FAILED:
      return "destructive"
    case Status.PENDING:
    case Status.ON_HOLD:
    case Status.ACTIVE:
    case Status.INACTIVE:
    case Status.SUSPENDED:
    case Status.ARCHIVED:
      return "outline"
    default:
      return "outline"
  }
}

export function ProductionOrderActivityCard({ order, activityLogs }: ProductionOrderActivityCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">
          {order.product.name} ({order.product.sku})
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>
            Quantity: {order.quantity} • Order ID: {order.id.substring(0, 8)}...
          </span>
          <Badge variant={getStatusBadgeVariant(order.status)}>{order.status.replace(/_/g, " ")}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activityLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity recorded for this order yet.</p>
        ) : (
          <ScrollArea className="h-[250px] pr-4">
            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
              {activityLogs.map((log) => (
                <li key={log.id} className="mb-4 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-900 dark:ring-gray-900">
                    <svg
                      className="h-4 w-4 text-blue-800 dark:text-blue-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </span>
                  <h3 className="mb-1 flex items-center text-base font-semibold text-gray-900 dark:text-white">
                    {log.summary || log.type.replace(/_/g, " ")}
                  </h3>
                  <time className="mb-1 block text-xs font-normal leading-none text-gray-400 dark:text-gray-500">
                    {format(parseISO(log.timestamp.toISOString()), "MMM dd, yyyy HH:mm")} by {log.userName}
                  </time>
                  <div className="text-sm font-normal text-gray-500 dark:text-gray-400">{renderLogDetails(log)}</div>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
